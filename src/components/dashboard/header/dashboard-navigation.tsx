'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export function DashboardNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative">
      <div className="flex justify-between items-center w-full">
        {/* Left Section - Logo and Title */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative h-8 w-16 md:h-12 md:w-24">
            <Image
              src="/assets/logo.png"
              alt="Dashboard Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="hidden sm:block">
            <span className="text-xs md:text-sm text-white font-red-hat-mono font-medium leading-[1.714]">your longevity co-pilot</span>
          </div>
        </div>

        {/* Desktop Menu - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-3 text-sm">
          <button className="text-white font-red-hat-mono font-medium leading-[1.714] hover:text-gray-300 transition-colors flex items-center gap-3">
            Science Chat
          </button>
          <Link 
            href="/twitter" 
            className="text-white font-red-hat-mono font-medium leading-[1.714] hover:text-gray-300 transition-colors"
          >
            Twitter
          </Link>

          <button className="text-white font-red-hat-mono font-medium leading-[1.714] hover:text-gray-300 transition-colors flex items-center gap-3">
            <div className="w-[5px] h-[5px] bg-white"></div>
            Waitlist
          </button>
          
          <button className="px-4 py-0 border border-white text-white hover:bg-white hover:text-black transition-colors font-red-hat-mono font-medium leading-[1.714] h-8">
            Get $AUBRAI
          </button>
        </div>

        {/* Mobile Hamburger Menu */}
        <button 
          className="md:hidden flex flex-col gap-1 p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <span className={`w-5 h-0.5 bg-white transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`w-5 h-0.5 bg-white transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`w-5 h-0.5 bg-white transition-transform duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-black border border-white/20 rounded-none mt-1 p-4 z-50 md:hidden">
          <div className="flex flex-col gap-4">
            <button 
              className="text-white font-red-hat-mono font-medium text-sm hover:text-gray-300 transition-colors text-left"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Science Chat
            </button>
            <Link 
              href="/twitter" 
              className="text-white font-red-hat-mono font-medium text-sm hover:text-gray-300 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Twitter
            </Link>
            <button 
              className="text-white font-red-hat-mono font-medium text-sm hover:text-gray-300 transition-colors flex items-center gap-2 text-left"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="w-[5px] h-[5px] bg-white"></div>
              Waitlist
            </button>
            <button 
              className="px-4 py-2 border border-white text-white hover:bg-white hover:text-black transition-colors font-red-hat-mono font-medium text-sm w-fit"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Get $AUBRAI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
