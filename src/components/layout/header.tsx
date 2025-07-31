'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, User, ChevronDown, Settings, LogOut } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { cn } from '@/lib/utils';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const pathname = usePathname();
  const { login, logout, authenticated, user, ready } = usePrivy();

  useEffect(() => {
    if (authenticated && user?.id) {
      // Extract username from user data
      const userEmail = typeof user.email === 'string' ? user.email : user.email?.address;
      setUsername(userEmail || null);
    } else {
      setUsername(null);
    }
  }, [authenticated, user]);

  const handleAuthAction = () => {
    if (authenticated) {
      logout();
    } else {
      login();
    }
  };

  const getUserEmail = () => {
    if (!user?.email) return 'User';
    return typeof user.email === 'string' ? user.email : user.email.address;
  };

  const isLandingPage = pathname === '/';
  const isAppRoute = pathname.startsWith('/chat') || pathname.startsWith('/account');

  // Don't show header on app routes (they have their own sidebar)
  if (isAppRoute) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-zinc-800">
      {/* Mobile header */}
      <div className="flex items-center justify-between lg:hidden p-4">
        <Link href="/">
          <Image
            src="/assets/aubrai_logo_white.png"
            alt="AUBRAI Logo"
            width={120}
            height={32}
            className="h-8 w-auto"
          />
        </Link>
        {!isLandingPage && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="min-w-[44px] min-h-[44px] flex flex-col justify-center items-center gap-1.5 border border-white/50 rounded p-2 touch-manipulation text-white"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'overflow-hidden transition-all lg:hidden',
          isOpen ? 'max-h-screen p-4 flex flex-col gap-6 bg-black' : 'max-h-0'
        )}
      >
        <NavLink
          to="/chat"
          label="AUBRAI"
          mobile
          pathname={pathname}
          onClick={() => setIsOpen(false)}
        />

        {ready && authenticated ? (
          <div className="flex flex-col gap-2">
            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              className="text-white text-left border border-white/50 rounded-md py-3 px-4 bg-transparent cursor-pointer font-inherit min-h-[44px] touch-manipulation flex items-start gap-2 hover:bg-white/10 transition-colors"
            >
              <Settings size={16} className="mt-0.5" />
              <div className="flex flex-col leading-tight">
                <span className="uppercase text-xs tracking-wider">Account</span>
                <span className="text-slate-400 text-[10px] tracking-wide">Manage invites</span>
              </div>
            </Link>
            <button
              onClick={() => {
                handleAuthAction();
                setIsOpen(false);
              }}
              className="text-white text-left border border-white/50 rounded-md py-3 px-4 bg-transparent cursor-pointer font-inherit min-h-[44px] touch-manipulation flex items-start gap-2 hover:bg-white/10 transition-colors"
            >
              <LogOut size={16} className="mt-0.5" />
              <div className="flex flex-col leading-tight">
                <span className="uppercase text-xs tracking-wider">Sign Out</span>
                <span className="text-slate-400 text-[10px] tracking-wide">
                  {username ?? getUserEmail()}
                </span>
              </div>
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              handleAuthAction();
              setIsOpen(false);
            }}
            className="text-white text-left border border-white/50 rounded-md py-3 px-4 bg-transparent cursor-pointer font-inherit min-h-[44px] touch-manipulation flex items-start gap-2"
          >
            <User size={16} className="mt-0.5" />
            Connect
          </button>
        )}
      </div>

      {/* Desktop header */}
      <div className="hidden lg:flex items-center justify-between w-full py-3 px-8">
        <Link href="/">
          <Image
            src="/assets/aubrai_logo_white.png"
            alt="AUBRAI Logo"
            width={160}
            height={32}
            className="h-8 w-auto"
          />
        </Link>

        {!isLandingPage && (
          <div className="flex items-center gap-8">
            {/* Nav links container */}
            <div className="flex items-center gap-6">
              <NavLink to="/chat" label="AUBRAI" pathname={pathname} />
              <a
                href="https://vitadao.notion.site/214a76ee454a806b945ec897362aec0d?pvs=105"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white hover:opacity-80 transition-opacity uppercase font-inherit"
              >
                Give Feedback
              </a>
            </div>

            {/* Buttons container */}
            <div className="flex gap-4">
              {ready && authenticated ? (
                <DropdownMenu username={username ?? getUserEmail()} onLogout={handleAuthAction} />
              ) : (
                <button
                  onClick={handleAuthAction}
                  disabled={!ready}
                  className="flex items-center gap-2 border border-white/50 rounded-md py-2 px-4 text-white text-xs bg-transparent cursor-pointer font-inherit uppercase tracking-wider hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <User size={12} className="w-2.5 h-2.5" />
                  {ready ? 'Connect' : 'Loading...'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

interface NavLinkProps {
  to: string;
  label: string;
  pathname: string;
  mobile?: boolean;
  onClick?: () => void;
}

const NavLink = ({ to, label, pathname, mobile, onClick }: NavLinkProps) => {
  const isActive = pathname === to;

  const handleClick = () => {
    onClick?.();
  };

  if (mobile) {
    return (
      <Link
        href={to}
        className={cn(
          'text-center py-3 hover:opacity-80 transition-opacity uppercase text-xs font-inherit min-h-[44px] flex items-center justify-center touch-manipulation',
          isActive ? 'text-[#FF6E71]' : 'text-white'
        )}
        onClick={handleClick}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={to}
      className={cn(
        'text-xs hover:opacity-80 transition-opacity uppercase font-inherit',
        isActive ? 'text-[#FF6E71]' : 'text-white'
      )}
      onClick={handleClick}
    >
      {label}
    </Link>
  );
};

interface DropdownMenuProps {
  username: string;
  onLogout: () => void;
}

const DropdownMenu = ({ username, onLogout }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border border-white/50 rounded-md py-2 px-4 text-white text-xs bg-transparent cursor-pointer font-inherit uppercase tracking-wider hover:bg-white/10 transition-colors"
      >
        <User size={12} className="w-2.5 h-2.5" />
        <span>{username}</span>
        <ChevronDown size={12} className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-20">
            <div className="py-1">
              <Link
                href="/account"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-white hover:bg-zinc-700 cursor-pointer"
              >
                <Settings size={14} />
                Account
              </Link>
              <div className="border-t border-zinc-700 my-1" />
              <button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-white hover:bg-zinc-700 cursor-pointer"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
