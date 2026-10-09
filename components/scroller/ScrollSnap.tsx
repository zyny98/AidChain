'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface StageInfo {
  id: string;
  name: string;
}

const SNAP_STAGES: StageInfo[] = [
  { id: 'stage-intro', name: 'Intro' },
  { id: 'stage-donor', name: 'Donor' },
  { id: 'stage-escrow', name: 'Escrow' },
  { id: 'stage-oracle', name: 'Oracle' },
  { id: 'stage-logistics', name: 'Logistics' },
  { id: 'stage-beneficiary', name: 'Beneficiary' },
];

export function ScrollSnap() {
  const isAnimatingRef = useRef<boolean>(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTriggerTimeRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const stageCoordsRef = useRef<number[]>([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    // Pre-calculate exact target scroll Y coordinates so wheel events NEVER cause layout reflows
    const measureStages = () => {
      const currentScroll = window.scrollY || window.pageYOffset || 0;
      const halfWin = window.innerHeight / 2;
      const coords = [0]; // index 0: Hero = 0

      for (let i = 1; i <= 5; i++) {
        const stage = SNAP_STAGES[i];
        const el = document.getElementById(stage.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          const targetY = Math.round(rect.top + currentScroll + rect.height / 2 - halfWin);
          coords.push(Math.max(0, targetY));
        } else {
          coords.push(i * window.innerHeight);
        }
      }

      // Index 6: Audience section (first section below stages)
      const aud = document.getElementById('audience') || document.getElementById('simulation');
      if (aud) {
        const rect = aud.getBoundingClientRect();
        coords.push(Math.round(rect.top + currentScroll - 60));
      } else {
        coords.push(6 * window.innerHeight);
      }

      stageCoordsRef.current = coords;
    };

    measureStages();
    const t1 = setTimeout(measureStages, 120);
    const t2 = setTimeout(measureStages, 600);
    const t3 = setTimeout(measureStages, 1500);
    window.addEventListener('resize', measureStages);

    // Instant O(1) lookup of closest stage
    const getClosestStageIndex = (): number => {
      const currentY = window.scrollY || window.pageYOffset || 0;
      const coords = stageCoordsRef.current;
      let closest = 0;
      let minDiff = Infinity;
      for (let i = 0; i <= 5; i++) {
        const diff = Math.abs(currentY - coords[i]);
        if (diff < minDiff) {
          minDiff = diff;
          closest = i;
        }
      }
      return closest;
    };

    // Ultra-crisp TikTok snap glide with zero latency
    const glideTo = (targetY: number, onDone?: () => void) => {
      isAnimatingRef.current = true;
      lastTriggerTimeRef.current = performance.now();

      if (tweenRef.current) {
        tweenRef.current.kill();
      }
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
      }

      // Safety failsafe: never stay locked if animation is interrupted
      safetyTimerRef.current = setTimeout(() => {
        isAnimatingRef.current = false;
      }, 550);

      const scrollObj = { y: window.scrollY || window.pageYOffset || 0 };

      // Power3.out delivers high initial velocity for instantaneous reaction, then soft settle
      tweenRef.current = gsap.to(scrollObj, {
        y: targetY,
        duration: 0.38,
        ease: 'power3.out',
        onUpdate: () => {
          window.scrollTo(0, scrollObj.y);
        },
        onComplete: () => {
          if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
          isAnimatingRef.current = false;
          onDone?.();
        },
      });
    };

    const goToIndex = (targetIdx: number) => {
      const clampedIdx = Math.max(0, Math.min(6, targetIdx));
      const targetY = stageCoordsRef.current[clampedIdx] ?? 0;
      glideTo(targetY);
    };

    const handleTransition = (direction: number) => {
      const closestIdx = getClosestStageIndex();
      if (direction > 0) {
        if (closestIdx < 5) {
          goToIndex(closestIdx + 1);
        } else {
          // At Beneficiary (Stage 5) -> glide into Audience section
          goToIndex(6);
        }
      } else {
        if (closestIdx > 0) {
          goToIndex(closestIdx - 1);
        } else {
          goToIndex(0);
        }
      }
    };

    // Mouse Wheel / Trackpad Handler: Instantaneous reaction without input lag
    const onWheel = (e: WheelEvent) => {
      const currentY = window.scrollY || window.pageYOffset || 0;
      const coords = stageCoordsRef.current;
      const audienceY = coords[6] || 6000;
      const now = performance.now();

      // Zone below stages: 100% natural browser scroll!
      if (currentY >= audienceY - 25) {
        // Only if user reaches top of Audience and scrolls UP -> snap back to Beneficiary
        if (e.deltaY < -15 && currentY <= audienceY + 30) {
          e.preventDefault();
          if (!isAnimatingRef.current && now - lastTriggerTimeRef.current > 300) {
            goToIndex(5);
          }
        }
        return;
      }

      // Inside snap zone: ignore sub-pixel tremor
      if (Math.abs(e.deltaY) < 5) return;

      e.preventDefault();

      // Fast cooldown (300ms) matches the snappy 0.38s animation
      if (isAnimatingRef.current || now - lastTriggerTimeRef.current < 300) {
        return;
      }

      const dir = e.deltaY > 0 ? 1 : -1;
      handleTransition(dir);
    };

    // Touch Event Handlers for Mobile (TikTok style vertical swipe)
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return;
      const currentY = window.scrollY || window.pageYOffset || 0;
      const coords = stageCoordsRef.current;
      const audienceY = coords[6] || 6000;
      const diffY = touchStartYRef.current - e.changedTouches[0].clientY;

      if (currentY >= audienceY - 25) {
        if (diffY < -40 && currentY <= audienceY + 30) {
          if (!isAnimatingRef.current) {
            goToIndex(5);
          }
        }
        return;
      }

      if (Math.abs(diffY) > 30) {
        const dir = diffY > 0 ? 1 : -1;
        if (!isAnimatingRef.current) {
          handleTransition(dir);
        }
      }
    };

    // Keyboard Arrow navigation
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      const currentY = window.scrollY || window.pageYOffset || 0;
      const coords = stageCoordsRef.current;
      const audienceY = coords[6] || 6000;

      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        if (currentY < audienceY - 40) {
          e.preventDefault();
          if (!isAnimatingRef.current) handleTransition(1);
        }
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        if (currentY < audienceY - 40) {
          e.preventDefault();
          if (!isAnimatingRef.current) handleTransition(-1);
        }
      }
    };

    // Anchor click handler (dots and internal navigation)
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      const targetId = href.slice(1);
      if (targetId === 'stage-intro') {
        e.preventDefault();
        goToIndex(0);
        return;
      }

      const stageIdx = SNAP_STAGES.findIndex((s) => s.id === targetId);
      if (stageIdx !== -1) {
        e.preventDefault();
        goToIndex(stageIdx);
        return;
      }

      if (targetId === 'audience') {
        e.preventDefault();
        goToIndex(6);
        return;
      }

      const el = document.getElementById(targetId);
      if (el) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset || 0;
        glideTo(Math.round(rect.top + scrollY - 70));
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', handleAnchorClick);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', measureStages);
      document.removeEventListener('click', handleAnchorClick);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      if (tweenRef.current) tweenRef.current.kill();
    };
  }, []);

  return null;
}
