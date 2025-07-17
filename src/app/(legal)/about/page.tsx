'use client';

import { Suspense } from 'react';

import { Footer } from '@/components/layout';
import { LandingTextarea } from '@/components/landing';
import { LandingChatSessions } from '@/components/landing';
import { Logo } from '@/components/ui';
import { HeroSection } from '@/components/landing';
import { ActionButtons } from '@/components/landing';
import { ContentSection } from '@/components/landing';
import { DecorativeElements } from '@/components/landing';

export default function AboutPage() {
  return (
    <main className="flex-1 size-full overflow-auto">
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative py-12 lg:py-24 px-4 md:px-8">
          <DecorativeElements />
          <HeroSection />
        </div>

        {/* Action Buttons */}
        <div className="py-8 px-4 md:px-8">
          <ActionButtons />
        </div>

        {/* Chat Interface Section */}
        <div className="py-12 lg:py-16 px-4 md:px-8 bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Previous Conversations */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
                    Previous Conversations
                  </h3>
                  <div className="h-64 lg:h-96 overflow-y-auto">
                    <Suspense fallback={null}>
                      <LandingChatSessions />
                    </Suspense>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="lg:col-span-3">
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    {process.env.NEXT_PUBLIC_AGENT_BANNER_LOGO && (
                      <Logo
                        src={process.env.NEXT_PUBLIC_AGENT_BANNER_LOGO}
                        width={80}
                        height={80}
                        className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4"
                      />
                    )}
                    <h3 className="text-xl font-medium text-zinc-900 dark:text-white mb-2">
                      Start a conversation with AUBRAI
                    </h3>
                    {process.env.NEXT_PUBLIC_AGENT_SHORT_DESCRIPTION && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
                        {process.env.NEXT_PUBLIC_AGENT_SHORT_DESCRIPTION}
                      </p>
                    )}
                  </div>
                  <Suspense fallback={null}>
                    <LandingTextarea />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RMR2 Project Section */}
        <div className="py-16 lg:py-24 px-4 md:px-8">
          <ContentSection
            buttonText="Explore the research"
            onButtonClick={() => {
              // TODO: Implement research page navigation
              console.log('Navigate to research page');
            }}
          >
            <div className="space-y-6">
              <p className="text-justify">
                At the heart of AUBRAI&apos;s mission lies the Robust Mouse Rejuvenation (RMR2) project – an ambitious endeavor that aims to double the remaining lifespan of middle-aged mice. To put this in perspective, normal mice live about 2.5 years.{' '}
                <strong className="font-bold">
                  The RMR2 project seeks to extend their lives to 3.5 years when treatment begins at 1.5 years of age.
                </strong>
                {' '}This might sound modest, but it represents a revolutionary leap in longevity science.
              </p>
              
              <p className="text-justify">
                Currently, the best life extension achieved in mice starting at 18 months is approximately four months.{' '}
                <strong className="font-bold">
                  The RMR2 project aims for twelve months – three times the current record.
                </strong>
                {' '}What makes this even more significant is that today&apos;s best results are barely better than what researchers achieved half a century ago.{' '}
                <strong className="font-bold">
                  This stagnation in progress underscores why RMR2&apos;s multi-target approach is so crucial.
                </strong>
              </p>
            </div>
          </ContentSection>
        </div>

        {/* What is AUBRAI Section */}
        <div className="py-16 lg:py-24 px-4 md:px-8 bg-zinc-50/50 dark:bg-zinc-950/50">
          <ContentSection
            title="What is AUBRAI?"
            buttonText="Launch AUBRAI"
            onButtonClick={() => {
              // Navigate to chat interface
              window.location.href = '/chat';
            }}
          >
            <div className="space-y-4">
              <p>
                AUBRAI is a groundbreaking AI agent that serves as a digital twin of gerontology pioneer Dr. Aubrey de Grey. Fine-tuned on over 10,000 synthetic Q&A pairs and private lab notebooks, AUBRAI delivers instant literature syntheses, study-design critiques, and cutting-edge insights into longevity science. This AI-powered researcher embodies one of the world&apos;s leading aging scientists&apos; expertise while providing 24/7 access to expert-level longevity knowledge.
              </p>
              
              <p>
                Researchers can query AUBRAI about specific intervention combinations, request analysis of unexpected results, or get recommendations for study design improvements. For the broader community, AUBRAI serves as an always-available longevity expert that can inform better health decisions based on current research and Dr. de Grey&apos;s decades of expertise.
              </p>
            </div>
          </ContentSection>
        </div>

        <Footer />
      </div>
    </main>
  );
} 