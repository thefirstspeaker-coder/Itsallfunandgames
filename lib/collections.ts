import { Game } from "@/lib/types";

export type GameCollection = {
  id: string;
  title: string;
  description: string;
  matches: (game: Game) => boolean;
};

const includesAny = (value: string | undefined | null, terms: string[]) => {
  const text = (value ?? "").toLowerCase();
  return terms.some((term) => text.includes(term));
};

const listIncludesAny = (list: string[] | undefined, terms: string[]) =>
  (list ?? []).some((item) => includesAny(item, terms));

const parseLargeGroupHint = (value: string | undefined | null) => {
  if (!value) return false;
  if (value.includes("+")) {
    const numeric = Number.parseInt(value, 10);
    return Number.isFinite(numeric) && numeric >= 8;
  }
  return includesAny(value, ["large", "whole class", "big group", "group"]);
};

const noEquipmentSignals = ["none", "no equipment", "nothing", "n/a", "na", "not required"];

export const GAME_COLLECTIONS: GameCollection[] = [
  {
    id: "quick-wins",
    title: "Quick wins",
    description: "Low-prep activities that are easy to start.",
    matches: (game) => {
      const prep = game.prepLevel?.toLowerCase() ?? "";
      const easyPrep = ["little", "low", "none", "minimal", "unknown"].some((key) => prep.includes(key));
      const simpleEquipment = !game.equipment || includesAny(game.equipment, noEquipmentSignals);
      return easyPrep || simpleEquipment;
    },
  },
  {
    id: "moving",
    title: "Get them moving",
    description: "Physical activity and movement-focused games.",
    matches: (game) =>
      includesAny(game.category, ["physical", "active", "outdoor", "wide"]) ||
      listIncludesAny(game.tags, ["run", "movement", "tag", "active", "wide"]) ||
      listIncludesAny(game.skillsDeveloped, ["agility", "coordination", "fitness"]),
  },
  {
    id: "calm-room",
    title: "Calm the room",
    description: "Quieter, lower-energy games for focus.",
    matches: (game) =>
      listIncludesAny(game.tags, ["listening", "focus", "calm", "quiet", "classroom"]) ||
      listIncludesAny(game.skillsDeveloped, ["focus", "listening", "self regulation", "patience"]) ||
      includesAny(game.description, ["quiet", "calm", "listen", "focus"]),
  },
  {
    id: "no-equipment",
    title: "No equipment needed",
    description: "Games that can run with little or no gear.",
    matches: (game) => !game.equipment || includesAny(game.equipment, noEquipmentSignals),
  },
  {
    id: "big-groups",
    title: "Best for big groups",
    description: "Suitable for larger groups and whole-class play.",
    matches: (game) =>
      game.playersMax === null ||
      (typeof game.playersMax === "number" && game.playersMax >= 10) ||
      parseLargeGroupHint(game.recommendedPlayersText),
  },
  {
    id: "listening-reaction",
    title: "Listening and reaction games",
    description: "Attention, reaction, and fast-response activities.",
    matches: (game) =>
      listIncludesAny(game.skillsDeveloped, ["listening", "reaction", "coordination", "spatial awareness", "attention"]) ||
      listIncludesAny(game.tags, ["listening", "reaction", "reflex", "quick", "signal"]) ||
      includesAny(game.description, ["listen", "signal", "react", "response"]),
  },
  {
    id: "teamwork",
    title: "Teamwork games",
    description: "Games that build collaboration and communication.",
    matches: (game) =>
      listIncludesAny(game.skillsDeveloped, ["teamwork", "collaboration", "communication"]) ||
      listIncludesAny(game.tags, ["team", "cooperative", "collaboration"]) ||
      includesAny(game.description, ["team", "together", "collaborate"]),
  },
];

export const getMatchingGamesForCollection = (games: Game[], collectionId: string) => {
  const collection = GAME_COLLECTIONS.find((item) => item.id === collectionId);
  if (!collection) return [];
  return games.filter(collection.matches);
};
