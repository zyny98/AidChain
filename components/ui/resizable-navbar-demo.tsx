"use client";

import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState } from "react";

export default function ResizableNavbarDemo() {
  const navItems = [
    {
      name: "О платформе",
      link: "#stage-intro",
    },
    {
      name: "Как это работает",
      link: "#stage-donor",
    },
    {
      name: "Симуляция",
      link: "#simulation",
    },
    {
      name: "Вопросы",
      link: "#faq",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo text="AidChain" href="#stage-intro" />
          <NavItems items={navItems} />
          <div className="relative z-20 flex items-center gap-3">
            <NavbarButton href="/app" variant="secondary">
              Войти
            </NavbarButton>
            <NavbarButton href="/app" variant="primary">
              Личные кабинеты →
            </NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo text="AidChain" href="#stage-intro" />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-slate-300 hover:text-white transition py-1"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-2.5 pt-2 border-t border-white/[0.08]">
              <NavbarButton
                href="/app"
                onClick={() => setIsMobileMenuOpen(false)}
                variant="secondary"
                className="w-full"
              >
                Войти
              </NavbarButton>
              <NavbarButton
                href="/app"
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full"
              >
                Личные кабинеты →
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
