import { Suspense } from 'react';

import { Footer } from '@/components/footer';
import { LandingTextarea } from '@/components/landing-textarea';
import { LandingChatSessions } from '@/components/landing-chat-sessions';

export default function Page() {
  return (
    <main className="flex-1 size-full overflow-hidden flex flex-col max-h-screen">
      <div className="flex-1 size-full flex flex-col lg:flex-row">
        {/* Left Sidebar - Previous Conversations (Desktop) */}
        <div className="hidden lg:flex w-80 xl:w-96 flex-shrink-0 border-r border-zinc-950/10 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="p-6 h-full overflow-y-auto w-full">
            <Suspense fallback={null}>
              <LandingChatSessions />
            </Suspense>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col justify-center items-center gap-6 lg:gap-8 px-4 md:px-8 py-6 lg:py-8">
            <div className="max-w-2xl mx-auto w-full text-center">
              <h1 className="text-2xl md:text-3xl xl:text-4xl font-semibold tracking-tighter text-pretty mb-6 lg:mb-8">
                Ask anything about {process.env.NEXT_PUBLIC_AGENT_NAME || 'Agent'}
              </h1>
              <div className="max-w-xl mx-auto w-full">
                <Suspense fallback={null}>
                  <LandingTextarea />
                </Suspense>
              </div>
            </div>

            {/* Mobile Previous Conversations */}
            <div className="lg:hidden w-full max-w-2xl mx-auto">
              <Suspense fallback={null}>
                <LandingChatSessions />
              </Suspense>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </main>
  );
}
