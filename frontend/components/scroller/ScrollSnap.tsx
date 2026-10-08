'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface StageInfo {
  id: string;
  name: string;
  getTargetY: () => number;
}

// Exactly 5 video stages ending at Beneficiary (Получатели)
const VIDEO_STAGES: StageInfo[] = [
  {
    id: 'stage-donor',
    name: 'Stage 1: Donor',
    getTargetY: () => {
      const el = document.getElementById('stage-donor');
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const currentScroll = window.scrollY || window.pageYOffset || 0;
      return Math.round(rect.top + currentScroll + rect.height / 2 - window.innerHeight / 2);
    },
  },
  {
    id: 'stage-escrow',
    name: 'Stage 2: Escrow',
    getTargetY: () => {
      const el = document.getElementById('stage-escrow');
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const currentScroll = window.scrollY || window.pageYOffset || 0;
      return Math.round(rect.top + currentScroll + rect.height / 2 - window.innerHeight / 2);
    },
  },
  {
    id: 'stage-oracle',
    name: 'Stage 3: Oracle',
    getTargetY: () => {
      const el = document.getElementById('stage-oracle');
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const currentScroll = window.scrollY || window.pageYOffset || 0;
      return Math.round(rect.top + currentScroll + rect.height / 2 - window.innerHeight / 2);
    },
  },
  {
    id: 'stage-logistics',
    name: 'Stage 4: Logistics',
    getTargetY: () => {
      const el = document.getElementById('stage-logistics');
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const currentScroll = window.scrollY || window.pageYOffset || 0;
      return Math.round(rect.top + currentScroll + rect.height / 2 - window.innerHeight / 2);
    },
  },
  {
    id: 'stage-beneficiary',
    name: 'Stage 5: Beneficiary',
    getTargetY: () => {
      const el = document.getElementById('stage-beneficiary');
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const currentScroll = window.scrollY || window.pageYOffset || 0;
      return Math.round(rect.top + currentScroll + rect.height / 2 - window.innerHeight / 2);
    },
  },
];

const ALL_SECTION_IDS = [
  'stage-intro',
  'stage-donor',
  'stage-escrow',
  'stage-oracle',
  'stage-logistics',
  'stage-beneficiary',
  'audience',
  'metrics',
  'security',
  'simulation',
  'faq',
  'footer',
];

export function ScrollSnap() {
  const isAnimatingRef = useRef<boolean>(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const accumulatedDeltaRef = useRef<number>(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartYRef = useRef<number>(0);
  const touchStartTimeRef = useRef<number>(0);

  useEffect(() => {
    // Helper to find the closest video stage index (0 to 4)
    const getClosestVideoStageIndex = (): number => {
      const currentY = window.scrollY || window.pageYOffset || 0;
      let closestIdx = 0;
      let minDiff = Infinity;

      for (let i = 0; i < VIDEO_STAGES.length; i++) {
        const targetY = VIDEO_STAGES[i].getTargetY();
        const diff = Math.abs(currentY - targetY);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }

      return closestIdx;
    };

    // Smooth glide to an explicit scroll Y
    const glideTo = (targetY: number, onDone?: () => void) => {
      isAnimatingRef.current = true;

      if (tweenRef.current) {
        tweenRef.current.kill();
      }

      const scrollObj = { y: window.scrollY || window.pageYOffset || 0 };

      tweenRef.current = gsap.to(scrollObj, {
        y: targetY,
        duration: 0.85,
        ease: 'power2.out',
        onUpdate: () => {
          window.scrollTo(0, scrollObj.y);
        },
        onComplete: () => {
          setTimeout(() => {
            isAnimatingRef.current = false;
            onDone?.();
          }, 80);
        },
      });
    };

    // Handle transition between video stages (+1 = next / down, -1 = prev / up)
    const handleTransition = (direction: number) => {
      const currentY = window.scrollY || window.pageYOffset || 0;
      const stage1Y = VIDEO_STAGES[0].getTargetY();
      const lastStageY = VIDEO_STAGES[VIDEO_STAGES.length - 1].getTargetY();
      const currentStageIdx = getClosestVideoStageIndex();

      if (direction > 0) {
        // Scrolling DOWN
        if (currentY < stage1Y - 100) {
          // In Hero -> enter Stage 1
          glideTo(stage1Y);
        } else if (currentStageIdx < VIDEO_STAGES.length - 1) {
          // Inside video stages -> snap to next stage
          glideTo(VIDEO_STAGES[currentStageIdx + 1].getTargetY());
        } else {
          // At Beneficiary -> smoothly release into natural scroll without skipping any sections
          isAnimatingRef.current = false;
          // Smoothly scroll slightly past beneficiary to let natural scroll take over
          glideTo(lastStageY + 220);
        }
      } else {
        // Scrolling UP
        if (currentStageIdx > 0) {
          glideTo(VIDEO_STAGES[currentStageIdx - 1].getTargetY());
        } else {
          // At Stage 1 -> return to Hero
          glideTo(0);
        }
      }
    };

    // Wheel event handler with strict boundary: ONLY intercepts between Stage 1 and Beneficiary
    const onWheel = (e: WheelEvent) => {
      const currentY = window.scrollY || window.pageYOffset || 0;
      const stage1Y = VIDEO_STAGES[0].getTargetY();
      const lastStageY = VIDEO_STAGES[VIDEO_STAGES.length - 1].getTargetY();

      // Zone 1: In Hero section -> allow 100% natural scroll
      if (currentY < stage1Y - 140) {
        if (e.deltaY > 0 && currentY > stage1Y - 260) {
          e.preventDefault();
          accumulatedDeltaRef.current += e.deltaY;
          if (accumulatedDeltaRef.current >= 26) {
            accumulatedDeltaRef.current = 0;
            handleTransition(1);
          }
        } else {
          accumulatedDeltaRef.current = 0;
        }
        return;
      }

      // Zone 3: Below Beneficiary (AudienceBlock, MetricsBlock, SecurityBlock, Simulation, FAQ, Footer)
      // Natural browser scrolling is 100% FREE! No skipping, no hijacking!
      if (currentY >= lastStageY + 120) {
        // Only if scrolling UP right near the bottom of Beneficiary, snap back into Beneficiary
        if (e.deltaY < 0 && currentY <= lastStageY + 200) {
          e.preventDefault();
          accumulatedDeltaRef.current += e.deltaY;
          if (accumulatedDeltaRef.current <= -26) {
            accumulatedDeltaRef.current = 0;
            glideTo(lastStageY);
          }
        } else {
          accumulatedDeltaRef.current = 0;
        }
        return;
      }

      // Zone 2: Inside 3D Video Stages (Stage 1 to Beneficiary)
      e.preventDefault();

      if (isAnimatingRef.current) return;

      accumulatedDeltaRef.current += e.deltaY;

      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        accumulatedDeltaRef.current = 0;
      }, 150);

      if (Math.abs(accumulatedDeltaRef.current) >= 26) {
        const dir = accumulatedDeltaRef.current > 0 ? 1 : -1;
        accumulatedDeltaRef.current = 0;
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        handleTransition(dir);
      }
    };

    // Touch event handlers for mobile
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartYRef.current = e.touches[0].clientY;
        touchStartTimeRef.current = Date.now();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return;
      const currentY = window.scrollY || window.pageYOffset || 0;
      const stage1Y = VIDEO_STAGES[0].getTargetY();
      const lastStageY = VIDEO_STAGES[VIDEO_STAGES.length - 1].getTargetY();

      // Only intercept touch inside the video stages zone
      const inVideoZone = currentY >= stage1Y - 140 && currentY < lastStageY + 120;
      const atHeroBottom = currentY < stage1Y - 140 && currentY > stage1Y - 260;

      if (!inVideoZone && !atHeroBottom) {
        return; // Natural free touch scrolling everywhere else
      }

      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchStartYRef.current - touchEndY;
      const elapsed = Math.max(1, Date.now() - touchStartTimeRef.current);
      const velocity = Math.abs(diffY) / elapsed;

      if (Math.abs(diffY) >= 28 || velocity > 0.25) {
        if (diffY > 0) {
          handleTransition(1);
        } else {
          handleTransition(-1);
        }
      }
    };

    // Keyboard arrow navigation
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      const currentY = window.scrollY || window.pageYOffset || 0;
      const stage1Y = VIDEO_STAGES[0].getTargetY();
      const lastStageY = VIDEO_STAGES[VIDEO_STAGES.length - 1].getTargetY();

      const inVideoZone = currentY >= stage1Y - 140 && currentY < lastStageY + 120;

      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        if (inVideoZone || (currentY < stage1Y - 140 && currentY > stage1Y - 260)) {
          e.preventDefault();
          handleTransition(1);
        }
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        if (inVideoZone) {
          e.preventDefault();
          handleTransition(-1);
        }
      }
    };

    // Anchor click handler
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('#')) return;

      const targetId = href.slice(1);
      if (!ALL_SECTION_IDS.includes(targetId)) return;

      const el = document.getElementById(targetId);
      if (!el && targetId !== 'footer') return;

      e.preventDefault();

      let targetY = 0;
      if (targetId === 'stage-intro') {
        targetY = 0;
      } else if (targetId === 'footer') {
        targetY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      } else {
        const stage = VIDEO_STAGES.find((s) => s.id === targetId);
        if (stage) {
          targetY = stage.getTargetY();
        } else if (el) {
          const rect = el.getBoundingClientRect();
          const currentScroll = window.scrollY || window.pageYOffset || 0;
          targetY = Math.round(rect.top + currentScroll - 80);
        }
      }

      glideTo(targetY);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', handleAnchorClick);

    return () => {
      if (tweenRef.current) {
        tweenRef.current.kill();
      }
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  return null;
}
