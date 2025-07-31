'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Copy,
  UserPlus,
  Mail,
  Send,
  Link,
  User,
  Check,
  ArrowLeft,
  RefreshCw,
  Calendar,
  Users,
  Badge,
  Clock,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useAuthenticatedFetch } from '@/lib/authenticated-fetch';
import { useUserManager } from '@/lib/user-manager';

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

interface UserInviteStats {
  invites: InviteCode[];
  remaining_codes: number;
  invited_users: Array<{
    username: string;
    email: string | null;
    joined_at: string;
  }>;
}

// Toast notification component
const Toast = ({ message, isVisible }: { message: string; isVisible: boolean }) => (
  <div
    className={cn(
      'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50',
      'px-4 py-3 rounded-xl backdrop-blur-md',
      'transition-all duration-300 ease-in-out text-sm font-medium',
      isVisible
        ? 'translate-y-0 opacity-100 scale-100'
        : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
    )}
    style={{
      backgroundColor: 'rgba(43, 43, 43, 0.9)',
      borderColor: '#4ade80',
      color: '#4ade80',
    }}
  >
    <div className="flex items-center gap-2">
      <Check className="w-4 h-4" />
      {message}
    </div>
  </div>
);

export default function InvitesPage() {
  const router = useRouter();
  const { user } = usePrivy();
  const { getUserId } = useUserManager();
  const authenticatedFetch = useAuthenticatedFetch();
  const [inviteStats, setInviteStats] = useState<UserInviteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [emailDialogInvite, setEmailDialogInvite] = useState<InviteCode | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const fetchInviteStats = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await authenticatedFetch('/api/invites/my-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInviteStats(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch invite stats:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching invite stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    const userId = getUserId();
    if (userId) {
      fetchInviteStats();
    }
  }, [fetchInviteStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInviteStats();
    setIsRefreshing(false);
    showToastMessage('Refreshed invite data');
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToastMessage(message);
    });
  };

  const handleGenerateInvites = async () => {
    const userId = getUserId();
    if (!userId) return;

    setIsGenerating(true);
    try {
      const response = await authenticatedFetch('/api/invites/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
        }),
      });

      if (response.ok) {
        showToastMessage('Invite codes generated successfully!');
        await fetchInviteStats(); // Refresh the data
      } else {
        const error = await response.json().catch(() => ({}));
        showToastMessage(`Error: ${error.error || 'Failed to generate invite codes'}`);
      }
    } catch (error) {
      showToastMessage('Error generating invite codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendInvite = async (inviteCode: InviteCode) => {
    if (!emailInput.trim()) return;

    setIsSending(inviteCode.id);

    try {
      const response = await authenticatedFetch('/api/invites/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: inviteCode.code,
          email: emailInput,
          senderName: senderName || 'Someone',
        }),
      });

      if (response.ok) {
        showToastMessage('Invite sent successfully!');
        setEmailInput('');
        setSenderName('');
        setEmailDialogInvite(null);
        await fetchInviteStats();
      } else {
        const error = await response.json().catch(() => ({}));
        showToastMessage(`Error: ${error.error || 'Failed to send invite'}`);
      }
    } catch (error) {
      showToastMessage('Error sending invite');
    } finally {
      setIsSending(null);
    }
  };

  const isExpired = (invite: InviteCode) => {
    if (!invite.expires_at) return false;
    return new Date() > new Date(invite.expires_at);
  };

  const isUsedOrAccepted = (invite: InviteCode) => {
    return invite.status === 'accepted' || invite.current_uses >= (invite.max_uses || 1);
  };

  const getStatusBadge = (invite: InviteCode) => {
    let status = invite.status || 'pending';

    // Check various conditions that affect status
    if (isExpired(invite)) {
      status = 'expired';
    } else if (isUsedOrAccepted(invite)) {
      status = 'accepted';
    }

    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      email_sent: 'bg-blue-500/20 text-blue-400',
      accepted: 'bg-green-500/20 text-green-400',
      expired: 'bg-red-500/20 text-red-400',
    };

    const displayText =
      status === 'accepted' && invite.current_uses > 0 ? 'used' : status.replace('_', ' ');

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium',
          'backdrop-blur-sm',
          'transition-all duration-300 ease-in-out',
          colors[status]
        )}
      >
        {status === 'accepted' && <Check className="w-3 h-3" />}
        {status === 'email_sent' && <Mail className="w-3 h-3" />}
        {status === 'pending' && <Clock className="w-3 h-3" />}
        {status === 'expired' && <X className="w-3 h-3" />}
        {displayText}
      </span>
    );
  };

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FF6E71] flex items-center justify-center">
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                Invite Management
              </h1>
              <p className="text-muted-foreground mt-1">Manage and share your invitation codes</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors disabled:opacity-50 text-sm font-medium"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            <span className="sm:inline">Refresh</span>
          </button>
        </div>

        {/* Invite Management */}
        <div className="bg-card rounded-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h2 className="text-xl font-medium text-foreground">Invitation Codes</h2>
            {inviteStats && (
              <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-md font-medium">
                <Badge className="w-4 h-4 text-[#FF6E71]" />
                <span className="font-semibold">{inviteStats.remaining_codes}</span>
                <span className="hidden sm:inline">codes remaining</span>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : inviteStats ? (
            inviteStats.invites.length === 0 && inviteStats.remaining_codes > 0 ? (
              // Show generate button when user has remaining codes but no actual invite codes
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#FF6E71]/10 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-8 h-8 text-[#FF6E71]" />
                </div>
                <p className="text-lg font-medium text-foreground mb-2">
                  Ready to Generate Invite Codes
                </p>
                <p className="text-muted-foreground mb-6">
                  You have {inviteStats.remaining_codes} invite code
                  {inviteStats.remaining_codes !== 1 ? 's' : ''} available to generate.
                </p>
                <button
                  onClick={handleGenerateInvites}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6E71] hover:bg-[#FF6E71]/90 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Generate Invite Codes
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-0">
                {inviteStats.invites.map((invite, index) => (
                  <div
                    key={invite.id}
                    className={cn(
                      'bg-muted/30 rounded-lg p-5 hover:bg-muted/50 transition-colors',
                      index !== inviteStats.invites.length - 1 && 'border-b border-border/20'
                    )}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                      <div className="min-w-0 lg:w-80 xl:w-96">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <code className="px-3 py-2 bg-secondary rounded-md text-sm font-mono font-medium">
                            {invite.code}
                          </code>
                          {getStatusBadge(invite)}
                          {invite.is_legacy && (
                            <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs transition-all duration-300 backdrop-blur-sm">
                              Legacy
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-xs font-medium">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              {formatDistanceToNow(new Date(invite.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </span>

                          {invite.email_sent_to && (
                            <span className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-xs font-medium">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{invite.email_sent_to}</span>
                            </span>
                          )}

                          {invite.current_uses !== undefined && invite.max_uses !== undefined && (
                            <span className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-xs font-medium">
                              <Users className="w-3 h-3 flex-shrink-0" />
                              {invite.current_uses}/{invite.max_uses} uses
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isExpired(invite) || isUsedOrAccepted(invite) ? (
                          <>
                            <button
                              disabled
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-md text-sm opacity-50 cursor-not-allowed font-medium"
                            >
                              <Copy className="w-3 h-3" />
                              <span className="hidden sm:inline">Copy</span>
                            </button>

                            <button
                              disabled
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-md text-sm opacity-50 cursor-not-allowed font-medium"
                            >
                              <Link className="w-3 h-3" />
                              <span className="hidden sm:inline">Link</span>
                            </button>

                            <button
                              disabled
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-500/30 text-red-400 rounded-lg text-sm opacity-50 cursor-not-allowed"
                            >
                              <Send className="w-3 h-3" />
                              <span className="hidden sm:inline">Send</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => copyToClipboard(invite.code, 'Invite code copied!')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm font-medium"
                            >
                              <Copy className="w-3 h-3" />
                              <span className="hidden sm:inline">Copy</span>
                            </button>

                            <button
                              onClick={() =>
                                copyToClipboard(
                                  `${window.location.origin}/login?invite=${invite.code}`,
                                  'Invite link copied!'
                                )
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm font-medium"
                            >
                              <Link className="w-3 h-3" />
                              <span className="hidden sm:inline">Link</span>
                            </button>

                            <button
                              onClick={() => setEmailDialogInvite(invite)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6E71] hover:bg-[#FF6E71]/90 text-white rounded-md transition-colors text-sm font-medium"
                            >
                              <Send className="w-3 h-3" />
                              <span className="hidden sm:inline">Send</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-xl flex items-center justify-center">
                <UserPlus className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-lg font-medium">No invite codes available</p>
            </div>
          )}
        </div>

        {/* Invited Users */}
        {inviteStats && inviteStats.invited_users.length > 0 && (
          <div className="bg-card rounded-xl p-6">
            <h2 className="text-xl font-medium text-foreground mb-6">
              <Users className="w-5 h-5 text-muted-foreground" />
              Invited Users ({inviteStats.invited_users.length})
            </h2>

            <div className="space-y-0">
              {inviteStats.invited_users.map((invitedUser, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors',
                    index !== inviteStats.invited_users.length - 1 && 'border-b border-border/20'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FF6E71] flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">
                        {invitedUser.username}
                      </p>
                      {invitedUser.email && (
                        <p className="text-sm text-muted-foreground truncate">
                          {invitedUser.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 bg-secondary/20 px-2 py-1 rounded-lg">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      {formatDistanceToNow(new Date(invitedUser.joined_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add bottom padding to ensure content doesn't get cut off */}
        <div className="h-8 sm:h-4"></div>
      </div>

      {/* Email Dialog */}
      {emailDialogInvite && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Send Invite</h3>
              <button
                onClick={() => setEmailDialogInvite(null)}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200 p-2 rounded-xl hover:bg-secondary/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Invite Code
                </label>
                <code className="block w-full px-3 py-2 bg-secondary rounded-xl text-sm font-mono break-all">
                  {emailDialogInvite.code}
                </code>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 bg-secondary rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6E71] transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-3 py-2 bg-secondary rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6E71] transition-all duration-300"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEmailDialogInvite(null)}
                  className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-md transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendInvite(emailDialogInvite)}
                  disabled={!emailInput.trim() || isSending === emailDialogInvite.id}
                  className="flex-1 px-4 py-2 bg-[#FF6E71] hover:bg-[#FF6E71]/90 text-white rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  {isSending === emailDialogInvite.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast message={toastMessage} isVisible={showToast} />
    </div>
  );
}
