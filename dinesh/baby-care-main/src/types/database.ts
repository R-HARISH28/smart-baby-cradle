export type BabyStatus = 'sleeping' | 'crying' | 'noise_detected';

export interface CryEvent {
  id: string;
  detected_at: string;
  duration: number;
  intensity: number;
  status: BabyStatus;
  created_at: string;
}

export interface SystemStatus {
  id: string;
  current_status: BabyStatus;
  last_cry_detected: string | null;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      cry_events: {
        Row: CryEvent;
        Insert: Omit<CryEvent, 'id' | 'created_at'>;
        Update: Partial<Omit<CryEvent, 'id' | 'created_at'>>;
      };
      system_status: {
        Row: SystemStatus;
        Insert: Omit<SystemStatus, 'id' | 'updated_at'>;
        Update: Partial<Omit<SystemStatus, 'id'>>;
      };
    };
  };
}
