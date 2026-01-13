/**
 * Database types for Supabase
 * Based on the campaign tracking and n8n-brain schemas
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          company: string | null;
          job_title: string | null;
          phone: string | null;
          linkedin_url: string | null;
          company_status: string | null;
          company_verified_at: string | null;
          previous_company: string | null;
          email_status: string | null;
          email_validated_at: string | null;
          email_validation_source: string | null;
          email_validation_result: string | null;
          email_validation_details: Json | null;
          lifecycle_stage: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          company?: string | null;
          job_title?: string | null;
          phone?: string | null;
          linkedin_url?: string | null;
          company_status?: string | null;
          company_verified_at?: string | null;
          previous_company?: string | null;
          email_status?: string | null;
          email_validated_at?: string | null;
          email_validation_source?: string | null;
          email_validation_result?: string | null;
          email_validation_details?: Json | null;
          lifecycle_stage?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          company?: string | null;
          job_title?: string | null;
          phone?: string | null;
          linkedin_url?: string | null;
          company_status?: string | null;
          company_verified_at?: string | null;
          previous_company?: string | null;
          email_status?: string | null;
          email_validated_at?: string | null;
          email_validation_source?: string | null;
          email_validation_result?: string | null;
          email_validation_details?: Json | null;
          lifecycle_stage?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'admin' | 'viewer';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'viewer';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'viewer';
          is_active?: boolean;
          updated_at?: string;
        };
      };
      multichannel_campaigns: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          campaign_type: string | null;
          primary_offer: string | null;
          primary_offer_value: string | null;
          secondary_offer: string | null;
          secondary_offer_programs: string[] | null;
          status: string | null;
          planned_start_date: string | null;
          planned_end_date: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          campaign_type?: string | null;
          primary_offer?: string | null;
          primary_offer_value?: string | null;
          secondary_offer?: string | null;
          secondary_offer_programs?: string[] | null;
          status?: string | null;
          planned_start_date?: string | null;
          planned_end_date?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          campaign_type?: string | null;
          primary_offer?: string | null;
          primary_offer_value?: string | null;
          secondary_offer?: string | null;
          secondary_offer_programs?: string[] | null;
          status?: string | null;
          planned_start_date?: string | null;
          planned_end_date?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      campaign_contacts: {
        Row: {
          id: string;
          campaign_id: string;
          contact_id: string;
          lifecycle_tag: string | null;
          lifecycle_tag_updated_at: string | null;
          ghl_branch: string | null;
          branch_assigned_at: string | null;
          branch_trigger_channel: string | null;
          branch_trigger_event: string | null;
          quarterly_update_registered: boolean | null;
          quarterly_update_registered_at: string | null;
          quarterly_update_first_session_attended: boolean | null;
          secondary_offer_interested: boolean | null;
          secondary_offer_interested_at: string | null;
          secondary_offer_accepted: boolean | null;
          secondary_offer_accepted_at: string | null;
          secondary_offer_program: string | null;
          secondary_offer_recipient: string | null;
          colleague_name: string | null;
          colleague_email: string | null;
          colleague_registered: boolean | null;
          status: string | null;
          opted_out_at: string | null;
          opt_out_reason: string | null;
          opt_out_channel: string | null;
          entered_at: string | null;
          completed_at: string | null;
          total_touches: number | null;
          first_touch_at: string | null;
          last_touch_at: string | null;
          first_engagement_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          contact_id: string;
          lifecycle_tag?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          lifecycle_tag?: string | null;
          status?: string | null;
          ghl_branch?: string | null;
          updated_at?: string;
        };
      };
      campaign_channels: {
        Row: {
          id: string;
          campaign_id: string;
          channel: string;
          platform: string | null;
          internal_name: string | null;
          platform_campaign_id: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          settings: Json | null;
          status: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          channel: string;
          platform?: string | null;
          status?: string | null;
        };
        Update: {
          status?: string | null;
          settings?: Json | null;
        };
      };
      campaign_activity: {
        Row: {
          id: string;
          campaign_contact_id: string;
          campaign_channel_id: string | null;
          message_id: string | null;
          variant_id: string | null;
          activity_type: string;
          activity_at: string;
          channel: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_contact_id: string;
          campaign_channel_id?: string | null;
          activity_type: string;
          activity_at?: string;
          channel?: string | null;
          metadata?: Json | null;
        };
        Update: {
          metadata?: Json | null;
        };
      };
    };
    Views: {
      campaign_funnel: {
        Row: {
          campaign_id: string | null;
          campaign_name: string | null;
          total_contacts: number | null;
          active_contacts: number | null;
          engaged_contacts: number | null;
          qualified_contacts: number | null;
          registered_contacts: number | null;
        };
      };
      channel_performance: {
        Row: {
          channel_id: string | null;
          channel: string | null;
          platform: string | null;
          total_contacts: number | null;
          active: number | null;
          paused: number | null;
          replied: number | null;
          hot_leads: number | null;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
  n8n_brain: {
    Tables: {
      patterns: {
        Row: {
          id: string;
          name: string;
          description: string;
          workflow_json: Json;
          tags: string[] | null;
          services: string[] | null;
          node_types: string[] | null;
          trigger_type: string | null;
          source_workflow_id: string | null;
          source_workflow_name: string | null;
          notes: string | null;
          success_count: number | null;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description: string;
          workflow_json: Json;
          tags?: string[] | null;
          services?: string[] | null;
          node_types?: string[] | null;
          trigger_type?: string | null;
        };
        Update: {
          success_count?: number | null;
          last_used_at?: string | null;
        };
      };
      credentials: {
        Row: {
          id: string;
          service_name: string;
          credential_id: string;
          credential_name: string | null;
          credential_type: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          service_name: string;
          credential_id: string;
          credential_name?: string | null;
          credential_type?: string | null;
        };
        Update: {
          credential_id?: string;
          credential_name?: string | null;
        };
      };
      error_fixes: {
        Row: {
          id: string;
          error_message: string;
          error_code: string | null;
          node_type: string | null;
          operation: string | null;
          fix_description: string;
          fix_example: Json | null;
          times_applied: number | null;
          times_succeeded: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          error_message: string;
          fix_description: string;
          node_type?: string | null;
          fix_example?: Json | null;
        };
        Update: {
          times_applied?: number | null;
          times_succeeded?: number | null;
        };
      };
      confidence_log: {
        Row: {
          id: string;
          task_description: string;
          services_involved: string[] | null;
          node_types_involved: string[] | null;
          confidence_score: number | null;
          confidence_factors: Json | null;
          recommendation: string | null;
          action_taken: string | null;
          outcome: string;
          outcome_notes: string | null;
          pattern_id: string | null;
          created_at: string;
        };
        Insert: {
          task_description: string;
          outcome: string;
          services_involved?: string[] | null;
          confidence_score?: number | null;
        };
        Update: {
          outcome?: string;
          outcome_notes?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// Helper types
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type Campaign = Database['public']['Tables']['multichannel_campaigns']['Row'];
export type CampaignContact = Database['public']['Tables']['campaign_contacts']['Row'];
export type CampaignChannel = Database['public']['Tables']['campaign_channels']['Row'];
export type CampaignActivity = Database['public']['Tables']['campaign_activity']['Row'];
export type CampaignFunnel = Database['public']['Views']['campaign_funnel']['Row'];
export type ChannelPerformance = Database['public']['Views']['channel_performance']['Row'];

// User profiles
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// n8n-brain types
export type Pattern = Database['n8n_brain']['Tables']['patterns']['Row'];
export type Credential = Database['n8n_brain']['Tables']['credentials']['Row'];
export type ErrorFix = Database['n8n_brain']['Tables']['error_fixes']['Row'];
export type ConfidenceLog = Database['n8n_brain']['Tables']['confidence_log']['Row'];
