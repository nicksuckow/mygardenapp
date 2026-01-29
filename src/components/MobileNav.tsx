"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/settings", label: "Location Data" },
  { href: "/plants", label: "Plants" },
  { href: "/seeds", label: "Seed Inventory" },
  { href: "/beds", label: "Beds" },
  { href: "/garden", label: "Garden View" },
  { href: "/schedule", label: "Schedule" },
  { href: "/plant-now", label: "Plant Now" },
  { href: "/journal", label: "Journal" },
  { href: "/seed-swaps", label: "Seed Swaps" },
  { href: "/stats", label: "Statistics" },
  { href: "/account", label: "Account" },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Hamburger button - only shows on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 -mr-2 text-earth-warm hover:text-earth-deep"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-64 bg-cream-100 shadow-xl border-l border-cream-200 transform transition-transform duration-200 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-cream-200">
          <span className="font-display font-semibold text-earth-deep">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-earth-warm hover:text-earth-deep"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-sage/10 text-sage-dark"
                        : "text-earth-warm hover:bg-cream-50 hover:text-earth-deep"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
