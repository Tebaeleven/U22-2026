export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bookmark_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmark_folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          project_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          id?: string
          project_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          project_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "bookmark_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_loves: {
        Row: {
          comment_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_loves_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_loves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          love_count: number
          parent_id: string | null
          project_id: number
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          love_count?: number
          parent_id?: string | null
          project_id: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          love_count?: number
          parent_id?: string | null
          project_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          project_id: number | null
          read: boolean
          recipient_id: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          project_id?: number | null
          read?: boolean
          recipient_id: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          project_id?: number | null
          read?: boolean
          recipient_id?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string
          bio: string
          country: string
          created_at: string
          display_name: string
          id: string
          updated_at: string
          username: string
          working_on: string
        }
        Insert: {
          avatar_url?: string
          bio?: string
          country?: string
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
          username: string
          working_on?: string
        }
        Update: {
          avatar_url?: string
          bio?: string
          country?: string
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          username?: string
          working_on?: string
        }
        Relationships: []
      }
      project_loves: {
        Row: {
          created_at: string
          project_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          project_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          project_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_loves_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_loves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          author_id: string
          comment_count: number
          created_at: string
          description: string
          featured: boolean
          id: number
          instructions: string
          loves: number
          parent_id: number | null
          remixes: number
          shared: boolean
          tags: string[]
          thumbnail_url: string
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author_id: string
          comment_count?: number
          created_at?: string
          description?: string
          featured?: boolean
          id?: never
          instructions?: string
          loves?: number
          parent_id?: number | null
          remixes?: number
          shared?: boolean
          tags?: string[]
          thumbnail_url?: string
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author_id?: string
          comment_count?: number
          created_at?: string
          description?: string
          featured?: boolean
          id?: never
          instructions?: string
          loves?: number
          parent_id?: number | null
          remixes?: number
          shared?: boolean
          tags?: string[]
          thumbnail_url?: string
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "projects_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_curators: {
        Row: {
          studio_id: string
          user_id: string
        }
        Insert: {
          studio_id: string
          user_id: string
        }
        Update: {
          studio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_curators_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_curators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_projects: {
        Row: {
          added_at: string
          project_id: number
          studio_id: string
        }
        Insert: {
          added_at?: string
          project_id: number
          studio_id: string
        }
        Update: {
          added_at?: string
          project_id?: number
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_projects_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          created_at: string
          created_by: string
          description: string
          follower_count: number
          id: string
          thumbnail_url: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string
          follower_count?: number
          id?: string
          thumbnail_url?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          follower_count?: number
          id?: string
          thumbnail_url?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "studios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          p_actor_id: string
          p_project_id?: number
          p_recipient_id: string
          p_type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: undefined
      }
      create_remix: {
        Args: { p_parent_id: number; p_title: string }
        Returns: number
      }
      get_follow_counts: {
        Args: { p_user_id: string }
        Returns: {
          follower_count: number
          following_count: number
        }[]
      }
      get_most_loved_projects: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          author_id: string
          comment_count: number
          created_at: string
          description: string
          featured: boolean
          id: number
          instructions: string
          loves: number
          parent_id: number | null
          remixes: number
          shared: boolean
          tags: string[]
          thumbnail_url: string
          title: string
          updated_at: string
          views: number
        }[]
        SetofOptions: {
          from: "*"
          to: "projects"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_most_viewed_projects: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          author_id: string
          comment_count: number
          created_at: string
          description: string
          featured: boolean
          id: number
          instructions: string
          loves: number
          parent_id: number | null
          remixes: number
          shared: boolean
          tags: string[]
          thumbnail_url: string
          title: string
          updated_at: string
          views: number
        }[]
        SetofOptions: {
          from: "*"
          to: "projects"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_recent_projects: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          author_id: string
          comment_count: number
          created_at: string
          description: string
          featured: boolean
          id: number
          instructions: string
          loves: number
          parent_id: number | null
          remixes: number
          shared: boolean
          tags: string[]
          thumbnail_url: string
          title: string
          updated_at: string
          views: number
        }[]
        SetofOptions: {
          from: "*"
          to: "projects"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_remix_tree: {
        Args: { p_project_id: number }
        Returns: {
          author_id: string
          comment_count: number
          created_at: string
          description: string
          featured: boolean
          id: number
          instructions: string
          loves: number
          parent_id: number | null
          remixes: number
          shared: boolean
          tags: string[]
          thumbnail_url: string
          title: string
          updated_at: string
          views: number
        }[]
        SetofOptions: {
          from: "*"
          to: "projects"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_trending_projects: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          author_id: string
          comment_count: number
          created_at: string
          description: string
          featured: boolean
          id: number
          instructions: string
          loves: number
          parent_id: number | null
          remixes: number
          shared: boolean
          tags: string[]
          thumbnail_url: string
          title: string
          updated_at: string
          views: number
        }[]
        SetofOptions: {
          from: "*"
          to: "projects"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_unread_notification_count: { Args: never; Returns: number }
      increment_project_views: {
        Args: { p_project_id: number }
        Returns: undefined
      }
      mark_notifications_read: { Args: never; Returns: undefined }
      move_bookmark_to_folder: {
        Args: { p_folder_id?: string; p_project_id: number }
        Returns: undefined
      }
      toggle_bookmark: {
        Args: { p_folder_id?: string; p_project_id: number }
        Returns: boolean
      }
      toggle_comment_love: { Args: { p_comment_id: string }; Returns: boolean }
      toggle_follow: { Args: { p_following_id: string }; Returns: boolean }
      toggle_project_love: { Args: { p_project_id: number }; Returns: boolean }
    }
    Enums: {
      notification_type: "love" | "comment" | "follow" | "remix"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      notification_type: ["love", "comment", "follow", "remix"],
    },
  },
} as const

