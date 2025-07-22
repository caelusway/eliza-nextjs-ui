export type Paper = {
  doi: string;
  title: string;
  abstract: string;
};

export interface ChatMessage {
  id: string;
  name: string;
  text: string | null | undefined;
  senderId: string;
  roomId: string;
  createdAt: number;
  source: string;
  isLoading?: boolean;
  thought?: string;
  actions?: any[]; // Consider defining a more specific type if the structure is known
  papers?: Paper[];
  // Voting-related fields
  responseId?: string; // Unique ID for response voting (can be same as id or generated)
  userVote?: 'up' | 'down' | null; // Current user's vote state
  voteCount?: {
    upvotes: number;
    downvotes: number;
    total: number;
  };
}
