'use client';

import { useState, useEffect, useCallback } from 'react';
import { Share2, Link, X, Copy, Check, Trash2, Edit3 } from 'lucide-react';
import { useSharedSessions } from '@/hooks/useSharedSessions';
import { toast } from '@/components/ui';

interface ShareButtonProps {
  sessionId: string;
  sessionTitle: string;
}

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

export const ShareButton = ({ sessionId, sessionTitle }: ShareButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sharedSession, setSharedSession] = useState<SharedSession | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const {
    loading,
    error,
    createSharedSession,
    getSharedSessionBySessionId,
    updateSharedSession,
    deleteSharedSession,
  } = useSharedSessions();

  // Only load shared session on component mount, not on every render
  useEffect(() => {
    let isMounted = true;

    const loadSharedSession = async () => {
      try {
        const session = await getSharedSessionBySessionId(sessionId);
        if (isMounted) {
          setSharedSession(session);
          if (session) {
            setEditTitle(session.title);
            setEditDescription(session.description || '');
          }
        }
      } catch (error) {
        console.error('Error loading shared session:', error);
      }
    };

    loadSharedSession();

    return () => {
      isMounted = false;
    };
  }, [sessionId]); // Only depend on sessionId, not the function

  const handleShare = async () => {
    // Always open modal first, regardless of whether session is already shared
    setIsModalOpen(true);

    // If session is already shared, just open the modal
    if (sharedSession) {
      return;
    }

    // If not shared yet, set up the form with default values
    setEditTitle(sessionTitle);
    setEditDescription('');
    setIsEditing(true);
  };

  const handleUnshare = async () => {
    if (!sharedSession) return;

    const success = await deleteSharedSession(sharedSession.public_id);
    if (success) {
      setSharedSession(null);
      setIsModalOpen(false);
      toast.success('Chat session unshared successfully!');
    } else if (error) {
      toast.error(error);
    }
  };

  const handleCreateSession = async () => {
    const newSharedSession = await createSharedSession({
      sessionId,
      title: editTitle,
      description: editDescription || undefined,
    });

    if (newSharedSession) {
      setSharedSession(newSharedSession);
      setEditTitle(newSharedSession.title);
      setEditDescription(newSharedSession.description || '');
      setIsEditing(false);
      toast.success('Chat session shared successfully!');
    } else if (error) {
      toast.error(error);
    }
  };

  const handleUpdateSession = async () => {
    if (!sharedSession) return;

    const updatedSession = await updateSharedSession(sharedSession.public_id, {
      title: editTitle,
      description: editDescription || undefined,
    });

    if (updatedSession) {
      setSharedSession(updatedSession);
      setIsEditing(false);
      toast.success('Shared session updated successfully!');
    } else if (error) {
      toast.error(error);
    }
  };

  const copyToClipboard = async () => {
    if (!sharedSession) return;

    try {
      await navigator.clipboard.writeText(sharedSession.publicUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <>
      <button
        onClick={handleShare}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
          sharedSession
            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={sharedSession ? 'View shared session' : 'Share conversation'}
      >
        {loading ? (
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {sharedSession ? 'Shared' : 'Share'}
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-[#1a1a1a] rounded-xl max-w-xl w-full p-8 shadow-2xl border border-gray-800">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-semibold text-white tracking-tight">
                Share Chat Session
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditing(false);
                }}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-800/50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {!sharedSession || isEditing ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6E71] transition-all duration-300 border border-gray-700"
                      placeholder="Enter title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Description (optional)
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-800 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6E71] transition-all duration-300 resize-none border border-gray-700"
                      placeholder="Enter description (optional)"
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={sharedSession ? handleUpdateSession : handleCreateSession}
                      disabled={loading || !editTitle.trim()}
                      className="flex-1 bg-[#FF6E71] hover:bg-[#FF6E71]/90 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
                    >
                      {sharedSession ? 'Save Changes' : 'Share Chat'}
                    </button>
                    <button
                      onClick={() => {
                        if (sharedSession) {
                          setIsEditing(false);
                        } else {
                          setIsModalOpen(false);
                        }
                      }}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white">{sharedSession.title}</h4>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-800/50"
                      >
                        <Edit3 className="h-5 w-5" />
                      </button>
                    </div>
                    {sharedSession.description && (
                      <p className="text-gray-300 mb-2">{sharedSession.description}</p>
                    )}
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <Link className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-white">Public Link</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={sharedSession.publicUrl}
                        readOnly
                        className="flex-1 px-4 py-3 text-sm bg-gray-700 rounded-xl text-gray-300 border border-gray-600 focus:outline-none select-all"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="p-3 text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-gray-700 border border-gray-600"
                      >
                        {copied ? (
                          <Check className="h-5 w-5 text-green-400" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400 bg-gray-800/30 rounded-xl px-4 py-3 border border-gray-700/50">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      {sharedSession.view_count} views
                    </span>
                    <span>Created {new Date(sharedSession.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={copyToClipboard}
                      className="flex-1 bg-[#FF6E71] hover:bg-[#FF6E71]/90 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </button>
                    <button
                      onClick={handleUnshare}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Unshare
                    </button>
                  </div>
                </>
              )}
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-600/30 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
