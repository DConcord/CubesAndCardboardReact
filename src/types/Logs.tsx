import { AllEmailAlertPreferences } from "../types/Players";

export type LogType = RsvpLogType | EventLogType | PlayerLogType | EmailSubscriptionLogType | GameTutorialLogType;

export type RsvpLogType = {
  "@timestamp": string;
  log_type: "rsvp";
  date: string;
  action: "update" | "delete" | "add";
  auth_sub: string;
  auth_type: "admin" | "self" | "host";
  event_id: string;
  user_id: string;
  rsvp: "attending" | "not_attending";
};
export type EventLogType =
  | {
      "@timestamp": string;
      log_type: "event";
      auth_sub: string;
      auth_type: "admin";
      event_id: string;
      date: string;
      new: Object;
      action: "create";
    }
  | {
      "@timestamp": string;
      log_type: "event";
      auth_sub: string;
      auth_type: "admin";
      event_id: string;
      date: string;
      previous: Object;
      action: "delete";
    }
  | {
      "@timestamp": string;
      log_type: "event";
      auth_sub: string;
      auth_type: "admin";
      event_id: string;
      date: string;
      previous: Object;
      new: Object;
      action: "modify";
    }
  | {
      "@timestamp": string;
      log_type: "event";
      auth_sub: string;
      auth_type: "host";
      event_id: string;
      date: string;
      previous: Object;
      new: Object;
      action: "update";
    };
export type PlayerLogType = {
  "@timestamp": string;
  log_type: "player";
  action: "create" | "update";
  auth_sub: string;
  auth_type: "admin" | "self";
  user_id: string;
  attrib: string;
};
export type EmailSubscriptionLogType = {
  "@timestamp": string;
  log_type: "email_subscription";
  action: "subscribe" | "unsubscribe";
  auth_sub: string;
  user_id: string;
  auth_type: "admin" | "self";
  attrib: keyof AllEmailAlertPreferences & string;
};
export type GameTutorialLogType = {
  "@timestamp": string;
  log_type: "game_tutorial";
  action: "create" | "update" | "delete";
  auth_sub: string;
  auth_type: "admin";
  previous: string;
  new: string;
};
