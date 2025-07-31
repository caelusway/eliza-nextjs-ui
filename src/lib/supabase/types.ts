export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      invites: {
        Row: {
          id: string;
          code: string;
          created_by: string | null;
          email: string | null;
          status: 'pending' | 'email_sent' | 'accepted' | 'expired';
          used_by: string | null;
          expires_at: string;
          created_at: string;
          used_at: string | null;
          email_sent_to: string | null;
          email_sent_at: string | null;
          is_legacy: boolean;
          max_uses: number;
          current_uses: number;
        };
        Insert: {
          id?: string;
          code: string;
          created_by?: string | null;
          email?: string | null;
          status?: 'pending' | 'email_sent' | 'accepted' | 'expired';
          used_by?: string | null;
          expires_at?: string;
          created_at?: string;
          used_at?: string | null;
          email_sent_to?: string | null;
          email_sent_at?: string | null;
          is_legacy?: boolean;
          max_uses?: number;
          current_uses?: number;
        };
        Update: {
          id?: string;
          code?: string;
          created_by?: string | null;
          email?: string | null;
          status?: 'pending' | 'email_sent' | 'accepted' | 'expired';
          used_by?: string | null;
          expires_at?: string;
          created_at?: string;
          used_at?: string | null;
          email_sent_to?: string | null;
          email_sent_at?: string | null;
          is_legacy?: boolean;
          max_uses?: number;
          current_uses?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'invites_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invites_used_by_fkey';
            columns: ['used_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          email: string | null;
          points: number | null;
          created_at: string | null;
          invited_by: string | null;
          invite_codes_remaining: number;
          used_invite_code: string | null;
          has_completed_invite_flow: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          email?: string | null;
          points?: number | null;
          created_at?: string | null;
          invited_by?: string | null;
          invite_codes_remaining?: number;
          used_invite_code?: string | null;
          has_completed_invite_flow?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          email?: string | null;
          points?: number | null;
          created_at?: string | null;
          invited_by?: string | null;
          invite_codes_remaining?: number;
          used_invite_code?: string | null;
          has_completed_invite_flow?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'users_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      response_votes: {
        Row: {
          id: string;
          voter_id: string;
          response_id: string;
          value: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          voter_id: string;
          response_id: string;
          value: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          voter_id?: string;
          response_id?: string;
          value?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'response_votes_voter_id_fkey';
            columns: ['voter_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      prompts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'prompts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      shared_chat_sessions: {
        Row: {
          id: string;
          session_id: string;
          owner_id: string;
          public_id: string;
          title: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          expires_at: string | null;
          view_count: number;
        };
        Insert: {
          id?: string;
          session_id: string;
          owner_id: string;
          public_id: string;
          title: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          expires_at?: string | null;
          view_count?: number;
        };
        Update: {
          id?: string;
          session_id?: string;
          owner_id?: string;
          public_id?: string;
          title?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          expires_at?: string | null;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'shared_chat_sessions_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      shared_chat_analytics: {
        Row: {
          id: string;
          shared_session_id: string;
          visitor_id: string;
          ip_address: string | null;
          user_agent: string | null;
          referrer: string | null;
          country: string | null;
          city: string | null;
          visited_at: string;
          session_duration: number | null;
        };
        Insert: {
          id?: string;
          shared_session_id: string;
          visitor_id: string;
          ip_address?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          country?: string | null;
          city?: string | null;
          visited_at?: string;
          session_duration?: number | null;
        };
        Update: {
          id?: string;
          shared_session_id?: string;
          visitor_id?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          referrer?: string | null;
          country?: string | null;
          city?: string | null;
          visited_at?: string;
          session_duration?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'shared_chat_analytics_shared_session_id_fkey';
            columns: ['shared_session_id'];
            isOneToOne: false;
            referencedRelation: 'shared_chat_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      daily_analytics: {
        Row: {
          id: string;
          shared_session_id: string;
          date: string;
          unique_visitors: number;
          total_views: number;
          avg_session_duration: number | null;
          top_referrer: string | null;
          top_country: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shared_session_id: string;
          date: string;
          unique_visitors?: number;
          total_views?: number;
          avg_session_duration?: number | null;
          top_referrer?: string | null;
          top_country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shared_session_id?: string;
          date?: string;
          unique_visitors?: number;
          total_views?: number;
          avg_session_duration?: number | null;
          top_referrer?: string | null;
          top_country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'daily_analytics_shared_session_id_fkey';
            columns: ['shared_session_id'];
            isOneToOne: false;
            referencedRelation: 'shared_chat_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cast_vote: {
        Args: {
          _voter_id: string;
          _response_id: string;
          _value: number;
          _comment?: string;
        };
        Returns: Json;
      };
      get_vote_stats: {
        Args: {
          _response_id: string;
        };
        Returns: Json;
      };
      get_user_vote: {
        Args: {
          _voter_id: string;
          _response_id: string;
        };
        Returns: Json;
      };
      remove_vote: {
        Args: {
          _voter_id: string;
          _response_id: string;
        };
        Returns: Json;
      };
      log_user_prompt: {
        Args: {
          _user_id: string;
          _content: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types for voting
export type VoteValue = 1 | -1;

export interface VoteStats {
  response_id: string;
  upvotes: number;
  downvotes: number;
  total: number;
  last_updated: string | null;
}

export interface UserVote {
  id: string;
  voter_id: string;
  response_id: string;
  value: VoteValue;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface CastVoteResponse {
  success: boolean;
  vote?: UserVote;
  stats?: {
    upvotes: number;
    downvotes: number;
    total: number;
  };
  error?: string;
  code?: string;
}

export interface GetUserVoteResponse {
  exists: boolean;
  vote: UserVote | null;
}

export interface RemoveVoteResponse {
  success: boolean;
  deleted: boolean;
  stats: {
    upvotes: number;
    downvotes: number;
    total: number;
  };
}

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;
