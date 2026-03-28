import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

import type { BillRecord, DayId, Product, StatsByDay } from '@/app/store/types';

export type ExportFormat = 'csv' | 'json' | 'txt' | 'md';
export type ExportSection =
  | 'summary'
  | 'products'
  | 'bills'
  | 'lineItems'
  | 'hourlyRevenue'
  | 'productShare'
  | 'dayComparison'
  | 'assortment';

type ExportInput = {
  day: DayId;
  bills: BillRecord[];
  products: Product[];
  format: ExportFormat;
  sections: ExportSection[];
  billsByDay?: StatsByDay;
};

type BillLine = {
  billId: number;
  datetime: string;
  day: DayId;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  billTotal: number;
};

function getTotalItems(bills: BillRecord[]): number {
  return bills.reduce(
    (sum, bill) => sum + Object.values(bill.items).reduce((inner, qty) => inner + Math.max(0, qty), 0),
    0,
  );
}

function collectLines(day: DayId, bills: BillRecord[], products: Product[]): BillLine[] {
  const sortedBills = [...bills].sort((a, b) => (a.datetime < b.datetime ? -1 : 1));

  return sortedBills.flatMap((bill) =>
    Object.entries(bill.items)
      .filter(([, quantity]) => quantity > 0)
      .map(([productIdRaw, quantity]) => {
        const productId = Number(productIdRaw);
        const product = products.find((entry) => entry.id === productId);
        const unitPrice = product?.price ?? 0;

        return {
          billId: bill.id,
          datetime: bill.datetime,
          day,
          productId,
          productName: product?.name ?? `Produkt #${productId}`,
          quantity,
          unitPrice,
          lineTotal: unitPrice * quantity,
          billTotal: bill.total,
        };
      }),
  );
}

function getHourlyRevenue(bills: BillRecord[]) {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, revenue: 0 }));
  bills.forEach((bill) => {
    const hour = new Date(bill.datetime).getHours();
    if (hour >= 0 && hour <= 23) {
      buckets[hour].revenue += bill.total;
    }
  });
  return buckets;
}

function getProductShare(products: Product[], lines: BillLine[]) {
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const totalRevenue = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  return products.map((product) => {
    const productLines = lines.filter((line) => line.productId === product.id);
    const quantity = productLines.reduce((sum, line) => sum + line.quantity, 0);
    const revenue = productLines.reduce((sum, line) => sum + line.lineTotal, 0);
    return {
      productId: product.id,
      productName: product.name,
      quantity,
      revenue,
      quantityShare: totalQuantity > 0 ? (quantity * 100) / totalQuantity : 0,
      revenueShare: totalRevenue > 0 ? (revenue * 100) / totalRevenue : 0,
    };
  });
}

function getDayComparison(billsByDay: StatsByDay | undefined) {
  if (!billsByDay) {
    return [];
  }

  return ([1, 2, 3] as DayId[]).map((day) => {
    const dayBills = billsByDay[day] ?? [];
    return {
      day,
      orders: dayBills.length,
      items: getTotalItems(dayBills),
      revenue: dayBills.reduce((sum, bill) => sum + bill.total, 0),
    };
  });
}

function buildDataset(day: DayId, bills: BillRecord[], products: Product[], billsByDay?: StatsByDay) {
  const lines = collectLines(day, bills, products);
  const totalRevenue = bills.reduce((sum, bill) => sum + bill.total, 0);
  const totalItems = getTotalItems(bills);
  const summary = {
    day,
    generatedAt: new Date().toISOString(),
    totalOrders: bills.length,
    totalItems,
    totalRevenue,
    averageTicket: bills.length > 0 ? totalRevenue / bills.length : 0,
    averageItemsPerOrder: bills.length > 0 ? totalItems / bills.length : 0,
  };
  const hourlyRevenue = getHourlyRevenue(bills);
  const productShare = getProductShare(products, lines);
  const dayComparison = getDayComparison(billsByDay);
  const assortment = {
    activeProducts: products.filter((product) => product.availableDays.includes(day)).length,
    soldProducts: productShare.filter((entry) => entry.quantity > 0).length,
  };

  return { summary, products, bills, lines, hourlyRevenue, productShare, dayComparison, assortment };
}

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function csvTable(title: string, header: string[], rows: string[][]): string {
  const lines = [escapeCsvCell(title), header.map(escapeCsvCell).join(',')];
  rows.forEach((row) => lines.push(row.map(escapeCsvCell).join(',')));
  return lines.join('\n');
}

function toCsv(sections: ExportSection[], dataset: ReturnType<typeof buildDataset>): string {
  const blocks: string[] = [];

  if (sections.includes('summary')) {
    blocks.push(
      csvTable('summary', ['key', 'value'], Object.entries(dataset.summary).map(([key, value]) => [key, String(value)])),
    );
  }
  if (sections.includes('products')) {
    blocks.push(
      csvTable(
        'products',
        ['id', 'name', 'price', 'includeInStats', 'availableDays'],
        dataset.products.map((product) => [
          String(product.id),
          product.name,
          String(product.price),
          String(product.includeInStats),
          product.availableDays.join('|'),
        ]),
      ),
    );
  }
  if (sections.includes('bills')) {
    blocks.push(
      csvTable(
        'bills',
        ['id', 'datetime', 'total'],
        dataset.bills.map((bill) => [String(bill.id), bill.datetime, bill.total.toFixed(2)]),
      ),
    );
  }
  if (sections.includes('lineItems')) {
    blocks.push(
      csvTable(
        'line_items',
        ['day', 'billId', 'datetime', 'productId', 'productName', 'quantity', 'unitPrice', 'lineTotal', 'billTotal'],
        dataset.lines.map((line) => [
          String(line.day),
          String(line.billId),
          line.datetime,
          String(line.productId),
          line.productName,
          String(line.quantity),
          line.unitPrice.toFixed(2),
          line.lineTotal.toFixed(2),
          line.billTotal.toFixed(2),
        ]),
      ),
    );
  }
  if (sections.includes('hourlyRevenue')) {
    blocks.push(
      csvTable(
        'hourly_revenue',
        ['hour', 'revenue'],
        dataset.hourlyRevenue.map((entry) => [String(entry.hour), entry.revenue.toFixed(2)]),
      ),
    );
  }
  if (sections.includes('productShare')) {
    blocks.push(
      csvTable(
        'product_share',
        ['productId', 'productName', 'quantity', 'revenue', 'quantityShare', 'revenueShare'],
        dataset.productShare.map((entry) => [
          String(entry.productId),
          entry.productName,
          String(entry.quantity),
          entry.revenue.toFixed(2),
          entry.quantityShare.toFixed(2),
          entry.revenueShare.toFixed(2),
        ]),
      ),
    );
  }
  if (sections.includes('dayComparison')) {
    blocks.push(
      csvTable(
        'day_comparison',
        ['day', 'orders', 'items', 'revenue'],
        dataset.dayComparison.map((entry) => [
          String(entry.day),
          String(entry.orders),
          String(entry.items),
          entry.revenue.toFixed(2),
        ]),
      ),
    );
  }
  if (sections.includes('assortment')) {
    blocks.push(
      csvTable('assortment', ['key', 'value'], [
        ['activeProducts', String(dataset.assortment.activeProducts)],
        ['soldProducts', String(dataset.assortment.soldProducts)],
      ]),
    );
  }

  return blocks.join('\n\n');
}

function toJson(sections: ExportSection[], dataset: ReturnType<typeof buildDataset>): string {
  const payload: Record<string, unknown> = {};
  sections.forEach((section) => {
    if (section === 'lineItems') {
      payload.lineItems = dataset.lines;
      return;
    }
    payload[section] = dataset[section];
  });
  return JSON.stringify(payload, null, 2);
}

function toTxt(sections: ExportSection[], dataset: ReturnType<typeof buildDataset>): string {
  const lines: string[] = [];
  if (sections.includes('summary')) {
    lines.push('== Summary ==');
    Object.entries(dataset.summary).forEach(([key, value]) => lines.push(`${key}: ${value}`));
    lines.push('');
  }
  if (sections.includes('products')) {
    lines.push('== Products ==');
    dataset.products.forEach((product) => lines.push(`${product.id} | ${product.name} | ${product.price.toFixed(2)} EUR`));
    lines.push('');
  }
  if (sections.includes('bills')) {
    lines.push('== Bills ==');
    dataset.bills.forEach((bill) => lines.push(`${bill.id} | ${bill.datetime} | ${bill.total.toFixed(2)} EUR`));
    lines.push('');
  }
  if (sections.includes('lineItems')) {
    lines.push('== Line Items ==');
    dataset.lines.forEach((line) =>
      lines.push(`${line.datetime} | ${line.quantity}x ${line.productName} | ${line.lineTotal.toFixed(2)} EUR`),
    );
    lines.push('');
  }
  if (sections.includes('hourlyRevenue')) {
    lines.push('== Hourly Revenue ==');
    dataset.hourlyRevenue.forEach((entry) => lines.push(`${entry.hour}:00 | ${entry.revenue.toFixed(2)} EUR`));
    lines.push('');
  }
  if (sections.includes('productShare')) {
    lines.push('== Product Share ==');
    dataset.productShare.forEach((entry) =>
      lines.push(
        `${entry.productName} | Menge: ${entry.quantity} (${entry.quantityShare.toFixed(1)}%) | Umsatz: ${entry.revenue.toFixed(2)} EUR (${entry.revenueShare.toFixed(1)}%)`,
      ),
    );
    lines.push('');
  }
  if (sections.includes('dayComparison')) {
    lines.push('== Day Comparison ==');
    dataset.dayComparison.forEach((entry) =>
      lines.push(`Tag ${entry.day}: ${entry.orders} Bestellungen, ${entry.items} Artikel, ${entry.revenue.toFixed(2)} EUR`),
    );
    lines.push('');
  }
  if (sections.includes('assortment')) {
    lines.push('== Assortment ==');
    lines.push(`Aktive Produkte: ${dataset.assortment.activeProducts}`);
    lines.push(`Verkaufte Produkte: ${dataset.assortment.soldProducts}`);
  }
  return lines.join('\n');
}

function toMarkdown(sections: ExportSection[], dataset: ReturnType<typeof buildDataset>): string {
  const parts: string[] = ['# Statistikexport', ''];

  if (sections.includes('summary')) {
    parts.push('## Summary');
    Object.entries(dataset.summary).forEach(([key, value]) => parts.push(`- ${key}: ${value}`));
    parts.push('');
  }
  if (sections.includes('products')) {
    parts.push('## Products');
    parts.push('| ID | Name | Preis | Statistik | Tage |');
    parts.push('| --- | --- | ---: | --- | --- |');
    dataset.products.forEach((product) =>
      parts.push(`| ${product.id} | ${product.name} | ${product.price.toFixed(2)} | ${product.includeInStats} | ${product.availableDays.join(',')} |`),
    );
    parts.push('');
  }
  if (sections.includes('bills')) {
    parts.push('## Bills');
    parts.push('| ID | Zeitpunkt | Total |');
    parts.push('| --- | --- | ---: |');
    dataset.bills.forEach((bill) => parts.push(`| ${bill.id} | ${bill.datetime} | ${bill.total.toFixed(2)} |`));
    parts.push('');
  }
  if (sections.includes('lineItems')) {
    parts.push('## Line Items');
    parts.push('| Bill | Zeitpunkt | Produkt | Menge | Zeile |');
    parts.push('| --- | --- | --- | ---: | ---: |');
    dataset.lines.forEach((line) =>
      parts.push(`| ${line.billId} | ${line.datetime} | ${line.productName} | ${line.quantity} | ${line.lineTotal.toFixed(2)} |`),
    );
    parts.push('');
  }
  if (sections.includes('hourlyRevenue')) {
    parts.push('## Hourly Revenue');
    parts.push('| Stunde | Umsatz |');
    parts.push('| --- | ---: |');
    dataset.hourlyRevenue.forEach((entry) => parts.push(`| ${entry.hour}:00 | ${entry.revenue.toFixed(2)} |`));
    parts.push('');
  }
  if (sections.includes('productShare')) {
    parts.push('## Product Share');
    parts.push('| Produkt | Menge | Umsatz | Anteil Menge | Anteil Umsatz |');
    parts.push('| --- | ---: | ---: | ---: | ---: |');
    dataset.productShare.forEach((entry) =>
      parts.push(`| ${entry.productName} | ${entry.quantity} | ${entry.revenue.toFixed(2)} | ${entry.quantityShare.toFixed(1)}% | ${entry.revenueShare.toFixed(1)}% |`),
    );
    parts.push('');
  }
  if (sections.includes('dayComparison')) {
    parts.push('## Day Comparison');
    parts.push('| Tag | Bestellungen | Artikel | Umsatz |');
    parts.push('| --- | ---: | ---: | ---: |');
    dataset.dayComparison.forEach((entry) =>
      parts.push(`| ${entry.day} | ${entry.orders} | ${entry.items} | ${entry.revenue.toFixed(2)} |`),
    );
    parts.push('');
  }
  if (sections.includes('assortment')) {
    parts.push('## Assortment');
    parts.push(`- Aktive Produkte: ${dataset.assortment.activeProducts}`);
    parts.push(`- Verkaufte Produkte: ${dataset.assortment.soldProducts}`);
    parts.push('');
  }

  return parts.join('\n');
}

function buildExport(format: ExportFormat, sections: ExportSection[], dataset: ReturnType<typeof buildDataset>): string {
  if (format === 'csv') {
    return toCsv(sections, dataset);
  }
  if (format === 'json') {
    return toJson(sections, dataset);
  }
  if (format === 'md') {
    return toMarkdown(sections, dataset);
  }
  return toTxt(sections, dataset);
}

export async function exportStatsReport({
  day,
  bills,
  products,
  format,
  sections,
  billsByDay,
}: ExportInput): Promise<void> {
  if (sections.length === 0) {
    throw new Error('Bitte mindestens einen Datenblock auswählen.');
  }

  const dataset = buildDataset(day, bills, products, billsByDay);
  const content = buildExport(format, sections, dataset);

  if (Platform.OS === 'web') {
    await Share.share({ message: content });
    return;
  }

  const directory = FileSystem.documentDirectory;
  if (!directory) {
    throw new Error('Kein Export-Verzeichnis verfügbar.');
  }

  const filename = `stats-tag-${day}-${new Date().toISOString().replace(/[:.]/g, '-')}.${format}`;
  const uri = `${directory}${filename}`;

  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Teilen ist auf diesem Gerät nicht verfügbar.');
  }

  await Sharing.shareAsync(uri, {
    mimeType:
      format === 'json'
        ? 'application/json'
        : format === 'csv'
          ? 'text/csv'
          : format === 'md'
            ? 'text/markdown'
            : 'text/plain',
    dialogTitle: `Statistik Tag ${day} exportieren`,
  });
}
