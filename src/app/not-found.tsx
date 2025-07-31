'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Home, MessageSquare } from 'lucide-react';
import { useUIConfigSection } from '@/hooks/use-ui-config';

export default function GlobalNotFound() {
  const loginBrandingConfig = useUIConfigSection('loginBranding');

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-center min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md sm:max-w-lg">
          <div className="text-center">
            {/* Logo Section */}
            <div className="mb-8 sm:mb-12">
              <Image
                src={loginBrandingConfig.logoImage}
                alt={loginBrandingConfig.logoAlt}
                width={loginBrandingConfig.logoWidth}
                height={loginBrandingConfig.logoHeight}
                className="h-8 sm:h-10 lg:h-12 w-auto mx-auto"
                priority
              />
            </div>

            {/* 404 Display Section */}
            <div className="mb-8 sm:mb-12">
              <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-[#FF6E71] tracking-tight leading-none">
                404
              </div>
            </div>

            {/* Content Section */}
            <div className="mb-8 sm:mb-12 space-y-3 sm:space-y-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground tracking-tight leading-tight">
                Page Not Found
              </h1>
              <div className="max-w-sm sm:max-w-md mx-auto">
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  The page you&apos;re looking for doesn&apos;t exist or has been moved. It might
                  have been deleted, renamed, or you entered the wrong URL.
                </p>
              </div>
            </div>

            {/* Actions Section */}
            <div className="mb-8 sm:mb-12">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:space-x-3 lg:space-x-4 justify-center">
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 bg-[#FF6E71] hover:bg-[#FF6E71]/90 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-md font-medium transition-colors text-sm sm:text-base"
                >
                  <Home className="w-4 h-4" />
                  <span>Go to Homepage</span>
                </Link>
                <Link
                  href="/chat"
                  className="flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-6 sm:px-8 py-2.5 sm:py-3 rounded-md font-medium transition-colors text-sm sm:text-base"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Start Chatting</span>
                </Link>
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground px-6 sm:px-8 py-2.5 sm:py-3 rounded-md font-medium transition-colors text-sm sm:text-base"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Go Back</span>
                </button>
              </div>
            </div>

            {/* Popular Pages Section */}
            <div className="mb-6 sm:mb-8">
              <div className="pt-6 sm:pt-8 border-t border-border/20">
                <h2 className="text-xs sm:text-sm font-medium text-foreground mb-4 sm:mb-5">
                  Popular Pages
                </h2>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
                  <Link
                    href="/chat"
                    className="inline-flex items-center justify-center px-4 py-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all duration-200 text-sm font-medium hover:scale-105 transform"
                  >
                    New Chat
                  </Link>
                  <Link
                    href="/shared-sessions"
                    className="inline-flex items-center justify-center px-4 py-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all duration-200 text-sm font-medium hover:scale-105 transform"
                  >
                    Shared Sessions
                  </Link>
                  <Link
                    href="/invites"
                    className="inline-flex items-center justify-center px-4 py-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all duration-200 text-sm font-medium hover:scale-105 transform"
                  >
                    Invites
                  </Link>
                </div>
              </div>
            </div>

            {/* Help Text Section */}
            <div className="max-w-xs sm:max-w-sm mx-auto">
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you continue to experience issues, please refresh the page or contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
