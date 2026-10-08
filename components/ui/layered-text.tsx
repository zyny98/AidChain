"use client"

import React, { useEffect, useRef, useId } from "react"
import { gsap } from "gsap"

export interface LayeredTextProps {
  lines?: Array<{ top: string; bottom: string }>
  fontSize?: string
  fontSizeMd?: string
  lineHeight?: number
  lineHeightMd?: number
  className?: string
}

export function LayeredText({
  lines = [
    { top: "\u00A0", bottom: "INFINITE" },
    { top: "INFINITE", bottom: "PROGRESS" },
    { top: "PROGRESS", bottom: "INNOVATION" },
    { top: "INNOVATION", bottom: "FUTURE" },
    { top: "FUTURE", bottom: "DREAMS" },
    { top: "DREAMS", bottom: "ACHIEVEMENT" },
    { top: "ACHIEVEMENT", bottom: "\u00A0" },
  ],
  fontSize = "72px",
  fontSizeMd = "36px",
  lineHeight = 60,
  lineHeightMd = 35,
  className = "",
}: LayeredTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline>()
  const rawId = useId()
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "")

  const calculateTranslateX = (index: number) => {
    const baseOffset = 35
    const baseOffsetMd = 20
    const centerIndex = Math.floor(lines.length / 2)
    return {
      desktop: (index - centerIndex) * baseOffset,
      mobile: (index - centerIndex) * baseOffsetMd,
    }
  }

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const paragraphs = container.querySelectorAll("p")

    const setupTimeline = () => {
      const isMobile = window.innerWidth < 768
      const targetY = isMobile ? -lineHeightMd : -lineHeight

      timelineRef.current?.kill()
      timelineRef.current = gsap.timeline({ paused: true })

      timelineRef.current.to(paragraphs, {
        y: targetY,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.08,
      })
    }

    setupTimeline()

    const handleMouseEnter = () => {
      timelineRef.current?.play()
    }

    const handleMouseLeave = () => {
      timelineRef.current?.reverse()
    }

    // Touch/click toggle for mobile devices
    let isToggled = false
    const handleClick = () => {
      if (isToggled) {
        timelineRef.current?.reverse()
        isToggled = false
      } else {
        timelineRef.current?.play()
        isToggled = true
      }
    }

    container.addEventListener("mouseenter", handleMouseEnter)
    container.addEventListener("mouseleave", handleMouseLeave)
    container.addEventListener("click", handleClick)

    // Scroll trigger: automatically plays when scrolled into view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timelineRef.current?.play()
          isToggled = true
        } else {
          timelineRef.current?.reverse()
          isToggled = false
        }
      },
      { threshold: 0.25 }
    )
    observer.observe(container)

    const handleResize = () => {
      setupTimeline()
    }
    window.addEventListener("resize", handleResize)

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter)
      container.removeEventListener("mouseleave", handleMouseLeave)
      container.removeEventListener("click", handleClick)
      window.removeEventListener("resize", handleResize)
      observer.disconnect()
      timelineRef.current?.kill()
    }
  }, [lines, lineHeight, lineHeightMd])

  return (
    <div
      ref={containerRef}
      className={`mx-auto py-6 font-sans font-black tracking-[-2px] uppercase text-[#ffedd7] antialiased cursor-pointer select-none transition-all duration-300 ${className}`}
      style={{ fontSize, "--md-font-size": fontSizeMd } as React.CSSProperties}
    >
      <style>{`
        @media (max-width: 768px) {
          .layered-item-${uid} {
            height: ${lineHeightMd}px !important;
            transform: translateX(var(--md-translateX)) var(--skew-scale) !important;
          }
          .layered-item-${uid} p {
            height: ${lineHeightMd}px !important;
            line-height: ${lineHeightMd}px !important;
          }
        }
      `}</style>
      <ul className="list-none p-0 m-0 flex flex-col items-center">
        {lines.map((line, index) => {
          const translateX = calculateTranslateX(index)
          const skewVal = index % 2 === 0 ? "60deg, -30deg" : "0deg, -30deg"
          const scaleVal = index % 2 === 0 ? "0.66667" : "1.33333"

          return (
            <li
              key={index}
              className={`
                layered-item-${uid}
                overflow-hidden relative
                ${
                  index % 2 === 0
                    ? "[transform:skew(60deg,-30deg)_scaleY(0.66667)]"
                    : "[transform:skew(0deg,-30deg)_scaleY(1.33333)]"
                }
              `}
              style={
                {
                  height: `${lineHeight}px`,
                  transform: `translateX(${translateX.desktop}px) skew(${skewVal}) scaleY(${scaleVal})`,
                  "--md-height": `${lineHeightMd}px`,
                  "--md-translateX": `${translateX.mobile}px`,
                  "--skew-scale": `skew(${skewVal}) scaleY(${scaleVal})`,
                } as React.CSSProperties
              }
            >
              <p
                className="px-[15px] align-top whitespace-nowrap m-0 transition-colors duration-200 hover:text-[#dc5000]"
                style={
                  {
                    height: `${lineHeight}px`,
                    lineHeight: `${lineHeight}px`,
                  } as React.CSSProperties
                }
              >
                {line.top}
              </p>
              <p
                className="px-[15px] align-top whitespace-nowrap m-0 transition-colors duration-200 hover:text-[#dc5000]"
                style={
                  {
                    height: `${lineHeight}px`,
                    lineHeight: `${lineHeight}px`,
                  } as React.CSSProperties
                }
              >
                {line.bottom}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
