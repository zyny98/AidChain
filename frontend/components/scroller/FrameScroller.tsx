'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

const TOTAL_FRAMES = 591;
const FRAME_PREFIX = '/frames_hd/frame_';
/** How many frames ahead (in scroll direction) to pre-decode so drawImage never decodes synchronously */
const DECODE_AHEAD = 12;

interface KeyframePoint {
  id?: string;
  frame: number;
}

// Exact frame mapping where each 3D cube is strictly DEAD CENTER (Y = 50.0%)
const STAGE_KEYFRAMES: KeyframePoint[] = [
  { id: 'stage-intro', frame: 0 },
  { id: 'stage-donor', frame: 0 },         // Node 01: Wallet (exact center Y = 49.6%)
  { id: 'stage-escrow', frame: 182 },      // Node 02: Lock (exact center Y = 50.1%)
  { id: 'stage-oracle', frame: 305 },      // Node 03: AI Vision (exact center Y = 50.3%)
  { id: 'stage-logistics', frame: 437 },   // Node 04: Truck Fleet (exact center Y = 50.1%)
  { id: 'stage-beneficiary', frame: 590 }, // Node 05: Final Shield / Completion
];

// Key anchor frames loaded first so stage positions are instantly sharp
const PRIORITY_KEYFRAME_INDICES = [0, 182, 305, 437, 590];

function targetFrameClamp(i: number): number {
  return Math.min(TOTAL_FRAMES - 1, Math.max(0, i));
}

function padFrame(index: number): string {
  return String(index + 1).padStart(4, '0');
}

// ─── Module-Level Persistent Image Cache & Background Preloader ───
// These persist across client navigation (e.g. landing -> /app/* -> landing)
const GLOBAL_IMAGE_CACHE: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES).fill(null);
let globalLoadedCount = 0;
let globalPreloadStarted = false;
const progressListeners = new Set<(count: number) => void>();

function notifyProgress() {
  const count = globalLoadedCount;
  progressListeners.forEach((listener) => {
    try {
      listener(count);
    } catch {
      // ignore
    }
  });
}

function loadSingleFrame(index: number): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const existing = GLOBAL_IMAGE_CACHE[index];
    if (existing && existing.complete && existing.naturalWidth > 0) {
      resolve(existing);
      return;
    }

    const img = new Image();
    img.decoding = 'async';
    img.src = `${FRAME_PREFIX}${padFrame(index)}.jpg`;

    img.onload = () => {
      if (!GLOBAL_IMAGE_CACHE[index]) {
        GLOBAL_IMAGE_CACHE[index] = img;
        globalLoadedCount++;
        notifyProgress();
      }
      resolve(img);
    };

    img.onerror = () => {
      // In case of network glitch, register slot so UI progress doesn't stall
      if (!GLOBAL_IMAGE_CACHE[index]) {
        GLOBAL_IMAGE_CACHE[index] = img;
        globalLoadedCount++;
        notifyProgress();
      }
      resolve(img);
    };
  });
}

function startGlobalPreloader() {
  if (globalPreloadStarted) return;
  globalPreloadStarted = true;

  // 1. Immediately load Frame 0 for instant initial hero display
  loadSingleFrame(0).then(() => {
    // 2. Concurrently load all keyframe anchors (0, 182, 305, 437, 590)
    Promise.all(PRIORITY_KEYFRAME_INDICES.map((k) => loadSingleFrame(k))).then(() => {
      // 3. Queue all remaining frames in sequential batches
      const remaining: number[] = [];
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        if (!GLOBAL_IMAGE_CACHE[i] || !GLOBAL_IMAGE_CACHE[i]?.complete) {
          remaining.push(i);
        }
      }

      // 8 concurrent workers stream remaining frames uninterrupted in the background
      const CONCURRENCY = 8;
      const runWorker = async () => {
        while (remaining.length > 0) {
          const nextIdx = remaining.shift();
          if (nextIdx !== undefined) {
            await loadSingleFrame(nextIdx);
          }
        }
      };

      for (let c = 0; c < CONCURRENCY; c++) {
        runWorker();
      }
    });
  });
}

// Start background preload immediately when module loads in browser
if (typeof window !== 'undefined') {
  startGlobalPreloader();
}

export default function FrameScroller() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(GLOBAL_IMAGE_CACHE);
  const currentFrameRef = useRef<number>(-1);
  const decodedRef = useRef<Set<number>>(new Set());
  const smoothFrameRef = useRef<number>(0);
  const smoothOpacityRef = useRef<number>(0);
  const pointsRef = useRef<{ scrollY: number; frame: number }[]>([]);
  const hudCounterRef = useRef<HTMLSpanElement>(null);

  // Initialize with current global progress count (never resets to 0 on return!)
  const [loadedCount, setLoadedCount] = useState<number>(globalLoadedCount);
  const [isInitialReady, setIsInitialReady] = useState<boolean>(
    GLOBAL_IMAGE_CACHE[0] !== null && Boolean(GLOBAL_IMAGE_CACHE[0]?.complete)
  );
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
    }
  }, []);

  // ─── Paint a frame to canvas ────────────────────────────────────
  const paintFrameToCanvas = useCallback((img: HTMLImageElement, frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const imgW = img.naturalWidth || 1920;
    const imgH = img.naturalHeight || 1080;

    // Cover scale calculation
    const scale = Math.max(W / imgW, H / imgH);
    const dw = imgW * scale;
    const dh = imgH * scale;
    const dx = (W - dw) / 2;
    const dy = (H - dh) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, dx, dy, dw, dh);

    currentFrameRef.current = frameIndex;

    if (hudCounterRef.current) {
      hudCounterRef.current.textContent = `F:${String(frameIndex + 1).padStart(3, '0')}/591`;
    }
  }, []);

  // ─── Measure Element Centers for Exact Keyframe Sync ────────────
  const measureKeyframes = useCallback(() => {
    const halfWin = window.innerHeight / 2;
    const currentScroll = window.scrollY || window.pageYOffset || 0;
    const pts: { scrollY: number; frame: number }[] = [];

    for (const kf of STAGE_KEYFRAMES) {
      if (!kf.id) continue;
      const el = document.getElementById(kf.id);
      if (el) {
        const rect = el.getBoundingClientRect();
        let targetScroll = 0;
        if (kf.id === 'stage-intro') {
          targetScroll = Math.max(0, rect.bottom + currentScroll - window.innerHeight);
        } else {
          const elCenterDocY = rect.top + currentScroll + rect.height / 2;
          targetScroll = Math.max(0, elCenterDocY - halfWin);
        }
        pts.push({ scrollY: targetScroll, frame: kf.frame });
      }
    }

    if (pts.length >= 2) {
      pts.sort((a, b) => a.scrollY - b.scrollY);
      pointsRef.current = pts;
    }
  }, []);

  // ─── Connect to persistent global preloader ───────────────────────
  useEffect(() => {
    // Immediately sync current count on mount
    setLoadedCount(globalLoadedCount);

    const frame0 = GLOBAL_IMAGE_CACHE[0];
    if (frame0 && frame0.complete && frame0.naturalWidth > 0) {
      setIsInitialReady(true);
      if (currentFrameRef.current === -1) {
        paintFrameToCanvas(frame0, 0);
      }
    }

    const handleProgress = (count: number) => {
      setLoadedCount(count);
      if (count > 0 && !isInitialReady) {
        const f0 = GLOBAL_IMAGE_CACHE[0];
        if (f0 && f0.complete) {
          setIsInitialReady(true);
          if (currentFrameRef.current === -1) {
            paintFrameToCanvas(f0, 0);
          }
        }
      }
    };

    progressListeners.add(handleProgress);
    startGlobalPreloader(); // Safe / idempotent

    return () => {
      progressListeners.delete(handleProgress);
    };
  }, [isInitialReady, paintFrameToCanvas]);

  // ─── Canvas size & Keyframe Measurement ─────────────────────────
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      measureKeyframes();

      // Immediate paint on resize / mount
      const curIdx = currentFrameRef.current >= 0 ? currentFrameRef.current : 0;
      const curImg = imagesRef.current[curIdx] || imagesRef.current[0];
      if (curImg && curImg.complete && curImg.naturalWidth > 0) {
        paintFrameToCanvas(curImg, curIdx);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const t1 = setTimeout(measureKeyframes, 300);
    const t2 = setTimeout(measureKeyframes, 1000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [measureKeyframes, paintFrameToCanvas]);

  // ─── Single, uninterrupted RAF loop with synchronized LERP & smooth opacity ──
  useEffect(() => {
    let animId: number;
    let isFirstTick = true;

    const tick = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const pts = pointsRef.current;
      const winH = window.innerHeight;

      // 1. Calculate raw target frame
      let rawTargetFrame = 0;

      if (pts.length >= 2) {
        if (scrollY <= pts[0].scrollY) {
          rawTargetFrame = pts[0].frame;
        } else if (scrollY >= pts[pts.length - 1].scrollY) {
          rawTargetFrame = pts[pts.length - 1].frame;
        } else {
          for (let i = 0; i < pts.length - 1; i++) {
            const p1 = pts[i];
            const p2 = pts[i + 1];
            if (scrollY >= p1.scrollY && scrollY <= p2.scrollY) {
              const span = p2.scrollY - p1.scrollY;
              const t = span > 0 ? (scrollY - p1.scrollY) / span : 0;
              rawTargetFrame = p1.frame + t * (p2.frame - p1.frame);
              break;
            }
          }
        }
      } else {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - winH);
        rawTargetFrame = (scrollY / maxScroll) * (TOTAL_FRAMES - 1);
      }

      // Static at frame 0 while in hero before entering donor
      const donorEl = document.getElementById('stage-donor');
      if (donorEl) {
        const donorRect = donorEl.getBoundingClientRect();
        if (donorRect.top > winH * 0.75) {
          rawTargetFrame = 0;
        }
      }

      // Static at frame 590 once beneficiary is reached
      const beneficiaryEl = document.getElementById('stage-beneficiary');
      if (beneficiaryEl) {
        const benRect = beneficiaryEl.getBoundingClientRect();
        if (benRect.top <= winH * 0.3) {
          rawTargetFrame = TOTAL_FRAMES - 1;
        }
      }

      // 2. Opacity calculation:
      // In Hero: 0 opacity so original cosmic horizon is purely visible. Fades in smoothly into Stage 1.
      let targetOpacity = 0;
      if (donorEl) {
        const donorRect = donorEl.getBoundingClientRect();
        if (donorRect.top >= winH) {
          targetOpacity = 0;
        } else if (donorRect.top <= winH * 0.4) {
          targetOpacity = 1;
        } else {
          targetOpacity = (winH - donorRect.top) / (winH * 0.6);
        }
      } else {
        targetOpacity = scrollY > 100 ? 1 : 0;
      }

      // Fade out smoothly when transitioning past Beneficiary into Audience / Simulation
      const afterStagesEl = document.getElementById('audience') || document.getElementById('simulation');
      if (afterStagesEl) {
        const afterRect = afterStagesEl.getBoundingClientRect();
        if (afterRect.top < winH) {
          const fadeOutDist = winH * 0.7;
          const progress = Math.max(0, Math.min(1, (winH - afterRect.top) / fadeOutDist));
          targetOpacity = Math.min(targetOpacity, 1 - progress);
        }
      }

      // On first tick after mounting (e.g. returning to landing page), sync directly without lerp lag
      if (isFirstTick) {
        smoothFrameRef.current = rawTargetFrame;
        smoothOpacityRef.current = targetOpacity;
        isFirstTick = false;
      } else {
        // Instantaneous responsive LERP glide: follows scroll with zero trailing lag
        smoothFrameRef.current += (rawTargetFrame - smoothFrameRef.current) * 0.42;
        smoothOpacityRef.current += (targetOpacity - smoothOpacityRef.current) * 0.35;
      }

      const targetFrame = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(smoothFrameRef.current))
      );

      if (containerRef.current) {
        containerRef.current.style.opacity = smoothOpacityRef.current.toFixed(3);
        containerRef.current.style.visibility = smoothOpacityRef.current <= 0.005 ? 'hidden' : 'visible';
      }

      // If prefers-reduced-motion: stay fixed at frame 0 without continuous scroll updates
      if (reducedMotion) {
        const firstImg = imagesRef.current[0];
        if (firstImg && firstImg.complete && currentFrameRef.current !== 0) {
          paintFrameToCanvas(firstImg, 0);
        }
        return;
      }

      // Pre-decode frames ahead in scroll direction
      {
        const dir = rawTargetFrame >= smoothFrameRef.current ? 1 : -1;
        for (let k = 1; k <= DECODE_AHEAD; k++) {
          const idx = targetFrameClamp(targetFrame + dir * k);
          const im = imagesRef.current[idx];
          if (im && im.complete && !decodedRef.current.has(idx)) {
            decodedRef.current.add(idx);
            im.decode().catch(() => decodedRef.current.delete(idx));
          }
        }
      }

      // Only paint if frame index changed and visible (or initial paint needed)
      if (
        (targetFrame !== currentFrameRef.current || currentFrameRef.current === -1) &&
        (smoothOpacityRef.current > 0.005 || currentFrameRef.current === -1)
      ) {
        const targetImg = imagesRef.current[targetFrame];

        if (targetImg && targetImg.complete && targetImg.naturalWidth > 0) {
          paintFrameToCanvas(targetImg, targetFrame);
        } else {
          // If exact targetFrame isn't ready yet, paint closest loaded frame
          const lastIdx = currentFrameRef.current >= 0 ? currentFrameRef.current : 0;
          const direction = targetFrame >= lastIdx ? 1 : -1;
          let bestIdx = -1;

          for (
            let i = lastIdx + direction;
            direction > 0 ? i <= targetFrame : i >= targetFrame;
            i += direction
          ) {
            const candidate = imagesRef.current[i];
            if (candidate && candidate.complete && candidate.naturalWidth > 0) {
              bestIdx = i;
            }
          }

          if (bestIdx !== -1 && bestIdx !== currentFrameRef.current) {
            const bestImg = imagesRef.current[bestIdx];
            if (bestImg) {
              paintFrameToCanvas(bestImg, bestIdx);
            }
          }
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [paintFrameToCanvas, reducedMotion]);

  const loadPercent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
  const isFullyBuffered = loadedCount >= TOTAL_FRAMES;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-ink will-change-[opacity]"
      style={{ opacity: 0 }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {/* Warm darkroom radial & linear vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 35%, rgba(5,6,13,0.6) 75%, rgba(5,6,13,0.95) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(5,6,13,0.85) 0%, transparent 16%, transparent 80%, rgba(5,6,13,0.96) 100%)',
        }}
      />

      {/* Thin buffering progress bar - automatically hidden when fully cached */}
      {!isFullyBuffered && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-paper/10 z-50">
          <div
            className="h-full bg-emerald-400 transition-all duration-200"
            style={{ width: `${loadPercent}%` }}
          />
        </div>
      )}

      {/* Debug frame counter is kept in the DOM but hidden from users */}
      <span ref={hudCounterRef} className="sr-only" />
    </div>
  );
}
