import "react-native-url-polyfill/auto";
import "expo-sqlite/localStorage/install";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type InquiryStatus = "new" | "contacted" | string;

type Database = {
  public: {
    Tables: {
      contact_inquiries: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          company: string | null;
          project_type: string;
          message: string;
          source: string;
          status: InquiryStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          company?: string | null;
          project_type: string;
          message: string;
          source?: string;
          status?: InquiryStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          company?: string | null;
          project_type?: string;
          message?: string;
          source?: string;
          status?: InquiryStatus;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

export type InquiryRow = Database["public"]["Tables"]["contact_inquiries"]["Row"];

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);

let client: SupabaseClient<Database> | null = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  if (!client) {
    client = createClient<Database>(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return client;
}
