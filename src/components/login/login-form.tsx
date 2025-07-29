'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePrivy, useLoginWithEmail } from '@privy-io/react-auth';
import { useUIConfigSection } from '@/hooks/use-ui-config';

interface LoginFormProps {
  onInviteSubmit: (code: string) => void;
  onInviteWithEmailSubmit: (code: string, email: string) => void;
  isValidating: boolean;
  isAuthenticating: boolean;
  error: string;
  isCheckingUser: boolean;
}

export default function LoginForm({
  onInviteSubmit,
  onInviteWithEmailSubmit,
  isValidating,
  isAuthenticating,
  error,
  isCheckingUser,
}: LoginFormProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [showEmbeddedForm, setShowEmbeddedForm] = useState(false);
  const [showInviteEmailForm, setShowInviteEmailForm] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isAwaitingVerification, setIsAwaitingVerification] = useState(false);
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [validatedInviteCode, setValidatedInviteCode] = useState('');

  const { ready } = usePrivy();
  const {
    sendCode: sendEmailCode,
    loginWithCode: loginWithEmailCode,
    state: emailState,
  } = useLoginWithEmail();

  const authConfig = useUIConfigSection('auth');
  const brandingConfig = useUIConfigSection('branding');

  // Generate darker shade for hover effect
  const getDarkerShade = (color: string) => {
    // Simple method to darken a hex color by reducing each RGB component
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - 20);
    const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - 20);
    const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - 20);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const formatInviteCode = (value: string) => {
    // Remove non-alphanumeric characters and convert to uppercase
    const formatted = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return formatted.slice(0, 12);
  };

  const handleInviteChange = (e: { target: { value: string } }) => {
    const formatted = formatInviteCode(e.target.value);
    setInviteCode(formatted);
  };

  const handleInviteSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    // Store the invite code and show email form
    setValidatedInviteCode(inviteCode);
    setShowInviteEmailForm(true);
  };

  const handleExistingUserLogin = () => {
    setShowEmbeddedForm(true);
  };

  const handleEmailSendCode = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    try {
      await sendEmailCode({ email: emailInput });
      setIsAwaitingVerification(true);
    } catch (error) {
      console.error('Failed to send email code:', error);
    }
  };

  const handleVerifyCode = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;

    try {
      await loginWithEmailCode({ code: verificationCode });
      // Reset form and hide embedded form immediately
      resetForm();
      setShowEmbeddedForm(false);
      // The usePrivy hook will automatically detect authentication
      // and trigger the useEffect in the login page
    } catch (error) {
      console.error('Failed to verify code:', error);
    }
  };

  const resetForm = () => {
    setIsAwaitingVerification(false);
    setVerificationCode('');
    setEmailInput('');
  };

  const resetInviteForm = () => {
    setShowInviteEmailForm(false);
    setInviteEmailInput('');
    setValidatedInviteCode('');
  };

  const handleInviteEmailSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!inviteEmailInput.trim() || !validatedInviteCode) return;

    // Call the parent handler with both invite code and email
    onInviteWithEmailSubmit(validatedInviteCode, inviteEmailInput.trim());
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-3 sm:p-4 flex items-start gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-red-300 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Checking User State */}
      {isCheckingUser && (
        <div className="flex items-center justify-center gap-2 py-6 sm:py-8">
          <Loader2
            className="w-4 h-4 animate-spin"
            style={{ color: brandingConfig.primaryColor }}
          />
          <span className="text-xs sm:text-sm text-zinc-400">{authConfig.verifyingText}</span>
        </div>
      )}

      {/* Sign In Button for Existing Users */}
      {!isCheckingUser && ready && !showEmbeddedForm && (
        <button
          onClick={handleExistingUserLogin}
          disabled={isAuthenticating || !ready}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-4',
            'border border-zinc-700 rounded-xl',
            'text-white font-medium',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black',
            'min-h-[48px] sm:min-h-[52px] text-sm sm:text-base',
            'active:scale-[0.98] transform'
          )}
          style={
            {
              backgroundColor: '#1F1F1F',
              '--tw-ring-color': brandingConfig.primaryColor,
            } as React.CSSProperties & { '--tw-ring-color': string }
          }
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#2A2A2A';
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#1F1F1F';
            }
          }}
        >
          {isAuthenticating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{authConfig.signingInText}</span>
            </>
          ) : (
            <span>{authConfig.existingUserText}</span>
          )}
        </button>
      )}

      {/* Embedded Login Form - Shows when button is clicked */}
      {!isCheckingUser && ready && showEmbeddedForm && (
        <div className="space-y-4">
          {/* Back to Button Option */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => {
                setShowEmbeddedForm(false);
                resetForm();
              }}
              className="text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to options
            </button>
          </div>

          {/* Email Login Form */}
          {!isAwaitingVerification && (
            <form onSubmit={handleEmailSendCode} className="space-y-3">
              <div>
                <label
                  htmlFor="email-input"
                  className="block text-xs sm:text-sm font-medium text-zinc-300 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email-input"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email"
                  className={cn(
                    'w-full px-3 py-3 sm:py-4 rounded-lg text-sm sm:text-base',
                    'border text-white border-zinc-600',
                    'placeholder:text-zinc-400',
                    'focus:outline-none focus:ring-2 focus:border-transparent',
                    'transition-all duration-200 shadow-sm',
                    'hover:border-zinc-500',
                    'min-h-[48px] sm:min-h-[52px]'
                  )}
                  style={
                    {
                      backgroundColor: '#383838',
                      '--tw-ring-color': brandingConfig.primaryColor,
                    } as React.CSSProperties & { '--tw-ring-color': string }
                  }
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                disabled={!emailInput || emailState.status === 'sending-code'}
                className={cn(
                  'w-full min-h-[48px] sm:min-h-[52px] text-sm sm:text-base font-semibold rounded-lg',
                  'text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors duration-200',
                  'flex items-center justify-center gap-2'
                )}
                style={{
                  backgroundColor: brandingConfig.primaryColor,
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = getDarkerShade(
                      brandingConfig.primaryColor
                    );
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = brandingConfig.primaryColor;
                  }
                }}
              >
                {emailState.status === 'sending-code' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Code</span>
                )}
              </button>
            </form>
          )}

          {/* Verification Code Form */}
          {isAwaitingVerification && (
            <form onSubmit={handleVerifyCode} className="space-y-3">
              <div>
                <label
                  htmlFor="verification-code"
                  className="block text-xs sm:text-sm font-medium text-zinc-300 mb-2"
                >
                  Verification Code
                </label>
                <input
                  id="verification-code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter verification code"
                  className={cn(
                    'w-full px-3 py-3 sm:py-4 rounded-lg text-sm sm:text-base',
                    'border text-white border-zinc-600',
                    'placeholder:text-zinc-400',
                    'focus:outline-none focus:ring-2 focus:border-transparent',
                    'transition-all duration-200 shadow-sm',
                    'hover:border-zinc-500',
                    'min-h-[48px] sm:min-h-[52px]'
                  )}
                  style={
                    {
                      backgroundColor: '#383838',
                      '--tw-ring-color': brandingConfig.primaryColor,
                    } as React.CSSProperties & { '--tw-ring-color': string }
                  }
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className={cn(
                    'flex-1 min-h-[48px] sm:min-h-[52px] text-sm sm:text-base font-medium rounded-lg',
                    'border border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-500',
                    'transition-colors duration-200'
                  )}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!verificationCode || emailState.status === 'submitting-code'}
                  className={cn(
                    'flex-1 min-h-[48px] sm:min-h-[52px] text-sm sm:text-base font-semibold rounded-lg',
                    'text-white',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors duration-200',
                    'flex items-center justify-center gap-2'
                  )}
                  style={{
                    backgroundColor: brandingConfig.primaryColor,
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = getDarkerShade(
                        brandingConfig.primaryColor
                      );
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = brandingConfig.primaryColor;
                    }
                  }}
                >
                  {emailState.status === 'submitting-code' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Invite Email Form - Shows when invite code is entered */}
      {!isCheckingUser && ready && showInviteEmailForm && (
        <div className="space-y-4">
          {/* Back to Invite Code */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={resetInviteForm}
              className="text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to invite code
            </button>
          </div>

          {/* Email Input for New User with Invite */}
          <form onSubmit={handleInviteEmailSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="invite-email-input"
                className="block text-xs sm:text-sm font-medium text-zinc-300 mb-2"
              >
                Email Address
              </label>
              <input
                id="invite-email-input"
                type="email"
                value={inviteEmailInput}
                onChange={(e) => setInviteEmailInput(e.target.value)}
                placeholder="Enter your email to create account"
                className={cn(
                  'w-full px-3 py-3 sm:py-4 rounded-lg text-sm sm:text-base',
                  'border text-white border-zinc-600',
                  'placeholder:text-zinc-400',
                  'focus:outline-none focus:ring-2 focus:border-transparent',
                  'transition-all duration-200 shadow-sm',
                  'hover:border-zinc-500',
                  'min-h-[48px] sm:min-h-[52px]'
                )}
                style={
                  {
                    backgroundColor: '#383838',
                    '--tw-ring-color': brandingConfig.primaryColor,
                  } as React.CSSProperties & { '--tw-ring-color': string }
                }
                autoComplete="email"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!inviteEmailInput || isValidating || isAuthenticating}
              className={cn(
                'w-full min-h-[48px] sm:min-h-[52px] text-sm sm:text-base font-semibold rounded-lg',
                'text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-200',
                'flex items-center justify-center gap-2'
              )}
              style={{
                backgroundColor: brandingConfig.primaryColor,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = getDarkerShade(
                    brandingConfig.primaryColor
                  );
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = brandingConfig.primaryColor;
                }
              }}
            >
              {isValidating || isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isValidating ? authConfig.validatingText : authConfig.authenticatingText}
                  </span>
                </>
              ) : (
                <span>Create Account with Invite</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-2 py-2 sm:py-2">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
        <span className="text-xs sm:text-sm text-zinc-400 font-medium px-2">or</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
      </div>

      {/* Invite Code Form */}
      {ready && !showInviteEmailForm && (
        <form onSubmit={handleInviteSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label
              htmlFor="invite-code"
              className="block text-xs sm:text-sm font-medium text-zinc-300 mb-2"
            >
              {authConfig.inviteCodeLabel}
            </label>
            <input
              id="invite-code"
              type="text"
              value={inviteCode}
              onChange={handleInviteChange}
              placeholder={authConfig.inviteCodePlaceholder}
              className={cn(
                'w-full px-3 py-3 sm:py-4 rounded-lg text-sm sm:text-base',
                'border text-white',
                'placeholder:text-zinc-400',
                'focus:outline-none focus:ring-2 focus:border-transparent',
                'transition-all duration-200 shadow-sm',
                'hover:border-zinc-500',
                'min-h-[48px] sm:min-h-[52px]',
                error ? 'border-red-500' : 'border-zinc-600'
              )}
              style={
                {
                  backgroundColor: error ? '#4A1A1A' : '#383838',
                  '--tw-ring-color': brandingConfig.primaryColor,
                } as React.CSSProperties & { '--tw-ring-color': string }
              }
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>

          <button
            type="submit"
            disabled={!inviteCode || isValidating || isAuthenticating || !ready}
            className={cn(
              'w-full min-h-[48px] sm:min-h-[52px] text-sm sm:text-base font-semibold rounded-lg',
              'text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-200',
              'flex items-center justify-center gap-2'
            )}
            style={
              {
                backgroundColor: brandingConfig.primaryColor,
                '--hover-bg': getDarkerShade(brandingConfig.primaryColor),
              } as React.CSSProperties & { '--hover-bg': string }
            }
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = getDarkerShade(brandingConfig.primaryColor);
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = brandingConfig.primaryColor;
              }
            }}
          >
            {isValidating || isAuthenticating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {isValidating ? authConfig.validatingText : authConfig.authenticatingText}
                </span>
              </>
            ) : (
              <span>{authConfig.continueButtonText}</span>
            )}
          </button>
        </form>
      )}

      {/* Terms */}
      <div className="pt-4 sm:pt-5">
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 text-center leading-relaxed">
          {authConfig.privacyText.replace('{appName}', brandingConfig.appName)}{' '}
          <a
            href="/privacy"
            className="underline underline-offset-2 font-medium transition-colors"
            style={{
              color: brandingConfig.primaryColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = getDarkerShade(brandingConfig.primaryColor);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = brandingConfig.primaryColor;
            }}
          >
            {authConfig.privacyLinkText}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
