'use client';

import { ChatSessions } from '@/components/chat-sessions';
import { useUserManager } from '@/lib/user-manager';

export const LandingChatSessions = () => {
  const { getUserId, isUserAuthenticated, isReady } = useUserManager();
  const userId = getUserId();

  // Don't render if Privy isn't ready yet
  if (!isReady) {
    return (
      <div className="w-full mt-2 lg:mt-12">
        <div className="mb-4 lg:mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Previous Conversations
          </h2>
        </div>
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
          <div className="text-center text-gray-500 dark:text-gray-400">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // Don't render if user isn't authenticated
  if (!isUserAuthenticated()) {
    return (
      <div className="w-full mt-2 lg:mt-12">
        <div className="mb-4 lg:mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Previous Conversations
          </h2>
        </div>
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
          <div className="text-center text-gray-500 dark:text-gray-400">
            Please log in to view your conversations
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-2 lg:mt-12">
      <div className="mb-4 lg:mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Previous Conversations
        </h2>
      </div>
      <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
        <ChatSessions userId={userId} showSidebar={true} />
      </div>
    </div>
  );
};

export default LandingChatSessions;
