export type PhotoRow = {
  id: string;
  storage_path: string;
  caption: string | null;
  sender_name: string;
  created_at: string;
};

export type MessageRow = {
  id: string;
  sender_name: string;
  content: string | null;
  photo_id: string | null;
  created_at: string;
};

export type EventCategory = "date" | "anniversaire" | "voyage" | "autre";

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  all_day: boolean;
  category: EventCategory;
  created_by: string;
  created_at: string;
};
