'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, ArrowLeft, Home } from 'lucide-react';
import { useUIConfigSection } from '@/hooks/use-ui-config';

export default function NotFound() {
  const loginBrandingConfig = useUIConfigSection('loginBranding');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src={loginBrandingConfig.logoImage}
              alt={loginBrandingConfig.logoAlt}
              width={loginBrandingConfig.logoWidth}
              height={loginBrandingConfig.logoHeight}
              className="h-8 w-auto"
            />
          </div>

          {/* Icon */}
          <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-red-500" />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Chat Session Not Found
            </h1>
            <p className="text-muted-foreground">
              This shared chat session was not found, has expired, or is no longer available. The
              link may be incorrect or the session may have been removed.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-[#FF6E71] hover:bg-[#FF6E71]/90 text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to Homepage
            </Link>
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-6 py-3 rounded-md font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>

          {/* Help text */}
          <p className="text-xs text-muted-foreground">
            If you believe this is an error, please contact the person who shared this link with
            you.
          </p>
        </div>
      </div>
    </div>
  );
}
