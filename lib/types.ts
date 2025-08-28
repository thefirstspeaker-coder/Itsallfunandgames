// lib/types.ts
import { z } from 'zod';

export const GameSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  ageMin: z.number().int().nullable().optional(),
  ageMax: z.number().int().nullable().optional(),
  playersMin: z.number().int().nullable().optional(),
  playersMax: z.number().int().nullable().optional(),
  recommendedPlayersText: z.string().nullable().optional(),
  equipment: z.string().nullable().optional(),
  generalRules: z.array(z.string()).default([]),
  variations: z.array(z.string()).default([]),
  skillsDeveloped: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  regionalPopularity: z.array(z.string()).default([]),
  regionalNames: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  traditionality: z.string().nullable().optional(),
  historicalNotes: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  relatedGames: z.array(z.string()).default([]),
  links: z.array(z.string()).default([]),
  prepLevel: z.string().nullable().optional(),
});

export type Game = z.infer<typeof GameSchema>;