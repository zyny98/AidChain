"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      role="radiogroup"
      aria-label="Переключение темы оформления"
      onClick={toggleTheme}
      className={`relative inline-flex h-[32px] w-[62px] items-center rounded-full p-[3px] border cursor-pointer select-none transition-colors duration-200 ${
        isDark
          ? "bg-[#0f172a] border-white/15 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
          : "bg-[#e8ebf0] border-[#cfd5de] shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]"
      } ${className || ""}`}
    >
      {/* Круглый скользящий бегунок (Thumb) с физической пружинной анимацией */}
      <motion.div
        className={`absolute top-[2.5px] left-[3px] h-[25px] w-[25px] rounded-full shadow-sm transition-colors duration-200 pointer-events-none ${
          isDark
            ? "bg-[#1e293b] border border-white/15"
            : "bg-[#d5dbe4] border border-[#c4cbd5]/60"
        }`}
        animate={{
          x: isDark ? 0 : 31,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          mass: 0.8,
        }}
      />

      {/* Левая иконка: Луна (Moon) */}
      <button
        type="button"
        role="radio"
        aria-checked={isDark}
        onClick={(e) => {
          e.stopPropagation();
          setTheme("dark");
        }}
        className={`relative z-10 flex h-[25px] w-[28px] items-center justify-center transition-colors duration-200 focus:outline-none ${
          isDark
            ? "text-white"
            : "text-[#64748b] hover:text-[#334155]"
        }`}
        title="Тёмная тема"
      >
        <svg
          className="h-[14px] w-[14px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </button>

      {/* Правая иконка: Солнце (Sun) с 8 лучами как на картинке */}
      <button
        type="button"
        role="radio"
        aria-checked={!isDark}
        onClick={(e) => {
          e.stopPropagation();
          setTheme("light");
        }}
        className={`relative z-10 flex h-[25px] w-[28px] items-center justify-center transition-colors duration-200 focus:outline-none ${
          !isDark
            ? "text-[#0f172a]"
            : "text-[#64748b] hover:text-[#94a3b8]"
        }`}
        title="Светлая тема"
      >
        <svg
          className="h-[15px] w-[15px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      </button>
    </div>
  );
}
