// Strict TypeScript definitions for ESI API Responses

export interface EsiSkillQueueItem {
  skill_id: number;
  finish_date?: string; // ISO 8601 string. Optional if queue is paused.
  start_date?: string;
  finished_level: number;
  queue_position: number;
  training_start_sp?: number;
  level_start_sp?: number;
  level_end_sp?: number;
}

export interface EsiIndustryJob {
  job_id: number;
  installer_id: number;
  facility_id: number;
  station_id: number;
  activity_id: number;
  blueprint_id: number;
  blueprint_type_id: number;
  blueprint_location_id: number;
  output_location_id: number;
  runs: number;
  cost?: number;
  licensed_runs?: number;
  probability?: number;
  product_type_id?: number;
  status: "active" | "cancelled" | "delivered" | "paused" | "ready" | "reverted";
  start_date: string;
  end_date: string;
  pause_date?: string;
  completed_date?: string;
  completed_character_id?: number;
  successful_runs?: number;
}

export interface EsiPlanet {
  planet_id: number;
  planet_type: "temperate" | "barren" | "oceanic" | "ice" | "gas" | "lava" | "storm" | "plasma";
  solar_system_id: number;
  upgrade_level: number;
  num_pins: number;
}

export interface EsiPlanetPin {
  pin_id: number;
  type_id: number;
  latitude: number;
  longitude: number;
  install_time?: string;
  expiry_time?: string;
  last_cycle_start?: string;
  factory_details?: {
    schematic_id: number;
  };
  extractor_details?: {
    product_type_id: number;
    cycle_time: number;
    head_radius: number;
    heads: Array<{
      head_id: number;
      latitude: number;
      longitude: number;
    }>;
    qty_per_cycle: number;
  };
  contents?: Array<{
    type_id: number;
    amount: number;
  }>;
}

export interface EsiPlanetDetails {
  links: Array<{
    source_pin_id: number;
    destination_pin_id: number;
    link_level: number;
  }>;
  pins: EsiPlanetPin[];
  routes: Array<{
    route_id: number;
    source_pin_id: number;
    destination_pin_id: number;
    content_type_id: number;
    quantity: number;
  }>;
}
