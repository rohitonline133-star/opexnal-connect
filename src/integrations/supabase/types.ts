export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          id: string;
          ip_address: string | null;
          metadata: Json;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
          id: string;
        };
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
          id?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
          id?: string;
        };
        Relationships: [];
      };
      comment_likes: {
        Row: {
          comment_id: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          comment_id: string;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          comment_id?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "post_comments";
            referencedColumns: ["id"];
          },
        ];
      };
      content_reports: {
        Row: {
          created_at: string;
          details: string;
          id: string;
          reason: string;
          reporter_id: string;
          status: string;
          target_id: string;
          target_type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          details?: string;
          id?: string;
          reason: string;
          reporter_id: string;
          status?: string;
          target_id: string;
          target_type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          details?: string;
          id?: string;
          reason?: string;
          reporter_id?: string;
          status?: string;
          target_id?: string;
          target_type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversation_members: {
        Row: {
          conversation_id: string;
          created_at: string;
          id: string;
          last_read_at: string;
          user_id: string;
        };
        Insert: {
          conversation_id: string;
          created_at?: string;
          id?: string;
          last_read_at?: string;
          user_id: string;
        };
        Update: {
          conversation_id?: string;
          created_at?: string;
          id?: string;
          last_read_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          last_message_at: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          last_message_at?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          last_message_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      follow_requests: {
        Row: {
          created_at: string;
          id: string;
          requester_id: string;
          status: Database["public"]["Enums"]["follow_request_status"];
          target_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          requester_id: string;
          status?: Database["public"]["Enums"]["follow_request_status"];
          target_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          requester_id?: string;
          status?: Database["public"]["Enums"]["follow_request_status"];
          target_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          created_at: string;
          follower_id: string;
          following_id: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
          id?: string;
        };
        Relationships: [];
      };
      hashtags: {
        Row: {
          created_at: string;
          id: string;
          posts_count: number;
          tag: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          posts_count?: number;
          tag: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          posts_count?: number;
          tag?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          body: string;
          conversation_id: string;
          created_at: string;
          id: string;
          sender_id: string;
        };
        Insert: {
          body: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          sender_id: string;
        };
        Update: {
          body?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      mutes: {
        Row: {
          created_at: string;
          id: string;
          mute_posts: boolean;
          mute_stories: boolean;
          muted_id: string;
          muter_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          mute_posts?: boolean;
          mute_stories?: boolean;
          muted_id: string;
          muter_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          mute_posts?: boolean;
          mute_stories?: boolean;
          muted_id?: string;
          muter_id?: string;
        };
        Relationships: [];
      };
      post_comments: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          likes_count: number;
          parent_id: string | null;
          post_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          likes_count?: number;
          parent_id?: string | null;
          post_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          likes_count?: number;
          parent_id?: string | null;
          post_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "post_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_hashtags: {
        Row: {
          created_at: string;
          hashtag_id: string;
          post_id: string;
        };
        Insert: {
          created_at?: string;
          hashtag_id: string;
          post_id: string;
        };
        Update: {
          created_at?: string;
          hashtag_id?: string;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_hashtags_hashtag_id_fkey";
            columns: ["hashtag_id"];
            isOneToOne: false;
            referencedRelation: "hashtags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_hashtags_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_likes: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_media: {
        Row: {
          created_at: string;
          duration_seconds: number | null;
          height: number | null;
          id: string;
          media_type: Database["public"]["Enums"]["media_type"];
          position: number;
          post_id: string;
          storage_path: string;
          user_id: string;
          width: number | null;
        };
        Insert: {
          created_at?: string;
          duration_seconds?: number | null;
          height?: number | null;
          id?: string;
          media_type: Database["public"]["Enums"]["media_type"];
          position?: number;
          post_id: string;
          storage_path: string;
          user_id: string;
          width?: number | null;
        };
        Update: {
          created_at?: string;
          duration_seconds?: number | null;
          height?: number | null;
          id?: string;
          media_type?: Database["public"]["Enums"]["media_type"];
          position?: number;
          post_id?: string;
          storage_path?: string;
          user_id?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_saves: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_shares: {
        Row: {
          channel: string;
          created_at: string;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          channel?: string;
          created_at?: string;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          channel?: string;
          created_at?: string;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          caption: string;
          comments_count: number;
          comments_enabled: boolean;
          created_at: string;
          id: string;
          likes_count: number;
          location_lat: number | null;
          location_lng: number | null;
          location_name: string | null;
          saves_count: number;
          shares_count: number;
          updated_at: string;
          user_id: string;
          visibility: Database["public"]["Enums"]["post_visibility"];
        };
        Insert: {
          caption?: string;
          comments_count?: number;
          comments_enabled?: boolean;
          created_at?: string;
          id?: string;
          likes_count?: number;
          location_lat?: number | null;
          location_lng?: number | null;
          location_name?: string | null;
          saves_count?: number;
          shares_count?: number;
          updated_at?: string;
          user_id: string;
          visibility?: Database["public"]["Enums"]["post_visibility"];
        };
        Update: {
          caption?: string;
          comments_count?: number;
          comments_enabled?: boolean;
          created_at?: string;
          id?: string;
          likes_count?: number;
          location_lat?: number | null;
          location_lng?: number | null;
          location_name?: string | null;
          saves_count?: number;
          shares_count?: number;
          updated_at?: string;
          user_id?: string;
          visibility?: Database["public"]["Enums"]["post_visibility"];
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"];
          allow_mentions_from: string;
          allow_tags_from: string;
          avatar_url: string | null;
          bio: string;
          country_code: string | null;
          created_at: string;
          display_name: string;
          followers_count: number;
          following_count: number;
          id: string;
          is_deactivated: boolean;
          is_private: boolean;
          is_verified: boolean;
          last_active_at: string | null;
          locale: string;
          location: string | null;
          posts_count: number;
          show_activity_status: boolean;
          timezone: string;
          updated_at: string;
          username: string;
          website: string | null;
        };
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"];
          allow_mentions_from?: string;
          allow_tags_from?: string;
          avatar_url?: string | null;
          bio?: string;
          country_code?: string | null;
          created_at?: string;
          display_name?: string;
          followers_count?: number;
          following_count?: number;
          id: string;
          is_deactivated?: boolean;
          is_private?: boolean;
          is_verified?: boolean;
          last_active_at?: string | null;
          locale?: string;
          location?: string | null;
          posts_count?: number;
          show_activity_status?: boolean;
          timezone?: string;
          updated_at?: string;
          username: string;
          website?: string | null;
        };
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"];
          allow_mentions_from?: string;
          allow_tags_from?: string;
          avatar_url?: string | null;
          bio?: string;
          country_code?: string | null;
          created_at?: string;
          display_name?: string;
          followers_count?: number;
          following_count?: number;
          id?: string;
          is_deactivated?: boolean;
          is_private?: boolean;
          is_verified?: boolean;
          last_active_at?: string | null;
          locale?: string;
          location?: string | null;
          posts_count?: number;
          show_activity_status?: boolean;
          timezone?: string;
          updated_at?: string;
          username?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      stories: {
        Row: {
          audience: Database["public"]["Enums"]["story_audience"];
          caption: string;
          created_at: string;
          duration_seconds: number | null;
          expires_at: string;
          height: number | null;
          id: string;
          media_type: Database["public"]["Enums"]["media_type"];
          storage_path: string;
          updated_at: string;
          user_id: string;
          views_count: number;
          width: number | null;
        };
        Insert: {
          audience?: Database["public"]["Enums"]["story_audience"];
          caption?: string;
          created_at?: string;
          duration_seconds?: number | null;
          expires_at?: string;
          height?: number | null;
          id?: string;
          media_type: Database["public"]["Enums"]["media_type"];
          storage_path: string;
          updated_at?: string;
          user_id: string;
          views_count?: number;
          width?: number | null;
        };
        Update: {
          audience?: Database["public"]["Enums"]["story_audience"];
          caption?: string;
          created_at?: string;
          duration_seconds?: number | null;
          expires_at?: string;
          height?: number | null;
          id?: string;
          media_type?: Database["public"]["Enums"]["media_type"];
          storage_path?: string;
          updated_at?: string;
          user_id?: string;
          views_count?: number;
          width?: number | null;
        };
        Relationships: [];
      };
      story_views: {
        Row: {
          created_at: string;
          id: string;
          story_id: string;
          viewer_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          story_id: string;
          viewer_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          story_id?: string;
          viewer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string | null;
          type: string;
          entity_id: string | null;
          entity_type: string | null;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          actor_id?: string | null;
          type: string;
          entity_id?: string | null;
          entity_type?: string | null;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          actor_id?: string | null;
          type?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          message?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      verification_applications: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          known_as: string;
          category: string;
          document_type: string;
          document_number: string;
          official_links: string[];
          notes: string | null;
          status: string;
          applied_at: string;
          reviewed_at: string | null;
          reviewer_notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          known_as: string;
          category: string;
          document_type: string;
          document_number: string;
          official_links?: string[];
          notes?: string | null;
          status?: string;
          applied_at?: string;
          reviewed_at?: string | null;
          reviewer_notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          known_as?: string;
          category?: string;
          document_type?: string;
          document_number?: string;
          official_links?: string[];
          notes?: string | null;
          status?: string;
          applied_at?: string;
          reviewed_at?: string | null;
          reviewer_notes?: string | null;
        };
        Relationships: [];
      };
      creator_analytics: {
        Row: {
          id: string;
          user_id: string;
          record_date: string;
          profile_visits: number;
          impressions: number;
          reach: number;
          followers_delta: number;
          engagement_count: number;
          reel_views: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          record_date?: string;
          profile_visits?: number;
          impressions?: number;
          reach?: number;
          followers_delta?: number;
          engagement_count?: number;
          reel_views?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          record_date?: string;
          profile_visits?: number;
          impressions?: number;
          reach?: number;
          followers_delta?: number;
          engagement_count?: number;
          reel_views?: number;
        };
        Relationships: [];
      };
      transactions_ledger: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          amount_cents: number;
          currency: string;
          status: string;
          description: string;
          metadata: Json;
          created_at: string;
          transaction_type?: string;
          source?: string;
          gross_cents?: number;
          fee_cents?: number;
          net_cents?: number;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          idempotency_key?: string;
          audit_metadata?: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: string;
          amount_cents?: number;
          currency?: string;
          status?: string;
          description: string;
          metadata?: Json;
          created_at?: string;
          transaction_type?: string;
          source?: string;
          gross_cents?: number;
          fee_cents?: number;
          net_cents?: number;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          idempotency_key?: string;
          audit_metadata?: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          amount_cents?: number;
          currency?: string;
          status?: string;
          description?: string;
          metadata?: Json;
          created_at?: string;
          transaction_type?: string;
          source?: string;
          gross_cents?: number;
          fee_cents?: number;
          net_cents?: number;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          idempotency_key?: string;
          audit_metadata?: Json;
        };
        Relationships: [];
      };
      post_drafts: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          caption: string | null;
          media: Json;
          type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          caption?: string | null;
          media?: Json;
          type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          caption?: string | null;
          media?: Json;
          type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      restrictions: {
        Row: {
          id: string;
          user_id: string;
          restricted_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          restricted_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          restricted_user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      story_replies: {
        Row: {
          id: string;
          story_id: string;
          user_id: string;
          message: string;
          reaction: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          user_id: string;
          message: string;
          reaction?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          user_id?: string;
          message?: string;
          reaction?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      moderation_cases: {
        Row: {
          id: string;
          target_type: string;
          target_id: string;
          reporter_id: string | null;
          category: string;
          severity: string;
          status: string;
          rationale: string | null;
          reviewer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          target_type: string;
          target_id: string;
          reporter_id?: string | null;
          category: string;
          severity?: string;
          status?: string;
          rationale?: string | null;
          reviewer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          target_type?: string;
          target_id?: string;
          reporter_id?: string | null;
          category?: string;
          severity?: string;
          status?: string;
          rationale?: string | null;
          reviewer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      appeals: {
        Row: {
          id: string;
          case_id: string | null;
          user_id: string;
          target_id: string;
          target_type: string;
          reason: string;
          status: string;
          decision_notes: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          case_id?: string | null;
          user_id: string;
          target_id: string;
          target_type: string;
          reason: string;
          status?: string;
          decision_notes?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          case_id?: string | null;
          user_id?: string;
          target_id?: string;
          target_type?: string;
          reason?: string;
          status?: string;
          decision_notes?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      verification_reviews: {
        Row: {
          id: string;
          application_id: string;
          reviewer_id: string;
          decision: string;
          rationale: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          reviewer_id: string;
          decision: string;
          rationale: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          reviewer_id?: string;
          decision?: string;
          rationale?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      creator_earnings: {
        Row: {
          id: string;
          user_id: string;
          gross_cents: number;
          net_cents: number;
          fee_cents: number;
          currency: string;
          period_start: string;
          period_end: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          gross_cents?: number;
          net_cents?: number;
          fee_cents?: number;
          currency?: string;
          period_start: string;
          period_end: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          gross_cents?: number;
          net_cents?: number;
          fee_cents?: number;
          currency?: string;
          period_start?: string;
          period_end?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          subscriber_id: string;
          creator_id: string | null;
          plan_id: string;
          amount_cents: number;
          currency: string;
          status: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subscriber_id: string;
          creator_id?: string | null;
          plan_id: string;
          amount_cents?: number;
          currency?: string;
          status?: string;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subscriber_id?: string;
          creator_id?: string | null;
          plan_id?: string;
          amount_cents?: number;
          currency?: string;
          status?: string;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_methods: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          external_id: string | null;
          type: string;
          brand: string;
          last4: string;
          exp_month: number | null;
          exp_year: number | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider?: string;
          external_id?: string | null;
          type?: string;
          brand?: string;
          last4?: string;
          exp_month?: number | null;
          exp_year?: number | null;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          external_id?: string | null;
          type?: string;
          brand?: string;
          last4?: string;
          exp_month?: number | null;
          exp_year?: number | null;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          invoice_number: string;
          amount_cents: number;
          currency: string;
          status: string;
          pdf_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id?: string | null;
          invoice_number: string;
          amount_cents: number;
          currency?: string;
          status?: string;
          pdf_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string | null;
          invoice_number?: string;
          amount_cents?: number;
          currency?: string;
          status?: string;
          pdf_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      payouts: {
        Row: {
          id: string;
          user_id: string;
          amount_cents: number;
          currency: string;
          status: string;
          provider_payout_id: string | null;
          destination_last4: string | null;
          failure_reason: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount_cents: number;
          currency?: string;
          status?: string;
          provider_payout_id?: string | null;
          destination_last4?: string | null;
          failure_reason?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount_cents?: number;
          currency?: string;
          status?: string;
          provider_payout_id?: string | null;
          destination_last4?: string | null;
          failure_reason?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      account_deletion_requests: {
        Row: {
          id: string;
          user_id: string;
          reason: string | null;
          status: string;
          scheduled_purge_at: string;
          created_at: string;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          reason?: string | null;
          status?: string;
          scheduled_purge_at?: string;
          created_at?: string;
          cancelled_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          reason?: string | null;
          status?: string;
          scheduled_purge_at?: string;
          created_at?: string;
          cancelled_at?: string | null;
        };
        Relationships: [];
      };
      monetization_eligibility: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          followers_count: number;
          account_age_days: number;
          qualified_views_30d: number;
          watch_time_minutes_30d: number;
          community_strikes: number;
          kyc_status: string;
          payment_verified: boolean;
          two_factor_verified: boolean;
          country_code: string;
          country_eligible: boolean;
          violations_count: number;
          rejection_reason: string | null;
          last_evaluated_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: string;
          followers_count?: number;
          account_age_days?: number;
          qualified_views_30d?: number;
          watch_time_minutes_30d?: number;
          community_strikes?: number;
          kyc_status?: string;
          payment_verified?: boolean;
          two_factor_verified?: boolean;
          country_code?: string;
          country_eligible?: boolean;
          violations_count?: number;
          rejection_reason?: string | null;
          last_evaluated_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: string;
          followers_count?: number;
          account_age_days?: number;
          qualified_views_30d?: number;
          watch_time_minutes_30d?: number;
          community_strikes?: number;
          kyc_status?: string;
          payment_verified?: boolean;
          two_factor_verified?: boolean;
          country_code?: string;
          country_eligible?: boolean;
          violations_count?: number;
          rejection_reason?: string | null;
          last_evaluated_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      monetization_programs_config: {
        Row: {
          id: string;
          program_name: string;
          creator_revenue_share_pct: number;
          platform_fee_pct: number;
          min_payout_cents: number;
          is_active: boolean;
          rules: Json;
          updated_at: string;
        };
        Insert: {
          id: string;
          program_name: string;
          creator_revenue_share_pct: number;
          platform_fee_pct: number;
          min_payout_cents?: number;
          is_active?: boolean;
          rules?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          program_name?: string;
          creator_revenue_share_pct?: number;
          platform_fee_pct?: number;
          min_payout_cents?: number;
          is_active?: boolean;
          rules?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      ad_revenue_events: {
        Row: {
          id: string;
          creator_id: string;
          content_id: string;
          content_type: string;
          viewer_id: string | null;
          impression_type: string;
          watch_time_seconds: number;
          advertiser_gross_cents: number;
          creator_share_cents: number;
          platform_fee_cents: number;
          is_invalid_traffic: boolean;
          fraud_filter_reason: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          content_id: string;
          content_type: string;
          viewer_id?: string | null;
          impression_type: string;
          watch_time_seconds?: number;
          advertiser_gross_cents?: number;
          creator_share_cents?: number;
          platform_fee_cents?: number;
          is_invalid_traffic?: boolean;
          fraud_filter_reason?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          content_id?: string;
          content_type?: string;
          viewer_id?: string | null;
          impression_type?: string;
          watch_time_seconds?: number;
          advertiser_gross_cents?: number;
          creator_share_cents?: number;
          platform_fee_cents?: number;
          is_invalid_traffic?: boolean;
          fraud_filter_reason?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_coin_wallets: {
        Row: {
          user_id: string;
          coin_balance: number;
          lifetime_purchased: number;
          lifetime_spent: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          coin_balance?: number;
          lifetime_purchased?: number;
          lifetime_spent?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          coin_balance?: number;
          lifetime_purchased?: number;
          lifetime_spent?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      gift_transactions: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          content_id: string | null;
          content_type: string;
          gift_id: string;
          gift_name: string;
          coin_amount: number;
          creator_net_cents: number;
          platform_fee_cents: number;
          status: string;
          anti_fraud_passed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          content_id?: string | null;
          content_type?: string;
          gift_id: string;
          gift_name: string;
          coin_amount: number;
          creator_net_cents: number;
          platform_fee_cents: number;
          status?: string;
          anti_fraud_passed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          content_id?: string | null;
          content_type?: string;
          gift_id?: string;
          gift_name?: string;
          coin_amount?: number;
          creator_net_cents?: number;
          platform_fee_cents?: number;
          status?: string;
          anti_fraud_passed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      creator_subscription_plans: {
        Row: {
          id: string;
          creator_id: string;
          tier_name: string;
          price_cents: number;
          currency: string;
          perks: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          tier_name: string;
          price_cents: number;
          currency?: string;
          perks?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          tier_name?: string;
          price_cents?: number;
          currency?: string;
          perks?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      live_monetization_events: {
        Row: {
          id: string;
          live_stream_id: string;
          creator_id: string;
          sender_id: string;
          item_type: string;
          coin_amount: number;
          gross_cents: number;
          creator_net_cents: number;
          platform_fee_cents: number;
          message: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          live_stream_id: string;
          creator_id: string;
          sender_id: string;
          item_type: string;
          coin_amount?: number;
          gross_cents?: number;
          creator_net_cents?: number;
          platform_fee_cents?: number;
          message?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          live_stream_id?: string;
          creator_id?: string;
          sender_id?: string;
          item_type?: string;
          coin_amount?: number;
          gross_cents?: number;
          creator_net_cents?: number;
          platform_fee_cents?: number;
          message?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      performance_reward_campaigns: {
        Row: {
          id: string;
          title: string;
          description: string;
          start_date: string;
          end_date: string;
          target_metric: string;
          milestone_threshold: number;
          reward_cents: number;
          max_cap_cents: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          description: string;
          start_date: string;
          end_date: string;
          target_metric: string;
          milestone_threshold: number;
          reward_cents: number;
          max_cap_cents: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          start_date?: string;
          end_date?: string;
          target_metric?: string;
          milestone_threshold?: number;
          reward_cents?: number;
          max_cap_cents?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      creator_campaign_participations: {
        Row: {
          id: string;
          campaign_id: string;
          creator_id: string;
          current_metric_value: number;
          progress_pct: number;
          status: string;
          earned_cents: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          creator_id: string;
          current_metric_value?: number;
          progress_pct?: number;
          status?: string;
          earned_cents?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          creator_id?: string;
          current_metric_value?: number;
          progress_pct?: number;
          status?: string;
          earned_cents?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      brand_campaigns: {
        Row: {
          id: string;
          brand_name: string;
          brand_logo: string | null;
          title: string;
          description: string;
          budget_cents: number;
          deliverables_required: string;
          requirements_min_followers: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_name: string;
          brand_logo?: string | null;
          title: string;
          description: string;
          budget_cents: number;
          deliverables_required: string;
          requirements_min_followers?: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_name?: string;
          brand_logo?: string | null;
          title?: string;
          description?: string;
          budget_cents?: number;
          deliverables_required?: string;
          requirements_min_followers?: number;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      creator_brand_contracts: {
        Row: {
          id: string;
          campaign_id: string;
          creator_id: string;
          proposal_text: string;
          deliverable_content_url: string | null;
          deliverable_post_id: string | null;
          status: string;
          compensation_cents: number;
          platform_fee_cents: number;
          creator_net_cents: number;
          disclosure_tag: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          creator_id: string;
          proposal_text: string;
          deliverable_content_url?: string | null;
          deliverable_post_id?: string | null;
          status?: string;
          compensation_cents: number;
          platform_fee_cents: number;
          creator_net_cents: number;
          disclosure_tag?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          creator_id?: string;
          proposal_text?: string;
          deliverable_content_url?: string | null;
          deliverable_post_id?: string | null;
          status?: string;
          compensation_cents?: number;
          platform_fee_cents?: number;
          creator_net_cents?: number;
          disclosure_tag?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      affiliate_products: {
        Row: {
          id: string;
          name: string;
          brand: string;
          image_url: string | null;
          category: string;
          price_cents: number;
          commission_pct: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          brand: string;
          image_url?: string | null;
          category?: string;
          price_cents: number;
          commission_pct?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          brand?: string;
          image_url?: string | null;
          category?: string;
          price_cents?: number;
          commission_pct?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      affiliate_links: {
        Row: {
          id: string;
          creator_id: string;
          product_id: string;
          custom_slug: string;
          clicks_count: number;
          conversions_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          product_id: string;
          custom_slug: string;
          clicks_count?: number;
          conversions_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          product_id?: string;
          custom_slug?: string;
          clicks_count?: number;
          conversions_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      affiliate_conversions: {
        Row: {
          id: string;
          link_id: string;
          creator_id: string;
          product_id: string;
          order_id: string;
          order_value_cents: number;
          commission_cents: number;
          creator_net_cents: number;
          platform_fee_cents: number;
          status: string;
          return_window_ends_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          link_id: string;
          creator_id: string;
          product_id: string;
          order_id: string;
          order_value_cents: number;
          commission_cents: number;
          creator_net_cents: number;
          platform_fee_cents: number;
          status?: string;
          return_window_ends_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          link_id?: string;
          creator_id?: string;
          product_id?: string;
          order_id?: string;
          order_value_cents?: number;
          commission_cents?: number;
          creator_net_cents?: number;
          platform_fee_cents?: number;
          status?: string;
          return_window_ends_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      creator_financial_wallets: {
        Row: {
          user_id: string;
          available_cents: number;
          pending_cents: number;
          approved_cents: number;
          payable_cents: number;
          total_paid_cents: number;
          total_reversed_cents: number;
          total_refunded_cents: number;
          lifetime_gross_cents: number;
          currency: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          available_cents?: number;
          pending_cents?: number;
          approved_cents?: number;
          payable_cents?: number;
          total_paid_cents?: number;
          total_reversed_cents?: number;
          total_refunded_cents?: number;
          lifetime_gross_cents?: number;
          currency?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          available_cents?: number;
          pending_cents?: number;
          approved_cents?: number;
          payable_cents?: number;
          total_paid_cents?: number;
          total_reversed_cents?: number;
          total_refunded_cents?: number;
          lifetime_gross_cents?: number;
          currency?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payout_account_configs: {
        Row: {
          user_id: string;
          schedule_type: string;
          minimum_threshold_cents: number;
          payout_method: string;
          account_holder_name: string | null;
          masked_account_number: string | null;
          tax_id_type: string;
          tax_id_last4: string | null;
          tax_form_status: string;
          tax_verified_at: string | null;
          legal_business_name: string | null;
          country: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          schedule_type?: string;
          minimum_threshold_cents?: number;
          payout_method?: string;
          account_holder_name?: string | null;
          masked_account_number?: string | null;
          tax_id_type?: string;
          tax_id_last4?: string | null;
          tax_form_status?: string;
          tax_verified_at?: string | null;
          legal_business_name?: string | null;
          country?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          schedule_type?: string;
          minimum_threshold_cents?: number;
          payout_method?: string;
          account_holder_name?: string | null;
          masked_account_number?: string | null;
          tax_id_type?: string;
          tax_id_last4?: string | null;
          tax_form_status?: string;
          tax_verified_at?: string | null;
          legal_business_name?: string | null;
          country?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payout_lifecycle_requests: {
        Row: {
          id: string;
          user_id: string;
          amount_cents: number;
          currency: string;
          status: string;
          destination_type: string;
          destination_summary: string;
          payout_batch_id: string | null;
          gateway_reference: string | null;
          failure_reason: string | null;
          retry_count: number;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount_cents: number;
          currency?: string;
          status?: string;
          destination_type: string;
          destination_summary: string;
          payout_batch_id?: string | null;
          gateway_reference?: string | null;
          failure_reason?: string | null;
          retry_count?: number;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount_cents?: number;
          currency?: string;
          status?: string;
          destination_type?: string;
          destination_summary?: string;
          payout_batch_id?: string | null;
          gateway_reference?: string | null;
          failure_reason?: string | null;
          retry_count?: number;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_follow_request: {
        Args: { _request_id: string };
        Returns: undefined;
      };
      can_view_author_content: { Args: { _author: string }; Returns: boolean };
      can_view_post: { Args: { _post_id: string }; Returns: boolean };
      can_view_story: { Args: { _story_id: string }; Returns: boolean };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_conversation_member: {
        Args: { _conversation_id: string; _user_id: string };
        Returns: boolean;
      };
      post_author: { Args: { _post_id: string }; Returns: string };
      request_follow: { Args: { _target_id: string }; Returns: string };
      story_author: { Args: { _story_id: string }; Returns: string };
    };
    Enums: {
      account_type: "personal" | "creator" | "business";
      app_role: "owner" | "super_admin" | "moderator" | "support" | "user";
      follow_request_status: "pending" | "approved" | "rejected";
      media_type: "image" | "video";
      post_visibility: "public" | "followers" | "private";
      story_audience: "public" | "followers" | "close_friends";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      account_type: ["personal", "creator", "business"],
      app_role: ["owner", "super_admin", "moderator", "support", "user"],
      follow_request_status: ["pending", "approved", "rejected"],
      media_type: ["image", "video"],
      post_visibility: ["public", "followers", "private"],
      story_audience: ["public", "followers", "close_friends"],
    },
  },
} as const;
