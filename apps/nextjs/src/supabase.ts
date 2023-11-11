export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      Conversation: {
        Row: {
          createdAt: string
          id: number
          review: string | null
          score: number | null
          type: string
          userId: string
        }
        Insert: {
          createdAt?: string
          id?: number
          review?: string | null
          score?: number | null
          type: string
          userId: string
        }
        Update: {
          createdAt?: string
          id?: number
          review?: string | null
          score?: number | null
          type?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Conversation_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      Message: {
        Row: {
          conversationId: number
          createdAt: string
          history: string[] | null
          id: number
          reply: string | null
          review: string | null
          score: number | null
          text: string
          updatedAt: string
          userId: number
        }
        Insert: {
          conversationId: number
          createdAt?: string
          history?: string[] | null
          id?: number
          reply?: string | null
          review?: string | null
          score?: number | null
          text: string
          updatedAt: string
          userId: number
        }
        Update: {
          conversationId?: number
          createdAt?: string
          history?: string[] | null
          id?: number
          reply?: string | null
          review?: string | null
          score?: number | null
          text?: string
          updatedAt?: string
          userId?: number
        }
        Relationships: [
          {
            foreignKeyName: "Message_conversationId_fkey"
            columns: ["conversationId"]
            isOneToOne: false
            referencedRelation: "Conversation"
            referencedColumns: ["id"]
          }
        ]
      }
      Post: {
        Row: {
          authorId: string | null
          content: string
          id: string
          published: boolean
          title: string
        }
        Insert: {
          authorId?: string | null
          content: string
          id: string
          published?: boolean
          title: string
        }
        Update: {
          authorId?: string | null
          content?: string
          id?: string
          published?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "Post_authorId_fkey"
            columns: ["authorId"]
            isOneToOne: false
            referencedRelation: "Profile"
            referencedColumns: ["id"]
          }
        ]
      }
      Profile: {
        Row: {
          email: string | null
          id: string
          image: string | null
          name: string
          userId: string
        }
        Insert: {
          email?: string | null
          id: string
          image?: string | null
          name: string
          userId: string
        }
        Update: {
          email?: string | null
          id?: string
          image?: string | null
          name?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Profile_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
