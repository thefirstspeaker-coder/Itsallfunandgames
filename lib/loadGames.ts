// lib/loadGames.ts
import fs from 'fs';
import path from 'path';
import { Game, GameSchema } from './types';
import { z } from 'zod';

// Utility to slugify strings for IDs
const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Utility to normalise potentially nullish string values
const normaliseNullishString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return ['', 'null', 'null,'].includes(trimmed.toLowerCase()) ? null : trimmed;
};

// Recursive function to trim all string values in an object or array
// Add this type definition at the top of the file
type AnyObject = { [key: string]: any };

// Update the function signature and reduce accumulator
const trimStrings = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(trimStrings);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc: AnyObject, key) => {
      const value = (obj as AnyObject)[key];
      acc[key] = typeof value === 'string' ? value.trim() : trimStrings(value);
      return acc;
    }, {});
  }
  return obj;
};

// Main function to load, validate, and normalise games
export const loadGames = () => {
  // Read raw data at build time
  const filePath = path.join(process.cwd(), 'public', 'games.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const rawData: unknown[] = JSON.parse(fileContents);

  const normalisedGames: Game[] = [];
  const seenIds = new Set<string>();

  for (const rawGame of rawData) {
    const trimmedGame = trimStrings(rawGame);

    let id = trimmedGame.id || '';
    if (!id && trimmedGame.name) {
      id = slugify(trimmedGame.name);
    }

    if (!id || seenIds.has(id)) {
      // Skip duplicates or items without an identifier
      continue;
    }
    seenIds.add(id);

    // Apply normalisation rules
    const gameToNormalise = {
      ...trimmedGame,
      id,
      name: normaliseNullishString(trimmedGame.name) || '',
      description: normaliseNullishString(trimmedGame.description),
      category: normaliseNullishString(trimmedGame.category),
      prepLevel: normaliseNullishString(trimmedGame.prepLevel),
    };

    // Guard ranges
    if (
      typeof gameToNormalise.ageMin === 'number' &&
      typeof gameToNormalise.ageMax === 'number' &&
      gameToNormalise.ageMin > gameToNormalise.ageMax
    ) {
      [gameToNormalise.ageMin, gameToNormalise.ageMax] = [gameToNormalise.ageMax, gameToNormalise.ageMin];
    }
    if (
      typeof gameToNormalise.playersMin === 'number' &&
      typeof gameToNormalise.playersMax === 'number' &&
      gameToNormalise.playersMin > gameToNormalise.playersMax
    ) {
      [gameToNormalise.playersMin, gameToNormalise.playersMax] = [gameToNormalise.playersMax, gameToNormalise.playersMin];
    }

    // Validate with Zod
    const validationResult = GameSchema.safeParse(gameToNormalise);
    if (validationResult.success) {
      normalisedGames.push(validationResult.data);
    }
    // Note: We don't log errors here; the diagnostics page will handle that.
  }

  return {
    raw: rawData,
    normalised: normalisedGames,
  };
};

export const { raw: rawGames, normalised: games } = loadGames();
