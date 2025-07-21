export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bank_statements: {
        Row: {
          account_info: Json | null
          created_at: string
          date_range_end: string | null
          date_range_start: string | null
          encrypted_file_data: string
          excel_data: Json | null
          file_size: number
          filename: string
          id: string
          original_file_hash: string
          processing_status: Database["public"]["Enums"]["statement_status"]
          total_transactions: number | null
          updated_at: string
          upload_date: string
          user_id: string
        }
        Insert: {
          account_info?: Json | null
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          encrypted_file_data: string
          excel_data?: Json | null
          file_size: number
          filename: string
          id?: string
          original_file_hash: string
          processing_status?: Database["public"]["Enums"]["statement_status"]
          total_transactions?: number | null
          updated_at?: string
          upload_date?: string
          user_id: string
        }
        Update: {
          account_info?: Json | null
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          encrypted_file_data?: string
          excel_data?: Json | null
          file_size?: number
          filename?: string
          id?: string
          original_file_hash?: string
          processing_status?: Database["public"]["Enums"]["statement_status"]
          total_transactions?: number | null
          updated_at?: string
          upload_date?: string
          user_id?: string
        }
        Relationships: []
      }
      export_logs: {
        Row: {
          download_count: number | null
          export_date: string
          export_format: string
          file_size: number | null
          id: string
          statement_id: string | null
          user_id: string
        }
        Insert: {
          download_count?: number | null
          export_date?: string
          export_format: string
          file_size?: number | null
          id?: string
          statement_id?: string | null
          user_id: string
        }
        Update: {
          download_count?: number | null
          export_date?: string
          export_format?: string
          file_size?: number | null
          id?: string
          statement_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_logs_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "bank_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_insights: {
        Row: {
          created_at: string
          generated_at: string
          id: string
          insight_data: Json
          insight_type: string
          statement_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_at?: string
          id?: string
          insight_data: Json
          insight_type: string
          statement_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_at?: string
          id?: string
          insight_data?: Json
          insight_type?: string
          statement_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_insights_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "bank_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_tracking: {
        Row: {
          amount: number
          auto_cancel_eligible: boolean | null
          category: string | null
          created_at: string
          frequency: string
          id: string
          is_active: boolean | null
          last_transaction_id: string | null
          next_billing_date: string | null
          service_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          auto_cancel_eligible?: boolean | null
          category?: string | null
          created_at?: string
          frequency: string
          id?: string
          is_active?: boolean | null
          last_transaction_id?: string | null
          next_billing_date?: string | null
          service_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          auto_cancel_eligible?: boolean | null
          category?: string | null
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_transaction_id?: string | null
          next_billing_date?: string | null
          service_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_tracking_last_transaction_id_fkey"
            columns: ["last_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          ai_confidence_score: number | null
          amount: number
          balance: number | null
          category: Database["public"]["Enums"]["transaction_category"] | null
          created_at: string
          description: string
          id: string
          is_subscription: boolean | null
          is_tax_deductible: boolean | null
          location: string | null
          merchant_name: string | null
          notes: string | null
          statement_id: string
          subscription_frequency: string | null
          tags: string[] | null
          tax_category: string | null
          transaction_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          amount: number
          balance?: number | null
          category?: Database["public"]["Enums"]["transaction_category"] | null
          created_at?: string
          description: string
          id?: string
          is_subscription?: boolean | null
          is_tax_deductible?: boolean | null
          location?: string | null
          merchant_name?: string | null
          notes?: string | null
          statement_id: string
          subscription_frequency?: string | null
          tags?: string[] | null
          tax_category?: string | null
          transaction_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          amount?: number
          balance?: number | null
          category?: Database["public"]["Enums"]["transaction_category"] | null
          created_at?: string
          description?: string
          id?: string
          is_subscription?: boolean | null
          is_tax_deductible?: boolean | null
          location?: string | null
          merchant_name?: string | null
          notes?: string | null
          statement_id?: string
          subscription_frequency?: string | null
          tags?: string[] | null
          tax_category?: string | null
          transaction_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "bank_statements"
            referencedColumns: ["id"]
          },
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
      statement_status: "processing" | "completed" | "failed"
      transaction_category:
        | "groceries"
        | "dining"
        | "transportation"
        | "utilities"
        | "entertainment"
        | "healthcare"
        | "shopping"
        | "subscription"
        | "investment"
        | "income"
        | "transfer"
        | "fees"
        | "taxes"
        | "insurance"
        | "education"
        | "other"
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
  public: {
    Enums: {
      statement_status: ["processing", "completed", "failed"],
      transaction_category: [
        "groceries",
        "dining",
        "transportation",
        "utilities",
        "entertainment",
        "healthcare",
        "shopping",
        "subscription",
        "investment",
        "income",
        "transfer",
        "fees",
        "taxes",
        "insurance",
        "education",
        "other",
      ],
    },
  },
} as const
