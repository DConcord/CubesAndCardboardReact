import { useEffect } from "react";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";

import { PlayersGroups } from "../types/Players";
import { queryOptions, QueryClientProvider, QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: `https://${import.meta.env.VITE_API_URL}/api`,
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
  const response = await axios.get(`https://${import.meta.env.VITE_API_URL}/events.json`);
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
  const response = await axios.get(`https://${import.meta.env.VITE_API_URL}/players_groups.json`);
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
