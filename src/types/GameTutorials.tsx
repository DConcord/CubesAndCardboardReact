// https://betterprogramming.pub/5-recipes-for-setting-default-props-in-react-typescript-b52d8b6a842c
export type GameTutorial = {
  bgg_id: number;
  game: string;
  url: string;
};

export type GameTutorials = {
  [key: number]: GameTutorial;
};

export type GameTutorialTable = GameTutorial[];

export type GameTutorialTask = "Create" | "Modify" | "Delete";
