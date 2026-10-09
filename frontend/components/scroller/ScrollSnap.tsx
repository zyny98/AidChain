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

  useEffect(() => {
    // Exact target scroll Y for each stage index
    const getStageTargetY = (index: number): number => {
      if (index <= 0) return 0;
      if (index >= 1 && index <= 5) {
        const stage = SNAP_STAGES[index];
        const el = document.getElementById(stage.id);
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset || 0;
        return Math.round(rect.top + scrollY + rect.height / 2 - window.innerHeight / 2);
      }
      // Index 6: First section below stages (Audience)
      const aud = document.getElementById('audience') || document.getElementById('simulation');
      if (aud) {
        const rect = aud.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset || 0;
        return Math.round(rect.top + scrollY - 60);
      }
      return 0;
    };

    // Find the closest stage index among 0..5
    const getClosestStageIndex = (): number => {
      const currentY = window.scrollY || window.pageYOffset || 0;
      let closest = 0;
      let minDiff = Infinity;
      for (let i = 0; i <= 5; i++) {
        const targetY = getStageTargetY(i);
        const diff = Math.abs(currentY - targetY);
        if (diff < minDiff) {
          minDiff = diff;
          closest = i;
        }
      }
      return closest;
    };

    // Smooth TikTok glide to target scroll Y
    const glideTo = (targetY: number, onDone?: () => void) => {
      isAnimatingRef.current = true;
      lastTriggerTimeRef.current = Date.now();

      if (tweenRef.current) {
        tweenRef.current.kill();
      }
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
      }

      // Safety failsafe: never stay locked if animation is interrupted
      safetyTimerRef.current = setTimeout(() => {
        isAnimatingRef.current = false;
      }, 750);

      const scrollObj = { y: window.scrollY || window.pageYOffset || 0 };

      tweenRef.current = gsap.to(scrollObj, {
        y: targetY,
        duration: 0.6,
        ease: 'power2.out',
        onUpdate: () => {
          window.scrollTo(0, scrollObj.y);
        },
        onComplete: () => {
          if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
          setTimeout(() => {
            isAnimatingRef.current = false;
            onDone?.();
          }, 50);
        },
      });
    };

    const goToIndex = (targetIdx: number) => {
      const clampedIdx = Math.max(0, Math.min(6, targetIdx));
      const targetY = getStageTargetY(clampedIdx);
      glideTo(targetY);
    };

    const handleTransition = (direction: number) => {
      const closestIdx = getClosestStageIndex();
      if (direction > 0) {
        if (closestIdx < 5) {
          goToIndex(closestIdx + 1);
        } else {
          // At Beneficiary (Stage 5) -> transition smoothly to Audience section
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

    // Mouse Wheel / Trackpad Handler
    const onWheel = (e: WheelEvent) => {
      const currentY = window.scrollY || window.pageYOffset || 0;
      const audienceY = getStageTargetY(6);
      const now = Date.now();

      // Zone below stages: Natural browser scrolling is 100% free!
      if (currentY >= audienceY - 20) {
        // Only if user reaches top of Audience and scrolls UP -> snap back to Beneficiary
        if (e.deltaY < -15 && currentY <= audienceY + 30) {
          e.preventDefault();
          if (!isAnimatingRef.current && now - lastTriggerTimeRef.current > 450) {
            goToIndex(5);
          }
        }
        return;
      }

      // Inside snap stages: ignore micro-jitters
      if (Math.abs(e.deltaY) < 8) return;

      e.preventDefault();

      // Debounce & lock during glide
      if (isAnimatingRef.current || now - lastTriggerTimeRef.current < 450) {
        return;
      }

      const dir = e.deltaY > 0 ? 1 : -1;
      handleTransition(dir);
    };

    // Touch Event Handlers for Mobile (TikTok style vertical swipes)
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return;
      const currentY = window.scrollY || window.pageYOffset || 0;
      const audienceY = getStageTargetY(6);
      const diffY = touchStartYRef.current - e.changedTouches[0].clientY;

      if (currentY >= audienceY - 20) {
        if (diffY < -40 && currentY <= audienceY + 30) {
          if (!isAnimatingRef.current) {
            goToIndex(5);
          }
        }
        return;
      }

      if (Math.abs(diffY) > 35) {
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
      const audienceY = getStageTargetY(6);

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
      document.removeEventListener('click', handleAnchorClick);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      if (tweenRef.current) tweenRef.current.kill();
    };
  }, []);

  return null;
}
