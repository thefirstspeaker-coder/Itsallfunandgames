// lib/loadGames.ts
import fs from 'fs';
import path from 'path';
import { Game, GameSchema } from './types';

// Utility to slugify strings for IDs
export const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Utility to normalise potentially nullish string values
export const normaliseNullishString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return ['', 'null', 'null,'].includes(trimmed.toLowerCase()) ? null : trimmed;
};

// This function uses generics to provide type safety, avoiding `any`.
export const trimStrings = <T>(obj: T): T => {
  if (Array.isArray(obj)) {
    // We can safely cast here as we are preserving the array structure.
    return obj.map(trimStrings) as T;
  }
  if (obj !== null && typeof obj === 'object') {
    // The initial value `{}` is cast to T, and we use Record<string, unknown>
    // for safe property access within the reducer.
    return Object.keys(obj).reduce((acc, key) => {
      const value = (obj as Record<string, unknown>)[key];
      (acc as Record<string, unknown>)[key] =
        typeof value === 'string' ? value.trim() : trimStrings(value);
      return acc;
    }, {} as T);
  }
  return obj;
};

type UnknownRecord = Record<string, unknown>;

// Main function to load, validate, and normalise games
export const loadGames = () => {
  // Read raw data at build time
  const filePath = path.join(process.cwd(), 'public', 'games.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');

  let rawData: unknown[];
  try {
    rawData = JSON.parse(fileContents) as unknown[];
  } catch (err) {
    throw new Error(`Invalid JSON in games.json: ${(err as Error).message}`);
  }

  const normalisedGames: Game[] = [];
  const seenIds = new Set<string>();

  for (const rawGame of rawData) {
    const trimmedGame = trimStrings(rawGame) as UnknownRecord;

    // Safe reads
    const name = typeof trimmedGame.name === 'string' ? trimmedGame.name : undefined;
    
    // Changed 'let' to 'const' as 'id' is not reassigned.
    const id =
      typeof trimmedGame.id === 'string'
        ? trimmedGame.id
        : name
        ? slugify(name)
        : '';

    // Skip if no ID or duplicate
    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);

    // Pull possibly-numeric fields with guards
    const ageMinRaw = typeof trimmedGame.ageMin === 'number' ? trimmedGame.ageMin : undefined;
    const ageMaxRaw = typeof trimmedGame.ageMax === 'number' ? trimmedGame.ageMax : undefined;
    const playersMinRaw =
      typeof trimmedGame.playersMin === 'number' ? trimmedGame.playersMin : undefined;
    const playersMaxRaw =
      typeof trimmedGame.playersMax === 'number' ? trimmedGame.playersMax : undefined;

    // Guard ranges (swap if reversed)
    let ageMin = ageMinRaw;
    let ageMax = ageMaxRaw;
    if (typeof ageMin === 'number' && typeof ageMax === 'number' && ageMin > ageMax) {
      [ageMin, ageMax] = [ageMax, ageMin];
    }

    let playersMin = playersMinRaw;
    let playersMax = playersMaxRaw;
    if (
      typeof playersMin === 'number' &&
      typeof playersMax === 'number' &&
      playersMin > playersMax
    ) {
      [playersMin, playersMax] = [playersMax, playersMin];
    }

    // String-likes
    const descriptionStr =
      typeof trimmedGame.description === 'string' ? trimmedGame.description : null;
    const categoryStr =
      typeof trimmedGame.category === 'string' ? trimmedGame.category : null;
    const prepLevelStr =
      typeof trimmedGame.prepLevel === 'string' ? trimmedGame.prepLevel : null;

    // Apply normalisation rules
    const gameToNormalise: UnknownRecord = {
      ...trimmedGame,
      id,
      name: normaliseNullishString(name) || '',
      description: normaliseNullishString(descriptionStr),
      category: normaliseNullishString(categoryStr),
      prepLevel: normaliseNullishString(prepLevelStr),
      ageMin,
      ageMax,
      playersMin,
      playersMax,
    };

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
