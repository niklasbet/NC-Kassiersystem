import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_DAY_DEFINITIONS,
  DEFAULT_STATS,
  loadDayDefinitions,
  loadProducts,
  loadSelectedDay,
  loadStats,
  loadThemeMode,
  resolveDayFromDate,
  saveDayDefinitions,
  saveProducts,
  saveSelectedDay,
  saveStats,
  saveThemeMode,
  type ThemeMode,
} from './storage';
import type { BillItems, BillRecord, DayDefinition, DayId, Product, StatsByDay } from './types';

type ProductInput = {
  name: string;
  price: number;
  availableDays: DayId[];
};

type AppDataContextType = {
  isReady: boolean;
  products: Product[];
  dayDefinitions: DayDefinition[];
  selectedDay: DayId;
  todayResolvedDay: DayId | null;
  hasTodayConfiguredDay: boolean;
  themeMode: ThemeMode;
  bills: BillRecord[];
  billsByDay: StatsByDay;
  setSelectedDay: (day: DayId) => Promise<void>;
  setDayDefinitions: (dayDefinitions: DayDefinition[]) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleThemeMode: () => Promise<void>;
  upsertProduct: (input: ProductInput, id?: number) => Promise<void>;
  removeProduct: (id: number) => Promise<void>;
  toggleProductStats: (id: number) => Promise<void>;
  setProductAvailability: (id: number, availableDays: DayId[]) => Promise<void>;
  updateProductImage: (id: number, imageUri?: string) => Promise<void>;
  moveProduct: (id: number, direction: 'up' | 'down') => Promise<void>;
  reorderProducts: (orderedIds: number[]) => Promise<void>;
  addBill: (items: BillItems) => Promise<void>;
  removeBill: (id: number) => Promise<void>;
  resetDayStats: () => Promise<void>;
  replaceDayStats: (day: DayId, bills: BillRecord[]) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

function buildBillTotal(items: BillItems, products: Product[]): number {
  return Object.entries(items).reduce((sum, [productIdRaw, quantity]) => {
    const productId = Number(productIdRaw);
    const product = products.find((entry) => entry.id === productId);

    if (!product || quantity <= 0) {
      return sum;
    }

    return sum + product.price * quantity;
  }, 0);
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [dayDefinitions, setDayDefinitionsState] = useState<DayDefinition[]>(DEFAULT_DAY_DEFINITIONS);
  const [selectedDay, setSelectedDayState] = useState<DayId>(1);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [statsByDay, setStatsByDay] = useState<StatsByDay>(DEFAULT_STATS);
  const todayResolvedDay = useMemo(() => resolveDayFromDate(dayDefinitions, new Date()), [dayDefinitions]);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      const [storedProducts, storedStats, storedDay, storedThemeMode, storedDayDefinitions] = await Promise.all([
        loadProducts(),
        loadStats(),
        loadSelectedDay(),
        loadThemeMode(),
        loadDayDefinitions(),
      ]);

      if (!mounted) {
        return;
      }

      const activeDayDefinitions = storedDayDefinitions.length > 0 ? storedDayDefinitions : DEFAULT_DAY_DEFINITIONS;
      const autoDay = resolveDayFromDate(activeDayDefinitions, new Date());
      const hasStoredDay = activeDayDefinitions.some((entry) => entry.id === storedDay);
      const fallbackDay = activeDayDefinitions[0]?.id ?? 1;
      const nextSelectedDay = autoDay ?? (hasStoredDay ? storedDay : fallbackDay);

      setProducts(storedProducts);
      setStatsByDay(storedStats);
      setDayDefinitionsState(activeDayDefinitions);
      setSelectedDayState(nextSelectedDay);
      setThemeModeState(storedThemeMode);
      setIsReady(true);

      if (nextSelectedDay !== storedDay) {
        await saveSelectedDay(nextSelectedDay);
      }
    };

    void hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  const setSelectedDay = useCallback(async (day: DayId) => {
    setSelectedDayState(day);
    await saveSelectedDay(day);
  }, []);

  const setDayDefinitions = useCallback(async (nextDefinitions: DayDefinition[]) => {
    const normalized = nextDefinitions
      .map((entry) => ({
        id: entry.id,
        label: entry.label.trim() || `Tag ${entry.id}`,
        dates: Array.from(new Set(entry.dates)),
      }))
      .filter((entry) => Number.isInteger(entry.id) && entry.id > 0)
      .sort((a, b) => a.id - b.id);

    if (normalized.length === 0) {
      return;
    }

    const autoDay = resolveDayFromDate(normalized, new Date());
    const fallbackDay = normalized[0].id;
    const currentStillValid = normalized.some((entry) => entry.id === selectedDay);
    const nextSelectedDay = autoDay ?? (currentStillValid ? selectedDay : fallbackDay);

    setDayDefinitionsState(normalized);
    setSelectedDayState(nextSelectedDay);
    await Promise.all([saveDayDefinitions(normalized), saveSelectedDay(nextSelectedDay)]);
  }, [selectedDay]);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await saveThemeMode(mode);
  }, []);

  const toggleThemeMode = useCallback(async () => {
    const nextMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeModeState(nextMode);
    await saveThemeMode(nextMode);
  }, [themeMode]);

  const upsertProduct = useCallback(async (input: ProductInput, id?: number) => {
    const normalizedName = input.name.trim();
    const validDayIds = new Set(dayDefinitions.map((entry) => entry.id));
    const normalizedDays = Array.from(new Set(input.availableDays)).filter((day): day is DayId => validDayIds.has(day));

    if (!normalizedName || Number.isNaN(input.price) || input.price < 0 || normalizedDays.length === 0) {
      return;
    }

    const nextProducts = [...products];

    if (id !== undefined) {
      const index = nextProducts.findIndex((entry) => entry.id === id);
      if (index === -1) {
        return;
      }

      nextProducts[index] = {
        ...nextProducts[index],
        name: normalizedName,
        price: input.price,
        availableDays: normalizedDays,
      };
    } else {
      const maxId = nextProducts.reduce((max, entry) => Math.max(max, entry.id), 0);
      nextProducts.push({
        id: maxId + 1,
        sortOrder: nextProducts.length,
        name: normalizedName,
        price: input.price,
        includeInStats: true,
        availableDays: normalizedDays,
      });
    }

    setProducts(nextProducts);
    await saveProducts(nextProducts);
  }, [dayDefinitions, products]);

  const removeProduct = useCallback(async (id: number) => {
    const nextProducts = products.filter((entry) => entry.id !== id);

    const nextStats: StatsByDay = Object.fromEntries(
      Object.entries(statsByDay).map(([dayKey, dayBills]) => {
        const dayId = Number(dayKey);
        const normalizedBills = (dayBills as BillRecord[]).map((bill) => {
        const items = { ...bill.items };
        delete items[id];
        return { ...bill, items, total: buildBillTotal(items, nextProducts) };
        });
        return [dayId, normalizedBills];
      }),
    );

    setProducts(nextProducts);
    setStatsByDay(nextStats);

    await Promise.all([saveProducts(nextProducts), saveStats(nextStats)]);
  }, [products, statsByDay]);

  const toggleProductStats = useCallback(async (id: number) => {
    const nextProducts = products.map((entry) =>
      entry.id === id ? { ...entry, includeInStats: !entry.includeInStats } : entry,
    );

    setProducts(nextProducts);
    await saveProducts(nextProducts);
  }, [products]);

  const setProductAvailability = useCallback(async (id: number, availableDays: DayId[]) => {
    const validDayIds = new Set(dayDefinitions.map((entry) => entry.id));
    const normalizedDays = Array.from(new Set(availableDays)).filter((day): day is DayId => validDayIds.has(day));

    if (normalizedDays.length === 0) {
      return;
    }

    const nextProducts = products.map((entry) =>
      entry.id === id ? { ...entry, availableDays: normalizedDays } : entry,
    );

    setProducts(nextProducts);
    await saveProducts(nextProducts);
  }, [dayDefinitions, products]);

  const updateProductImage = useCallback(async (id: number, imageUri?: string) => {
    const nextProducts = products.map((entry) =>
      entry.id === id ? { ...entry, imageUri } : entry,
    );

    setProducts(nextProducts);
    await saveProducts(nextProducts);
  }, [products]);

  const moveProduct = useCallback(async (id: number, direction: 'up' | 'down') => {
    const sorted = [...products].sort((a, b) => a.sortOrder - b.sortOrder);
    const currentIndex = sorted.findIndex((entry) => entry.id === id);

    if (currentIndex < 0) {
      return;
    }

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= sorted.length) {
      return;
    }

    const temp = sorted[currentIndex];
    sorted[currentIndex] = sorted[swapIndex];
    sorted[swapIndex] = temp;

    const reindexed = sorted.map((entry, index) => ({
      ...entry,
      sortOrder: index,
    }));

    setProducts(reindexed);
    await saveProducts(reindexed);
  }, [products]);

  const reorderProducts = useCallback(async (orderedIds: number[]) => {
    if (orderedIds.length === 0 || orderedIds.length !== products.length) {
      return;
    }

    const idSet = new Set(orderedIds);
    if (idSet.size !== products.length) {
      return;
    }

    const sourceById = new Map(products.map((entry) => [entry.id, entry]));
    const nextProducts: Product[] = [];

    for (const id of orderedIds) {
      const entry = sourceById.get(id);
      if (!entry) {
        return;
      }
      nextProducts.push(entry);
    }

    const reindexed = nextProducts.map((entry, index) => ({
      ...entry,
      sortOrder: index,
    }));

    setProducts(reindexed);
    await saveProducts(reindexed);
  }, [products]);

  const addBill = useCallback(async (items: BillItems) => {
    const filteredItems: BillItems = Object.entries(items).reduce((acc, [productIdRaw, quantity]) => {
      const productId = Number(productIdRaw);
      if (quantity > 0) {
        acc[productId] = quantity;
      }
      return acc;
    }, {} as BillItems);

    if (Object.keys(filteredItems).length === 0) {
      return;
    }

    const currentBills = statsByDay[selectedDay] ?? [];
    const nextId = currentBills.reduce((max, bill) => Math.max(max, bill.id), 0) + 1;

    const bill: BillRecord = {
      id: nextId,
      datetime: new Date().toISOString(),
      items: filteredItems,
      total: buildBillTotal(filteredItems, products),
    };

    const nextStats: StatsByDay = {
      ...statsByDay,
      [selectedDay]: [...currentBills, bill],
    };

    setStatsByDay(nextStats);
    await saveStats(nextStats);
  }, [products, selectedDay, statsByDay]);

  const removeBill = useCallback(async (id: number) => {
    const currentBills = statsByDay[selectedDay] ?? [];
    const nextStats: StatsByDay = {
      ...statsByDay,
      [selectedDay]: currentBills.filter((bill) => bill.id !== id),
    };

    setStatsByDay(nextStats);
    await saveStats(nextStats);
  }, [selectedDay, statsByDay]);

  const resetDayStats = useCallback(async () => {
    const nextStats: StatsByDay = {
      ...statsByDay,
      [selectedDay]: [],
    };

    setStatsByDay(nextStats);
    await saveStats(nextStats);
  }, [selectedDay, statsByDay]);

  const replaceDayStats = useCallback(async (day: DayId, bills: BillRecord[]) => {
    const nextStats: StatsByDay = {
      ...statsByDay,
      [day]: bills,
    };

    setStatsByDay(nextStats);
    await saveStats(nextStats);
  }, [statsByDay]);

  const value = useMemo<AppDataContextType>(() => ({
    isReady,
    products,
    dayDefinitions,
    selectedDay,
    todayResolvedDay,
    hasTodayConfiguredDay: todayResolvedDay !== null,
    themeMode,
    bills: statsByDay[selectedDay] ?? [],
    billsByDay: statsByDay,
    setSelectedDay,
    setDayDefinitions,
    setThemeMode,
    toggleThemeMode,
    upsertProduct,
    removeProduct,
    toggleProductStats,
    setProductAvailability,
    updateProductImage,
    moveProduct,
    reorderProducts,
    addBill,
    removeBill,
    resetDayStats,
    replaceDayStats,
  }), [
    addBill,
    isReady,
    products,
    dayDefinitions,
    todayResolvedDay,
    removeBill,
    removeProduct,
    resetDayStats,
    replaceDayStats,
    selectedDay,
    setDayDefinitions,
    setThemeMode,
    setSelectedDay,
    statsByDay,
    themeMode,
    toggleThemeMode,
    toggleProductStats,
    setProductAvailability,
    updateProductImage,
    moveProduct,
    reorderProducts,
    upsertProduct,
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextType {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used inside AppDataProvider');
  }

  return context;
}
