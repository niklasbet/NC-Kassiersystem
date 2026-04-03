import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DayDefinition, DayId, Product, StatsByDay } from './types';

const PRODUCTS_KEY = 'products_v2';
const STATS_KEY = 'stats_by_day_v2';
const SELECTED_DAY_KEY = 'selected_day_v2';
const THEME_MODE_KEY = 'theme_mode_v1';
const STATS_PASSCODE_KEY = 'stats_passcode_v1';
const DAY_DEFINITIONS_KEY = 'day_definitions_v1';

export const DEFAULT_DAY_DEFINITIONS: DayDefinition[] = [
  { id: 1, label: 'Tag 1', dates: [] },
  { id: 2, label: 'Tag 2', dates: [] },
  { id: 3, label: 'Tag 3', dates: [] },
];

export const DEFAULT_STATS: StatsByDay = {};

function normalizeDays(value: unknown): DayId[] {
  if (!Array.isArray(value)) {
    return DEFAULT_DAY_DEFINITIONS.map((entry) => entry.id);
  }

  const normalized = value
    .map((entry) => Number(entry))
    .filter((entry): entry is DayId => Number.isInteger(entry) && entry > 0);

  return normalized.length > 0 ? Array.from(new Set(normalized)) : DEFAULT_DAY_DEFINITIONS.map((entry) => entry.id);
}

function normalizeDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  return value;
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
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') {
      return DEFAULT_STATS;
    }
    const normalized: StatsByDay = {};
    Object.entries(parsed).forEach(([key, value]) => {
      const dayId = Number(key);
      if (!Number.isInteger(dayId) || dayId <= 0) {
        return;
      }
      normalized[dayId] = Array.isArray(value) ? (value as StatsByDay[DayId]) : [];
    });
    return normalized;
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
  if (Number.isInteger(value) && value > 0) {
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

export async function loadStatsPasscode(): Promise<string> {
  const raw = await AsyncStorage.getItem(STATS_PASSCODE_KEY);
  if (!raw || raw.trim().length === 0) {
    return '0000';
  }
  return raw;
}

export async function saveStatsPasscode(passcode: string): Promise<void> {
  await AsyncStorage.setItem(STATS_PASSCODE_KEY, passcode);
}

export async function loadDayDefinitions(): Promise<DayDefinition[]> {
  const raw = await AsyncStorage.getItem(DAY_DEFINITIONS_KEY);
  if (!raw) {
    return DEFAULT_DAY_DEFINITIONS;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return DEFAULT_DAY_DEFINITIONS;
    }
    const normalized = parsed
      .map((entry): DayDefinition | null => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }
        const source = entry as Partial<DayDefinition>;
        const id = Number(source.id);
        if (!Number.isInteger(id) || id <= 0) {
          return null;
        }
        const label = typeof source.label === 'string' && source.label.trim().length > 0
          ? source.label.trim()
          : `Tag ${id}`;
        const dates = Array.isArray(source.dates)
          ? Array.from(
              new Set(
                source.dates
                  .map((date) => (typeof date === 'string' ? normalizeDate(date.trim()) : null))
                  .filter((date): date is string => Boolean(date)),
              ),
            )
          : [];
        return { id, label, dates };
      })
      .filter((entry): entry is DayDefinition => entry !== null)
      .sort((a, b) => a.id - b.id);

    return normalized.length > 0 ? normalized : DEFAULT_DAY_DEFINITIONS;
  } catch {
    return DEFAULT_DAY_DEFINITIONS;
  }
}

export async function saveDayDefinitions(dayDefinitions: DayDefinition[]): Promise<void> {
  await AsyncStorage.setItem(DAY_DEFINITIONS_KEY, JSON.stringify(dayDefinitions));
}

export function resolveDayFromDate(dayDefinitions: DayDefinition[], date: Date): DayId | null {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const isoDate = `${year}-${month}-${day}`;
  const match = dayDefinitions.find((entry) => entry.dates.includes(isoDate));
  return match?.id ?? null;
}
