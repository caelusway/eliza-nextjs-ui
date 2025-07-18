'use client';

import { useState } from 'react';
import { usePrivy, useLoginWithEmail } from '@privy-io/react-auth';
import { Button } from '@/components/ui';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface LoginButtonProps {
  mobile?: boolean;
  onClick?: () => void;
}

export default function LoginButton({ mobile = false, onClick }: LoginButtonProps) {
  const { ready, authenticated, user, logout, linkWallet } = usePrivy();
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { sendCode, loginWithCode } = useLoginWithEmail();

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <div
        className={clsx(
          'flex items-center',
          mobile
            ? '-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-zinc-900 dark:text-white'
            : 'text-sm font-medium text-zinc-500 dark:text-zinc-400'
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  // Show user info and logout if authenticated
  if (authenticated && user) {
    const hasWallet = user.wallet?.address;

    return (
      <div
        className={clsx(
          'flex items-center',
          mobile
            ? '-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
            : 'text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-white'
        )}
      >
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm">
              {user.email?.address || user.wallet?.address?.slice(0, 6) + '...' || 'User'}
            </span>
            <button
              onClick={() => {
                logout();
                onClick?.();
              }}
              className="text-xs underline hover:no-underline"
            >
              Logout
            </button>
          </div>
          {!hasWallet && (
            <button
              onClick={async () => {
                setIsLoading(true);
                try {
                  await linkWallet();
                } catch (error) {
                  console.error('Error linking wallet:', error);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Connect Wallet</span>
              )}
            </button>
          )}
          {hasWallet && (
            <div className="text-xs text-green-600 dark:text-green-400">
              ✓ Wallet: {user.wallet?.address?.slice(0, 6)}...{user.wallet?.address?.slice(-4)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show email login form if showEmailLogin is true
  if (showEmailLogin) {
    return (
      <div
        className={clsx(
          'flex flex-col space-y-2',
          mobile
            ? '-mx-3 block rounded-lg px-3 py-2'
            : 'absolute right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 shadow-lg z-50'
        )}
      >
        <div className="flex flex-col space-y-2">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={async () => {
              setIsLoading(true);
              try {
                await sendCode({ email });
              } catch (error) {
                console.error('Error sending code:', error);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={!email || isLoading}
            className="w-full"
            color="blue"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Code'}
          </Button>
          <input
            type="text"
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={async () => {
              setIsLoading(true);
              try {
                await loginWithCode({ code });
                setShowEmailLogin(false);
                onClick?.();
              } catch (error) {
                console.error('Error logging in:', error);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={!code || isLoading}
            className="w-full"
            color="blue"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
          </Button>
          <button
            onClick={() => setShowEmailLogin(false)}
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Show login button
  return (
    <button
      onClick={() => setShowEmailLogin(true)}
      className={clsx(
        'text-sm font-medium flex items-center',
        mobile
          ? '-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
          : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-white'
      )}
    >
      Login
    </button>
  );
}
