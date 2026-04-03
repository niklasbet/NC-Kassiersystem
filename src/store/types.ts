export type DayId = 1 | 2 | 3;

export type Product = {
  id: number;
  sortOrder: number;
  name: string;
  price: number;
  imageUri?: string;
  includeInStats: boolean;
  availableDays: DayId[];
};

export type BillItems = Record<number, number>;

export type BillRecord = {
  id: number;
  datetime: string;
  items: BillItems;
  total: number;
};

export type StatsByDay = Record<DayId, BillRecord[]>;
