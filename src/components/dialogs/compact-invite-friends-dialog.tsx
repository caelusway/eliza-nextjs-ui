'use client';

import React, { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Copy, X, UserPlus, Mail, Send, Plus, Link, User, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrivy } from '@privy-io/react-auth';

interface InviteCode {
  id: string;
  code: string;
  used: boolean;
  used_by?: string;
  created_at: string;
  expires_at?: string;
  status?: 'pending' | 'email_sent' | 'accepted' | 'expired';
  current_uses?: number;
  max_uses?: number;
  is_legacy?: boolean;
  email_sent_to?: string | null;
  email_sent_at?: string | null;
}

interface CompactInviteFriendsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Toast notification component
const Toast = ({ message, isVisible }: { message: string; isVisible: boolean }) => (
  <div
    className={cn(
      'fixed bottom-4 left-1/2 transform -translate-x-1/2',
      'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 rounded-lg shadow-lg',
      'transition-all duration-300 text-sm font-medium text-zinc-900 dark:text-white',
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
    )}
  >
    <div className="flex items-center gap-2">
      <Check className="w-4 h-4 text-green-500" />
      {message}
    </div>
  </div>
);

export default function CompactInviteFriendsDialog({
  isOpen,
  onClose,
}: CompactInviteFriendsDialogProps) {
  const { user } = usePrivy();
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [emailDialogInvite, setEmailDialogInvite] = useState<InviteCode | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [senderName, setSenderName] = useState('');

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchInviteCodes();
    }
  }, [isOpen, user?.id]);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const fetchInviteCodes = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/invites/my-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const invites = data.invites || [];
        setInviteCodes(invites);
      }
    } catch (error) {
      console.error('Failed to fetch invite codes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInviteCode = async () => {
    if (!user?.id) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/invites/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (response.ok) {
        await fetchInviteCodes();
        showToastMessage('New invite code generated!');
      }
    } catch (error) {
      console.error('Failed to generate invite code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        showToastMessage(`Code ${text} copied!`);
      } else {
        showToastMessage('Invite link copied!');
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const sendInviteEmail = async (invite: InviteCode) => {
    if (!emailInput.trim()) return;

    setIsSending(invite.id);
    try {
      const response = await fetch('/api/invites/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: invite.code,
          email: emailInput.trim(),
          senderName: senderName.trim() || undefined,
        }),
      });

      if (response.ok) {
        await fetchInviteCodes();
        showToastMessage(`Invite sent to ${emailInput}!`);
        setEmailDialogInvite(null);
        setEmailInput('');
        setSenderName('');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send invite' }));
        showToastMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to send invite:', error);
    } finally {
      setIsSending(null);
    }
  };

  const resendInviteEmail = async (invite: InviteCode) => {
    if (!invite.email_sent_to) return;

    setIsSending(invite.id);
    try {
      const response = await fetch('/api/invites/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: invite.code,
          email: invite.email_sent_to,
          senderName: senderName || undefined,
        }),
      });

      if (response.ok) {
        showToastMessage(`Invite resent to ${invite.email_sent_to}!`);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to resend invite' }));
        showToastMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Failed to resend invite:', error);
    } finally {
      setIsSending(null);
    }
  };

  const getStatusBadge = (invite: InviteCode) => {
    const status = invite.status || (invite.used ? 'accepted' : 'pending');

    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
            Available
          </span>
        );
      case 'email_sent':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400">
            Sent
          </span>
        );
      case 'accepted':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
            Used
          </span>
        );
      default:
        return null;
    }
  };

  const getMetaInfo = (invite: InviteCode) => {
    const status = invite.status || (invite.used ? 'accepted' : 'pending');
    const uses = invite.current_uses || (invite.used ? 1 : 0);
    const maxUses = invite.max_uses || 1;

    switch (status) {
      case 'accepted':
        return (
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <User className="w-3 h-3" />
            <span>{invite.used_by || invite.email_sent_to}</span>
            <span className="ml-2">
              {uses}/{maxUses} uses
            </span>
          </div>
        );
      case 'email_sent':
        return (
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <Mail className="w-3 h-3" />
            <span>{invite.email_sent_to}</span>
            <span className="ml-2">
              {uses}/{maxUses} uses • Awaiting signup
            </span>
          </div>
        );
      case 'pending':
        return (
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {uses}/{maxUses} uses • Ready to share
          </div>
        );
      default:
        return null;
    }
  };

  const usedCodesCount = inviteCodes.filter(
    (code) => code.status === 'accepted' || code.used
  ).length;
  const availableCodesCount = inviteCodes.filter(
    (code) => code.status === 'pending' || (!code.used && code.status !== 'accepted')
  ).length;

  // Get a common expiration date (assuming all invites expire at the same time)
  const expirationDate = inviteCodes[0]?.expires_at
    ? new Date(inviteCodes[0].expires_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No expiration';

  return (
    <>
      <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] bg-zinc-50 dark:bg-zinc-800 rounded-3xl shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] focus:outline-none overflow-hidden">
            <DialogPrimitive.Title className="sr-only">
              Invite friends to AUBRAI
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Share your invite codes with friends to give them access
            </DialogPrimitive.Description>

            {/* Header */}
            <div className="p-8 pb-6 relative border-b border-zinc-200/60 dark:border-zinc-700/60">
              <DialogPrimitive.Close
                className="absolute right-8 top-8 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-50"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </DialogPrimitive.Close>

              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-brand" />
                Invite Friends
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Share your invite codes with friends to give them access
              </p>
            </div>

            {/* Stats Bar */}
            <div className="px-8 py-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-700/50">
                <div className="flex gap-8">
                  <div>
                    <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {availableCodesCount}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">Available</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {usedCodesCount}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">Used</div>
                  </div>
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  Expires {expirationDate}
                </div>
              </div>
            </div>

            {/* Invite List */}
            <div className="px-8 pb-8">
              <div className="space-y-3 max-h-[320px] overflow-y-auto overflow-x-visible">
                {/* Invite Rows */}
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto"></div>
                  </div>
                ) : inviteCodes.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
                    <p className="mb-4">No invite codes yet</p>
                    <p className="text-xs">
                      Your invite codes will appear here once they are assigned to you
                    </p>
                  </div>
                ) : (
                  inviteCodes.map((invite, index) => {
                    const status = invite.status || (invite.used ? 'accepted' : 'pending');

                    return (
                      <div
                        key={invite.id}
                        className="p-4 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl hover:border-zinc-300/80 dark:hover:border-zinc-600/80 transition-all duration-200 hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="font-mono text-sm text-zinc-900 dark:text-white font-medium">
                              {invite.code}
                            </span>
                            {getStatusBadge(invite)}
                            {getMetaInfo(invite)}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Copy Code */}
                            <div className="relative">
                              <button
                                onClick={() => copyToClipboard(invite.code, 'code')}
                                onMouseEnter={() => setHoveredButton(`copy-${invite.id}`)}
                                onMouseLeave={() => setHoveredButton(null)}
                                className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 focus:outline-none"
                                aria-label="Copy invite code"
                              >
                                <Copy className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                              </button>
                              {hoveredButton === `copy-${invite.id}` && (
                                <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-xs text-white dark:text-zinc-900 rounded-lg whitespace-nowrap pointer-events-none z-[100] shadow-lg overflow-visible">
                                  Copy code
                                </div>
                              )}
                            </div>

                            {/* Share Link */}
                            <div className="relative">
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    `${window.location.origin}/login?invite=${invite.code}`,
                                    'link'
                                  )
                                }
                                onMouseEnter={() => setHoveredButton(`share-${invite.id}`)}
                                onMouseLeave={() => setHoveredButton(null)}
                                className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 focus:outline-none"
                                aria-label="Copy invite link"
                              >
                                <Link className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                              </button>
                              {hoveredButton === `share-${invite.id}` && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-xs text-white dark:text-zinc-900 rounded-lg whitespace-nowrap pointer-events-none z-[100] shadow-lg">
                                  Share link
                                </div>
                              )}
                            </div>

                            {/* Send Email */}
                            {status === 'pending' && !invite.email_sent_to && !invite.email_sent_at && (
                              <div className="relative">
                                <button
                                  onClick={() => setEmailDialogInvite(invite)}
                                  onMouseEnter={() => setHoveredButton(`send-${invite.id}`)}
                                  onMouseLeave={() => setHoveredButton(null)}
                                  className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 focus:outline-none"
                                  disabled={isSending === invite.id}
                                  aria-label="Send invite via email"
                                >
                                  {isSending === invite.id ? (
                                    <div className="h-4 w-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Mail className="h-4 w-4 text-brand" />
                                  )}
                                </button>
                                {hoveredButton === `send-${invite.id}` && (
                                  <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-xs text-white dark:text-zinc-900 rounded-lg whitespace-nowrap pointer-events-none z-[100] shadow-lg">
                                    Send invite
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Show "Sent" indicator for codes that have been emailed */}
                            {invite.email_sent_to && invite.email_sent_at && (
                              <div className="relative">
                                <button
                                  disabled
                                  onMouseEnter={() => setHoveredButton(`sent-${invite.id}`)}
                                  onMouseLeave={() => setHoveredButton(null)}
                                  className="p-2 rounded-xl opacity-50 cursor-not-allowed"
                                  aria-label="Invite already sent via email"
                                >
                                  <Mail className="h-4 w-4 text-green-500" />
                                </button>
                                {hoveredButton === `sent-${invite.id}` && (
                                  <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-zinc-900 dark:bg-zinc-100 text-xs text-white dark:text-zinc-900 rounded-lg whitespace-nowrap pointer-events-none z-[100] shadow-lg">
                                    Already sent
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Email Dialog */}
      {emailDialogInvite && (
        <DialogPrimitive.Root
          open={!!emailDialogInvite}
          onOpenChange={() => setEmailDialogInvite(null)}
        >
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-[#1a1a1a] rounded-xl p-8 shadow-2xl border border-gray-800 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none">
              <DialogPrimitive.Title className="text-lg font-semibold text-white mb-4">
                Send Invite via Email
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                Send an invite code to a friend via email
              </DialogPrimitive.Description>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Email Address</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="friend@example.com"
                    className="w-full mt-1 px-4 py-3 bg-[#2a2a2a] dark:bg-[#2a2a2a] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 border border-gray-600 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                    onKeyPress={(e) =>
                      e.key === 'Enter' && emailInput.trim() && sendInviteEmail(emailDialogInvite)
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Your name"
                    className="w-full mt-1 px-4 py-3 bg-[#2a2a2a] dark:bg-[#2a2a2a] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-300 border border-gray-600 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                    onKeyPress={(e) =>
                      e.key === 'Enter' && emailInput.trim() && sendInviteEmail(emailDialogInvite)
                    }
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <button
                    onClick={() => setEmailDialogInvite(null)}
                    className="px-6 py-3 bg-[#2a2a2a] dark:bg-[#2a2a2a] hover:bg-[#333] dark:hover:bg-[#333] text-white rounded-xl text-sm font-medium transition-colors border border-gray-600 dark:border-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => sendInviteEmail(emailDialogInvite)}
                    disabled={!emailInput.trim() || isSending === emailDialogInvite.id}
                    className="px-6 py-3 bg-[#FF6E71] hover:bg-[#FF6E71]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    {isSending === emailDialogInvite.id ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}

      {/* Toast Notification */}
      <Toast message={toastMessage} isVisible={showToast} />
    </>
  );
}
