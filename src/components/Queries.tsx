import { retrieveTokens, TokensFromStorage } from "amazon-cognito-passwordless-auth/storage";
// import { usePasswordless } from "amazon-cognito-passwordless-auth/react";

import { PlayersGroups } from "../types/Players";
import { queryOptions } from "@tanstack/react-query";
import axios from "axios";

// const { tokens } = usePasswordless();
// const apiClient = axios.create({
//   baseURL: `https://${import.meta.env.VITE_API_URL}/api`,
//   headers: tokens && {
//     Authorization: "Bearer " + tokens.idToken,
//   },
// });

///// Events /////
export function fetchEventsOptions() {
  return queryOptions({
    queryKey: ["events"],
    queryFn: () => fetchEventsJson(),
    refetchInterval: 1000 * 60 * 10, // refetch every 10 min
  });
}

export const fetchEventsJson = async (): Promise<[]> => {
  const response = await axios.get(`https://${import.meta.env.VITE_API_URL}/events.json`);
  return response.data;
};

export function fetchEventsApiOptions(tokens: TokensFromStorage) {
  return queryOptions({
    queryKey: ["events"],
    queryFn: () => fetchEventsApi(tokens),
    refetchInterval: 1000 * 60 * 10, // refetch every 10 min
  });
}

export const fetchEventsApi = async (tokens: TokensFromStorage): Promise<[]> => {
  const response = await axios.get(`https://${import.meta.env.VITE_API_URL}/api/events`, {
    headers: { Authorization: "Bearer " + tokens.idToken },
  });
  return response.data;
};

///// Players /////
export function fetchPlayersOptions() {
  return queryOptions({
    queryKey: ["players"],
    queryFn: () => fetchPlayersJson(),
    staleTime: 1000 * 60 * 10, // cache for 10 min before refetching
    refetchInterval: 1000 * 60 * 20, // refetch every 20 min
  });
}

export const fetchPlayersJson = async (): Promise<PlayersGroups> => {
  const response = await axios.get(`https://${import.meta.env.VITE_API_URL}/players_groups.json`);
  return response.data;
};

export function fetchPlayersApiOptions({ tokens, refresh }: { tokens: TokensFromStorage; refresh: "yes" | "no" }) {
  return queryOptions({
    queryKey: ["players"],
    queryFn: () => fetchPlayersApi(tokens, refresh),
    staleTime: 1000 * 60 * 10, // cache for 10 min before refetching
    refetchInterval: 1000 * 60 * 20, // refetch every 20 min
  });
}

export const fetchPlayersApi = async (tokens: TokensFromStorage, refresh: "yes" | "no"): Promise<PlayersGroups> => {
  const response = await axios.get(`https://${import.meta.env.VITE_API_URL}/api/players`, {
    headers: { Authorization: "Bearer " + tokens.idToken },
    params: { refresh: refresh },
  });
  return response.data;
};
