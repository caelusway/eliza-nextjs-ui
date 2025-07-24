'use client';

import { useEffect } from 'react';

export function BugHerdScript() {
  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="bugherd.com"]');
    if (existingScript) return;

    // Create script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://www.bugherd.com/sidebarv2.js?apikey=eueujerg3pkawdagajobfq';
    script.async = true;
    script.id = 'bugherd-script';
    
    // Add to head immediately
    document.head.appendChild(script);
    
    console.log('BugHerd script added to head');
    
    // Cleanup function
    return () => {
      const scriptElement = document.getElementById('bugherd-script');
      if (scriptElement && document.head.contains(scriptElement)) {
        document.head.removeChild(scriptElement);
      }
    };
  }, []);

  return null;
} 