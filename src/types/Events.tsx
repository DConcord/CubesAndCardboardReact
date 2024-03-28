export interface EventDict {
  [key: ExistingGameKnightEvent["event_id"]]: ExistingGameKnightEvent;
}

export interface ExistingGameKnightEvent extends GameKnightEvent {
  event_id: string;
}

export type GameKnightEvent = {
  event_id?: string;
  event_type: string;
  date: string;
  host: string;
  organizer: string;
  format: "Open" | "Reserved" | "Private";
  game: string;
  bgg_id?: number;
  total_spots?: number;
  registered?: string[];
  attending: string[];
  not_attending: string[];
  player_pool: string[];
  organizer_pool: string[];
  tbd_pic?: string;
  migrated?: boolean;
  status?: "Normal" | "Cancelled";
  finalScore?: PlayerScore[];
};

export type PlayerScore = {
  place: number;
  player: string;
  score: string;
};

export type ManagedEventTask = "Clone" | "Create" | "Modify" | "Migrate" | "Read" | "Restore";

export const tbd_pics = [
  "Game_TBD_17.jpeg",
  "Game_TBD_24.jpeg",
  "Game_TBD_23.jpeg",
  "Game_TBD_22.jpeg",
  "Game_TBD_21.jpeg",
  "Game_TBD_20.jpeg",
  "Game_TBD_19.jpeg",
  "Game_TBD_18.jpeg",
  "Game_TBD_27.jpeg",
  "Game_TBD_26.jpeg",
  "Game_TBD_28.jpeg",
  "Game_TBD_29.jpeg",
  "Game_TBD_30.jpeg",
  "Game_TBD_31.jpeg",
  "Game_TBD_32.jpeg",
  "Game_TBD_34.jpeg",
  "Game_TBD_33.jpeg",
];

export type GameSearch = {
  id: string;
  name: string;
  yearpublished: string;
  thumbnail: string;
};
