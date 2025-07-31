'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TextareaWithActions } from '@/components/ui/textarea-with-actions';
import { SuggestedPromptsSection } from '@/components/chat/suggested-prompts-section';
import { useUIConfigSection } from '@/hooks/use-ui-config';
import { useAuthenticatedFetch } from '@/lib/authenticated-fetch';
import { useSessions } from '@/contexts/SessionsContext';
import { useCachedPrompts } from '@/hooks/use-cached-prompts';

interface NewChatWelcomeProps {
  userId: string;
}

export function NewChatWelcome({ userId }: NewChatWelcomeProps) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clickedPrompt, setClickedPrompt] = useState<string | null>(null);
  const [isFileUploading, setIsFileUploading] = useState(false);

  const chatConfig = useUIConfigSection('chat');
  const brandingConfig = useUIConfigSection('branding');
  const authenticatedFetch = useAuthenticatedFetch();
  const { addNewSession } = useSessions();
  
  // Use dynamic prompts with caching, fallback to static prompts silently
  const { prompts: dynamicPrompts } = useCachedPrompts(userId);
  
  // Fall back to static prompts if dynamic ones fail or are loading (silent fallback)
  const suggestedPrompts = (dynamicPrompts.length > 0) ? dynamicPrompts : chatConfig.suggestedPrompts;

  // Handler for speech-to-text input
  const handleTranscript = (transcript: string) => {
    setInput(prev => prev + transcript);
  };

  // Handler for file upload
  const handleFileUpload = async (file: File, _uploadResult: any) => {
    try {
      // Add file reference to input if needed
      const fileReference = `[File: ${file.name}]`;
      setInput(prev => prev ? `${prev}\n\n${fileReference}` : fileReference);
    } catch (error) {
      console.error('[NewChatWelcome] File upload error:', error);
    }
  };

  // Handler for file upload state changes
  const handleFileUploadStateChange = (isUploading: boolean) => {
    setIsFileUploading(isUploading);
  };

  const createAndAddSession = (sessionData: any, initialMessage: string) => {
    // Create the session object in the format expected by the context
    const newSession = {
      id: sessionData.sessionId,
      title: initialMessage.length > 50 ? initialMessage.substring(0, 47) + '...' : initialMessage,
      messageCount: 0, // New session starts with 0 messages
      lastActivity: sessionData.createdAt || new Date().toISOString(),
      preview: '', // No preview yet
      isFromAgent: false,
      channelId: sessionData.channelId,
      metadata: {
        initialMessage: initialMessage,
      },
    };

    // Add to context immediately for real-time sidebar update
    addNewSession(newSession);
    
    return newSession;
  };

  const handlePromptClick = async (prompt: string) => {
    if (!userId || isLoading || isFileUploading) return;

    // Show the prompt in the input box first
    setInput(prompt);
    setClickedPrompt(prompt);
    setIsLoading(true);

    try {
      const response = await authenticatedFetch('/api/chat-session/create', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          initialMessage: prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create chat session');
      }

      // Add the new session to the context immediately for real-time sidebar update
      createAndAddSession(data.data, prompt);

      // Clean the input box before redirecting
      setInput('');

      // Redirect to the new session - tracking happens there
      router.push(`/chat/${data.data.sessionId}`);
    } catch (err) {
      console.error('[NewChatWelcome] Error creating session:', err);
      setIsLoading(false);
      setClickedPrompt(null);
      // Keep the prompt in input on error so user can retry
    }
  };

  const handleDirectSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!userId || !input.trim() || isLoading || isFileUploading) return;

    try {
      setIsLoading(true);

      const response = await authenticatedFetch('/api/chat-session/create', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          initialMessage: input.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create chat session');
      }

      // Add the new session to the context immediately for real-time sidebar update
      createAndAddSession(data.data, input.trim());

      // Redirect to the new session - tracking happens there
      router.push(`/chat/${data.data.sessionId}`);
    } catch (err) {
      console.error('[NewChatWelcome] Error creating session:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-full px-4 py-12">
      <div className="w-full max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              <span className="text-zinc-900 dark:text-white">Welcome to </span>
              <span 
                className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                style={{ 
                  background: `linear-gradient(135deg, ${brandingConfig.primaryColor}, ${brandingConfig.primaryColor}CC)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {brandingConfig.appName}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              {chatConfig.welcomeSubtitle}
            </p>
          </div>
        </div>

        {/* Suggested Prompts Section */}
        <SuggestedPromptsSection
          prompts={suggestedPrompts}
          onPromptClick={handlePromptClick}
          isLoading={isLoading}
          isFileUploading={isFileUploading}
          clickedPrompt={clickedPrompt}
        />

        {/* Input Section */}
        <div className="w-full">
          <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <TextareaWithActions
              input={input}
              onInputChange={(e) => setInput(e.target.value)}
              onSubmit={handleDirectSubmit}
              isLoading={isLoading}
              placeholder={chatConfig.newChatPlaceholder}
              disabled={isLoading || isFileUploading}
              onTranscript={handleTranscript}
              onFileUpload={handleFileUpload}
              isFileUploading={isFileUploading}
              onFileUploadStateChange={handleFileUploadStateChange}
            />
          </div>

          {/* Loading feedback */}
          {(isLoading || isFileUploading) && (
            <div className="flex items-center justify-center gap-3 mt-4 text-base">
              <div className="relative">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                     style={{ borderColor: brandingConfig.primaryColor, borderTopColor: 'transparent' }} />
                <div className="absolute inset-0 w-5 h-5 border-2 border-transparent rounded-full animate-ping"
                     style={{ borderTopColor: `${brandingConfig.primaryColor}40` }} />
              </div>
              <span className="font-medium" style={{ color: brandingConfig.primaryColor }}>
                {isFileUploading ? 'Uploading file...' : chatConfig.creatingSessionText}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
