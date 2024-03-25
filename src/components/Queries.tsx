import { useEffect } from "react";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";

import { PlayersGroups } from "../types/Players";
import { GameSearch } from "../types/Events";
import { queryOptions, QueryClientProvider, QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: `https://${import.meta.env.VITE_API_URL}/api`,
});

export const publicClient = axios.create({
  baseURL: `https://${import.meta.env.VITE_API_URL}`,
});

///// Events /////
export function fetchEventsOptions() {
  return queryOptions({
    queryKey: ["events"],
    queryFn: () => fetchEventsJson(),
    refetchInterval: 1000 * 60 * 10, // refetch every 10 min
  });
}

export const fetchEventsJson = async (): Promise<[]> => {
  const response = await publicClient.get(`/events.json`);
  return response.data;
};

export function fetchEventsApiOptions() {
  return queryOptions({
    queryKey: ["events"],
    queryFn: () => fetchEventsApi(),
    refetchInterval: 1000 * 60 * 10, // refetch every 10 min
  });
}

export const fetchEventsApi = async (): Promise<[]> => {
  const response = await apiClient.get(`/events`);
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
    queryKey: ["players"],
    queryFn: () => fetchPlayersApi(refresh),
    staleTime: 1000 * 60 * 10, // cache for 10 min before refetching
    refetchInterval: 1000 * 60 * 20, // refetch every 20 min
  });
}

export const fetchPlayersApi = async (refresh: "yes" | "no"): Promise<PlayersGroups> => {
  const response = await apiClient.get(`/players`, {
    params: { refresh: refresh },
  });
  return response.data;
};

///// gameSearch /////
export function fetchGameSearchOptions(game: string) {
  return queryOptions({
    queryKey: ["gamesearch", game],
    queryFn: () => fetchGameSearch(game),
    staleTime: Infinity, // cache for 10 min before refetching
    refetchInterval: false, // refetch every 20 min
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

// Default queryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5min
    },
  },
});

export default function CustomQueryClientProvider(props: { children: React.ReactNode }) {
  const { tokens } = usePasswordless();
  useEffect(() => {
    if (tokens) {
      apiClient.defaults.headers.common["Authorization"] = "Bearer " + tokens.idToken;
      console.log("apiClient Bearer token updated");
    }
  }, [tokens]);

  return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>;
}
