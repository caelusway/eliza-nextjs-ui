'use client';

import { ReactNode } from 'react';

interface SharedSessionsLayoutProps {
  children: ReactNode;
}

export default function SharedSessionsLayout({ children }: SharedSessionsLayoutProps) {
  return <div className="h-full bg-background overflow-auto">{children}</div>;
}
