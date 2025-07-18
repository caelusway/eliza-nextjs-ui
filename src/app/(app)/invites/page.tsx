'use client'

import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

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
      "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50",
      "px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md",
      "transition-all duration-300 ease-in-out text-sm font-medium",
      "border border-green-400/20",
      isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95 pointer-events-none"
    )}
    style={{
      backgroundColor: 'rgba(43, 43, 43, 0.9)',
      borderColor: '#4ade80',
      color: '#4ade80'
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
  const [inviteStats, setInviteStats] = useState<UserInviteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [emailDialogInvite, setEmailDialogInvite] = useState<InviteCode | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [senderName, setSenderName] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchInviteStats();
    }
  }, [user?.id]);

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
    showToastMessage('Refreshed invite data');
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
        showToastMessage('Invite sent successfully!');
        setEmailInput('');
        setSenderName('');
        setEmailDialogInvite(null);
        await fetchInviteStats();
      } else {
        const error = await response.json();
        showToastMessage(`Error: ${error.error || 'Failed to send invite'}`);
      }
    } catch (error) {
      showToastMessage('Error sending invite');
    } finally {
      setIsSending(null);
    }
  };

  const getStatusBadge = (invite: InviteCode) => {
    const status = invite.status || 'pending';
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30',
      email_sent: 'bg-blue-500/20 text-blue-400 border-blue-400/30',
      accepted: 'bg-green-500/20 text-green-400 border-green-400/30',
      expired: 'bg-red-500/20 text-red-400 border-red-400/30'
    };
    
    return (
      <span className={cn(
        "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium",
        "border backdrop-blur-sm shadow-lg",
        "transition-all duration-300 ease-in-out",
        colors[status]
      )}>
        {status === 'accepted' && <Check className="w-3 h-3" />}
        {status === 'email_sent' && <Mail className="w-3 h-3" />}
        {status === 'pending' && <Clock className="w-3 h-3" />}
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pt-16 sm:pt-6 mt-6 lg:pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 mt-8 sm:mt-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#FF6E71] flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#FF6E71]/50">
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Invite Friends</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Share your invite codes with friends</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-xl transition-all duration-300 disabled:opacity-50 hover:scale-105 active:scale-95 shadow-lg backdrop-blur-sm"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            <span className="sm:inline">Refresh</span>
          </button>
        </div>

        {/* Invite Management */}
        <div className="bg-gradient-to-br from-card to-card/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 transition-all duration-300 hover:shadow-xl hover:shadow-[#FF6E71]/10 border-l-4 border-[#FF6E71]/30 hover:border-[#FF6E71]/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-muted-foreground" />
              Your Invite Codes
            </h2>
            {inviteStats && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-4 py-2 rounded-full backdrop-blur-sm shadow-inner">
                <Badge className="w-4 h-4 text-blue-400" />
                <span className="font-semibold">{inviteStats.remaining_codes}</span>
                <span className="hidden sm:inline">codes remaining</span>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6E71] shadow-lg"></div>
            </div>
          ) : inviteStats ? (
            <div className="space-y-4">
              {inviteStats.invites.map((invite) => (
                <div key={invite.id} className="group bg-secondary/30 rounded-xl p-4 transition-all duration-300 hover:bg-secondary/50">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                        <code className="px-3 py-1.5 bg-secondary rounded-lg text-sm font-mono break-all shadow-inner">
                          {invite.code}
                        </code>
                        {getStatusBadge(invite)}
                        {invite.is_legacy && (
                          <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs transition-all duration-300 backdrop-blur-sm shadow-lg border border-purple-400/20">
                            Legacy
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5 bg-secondary/20 px-2 py-1 rounded-lg">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}</span>
                        </span>
                        
                        {invite.email_sent_to && (
                          <span className="flex items-center gap-1.5 bg-secondary/20 px-2 py-1 rounded-lg">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{invite.email_sent_to}</span>
                          </span>
                        )}
                        
                        {invite.current_uses !== undefined && invite.max_uses !== undefined && (
                          <span className="flex items-center gap-1.5 bg-secondary/20 px-2 py-1 rounded-lg">
                            <Users className="w-3 h-3 flex-shrink-0" />
                            {invite.current_uses}/{invite.max_uses} uses
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(invite.code, 'Invite code copied!')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg transition-all duration-300 text-sm hover:scale-105 active:scale-95 shadow-lg"
                      >
                        <Copy className="w-3 h-3" />
                        <span className="hidden sm:inline">Copy</span>
                      </button>
                      
                      <button
                        onClick={() => copyToClipboard(
                          `${window.location.origin}/login?invite=${invite.code}`, 
                          'Invite link copied!'
                        )}
                        className="flex items-center gap-1 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg transition-all duration-300 text-sm hover:scale-105 active:scale-95 shadow-lg"
                      >
                        <Link className="w-3 h-3" />
                        <span className="hidden sm:inline">Link</span>
                      </button>
                      
                      {invite.status !== 'accepted' && (
                        <button
                          onClick={() => setEmailDialogInvite(invite)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#FF6E71] hover:bg-[#FF6E71]/90 text-white rounded-lg transition-all duration-300 text-sm hover:scale-105 active:scale-95"
                        >
                          <Send className="w-3 h-3" />
                          <span className="hidden sm:inline">Send</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 bg-secondary/30 rounded-2xl flex items-center justify-center">
                <UserPlus className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-lg font-medium">No invite codes available</p>
            </div>
          )}
        </div>

        {/* Invited Users */}
        {inviteStats && inviteStats.invited_users.length > 0 && (
          <div className="bg-gradient-to-br from-card to-card/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 border-l-4 border-green-500/30 hover:border-green-500/50">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-muted-foreground" />
              Invited Users ({inviteStats.invited_users.length})
            </h2>
            
            <div className="space-y-3">
              {inviteStats.invited_users.map((invitedUser, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-secondary/30 rounded-xl transition-all duration-300 hover:bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#FF6E71] flex items-center justify-center transition-all duration-300 hover:scale-105 flex-shrink-0 shadow-lg shadow-[#FF6E71]/30">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{invitedUser.username}</p>
                      {invitedUser.email && (
                        <p className="text-sm text-muted-foreground truncate">{invitedUser.email}</p>
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
          <div className="bg-gradient-to-br from-card to-card/80 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md mx-4 transform transition-all duration-300 ease-out scale-100 opacity-100 shadow-2xl border-l-4 border-[#FF6E71]/30">
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
                <code className="block w-full px-3 py-2 bg-secondary rounded-xl text-sm font-mono break-all shadow-inner">
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
                  className="w-full px-3 py-2 bg-secondary rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6E71] transition-all duration-300 shadow-inner"
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
                  className="w-full px-3 py-2 bg-secondary rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6E71] transition-all duration-300 shadow-inner"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setEmailDialogInvite(null)}
                  className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendInvite(emailDialogInvite)}
                  disabled={!emailInput.trim() || isSending === emailDialogInvite.id}
                  className="flex-1 px-4 py-2 bg-[#FF6E71] hover:bg-[#FF6E71]/90 text-white rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 disabled:hover:scale-100 shadow-lg shadow-[#FF6E71]/30"
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