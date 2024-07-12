import { useEffect } from "react";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";

import { PlayersGroups, PlayerEmailAlertPreferences, AllEmailAlertPreferences } from "../types/Players";
import { GameSearch, GameKnightEvent } from "../types/Events";

import { queryOptions, QueryClientProvider, QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: `https://${import.meta.env.VITE_API_URL}/api`,
});

export const publicClient = axios.create({
  baseURL: `https://${import.meta.env.VITE_API_URL}`,
});

// Default queryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5min
    },
  },
});

///// Events /////
export function fetchEventsOptions() {
  return queryOptions({
    queryKey: ["events"],
    queryFn: () => fetchEventsJson(),
    refetchInterval: 1000 * 60 * 10, // refetch every 10 min
  });
}

export const fetchEventsJson = async (): Promise<GameKnightEvent[]> => {
  const response = await publicClient.get(`/events.json`);
  return response.data;
};

export function fetchEventsApiOptions(refetchInterval = 1000 * 60 * 10) {
  return queryOptions({
    queryKey: ["events"],
    queryFn: () => fetchEventsApi({}),
    refetchInterval: refetchInterval,
  });
}

interface fetchEventsApiProps {
  dateLte?: string;
  dateGte?: string;
}
export const fetchEventsApi = async ({ dateLte, dateGte }: fetchEventsApiProps): Promise<GameKnightEvent[]> => {
  const response = await apiClient.get(`/events`, { params: { dateLte: dateLte, dateGte: dateGte } });
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
  const response = await publicClient.get(`/players_groups.json`);
  return response.data;
};

export function fetchPlayersApiOptions({ refresh }: { refresh: "yes" | "no" }) {
  return queryOptions({
    queryKey: ["players", "api"],
    queryFn: () => fetchPlayersApi(refresh),
    staleTime: 1000 * 60 * 10, // cache for 10 min before marking stale
    refetchInterval: 1000 * 60 * 20, // refetch every 20 min
  });
}

export const fetchPlayersApi = async (refresh: "yes" | "no"): Promise<PlayersGroups> => {
  const response = await apiClient.get(`/players`, {
    params: { refresh: refresh },
  });
  queryClient.setQueryData(["players"], response.data);
  return response.data;
};

///// gameSearch /////
export function fetchGameSearchOptions(game: string) {
  return queryOptions({
    queryKey: ["gamesearch", game],
    queryFn: () => fetchGameSearch(game),
    staleTime: Infinity, // cache for 10 min before refetching
    refetchInterval: false, // refetch every 20 min
    gcTime: Infinity,
  });
}

export const fetchGameSearch = async (game: string): Promise<GameSearch[]> => {
  const response = await apiClient.get("/gamesearch", {
    params: { game: game },
  });
  return response.data;
};

///// BGG Thumbnail /////
export function fetchBggThumbnailOptions(bgg_id: number) {
  return queryOptions({
    queryKey: ["bgg_thumbnail", bgg_id],
    queryFn: () => fetchBggThumbnail(bgg_id),
    staleTime: Infinity, // cache for 10 min before refetching
    refetchInterval: false, // refetch every 20 min
  });
}

export const fetchBggThumbnail = async (bgg_id: number): Promise<string> => {
  const response = await axios.get(`https://boardgamegeek.com/xmlapi2/thing?id=${bgg_id}`, {
    responseType: "document",
  });
  return response.data.getElementsByTagName("thumbnail")[0].textContent;
};

///// Player Email Alert Subscriptions /////
queryClient.setQueryDefaults(["PlayerEmailAlertSubscriptions"], { gcTime: Infinity });

export function fetchPlayerEmailAlertSubscriptionsOptions(user_id: string) {
  return queryOptions({
    queryKey: ["PlayerEmailAlertSubscriptions", user_id],
    queryFn: () => fetchPlayerEmailAlertSubscriptions(user_id),
    staleTime: 1000 * 60 * 10, // cache for 10 min before refetching
  });
}

export const fetchPlayerEmailAlertSubscriptions = async (user_id: string): Promise<PlayerEmailAlertPreferences> => {
  const response = await apiClient.get(`/alerts/player`, { params: { user_id: user_id } });
  return response.data;
};

///// All Email Alert Subscriptions /////
export function fetchAllEmailAlertSubscriptionsOptions() {
  return queryOptions({
    queryKey: ["AllEmailAlertSubscriptions"],
    queryFn: () => fetchAllEmailAlertSubscriptions(),
    staleTime: 1000 * 60 * 10, // cache for 10 min before refetching
  });
}

export const fetchAllEmailAlertSubscriptions = async (): Promise<AllEmailAlertPreferences> => {
  const response = await apiClient.get(`/alerts`);
  const playersQuery = await queryClient.ensureQueryData(fetchPlayersOptions());
  const playersDict = playersQuery.Users;
  for (const user_id of Object.keys(playersDict)) {
    const alert_subscriptions = Object.fromEntries(
      Object.entries(response.data as AllEmailAlertPreferences).map(([alert_type, subscribers_list]) => [
        alert_type,
        subscribers_list.includes(user_id),
      ])
    );
    queryClient.setQueryData(["PlayerEmailAlertSubscriptions", user_id], alert_subscriptions);
  }
  return response.data;
};

export default function CustomQueryClientProvider({ children }: { children: React.ReactNode }) {
  const { tokens } = usePasswordless();
  useEffect(() => {
    if (tokens) {
      apiClient.defaults.headers.common["Authorization"] = "Bearer " + tokens.idToken;
    }
  }, [tokens]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
