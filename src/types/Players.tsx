// https://betterprogramming.pub/5-recipes-for-setting-default-props-in-react-typescript-b52d8b6a842c
export type PlayerNameDict = {
  [key: PlayerGet["attrib"]["given_name"]]: string;
};

export type PlayersGroups = {
  Users: PlayersDict;
  Groups: {
    [key: string]: string[];
  };
};

export type PlayersDict = {
  [key: string]: PlayerGet;
};

export type PlayerGet = {
  groups: string[];
  attrib: {
    given_name: string;
    family_name?: string;
    email: string;
    phone_number?: string;
  };
};

export type PlayerTable = PlayerExisting[];

export type PlayerBase = {
  given_name: string;
  family_name?: string;
  email: string;
  phone_number?: string;
  user_id: string;
  groups: PlayerGet["groups"];
  accessToken: string;
};

export type PlayerCreate = Omit<PlayerBase, "user_id" | "accessToken">;

export type PlayerExisting = Omit<PlayerBase, "accessToken">;

export type PlayerModifySelf = PlayerBase;

export type Player = PlayerCreate | PlayerExisting | PlayerModifySelf;
