import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
          status: string;
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
          status?: string;
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
          status?: string;
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

type ContactInquiryInput = {
  fullName: string;
  email: string;
  company?: string;
  projectType: string;
  message: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient<Database> | null = null;

function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return browserClient;
}

export async function createContactInquiry(input: ContactInquiryInput) {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.from("contact_inquiries").insert({
    full_name: input.fullName,
    email: input.email,
    company: input.company?.trim() || null,
    project_type: input.projectType,
    message: input.message,
    source: "website",
  });

  if (error) {
    throw error;
  }
}
