// --- Constants ---
export const USER_NAME = 'User';

// Source identifier for this Next.js application
export const CHAT_SOURCE = 'client_chat';

// UUID v5 namespace for generating deterministic UUIDs from email addresses
export const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

// --- Message States ---
export enum MESSAGE_STATE {
  THINKING = 'THINKING',
  KNOWLEDGE = 'KNOWLEDGE',
  KNOWLEDGE_GRAPH = 'KNOWLEDGE-GRAPH',
  REPLYING = 'REPLYING',
  DONE = 'DONE',
}

// Message state display messages
export const MESSAGE_STATE_MESSAGES = {
  [MESSAGE_STATE.THINKING]: 'is thinking...',
  [MESSAGE_STATE.KNOWLEDGE]: 'is querying internal notes...',
  [MESSAGE_STATE.KNOWLEDGE_GRAPH]: 'is analyzing knowledge graph...',
  [MESSAGE_STATE.REPLYING]: 'is preparing response...',
  [MESSAGE_STATE.DONE]: 'is sending answer...',
  DEFAULT: 'is preparing to answer...',
} as const;
