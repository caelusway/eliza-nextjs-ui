'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Share2,
  Copy,
  Eye,
  Calendar,
  Edit3,
  Trash2,
  ExternalLink,
  MessageSquare,
  Check,
  Clock,
  X,
} from 'lucide-react';
import { useSharedSessions } from '@/hooks/useSharedSessions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface SharedSession {
  id: string;
  session_id: string;
  owner_id: string;
  public_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  view_count: number;
  publicUrl: string;
}

interface SharedSessionsListProps {
  userId: string;
  searchQuery?: string;
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

export const SharedSessionsList = ({ userId, searchQuery = '' }: SharedSessionsListProps) => {
  const [sessions, setSessions] = useState<SharedSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SharedSession[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [unshareModal, setUnshareModal] = useState<{
    show: boolean;
    sessionId: string | null;
    sessionTitle: string;
  }>({
    show: false,
    sessionId: null,
    sessionTitle: '',
  });

  const { loading, error, getSharedSessions, updateSharedSession, deleteSharedSession } =
    useSharedSessions();

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const loadSessions = async () => {
    const data = await getSharedSessions();
    setSessions(data);
  };

  // Filter sessions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSessions(sessions);
    } else {
      const filtered = sessions.filter(
        (session) =>
          session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (session.description &&
            session.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredSessions(filtered);
    }
  }, [sessions, searchQuery]);

  // Listen for refresh events from parent
  useEffect(() => {
    const handleRefresh = () => {
      loadSessions();
    };

    window.addEventListener('refreshSharedSessions', handleRefresh);
    return () => window.removeEventListener('refreshSharedSessions', handleRefresh);
  }, []);

  useEffect(() => {
    if (userId) {
      loadSessions();
    }
  }, [userId]);

  const copyToClipboard = async (url: string, publicId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(publicId);
      showToastMessage('Link copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      showToastMessage('Failed to copy link');
    }
  };

  const handleEdit = (session: SharedSession) => {
    setEditingId(session.public_id);
    setEditForm({
      title: session.title,
      description: session.description || '',
    });
  };

  const handleSaveEdit = async (publicId: string) => {
    const updated = await updateSharedSession(publicId, editForm);
    if (updated) {
      setSessions((prev) =>
        prev.map((session) =>
          session.public_id === publicId ? { ...session, ...updated } : session
        )
      );
      setEditingId(null);
      showToastMessage('Session updated successfully!');
    }
  };

  const handleDelete = (publicId: string, title: string) => {
    setUnshareModal({
      show: true,
      sessionId: publicId,
      sessionTitle: title,
    });
  };

  const confirmUnshare = async () => {
    if (!unshareModal.sessionId) return;

    const success = await deleteSharedSession(unshareModal.sessionId);
    if (success) {
      setSessions((prev) => prev.filter((session) => session.public_id !== unshareModal.sessionId));
      showToastMessage('Session unshared successfully!');
    }

    setUnshareModal({ show: false, sessionId: null, sessionTitle: '' });
  };

  const cancelUnshare = () => {
    setUnshareModal({ show: false, sessionId: null, sessionTitle: '' });
  };

  const isExpired = (session: SharedSession) => {
    if (!session.expires_at) return false;
    return new Date() > new Date(session.expires_at);
  };

  const getStatusBadge = (session: SharedSession) => {
    const expired = isExpired(session);
    const active = session.is_active && !expired;

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
          active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        )}
      >
        {active ? (
          <>
            <Check className="w-3 h-3" />
            Active
          </>
        ) : (
          <>
            <X className="w-3 h-3" />
            {expired ? 'Expired' : 'Inactive'}
          </>
        )}
      </span>
    );
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">Error Loading Sessions</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6">
        <div className="text-center py-12 text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-xl flex items-center justify-center">
            <Share2 className="w-8 h-8 opacity-50" />
          </div>
          <p className="text-lg font-medium">No shared sessions yet</p>
          <p className="text-sm mt-2">Share your first chat to get started!</p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#FF6E71] hover:bg-[#FF6E71]/90 text-white rounded-md transition-colors text-sm font-medium"
          >
            <MessageSquare className="w-4 h-4" />
            Start Chatting
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-medium text-foreground">Your Shared Sessions</h2>
        <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-md font-medium">
          <MessageSquare className="w-4 h-4 text-[#FF6E71]" />
          <span className="font-semibold">{filteredSessions.length}</span>
          <span className="hidden sm:inline">
            {filteredSessions.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {filteredSessions.map((session, index) => (
          <div
            key={session.public_id}
            className={cn(
              'bg-muted/30 rounded-lg p-6 hover:bg-muted/50 transition-colors',
              index !== filteredSessions.length - 1 && 'border-b border-border/20'
            )}
          >
            {editingId === session.public_id ? (
              // Edit Mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-secondary rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6E71] transition-all duration-300"
                    placeholder="Session title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 bg-secondary rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6E71] transition-all duration-300"
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSaveEdit(session.public_id)}
                    disabled={loading || !editForm.title.trim()}
                    className="px-4 py-2 bg-[#FF6E71] hover:bg-[#FF6E71]/90 text-white rounded-md transition-colors disabled:opacity-50 font-medium"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-md transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-4">
                {/* Title row with main actions */}
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4 min-w-0 flex-1 overflow-hidden">
                    <h3 className="text-lg font-semibold text-foreground truncate flex-shrink min-w-0">
                      {session.title}
                    </h3>
                    <div className="flex-shrink-0">{getStatusBadge(session)}</div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => copyToClipboard(session.publicUrl, session.public_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm font-medium"
                    >
                      {copiedId === session.public_id ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span className="hidden sm:inline">
                        {copiedId === session.public_id ? 'Copied!' : 'Copy'}
                      </span>
                    </button>

                    <a
                      href={session.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="hidden sm:inline">View</span>
                    </a>

                    <button
                      onClick={() => handleEdit(session)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm font-medium"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  </div>
                </div>

                {/* Description */}
                {session.description && (
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {session.description}
                  </p>
                )}

                {/* Metadata row with secondary actions */}
                <div className="flex items-center justify-between gap-6">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground min-w-0 flex-1 overflow-hidden">
                    <span className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-xs font-medium">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                      </span>
                    </span>

                    <span className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-xs font-medium">
                      <Eye className="w-3 h-3 flex-shrink-0" />
                      {session.view_count} views
                    </span>

                    {session.expires_at && (
                      <span className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded text-xs font-medium">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        Expires{' '}
                        {formatDistanceToNow(new Date(session.expires_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => handleDelete(session.public_id, session.title)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded-md transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Unshare</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Expanded Analytics */}
            {/* The expandedDetails state and its usage were removed, so this block is no longer relevant. */}
          </div>
        ))}
      </div>

      {/* Unshare Confirmation Modal */}
      {unshareModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full p-8 shadow-2xl border border-gray-800">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800">
                  <Trash2 className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white tracking-tight">
                    Unshare Session
                  </h2>
                  <p className="text-sm text-gray-400">Remove public access to this session</p>
                </div>
              </div>
              <button
                onClick={cancelUnshare}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-800/50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Session Title</label>
                <div className="w-full px-4 py-3 bg-[#2a2a2a] dark:bg-[#2a2a2a] rounded-xl text-white border border-gray-600 dark:border-gray-600">
                  {unshareModal.sessionTitle}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Warning</label>
                <div className="w-full px-4 py-3 bg-rose-500/15 rounded-xl text-rose-400 border border-rose-500/25 leading-relaxed">
                  This will make the public link inaccessible to anyone who has it. This action
                  cannot be undone.
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                onClick={cancelUnshare}
                className="flex-1 bg-[#2a2a2a] dark:bg-[#2a2a2a] hover:bg-[#333] dark:hover:bg-[#333] text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors border border-gray-600 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnshare}
                disabled={loading}
                className="flex-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 px-6 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border border-rose-500/25"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Unsharing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Unshare Session
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast message={toastMessage} isVisible={showToast} />
    </div>
  );
};
