"use client";

import { cn } from "@/lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import React, { useRef, useState } from "react";

export interface NavbarProps {
  children: React.ReactNode;
  className?: string;
  scrollThreshold?: number;
}

export interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

export interface NavItemsProps {
  items: {
    name: string;
    link: string;
  }[];
  className?: string;
  onItemClick?: () => void;
}

export interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

export interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Navbar = ({
  children,
  className,
  scrollThreshold = 70,
}: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState<boolean>(false);

  // Hysteresis prevents flutter and ensures smooth bidirectional transition
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > scrollThreshold && !visible) {
      setVisible(true);
    } else if (latest < Math.max(20, scrollThreshold - 35) && visible) {
      setVisible(false);
    }
  });

  return (
    <motion.div
      ref={ref}
      className={cn("fixed inset-x-0 top-0 z-50 w-full pointer-events-none", className)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible },
            )
          : child,
      )}
    </motion.div>
  );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        maxWidth: visible ? "820px" : "1180px",
        y: visible ? 8 : 2,
        backgroundColor: visible ? "rgba(11, 15, 25, 0.94)" : "rgba(11, 15, 25, 0.78)",
        borderColor: visible ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.08)",
        boxShadow: visible
          ? "0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)"
          : "0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
      }}
      transition={{
        duration: 0.38,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full flex-row items-center justify-between gap-3 sm:gap-6 self-start rounded-full border px-4 sm:px-5 py-2 sm:py-2.5 backdrop-blur-md pointer-events-auto lg:flex",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "hidden lg:flex flex-1 items-center justify-center gap-1 min-w-0 px-1",
        className,
      )}
    >
      {items.map((item, idx) => (
        <a
          key={`link-${idx}`}
          href={item.link}
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className="relative z-10 shrink-0 whitespace-nowrap rounded-full px-2.5 sm:px-3 py-1.5 text-[12.5px] font-medium text-slate-300 transition-colors hover:text-white"
        >
          {hovered === idx && (
            <motion.div
              layoutId="hovered-nav-pill"
              className="absolute inset-0 h-full w-full rounded-full bg-white/[0.08] border border-white/[0.06]"
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          )}
          <span className="relative z-20">{item.name}</span>
        </a>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        maxWidth: visible ? "92%" : "96%",
        y: visible ? 6 : 2,
        backgroundColor: visible ? "rgba(11, 15, 25, 0.94)" : "rgba(11, 15, 25, 0.82)",
        borderColor: visible ? "rgba(255, 255, 255, 0.16)" : "rgba(255, 255, 255, 0.08)",
        boxShadow: visible
          ? "0 16px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)"
          : "0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)",
      }}
      transition={{
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full flex-col items-center justify-between rounded-2xl border px-4 py-2.5 backdrop-blur-md pointer-events-auto lg:hidden",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
  onClose,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "absolute inset-x-0 top-14 z-50 flex w-full flex-col items-start justify-start gap-3 rounded-2xl border border-white/[0.1] bg-[#0b0f19]/95 p-5 shadow-2xl backdrop-blur-xl",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Toggle menu"
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-white hover:bg-white/[0.08] transition"
    >
      {isOpen ? <IconX className="size-5 text-white" /> : <IconMenu2 className="size-5 text-white" />}
    </button>
  );
};

export const NavbarLogo = ({
  href = "#",
  text = "AidChain",
  imgSrc,
  className,
}: {
  href?: string;
  text?: string;
  imgSrc?: string;
  className?: string;
}) => {
  return (
    <a
      href={href}
      className={cn(
        "relative z-20 shrink-0 flex items-center space-x-2 px-1 py-1 font-display font-medium text-white transition-colors hover:text-emerald-400",
        className,
      )}
    >
      {imgSrc && (
        <img
          src={imgSrc}
          alt="logo"
          width={28}
          height={28}
          className="rounded-lg object-contain select-none"
        />
      )}
      <span className="text-[16px] tracking-tight">{text}</span>
    </a>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
} & (
  | React.ComponentPropsWithoutRef<"a">
  | React.ComponentPropsWithoutRef<"button">
)) => {
  const baseStyles =
    "px-3.5 py-1.5 rounded-xl text-xs font-semibold relative cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 inline-block text-center whitespace-nowrap";

  const variantStyles = {
    primary:
      "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/10",
    secondary:
      "bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/[0.08]",
    dark:
      "bg-black text-white border border-white/[0.1] shadow-lg",
    gradient:
      "bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 shadow-sm",
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};
