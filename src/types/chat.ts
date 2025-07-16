import { Message } from 'ai';

export type ChatStreamData = Record<string, unknown>;

export interface ChatRequest {
  messages: Message[];
}

export interface ChatResponse extends ChatStreamData {
  id: string;
  messages: Message[];
  followUpPrompts?: string[];
}
