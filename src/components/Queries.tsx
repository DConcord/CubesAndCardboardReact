import { TokensFromStorage } from "amazon-cognito-passwordless-auth/storage";

import { PlayersGroups } from "../types/Players";
import { queryOptions } from "@tanstack/react-query";
import axios from "axios";

///// Events /////
export function fetchEventsOptions() {
  return queryOptions({
    queryKey: ["events"],
    queryFn: async (): Promise<[]> => {
      const response = await axios.get(`https://${import.meta.env.VITE_API_URL}/events.json`);
      return response.data;
    },
    refetchInterval: 1000 * 60 * 10, // refetch every 10 min
  });
}

export function fetchEventsApiOptions(tokens: TokensFromStorage) {
  return queryOptions({
    queryKey: ["events"],
    queryFn: async (): Promise<[]> => {
      const response = await axios.get(`https://${import.meta.env.VITE_API_URL}/api/events`, {
        headers: { Authorization: "Bearer " + tokens.idToken },
      });
      return response.data;
    },
    refetchInterval: 1000 * 60 * 10, // refetch every 10 min
  });
}

///// Players /////
export function fetchPlayersOptions() {
  return queryOptions({
    queryKey: ["players"],
    queryFn: async (): Promise<PlayersGroups> => {
      const response = await axios.get(`https://${import.meta.env.VITE_API_URL}/players_groups.json`);
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // cache for 10 min before refetching
    refetchInterval: 1000 * 60 * 20, // refetch every 20 min
  });
}

export function fetchPlayersApiOptions({ tokens, refresh }: { tokens: TokensFromStorage; refresh: "yes" | "no" }) {
  return queryOptions({
    queryKey: ["players"],
    queryFn: async (): Promise<PlayersGroups> => {
      const response = await axios.get(`https://${import.meta.env.VITE_API_URL}/api/players`, {
        headers: { Authorization: "Bearer " + tokens.idToken },
        params: { refresh: refresh },
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // cache for 10 min before refetching
    refetchInterval: 1000 * 60 * 20, // refetch every 20 min
  });
}
