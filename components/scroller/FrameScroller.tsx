'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

const TOTAL_FRAMES = 591;
const FRAME_PREFIX = '/frames_hd/frame_';
/** How many frames ahead (in scroll direction) to pre-decode so drawImage never decodes synchronously */
const DECODE_AHEAD = 10;

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

function targetFrameClamp(i: number): number {
  return Math.min(TOTAL_FRAMES - 1, Math.max(0, i));
}

function padFrame(index: number): string {
  return String(index + 1).padStart(4, '0');
}

// Persistent global image cache across client navigations
const GLOBAL_IMAGE_CACHE: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES).fill(null);
let globalLoadedCount = 0;
let globalPreloadStarted = false;

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
  const paintFrameToCanvas = (img: HTMLImageElement, frameIndex: number) => {
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
  };

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

  // ─── Preload frames cleanly with async decoding ──────────────────
  useEffect(() => {
    let isCancelled = false;

    // If frame 0 is already loaded from previous page view, paint it immediately
    const frame0 = GLOBAL_IMAGE_CACHE[0];
    if (frame0 && frame0.complete && currentFrameRef.current === -1) {
      paintFrameToCanvas(frame0, 0);
      setIsInitialReady(true);
    }

    // If all frames already buffered in this session, nothing left to load
    if (globalLoadedCount >= TOTAL_FRAMES) {
      setLoadedCount(TOTAL_FRAMES);
      setIsInitialReady(true);
      return;
    }

    if (globalPreloadStarted) {
      return;
    }
    globalPreloadStarted = true;

    const loadSingleFrame = (index: number): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        if (GLOBAL_IMAGE_CACHE[index]?.complete) {
          resolve(GLOBAL_IMAGE_CACHE[index]!);
          return;
        }

        const img = new Image();
        img.decoding = 'async';
        img.src = `${FRAME_PREFIX}${padFrame(index)}.jpg`;
        img.onload = () => {
          if (isCancelled) return;
          GLOBAL_IMAGE_CACHE[index] = img;
          globalLoadedCount++;
          setLoadedCount(globalLoadedCount);

          if (index === 0 && currentFrameRef.current === -1) {
            paintFrameToCanvas(img, 0);
            setIsInitialReady(true);
          }
          resolve(img);
        };
        img.onerror = () => {
          resolve(img);
        };
      });
    };

    // Load frame 0 immediately
    loadSingleFrame(0).then(() => {
      if (isCancelled) return;

      const queue = Array.from({ length: TOTAL_FRAMES - 1 }, (_, i) => i + 1);
      const CONCURRENCY = 10;

      const runWorker = async () => {
        while (queue.length > 0 && !isCancelled) {
          const nextIndex = queue.shift();
          if (nextIndex !== undefined) {
            await loadSingleFrame(nextIndex);
          }
        }
      };

      for (let c = 0; c < CONCURRENCY; c++) {
        runWorker();
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

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

      const curIdx = currentFrameRef.current >= 0 ? currentFrameRef.current : 0;
      const curImg = imagesRef.current[curIdx];
      if (curImg && curImg.complete && curImg.naturalWidth > 0) {
        paintFrameToCanvas(curImg, curIdx);
      }

      measureKeyframes();
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
  }, [measureKeyframes]);

  // ─── Single, uninterrupted RAF loop with synchronized LERP & smooth opacity ──
  useEffect(() => {
    let animId: number;

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

      // Instantaneous responsive LERP glide: follows scroll with zero trailing lag
      smoothFrameRef.current += (rawTargetFrame - smoothFrameRef.current) * 0.42;

      const targetFrame = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(smoothFrameRef.current))
      );

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

      // Smooth opacity interpolation to eliminate any sudden jumps or hard cuts
      smoothOpacityRef.current += (targetOpacity - smoothOpacityRef.current) * 0.35;
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

      // Only paint if frame index changed and visible
      if (targetFrame !== currentFrameRef.current && smoothOpacityRef.current > 0.005) {
        const targetImg = imagesRef.current[targetFrame];

        if (targetImg && targetImg.complete && targetImg.naturalWidth > 0) {
          paintFrameToCanvas(targetImg, targetFrame);
        } else {
          const lastIdx = currentFrameRef.current;
          const direction = targetFrame > lastIdx ? 1 : -1;
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

          if (bestIdx !== -1 && bestIdx !== lastIdx) {
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
  }, []);

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

      {/* Thin buffering progress bar */}
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
