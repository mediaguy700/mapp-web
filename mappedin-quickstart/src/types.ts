export interface Reader {
  reader_name: string;
  display_name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

export interface ReadersResponse {
  readers: Reader[];
}

export interface Child {
  child_id?: string;
  name: string;
  reader_name: string;
  latitude: number;
  longitude: number;
  last_seen?: string;
}

export interface ChildrenResponse {
  children: Child[];
}

/** Event from GET /events or GET /readers/{readerName}/events */
export interface BLEEvent {
  id: number;
  name: string;
  mac: string;
  reader_name: string;
  direction: 'in' | 'out';
  date_time: string;
  created_at?: string;
}

export interface EventsResponse {
  events: BLEEvent[];
}
