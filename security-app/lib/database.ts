import type { Site, Issue, Audit } from "./domain";
type Owned<T> = T & { owner_id: string };
type SiteInput = { name: string; url: string; description: string };
type IssueInput = {
  site_id: string;
  title: string;
  severity: Issue["severity"];
  status: Issue["status"];
  description: string;
  remediation: string;
  due_date: string | null;
};
export type Database = {
  public: {
    Tables: {
      sites: {
        Row: Owned<Site>;
        Insert: SiteInput;
        Update: Partial<SiteInput>;
        Relationships: [];
      };
      issues: {
        Row: Owned<Issue>;
        Insert: IssueInput;
        Update: Partial<IssueInput>;
        Relationships: [];
      };
      audit_events: {
        Row: Owned<Audit> & { entity_id: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
