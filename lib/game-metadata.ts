import { Game } from "@/lib/types";
import { prettifyFilterValue } from "@/lib/utils";
import { Baby, Sparkles, Tag, Users, Wrench, type LucideIcon } from "lucide-react";

export type MetadataType = "players" | "age" | "prep" | "category" | "equipment" | "skill" | "tag";

export type MetadataToken = {
  id: string;
  type: MetadataType;
  value: string;
  label: string;
  Icon: LucideIcon;
  tone: string;
};

const toRange = (min?: number | null, max?: number | null) => {
  if (typeof min === "number" && typeof max === "number") return `${min}–${max}`;
  if (typeof min === "number") return `${min}+`;
  if (typeof max === "number") return `Up to ${max}`;
  return null;
};

const makeToken = (type: MetadataType, value: string, label: string, Icon: LucideIcon, tone: string): MetadataToken => ({
  id: `${type}:${value}`,
  type,
  value,
  label,
  Icon,
  tone,
});

export const getGameMetadataTokens = (game: Game): MetadataToken[] => {
  const tokens: MetadataToken[] = [];

  const players = toRange(game.playersMin, game.playersMax);
  if (players) tokens.push(makeToken("players", players, players, Users, "bg-cyan-500/25 text-cyan-900 border-cyan-300/50"));

  const ages = toRange(game.ageMin, game.ageMax);
  if (ages) tokens.push(makeToken("age", ages, ages, Baby, "bg-violet-500/25 text-violet-900 border-violet-300/50"));

  if (game.prepLevel) tokens.push(makeToken("prep", game.prepLevel, prettifyFilterValue(game.prepLevel), Wrench, "bg-amber-500/25 text-amber-900 border-amber-300/50"));

  if (game.category) tokens.push(makeToken("category", game.category, prettifyFilterValue(game.category), Sparkles, "bg-emerald-500/25 text-emerald-900 border-emerald-300/50"));

  if (game.equipment) tokens.push(makeToken("equipment", "equipment-needed", "Equipment needed", Wrench, "bg-rose-500/25 text-rose-900 border-rose-300/50"));

  (game.skillsDeveloped || []).forEach((skill) => {
    tokens.push(makeToken("skill", skill, prettifyFilterValue(skill), Sparkles, "bg-indigo-500/25 text-indigo-900 border-indigo-300/50"));
  });

  (game.tags || []).forEach((tag) => {
    tokens.push(makeToken("tag", tag, prettifyFilterValue(tag), Tag, "bg-teal-500/25 text-teal-900 border-teal-300/50"));
  });

  return tokens;
};
