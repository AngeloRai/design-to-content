"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import CTA from "../components/CTA";
import { getCTAVariantAndClasses } from "@/lib/utils/brandColors";
import Menu from "../icons/Menu";
import X from "../icons/X";
import { NavbarProps } from "@/lib/contentful/types/fields";

interface MobileMenuProps {
  menuItems: Array<{ label: string; href: string }>;
  cta: NavbarProps["cta"];
  backgroundColor: string;
}

export default function MobileMenu({
  menuItems,
  cta,
  backgroundColor,
}: MobileMenuProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <div ref={navRef} className="md:hidden relative">
      {/* Mobile Menu Button */}
      <CTA
        variant="icon"
        className="transform transition-all duration-200 hover:scale-110 hover:bg-brand-primary/5"
        onClick={toggleMobileMenu}
      >
        {isMobileMenuOpen ? <X /> : <Menu />}
      </CTA>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Enhanced Backdrop with smooth animation */}
          <div
            className="fixed top-0 left-0 right-0 bottom-0 bg-brand-primary/20 backdrop-blur-md z-40 md:hidden
                       animate-in fade-in duration-300"
            style={{ top: "calc(88px)" }} // Approximate navbar height
            onClick={closeMobileMenu}
          />

          {/* Enhanced Mobile Menu */}
          <div
            className="fixed top-[88px] left-0 right-0 bg-surface-soft/95 backdrop-blur-md 
                         border-t border-brand-primary/10 shadow-xl z-50 md:hidden
                         animate-in slide-in-from-top-4 duration-300"
          >
            <div className="px-6 py-6 space-y-1">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="block px-4 py-4 text-lg font-body text-brand-primary 
                           hover:text-brand-secondary hover:bg-brand-primary/5 
                           rounded-xl transition-all duration-200 transform hover:translate-x-1
                           border border-transparent hover:border-brand-primary/10"
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </Link>
              ))}
              {cta && (
                <div className="pt-4 border-t border-brand-primary/10 mt-4">
                  <CTA
                    {...cta.fields}
                    variant={
                      getCTAVariantAndClasses(cta, backgroundColor, "primary")
                        .variant
                    }
                    className="w-full transform transition-transform duration-200 hover:scale-105"
                    onClick={closeMobileMenu}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}