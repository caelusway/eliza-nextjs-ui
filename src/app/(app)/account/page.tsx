'use client';

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Copy,
  Send,
  UserPlus,
  LogOut,
  Check,
  ExternalLink,
  RefreshCw,
  Calendar,
  Users,
  Link,
  Settings,
  Badge,
  Clock,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useUIConfigSection } from '@/hooks/use-ui-config';

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

// Toast notification component (will be rendered inside the component to access config)
const Toast = ({
  message,
  isVisible,
  primaryColor,
}: {
  message: string;
  isVisible: boolean;
  primaryColor: string;
}) => (
  <div
    className={cn(
      'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50',
      'px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md',
      'transition-all duration-300 ease-in-out text-sm font-medium',
      'border',
      isVisible
        ? 'translate-y-0 opacity-100 scale-100'
        : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
    )}
    style={{
      backgroundColor: 'rgba(43, 43, 43, 0.9)',
      borderColor: primaryColor,
      color: primaryColor,
    }}
  >
    <div className="flex items-center gap-2">
      <Check className="w-4 h-4" />
      {message}
    </div>
  </div>
);

export default function AccountPage() {
  const { user, authenticated, logout } = usePrivy();
  const router = useRouter();
  const [inviteStats, setInviteStats] = useState<UserInviteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [emailDialogInvite, setEmailDialogInvite] = useState<InviteCode | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isSending, setIsSending] = useState<string | null>(null);

  const accountConfig = useUIConfigSection('account');
  const brandingConfig = useUIConfigSection('branding');

  // Helper function to get darker shade for hover states
  const getDarkerShade = (color: string) => {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const num = parseInt(hex, 16);
      const r = Math.max(0, (num >> 16) - 20);
      const g = Math.max(0, ((num >> 8) & 0x00ff) - 20);
      const b = Math.max(0, (num & 0x0000ff) - 20);
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    return color;
  };

  useEffect(() => {
    if (!authenticated) {
      router.push('/login');
      return;
    }
    fetchInviteStats();
  }, [authenticated, router]);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const fetchInviteStats = async () => {
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
        setInviteStats(data);
      } else {
        console.error('Failed to fetch invite stats');
      }
    } catch (error) {
      console.error('Error fetching invite stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInviteStats();
    setIsRefreshing(false);
    showToastMessage(accountConfig.refreshedDataText);
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToastMessage(message);
    });
  };

  const handleSendInvite = async (inviteCode: InviteCode) => {
    if (!emailInput.trim()) return;

    setIsSending(inviteCode.id);

    try {
      const response = await fetch('/api/invites/send', {
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
        showToastMessage(accountConfig.inviteSentText);
        setEmailInput('');
        setSenderName('');
        setEmailDialogInvite(null);
        await fetchInviteStats();
      } else {
        const error = await response.json();
        showToastMessage(`Error: ${error.error || 'Failed to send invite'}`);
      }
    } catch (error) {
      showToastMessage(accountConfig.sendInviteErrorText);
    } finally {
      setIsSending(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isExpired = (invite: InviteCode) => {
    if (!invite.expires_at) return false;
    return new Date() > new Date(invite.expires_at);
  };

  const getStatusBadge = (invite: InviteCode) => {
    let status = invite.status || 'pending';
    if (isExpired(invite)) {
      status = 'expired';
    }
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      email_sent: 'bg-blue-500/20 text-blue-400',
      accepted: 'bg-green-500/20 text-green-400',
      expired: 'bg-red-500/20 text-red-400',
    };

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
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getUserEmail = () => {
    if (typeof user?.email === 'string') return user.email;
    if (user?.email?.address) return user.email.address;
    return 'No email';
  };

  const getUserIdentifier = () => {
    const email = getUserEmail();
    if (email !== 'No email') return email;
    return user?.id?.substring(0, 20) + '...';
  };

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FF6E71] flex items-center justify-center">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                {accountConfig.pageTitle}
              </h1>
              <p className="text-muted-foreground mt-1">{accountConfig.pageDescription}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors disabled:opacity-50 text-sm font-medium"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            <span className="sm:inline">{accountConfig.refreshText}</span>
          </button>
        </div>

        {/* User Information */}
        <div className="bg-card rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground font-medium">
                  {accountConfig.emailLabel}
                </p>
                <p className="font-semibold text-foreground truncate">{getUserEmail()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <User className="w-5 h-5 text-purple-400 flex-shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground font-medium">
                  {accountConfig.userIdLabel}
                </p>
                <p className="font-semibold text-foreground font-mono text-sm truncate">
                  {user?.id?.substring(0, 20)}...
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add bottom padding to ensure content doesn't get cut off */}
        <div className="h-8 sm:h-4"></div>
      </div>

      {/* Email Dialog */}
      {emailDialogInvite && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {accountConfig.sendInviteDialogTitle}
              </h3>
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
                  {accountConfig.inviteCodeLabel}
                </label>
                <code className="block w-full px-3 py-2 bg-secondary rounded-xl text-sm font-mono break-all">
                  {emailDialogInvite.code}
                </code>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {accountConfig.yourNameLabel}
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder={accountConfig.yourNamePlaceholder}
                  className="w-full px-3 py-2 bg-secondary rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6E71] transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {accountConfig.emailAddressLabel}
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={accountConfig.emailPlaceholder}
                  className="w-full px-3 py-2 bg-secondary rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6E71] transition-all duration-300"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEmailDialogInvite(null)}
                  className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-md transition-colors font-medium"
                >
                  {accountConfig.cancelText}
                </button>
                <button
                  onClick={() => handleSendInvite(emailDialogInvite)}
                  disabled={!emailInput.trim() || isSending === emailDialogInvite.id}
                  className="flex-1 px-4 py-2 bg-[#FF6E71] hover:bg-[#FF6E71]/90 text-white rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  {isSending === emailDialogInvite.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">{accountConfig.sendingText}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">{accountConfig.sendText}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast
        message={toastMessage}
        isVisible={showToast}
        primaryColor={brandingConfig.primaryColor}
      />
    </div>
  );
}
