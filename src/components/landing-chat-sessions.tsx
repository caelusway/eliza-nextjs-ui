'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatSessions } from '@/components/chat-sessions';

export const LandingChatSessions = () => {
  const [userEntity, setUserEntity] = useState<string | null>(null);

  // Initialize user entity on client side only to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEntity = localStorage.getItem('elizaHowUserEntity');
      if (storedEntity) {
        setUserEntity(storedEntity);
      } else {
        const newEntity = uuidv4();
        localStorage.setItem('elizaHowUserEntity', newEntity);
        setUserEntity(newEntity);
      }
    }
  }, []);

  return (
    <div className="w-full mt-2 lg:mt-12">
      <div className="mb-4 lg:mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          Previous Conversations
        </h2>
      </div>
      <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
        <ChatSessions userId={userEntity} showSidebar={true} />
      </div>
    </div>
  );
};

export default LandingChatSessions;
