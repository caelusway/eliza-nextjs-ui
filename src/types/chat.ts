import { Message } from "ai";


export interface ChatStreamData {}

export interface ChatRequest {
  messages: Message[];
}

export interface ChatResponse extends ChatStreamData {
  id: string;
  messages: Message[];
  followUpPrompts?: string[];
}
