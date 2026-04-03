import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DayId, Product, StatsByDay } from './types';

const PRODUCTS_KEY = 'products_v2';
const STATS_KEY = 'stats_by_day_v2';
const SELECTED_DAY_KEY = 'selected_day_v2';
const THEME_MODE_KEY = 'theme_mode_v1';

export const DEFAULT_STATS: StatsByDay = {
  1: [],
  2: [],
  3: [],
};

const ALL_DAYS: DayId[] = [1, 2, 3];

function normalizeDays(value: unknown): DayId[] {
  if (!Array.isArray(value)) {
    return [...ALL_DAYS];
  }

  const normalized = value
    .map((entry) => Number(entry))
    .filter((entry): entry is DayId => entry === 1 || entry === 2 || entry === 3);

  return normalized.length > 0 ? Array.from(new Set(normalized)) : [...ALL_DAYS];
}

export async function loadProducts(): Promise<Product[]> {
  const raw = await AsyncStorage.getItem(PRODUCTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry): Product | null => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }

        const source = entry as Partial<Product> & { includeInStats?: unknown; availableDays?: unknown };
        if (typeof source.id !== 'number' || typeof source.name !== 'string' || typeof source.price !== 'number') {
          return null;
        }

        return {
          id: source.id,
          sortOrder: typeof source.sortOrder === 'number' ? source.sortOrder : source.id,
          name: source.name,
          price: source.price,
          imageUri: typeof source.imageUri === 'string' ? source.imageUri : undefined,
          includeInStats: typeof source.includeInStats === 'boolean' ? source.includeInStats : true,
          availableDays: normalizeDays(source.availableDays),
        };
      })
      .filter((entry): entry is Product => entry !== null);
  } catch {
    return [];
  }
}

export async function saveProducts(products: Product[]): Promise<void> {
  await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export async function loadStats(): Promise<StatsByDay> {
  const raw = await AsyncStorage.getItem(STATS_KEY);
  if (!raw) {
    return DEFAULT_STATS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StatsByDay>;
    return {
      1: parsed[1] ?? [],
      2: parsed[2] ?? [],
      3: parsed[3] ?? [],
    };
  } catch {
    return DEFAULT_STATS;
  }
}

export async function saveStats(statsByDay: StatsByDay): Promise<void> {
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(statsByDay));
}

export async function loadSelectedDay(): Promise<DayId> {
  const raw = await AsyncStorage.getItem(SELECTED_DAY_KEY);
  if (!raw) {
    return 1;
  }

  const value = Number(raw);
  if (value === 1 || value === 2 || value === 3) {
    return value;
  }

  return 1;
}

export async function saveSelectedDay(day: DayId): Promise<void> {
  await AsyncStorage.setItem(SELECTED_DAY_KEY, String(day));
}

export type ThemeMode = 'light' | 'dark';

export async function loadThemeMode(): Promise<ThemeMode> {
  const raw = await AsyncStorage.getItem(THEME_MODE_KEY);
  return raw === 'dark' ? 'dark' : 'light';
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(THEME_MODE_KEY, mode);
}
