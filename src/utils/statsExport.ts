import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';
import * as XLSX from 'xlsx';

import type { BillRecord, DayId, Product, StatsByDay } from '@/src/store/types';

export type ExportFormat = 'csv' | 'json' | 'txt' | 'md' | 'pdf' | 'xlsx';
export type ExportSection =
  | 'summary'
  | 'products'
  | 'bills'
  | 'lineItems'
  | 'hourlyRevenue'
  | 'productShare'
  | 'dayComparison';

type ExportInput = {
  selectedDays: DayId[];
  products: Product[];
  format: ExportFormat;
  sections: ExportSection[];
  billsByDay: StatsByDay;
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

type DayDataset = {
  day: DayId;
  summary: {
    day: DayId;
    generatedAt: string;
    totalOrders: number;
    totalItems: number;
    totalRevenue: number;
    averageTicket: number;
    averageItemsPerOrder: number;
  };
  bills: BillRecord[];
  lines: BillLine[];
  hourlyRevenue: { hour: number; revenue: number }[];
  productShare: {
    productId: number;
    productName: string;
    quantity: number;
    revenue: number;
    quantityShare: number;
    revenueShare: number;
  }[];
};

const currencyFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const numberFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });
const percentFormatter = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dateTimeFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return dateTimeFormatter.format(parsed);
}

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

function buildDayDataset(day: DayId, products: Product[], billsByDay: StatsByDay): DayDataset {
  const bills = billsByDay[day] ?? [];
  const lines = collectLines(day, bills, products);
  const totalRevenue = bills.reduce((sum, bill) => sum + bill.total, 0);
  const totalItems = getTotalItems(bills);

  return {
    day,
    summary: {
      day,
      generatedAt: new Date().toISOString(),
      totalOrders: bills.length,
      totalItems,
      totalRevenue,
      averageTicket: bills.length > 0 ? totalRevenue / bills.length : 0,
      averageItemsPerOrder: bills.length > 0 ? totalItems / bills.length : 0,
    },
    bills,
    lines,
    hourlyRevenue: getHourlyRevenue(bills),
    productShare: getProductShare(products, lines),
  };
}

function buildDayComparison(selectedDays: DayId[], billsByDay: StatsByDay) {
  return selectedDays.map((day) => {
    const dayBills = billsByDay[day] ?? [];
    return {
      day,
      orders: dayBills.length,
      items: getTotalItems(dayBills),
      revenue: dayBills.reduce((sum, bill) => sum + bill.total, 0),
    };
  });
}

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function csvTable(title: string, header: string[], rows: string[][]): string {
  const lines = [escapeCsvCell(title), header.map(escapeCsvCell).join(',')];
  rows.forEach((row) => lines.push(row.map(escapeCsvCell).join(',')));
  return lines.join('\n');
}

function toCsv(sections: ExportSection[], products: Product[], dayData: DayDataset[], dayComparison: ReturnType<typeof buildDayComparison>): string {
  const blocks: string[] = [];

  if (sections.includes('summary')) {
    blocks.push(
      csvTable(
        'summary',
        ['day', 'totalOrders', 'totalItems', 'totalRevenue', 'averageTicket', 'averageItemsPerOrder'],
        dayData.map((entry) => [
          String(entry.day),
          String(entry.summary.totalOrders),
          String(entry.summary.totalItems),
          entry.summary.totalRevenue.toFixed(2),
          entry.summary.averageTicket.toFixed(2),
          entry.summary.averageItemsPerOrder.toFixed(2),
        ]),
      ),
    );
  }
  if (sections.includes('products')) {
    blocks.push(
      csvTable(
        'products',
        ['id', 'name', 'price', 'includeInStats', 'availableDays'],
        products.map((product) => [
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
        ['day', 'id', 'datetime', 'total'],
        dayData.flatMap((entry) =>
          entry.bills.map((bill) => [String(entry.day), String(bill.id), bill.datetime, bill.total.toFixed(2)]),
        ),
      ),
    );
  }
  if (sections.includes('lineItems')) {
    blocks.push(
      csvTable(
        'line_items',
        ['day', 'billId', 'datetime', 'productId', 'productName', 'quantity', 'unitPrice', 'lineTotal', 'billTotal'],
        dayData.flatMap((entry) =>
          entry.lines.map((line) => [
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
      ),
    );
  }
  if (sections.includes('hourlyRevenue')) {
    blocks.push(
      csvTable(
        'hourly_revenue',
        ['day', 'hour', 'revenue'],
        dayData.flatMap((entry) =>
          entry.hourlyRevenue.map((hour) => [String(entry.day), String(hour.hour), hour.revenue.toFixed(2)]),
        ),
      ),
    );
  }
  if (sections.includes('productShare')) {
    blocks.push(
      csvTable(
        'product_share',
        ['day', 'productId', 'productName', 'quantity', 'revenue', 'quantityShare', 'revenueShare'],
        dayData.flatMap((entry) =>
          entry.productShare.map((share) => [
            String(entry.day),
            String(share.productId),
            share.productName,
            String(share.quantity),
            share.revenue.toFixed(2),
            share.quantityShare.toFixed(2),
            share.revenueShare.toFixed(2),
          ]),
        ),
      ),
    );
  }
  if (sections.includes('dayComparison')) {
    blocks.push(
      csvTable(
        'day_comparison',
        ['day', 'orders', 'items', 'revenue'],
        dayComparison.map((entry) => [String(entry.day), String(entry.orders), String(entry.items), entry.revenue.toFixed(2)]),
      ),
    );
  }

  return blocks.join('\n\n');
}

function toJson(sections: ExportSection[], products: Product[], dayData: DayDataset[], dayComparison: ReturnType<typeof buildDayComparison>) {
  const payload: Record<string, unknown> = {
    metadata: {
      exportedAt: new Date().toISOString(),
      days: dayData.map((entry) => entry.day),
      sections,
      productCount: products.length,
    },
  };

  if (sections.includes('summary')) {
    payload.summary = dayData.map((entry) => ({
      ...entry.summary,
      generatedAtDisplay: formatDateTime(entry.summary.generatedAt),
    }));
  }
  if (sections.includes('products')) {
    payload.products = products;
  }
  if (sections.includes('bills')) {
    payload.bills = dayData.flatMap((entry) => entry.bills.map((bill) => ({ day: entry.day, ...bill })));
  }
  if (sections.includes('lineItems')) {
    payload.lineItems = dayData.flatMap((entry) => entry.lines);
  }
  if (sections.includes('hourlyRevenue')) {
    payload.hourlyRevenue = dayData.flatMap((entry) =>
      entry.hourlyRevenue.map((hour) => ({ day: entry.day, ...hour })),
    );
  }
  if (sections.includes('productShare')) {
    payload.productShare = dayData.flatMap((entry) =>
      entry.productShare.map((share) => ({ day: entry.day, ...share })),
    );
  }
  if (sections.includes('dayComparison')) {
    payload.dayComparison = dayComparison;
  }

  return JSON.stringify(payload, null, 2);
}

function toTxt(sections: ExportSection[], products: Product[], dayData: DayDataset[], dayComparison: ReturnType<typeof buildDayComparison>) {
  const lines: string[] = ['STATISTIK-EXPORT', `Erstellt am: ${formatDateTime(new Date().toISOString())}`, ''];
  if (sections.includes('summary')) {
    lines.push('=== Zusammenfassung ===');
    dayData.forEach((entry) => {
      lines.push(`Tag ${entry.day}`);
      lines.push(`- Bestellungen: ${entry.summary.totalOrders}`);
      lines.push(`- Artikel: ${entry.summary.totalItems}`);
      lines.push(`- Umsatz: ${formatCurrency(entry.summary.totalRevenue)}`);
      lines.push(`- Ø Bestellwert: ${formatCurrency(entry.summary.averageTicket)}`);
      lines.push(`- Artikel/Bestellung: ${formatNumber(entry.summary.averageItemsPerOrder)}`);
      lines.push('');
    });
  }
  if (sections.includes('products')) {
    lines.push('=== Produkte ===');
    products.forEach((product) =>
      lines.push(
        `#${product.id} ${product.name} | ${formatCurrency(product.price)} | Statistik: ${product.includeInStats ? 'Ja' : 'Nein'} | Tage: ${product.availableDays.join(', ')}`,
      ),
    );
    lines.push('');
  }
  if (sections.includes('bills')) {
    lines.push('=== Bestellungen ===');
    dayData.forEach((entry) =>
      entry.bills.forEach((bill) =>
        lines.push(`Tag ${entry.day} | #${bill.id} | ${formatDateTime(bill.datetime)} | ${formatCurrency(bill.total)}`),
      ),
    );
    lines.push('');
  }
  if (sections.includes('lineItems')) {
    lines.push('=== Positionsdaten ===');
    dayData.forEach((entry) =>
      entry.lines.forEach((line) =>
        lines.push(
          `Tag ${entry.day} | #${line.billId} | ${formatDateTime(line.datetime)} | ${line.quantity}x ${line.productName} | ${formatCurrency(line.lineTotal)}`,
        ),
      ),
    );
    lines.push('');
  }
  if (sections.includes('hourlyRevenue')) {
    lines.push('=== Umsatz pro Stunde ===');
    dayData.forEach((entry) =>
      entry.hourlyRevenue.forEach((hour) =>
        lines.push(`Tag ${entry.day} | ${String(hour.hour).padStart(2, '0')}:00 | ${formatCurrency(hour.revenue)}`),
      ),
    );
    lines.push('');
  }
  if (sections.includes('productShare')) {
    lines.push('=== Produktanteile ===');
    dayData.forEach((entry) =>
      entry.productShare.forEach((share) =>
        lines.push(
          `Tag ${entry.day} | ${share.productName} | Menge: ${share.quantity} (${formatPercent(share.quantityShare)}) | Umsatz: ${formatCurrency(share.revenue)} (${formatPercent(share.revenueShare)})`,
        ),
      ),
    );
    lines.push('');
  }
  if (sections.includes('dayComparison')) {
    lines.push('=== Tagesvergleich ===');
    dayComparison.forEach((entry) =>
      lines.push(`Tag ${entry.day}: ${entry.orders} Bestellungen, ${entry.items} Artikel, ${formatCurrency(entry.revenue)}`),
    );
  }
  return lines.join('\n');
}

function toMarkdown(sections: ExportSection[], products: Product[], dayData: DayDataset[], dayComparison: ReturnType<typeof buildDayComparison>) {
  const escapePipe = (value: string) => value.replaceAll('|', '\\|');
  const out: string[] = ['# Statistikexport', '', `Erstellt am: ${formatDateTime(new Date().toISOString())}`, ''];
  if (sections.includes('summary')) {
    out.push('## Zusammenfassung');
    out.push('| Tag | Bestellungen | Artikel | Umsatz | Ø Bestellwert | Artikel/Bestellung |');
    out.push('| --- | ---: | ---: | ---: | ---: | ---: |');
    dayData.forEach((entry) =>
      out.push(`| ${entry.day} | ${entry.summary.totalOrders} | ${entry.summary.totalItems} | ${formatCurrency(entry.summary.totalRevenue)} | ${formatCurrency(entry.summary.averageTicket)} | ${formatNumber(entry.summary.averageItemsPerOrder)} |`),
    );
    out.push('');
  }
  if (sections.includes('products')) {
    out.push('## Produkte');
    out.push('| ID | Name | Preis | In Statistik | Tage |');
    out.push('| --- | --- | ---: | --- | --- |');
    products.forEach((product) =>
      out.push(
        `| ${product.id} | ${escapePipe(product.name)} | ${formatCurrency(product.price)} | ${product.includeInStats ? 'Ja' : 'Nein'} | ${product.availableDays.join(', ')} |`,
      ),
    );
    out.push('');
  }
  if (sections.includes('bills')) {
    out.push('## Bestellungen');
    out.push('| Tag | ID | Zeitpunkt | Gesamt |');
    out.push('| --- | --- | --- | ---: |');
    dayData.forEach((entry) =>
      entry.bills.forEach((bill) =>
        out.push(`| ${entry.day} | ${bill.id} | ${formatDateTime(bill.datetime)} | ${formatCurrency(bill.total)} |`),
      ),
    );
    out.push('');
  }
  if (sections.includes('lineItems')) {
    out.push('## Positionen');
    out.push('| Tag | Bestellung | Zeitpunkt | Produkt | Menge | Position gesamt |');
    out.push('| --- | --- | --- | --- | ---: | ---: |');
    dayData.forEach((entry) =>
      entry.lines.forEach((line) =>
        out.push(
          `| ${entry.day} | ${line.billId} | ${formatDateTime(line.datetime)} | ${escapePipe(line.productName)} | ${line.quantity} | ${formatCurrency(line.lineTotal)} |`,
        ),
      ),
    );
    out.push('');
  }
  if (sections.includes('hourlyRevenue')) {
    out.push('## Umsatz pro Stunde');
    out.push('| Tag | Stunde | Umsatz |');
    out.push('| --- | --- | ---: |');
    dayData.forEach((entry) =>
      entry.hourlyRevenue.forEach((hour) =>
        out.push(`| ${entry.day} | ${String(hour.hour).padStart(2, '0')}:00 | ${formatCurrency(hour.revenue)} |`),
      ),
    );
    out.push('');
  }
  if (sections.includes('productShare')) {
    out.push('## Produktanteile');
    out.push('| Tag | Produkt | Menge | Umsatz | Anteil Menge | Anteil Umsatz |');
    out.push('| --- | --- | ---: | ---: | ---: | ---: |');
    dayData.forEach((entry) =>
      entry.productShare.forEach((share) =>
        out.push(
          `| ${entry.day} | ${escapePipe(share.productName)} | ${share.quantity} | ${formatCurrency(share.revenue)} | ${formatPercent(share.quantityShare)} | ${formatPercent(share.revenueShare)} |`,
        ),
      ),
    );
    out.push('');
  }
  if (sections.includes('dayComparison')) {
    out.push('## Tagesvergleich');
    out.push('| Tag | Bestellungen | Artikel | Umsatz |');
    out.push('| --- | ---: | ---: | ---: |');
    dayComparison.forEach((entry) => out.push(`| ${entry.day} | ${entry.orders} | ${entry.items} | ${formatCurrency(entry.revenue)} |`));
  }
  return out.join('\n');
}

function toHtmlForPdf(sections: ExportSection[], products: Product[], dayData: DayDataset[], dayComparison: ReturnType<typeof buildDayComparison>) {
  const esc = (txt: string) => txt.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const section = (title: string, content: string) => `<section><h2>${esc(title)}</h2>${content}</section>`;
  const table = (headers: string[], rows: string[][]) => `
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${esc(header)}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
  `;
  const blocks: string[] = [];

  if (sections.includes('summary')) {
    blocks.push(
      section(
        'Zusammenfassung',
        table(
          ['Tag', 'Bestellungen', 'Artikel', 'Umsatz', 'Ø Bestellwert', 'Artikel/Bestellung'],
          dayData.map((entry) => [
            `Tag ${entry.day}`,
            String(entry.summary.totalOrders),
            String(entry.summary.totalItems),
            formatCurrency(entry.summary.totalRevenue),
            formatCurrency(entry.summary.averageTicket),
            formatNumber(entry.summary.averageItemsPerOrder),
          ]),
        ),
      ),
    );
  }

  if (sections.includes('products')) {
    blocks.push(
      section(
        'Produkte',
        table(
          ['ID', 'Name', 'Preis', 'In Statistik', 'Tage'],
          products.map((product) => [
            String(product.id),
            product.name,
            formatCurrency(product.price),
            product.includeInStats ? 'Ja' : 'Nein',
            product.availableDays.join(', '),
          ]),
        ),
      ),
    );
  }

  if (sections.includes('bills')) {
    blocks.push(
      section(
        'Bestellungen',
        table(
          ['Tag', 'ID', 'Zeitpunkt', 'Gesamt'],
          dayData.flatMap((entry) =>
            entry.bills.map((bill) => [
              `Tag ${entry.day}`,
              String(bill.id),
              formatDateTime(bill.datetime),
              formatCurrency(bill.total),
            ]),
          ),
        ),
      ),
    );
  }

  if (sections.includes('lineItems')) {
    blocks.push(
      section(
        'Positionsdaten',
        table(
          ['Tag', 'Bestellung', 'Zeitpunkt', 'Produkt', 'Menge', 'Einzelpreis', 'Position gesamt'],
          dayData.flatMap((entry) =>
            entry.lines.map((line) => [
              `Tag ${entry.day}`,
              String(line.billId),
              formatDateTime(line.datetime),
              line.productName,
              String(line.quantity),
              formatCurrency(line.unitPrice),
              formatCurrency(line.lineTotal),
            ]),
          ),
        ),
      ),
    );
  }

  if (sections.includes('hourlyRevenue')) {
    blocks.push(
      section(
        'Umsatz pro Stunde',
        table(
          ['Tag', 'Stunde', 'Umsatz'],
          dayData.flatMap((entry) =>
            entry.hourlyRevenue.map((hour) => [
              `Tag ${entry.day}`,
              `${String(hour.hour).padStart(2, '0')}:00`,
              formatCurrency(hour.revenue),
            ]),
          ),
        ),
      ),
    );
  }

  if (sections.includes('productShare')) {
    blocks.push(
      section(
        'Produktanteile',
        table(
          ['Tag', 'Produkt', 'Menge', 'Umsatz', 'Anteil Menge', 'Anteil Umsatz'],
          dayData.flatMap((entry) =>
            entry.productShare.map((share) => [
              `Tag ${entry.day}`,
              share.productName,
              String(share.quantity),
              formatCurrency(share.revenue),
              formatPercent(share.quantityShare),
              formatPercent(share.revenueShare),
            ]),
          ),
        ),
      ),
    );
  }

  if (sections.includes('dayComparison')) {
    blocks.push(
      section(
        'Tagesvergleich',
        table(
          ['Tag', 'Bestellungen', 'Artikel', 'Umsatz'],
          dayComparison.map((entry) => [
            `Tag ${entry.day}`,
            String(entry.orders),
            String(entry.items),
            formatCurrency(entry.revenue),
          ]),
        ),
      ),
    );
  }

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 18px; color: #0f172a; background: #f8fafc; }
          h1 { margin: 0 0 4px; font-size: 22px; }
          .sub { margin: 0 0 14px; color: #475569; font-size: 12px; }
          section { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin-bottom: 10px; page-break-inside: avoid; }
          h2 { margin: 0 0 8px; font-size: 15px; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th, td { border-bottom: 1px solid #e2e8f0; padding: 6px 8px; font-size: 11px; vertical-align: top; text-align: left; word-wrap: break-word; }
          th { background: #f1f5f9; font-weight: 700; color: #1e293b; }
          tr:last-child td { border-bottom: none; }
        </style>
      </head>
      <body>
        <h1>Statistikexport</h1>
        <p class="sub">Erstellt am ${esc(formatDateTime(new Date().toISOString()))}</p>
        ${blocks.join('\n')}
      </body>
    </html>
  `;
}

function buildTextExport(format: ExportFormat, sections: ExportSection[], products: Product[], dayData: DayDataset[], dayComparison: ReturnType<typeof buildDayComparison>) {
  if (format === 'csv') {
    return toCsv(sections, products, dayData, dayComparison);
  }
  if (format === 'json') {
    return toJson(sections, products, dayData, dayComparison);
  }
  if (format === 'md') {
    return toMarkdown(sections, products, dayData, dayComparison);
  }
  return toTxt(sections, products, dayData, dayComparison);
}

function buildXlsxBase64(
  sections: ExportSection[],
  products: Product[],
  dayData: DayDataset[],
  dayComparison: ReturnType<typeof buildDayComparison>,
): string {
  const workbook = XLSX.utils.book_new();
  const addSheet = (name: string, rows: Record<string, string | number | boolean>[]) => {
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, name.slice(0, 31));
  };

  if (sections.includes('summary')) {
    addSheet(
      'Summary',
      dayData.map((entry) => ({
        Tag: entry.day,
        Bestellungen: entry.summary.totalOrders,
        Artikel: entry.summary.totalItems,
        Umsatz_EUR: Number(entry.summary.totalRevenue.toFixed(2)),
        Durchschnitt_Bestellwert_EUR: Number(entry.summary.averageTicket.toFixed(2)),
        Artikel_pro_Bestellung: Number(entry.summary.averageItemsPerOrder.toFixed(2)),
      })),
    );
  }

  if (sections.includes('products')) {
    addSheet(
      'Produkte',
      products.map((product) => ({
        ID: product.id,
        Name: product.name,
        Preis_EUR: Number(product.price.toFixed(2)),
        In_Statistik: product.includeInStats,
        Verfuegbare_Tage: product.availableDays.join(','),
      })),
    );
  }

  if (sections.includes('bills')) {
    addSheet(
      'Bestellungen',
      dayData.flatMap((entry) =>
        entry.bills.map((bill) => ({
          Tag: entry.day,
          ID: bill.id,
          Zeitpunkt: formatDateTime(bill.datetime),
          Gesamt_EUR: Number(bill.total.toFixed(2)),
        })),
      ),
    );
  }

  if (sections.includes('lineItems')) {
    addSheet(
      'Positionen',
      dayData.flatMap((entry) =>
        entry.lines.map((line) => ({
          Tag: entry.day,
          Bestellung: line.billId,
          Zeitpunkt: formatDateTime(line.datetime),
          Produkt: line.productName,
          Menge: line.quantity,
          Einzelpreis_EUR: Number(line.unitPrice.toFixed(2)),
          Position_Gesamt_EUR: Number(line.lineTotal.toFixed(2)),
        })),
      ),
    );
  }

  if (sections.includes('hourlyRevenue')) {
    addSheet(
      'Umsatz_Stunde',
      dayData.flatMap((entry) =>
        entry.hourlyRevenue.map((hour) => ({
          Tag: entry.day,
          Stunde: `${String(hour.hour).padStart(2, '0')}:00`,
          Umsatz_EUR: Number(hour.revenue.toFixed(2)),
        })),
      ),
    );
  }

  if (sections.includes('productShare')) {
    addSheet(
      'Produktanteil',
      dayData.flatMap((entry) =>
        entry.productShare.map((share) => ({
          Tag: entry.day,
          Produkt: share.productName,
          Menge: share.quantity,
          Umsatz_EUR: Number(share.revenue.toFixed(2)),
          Anteil_Menge_Prozent: Number(share.quantityShare.toFixed(2)),
          Anteil_Umsatz_Prozent: Number(share.revenueShare.toFixed(2)),
        })),
      ),
    );
  }

  if (sections.includes('dayComparison')) {
    addSheet(
      'Tagesvergleich',
      dayComparison.map((entry) => ({
        Tag: entry.day,
        Bestellungen: entry.orders,
        Artikel: entry.items,
        Umsatz_EUR: Number(entry.revenue.toFixed(2)),
      })),
    );
  }

  return XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
}

async function shareFile(uri: string, format: ExportFormat, title: string) {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Teilen ist auf diesem Gerät nicht verfügbar.');
  }

  await Sharing.shareAsync(uri, {
    mimeType:
      format === 'pdf'
        ? 'application/pdf'
        : format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : format === 'json'
          ? 'application/json'
          : format === 'csv'
            ? 'text/csv'
            : format === 'md'
              ? 'text/markdown'
              : 'text/plain',
    dialogTitle: title,
  });
}

export async function exportStatsReport({
  selectedDays,
  products,
  format,
  sections,
  billsByDay,
}: ExportInput): Promise<void> {
  if (sections.length === 0) {
    throw new Error('Bitte mindestens einen Datenblock auswählen.');
  }
  if (selectedDays.length === 0) {
    throw new Error('Bitte mindestens einen Tag auswählen.');
  }

  const days = [...new Set(selectedDays)].sort((a, b) => a - b) as DayId[];
  const dayData = days.map((day) => buildDayDataset(day, products, billsByDay));
  const dayComparison = buildDayComparison(days, billsByDay);
  const dayLabel = days.length === 1 ? `Tag ${days[0]}` : `Tage ${days.join(', ')}`;

  if (format === 'pdf') {
    const html = toHtmlForPdf(sections, products, dayData, dayComparison);
    if (Platform.OS === 'web') {
      await Share.share({ message: toMarkdown(sections, products, dayData, dayComparison) });
      return;
    }
    const result = await Print.printToFileAsync({ html });
    await shareFile(result.uri, 'pdf', `Statistik ${dayLabel} exportieren`);
    return;
  }

  if (format === 'xlsx') {
    if (Platform.OS === 'web') {
      await Share.share({ message: 'Excel-Export ist auf Web nicht direkt verfügbar. Bitte CSV oder JSON nutzen.' });
      return;
    }

    const directory = FileSystem.documentDirectory;
    if (!directory) {
      throw new Error('Kein Export-Verzeichnis verfügbar.');
    }
    const filename = `stats-${days.join('-')}-${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`;
    const uri = `${directory}${filename}`;
    const base64 = buildXlsxBase64(sections, products, dayData, dayComparison);
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
    await shareFile(uri, 'xlsx', `Statistik ${dayLabel} exportieren`);
    return;
  }

  const content = buildTextExport(format, sections, products, dayData, dayComparison);
  if (Platform.OS === 'web') {
    await Share.share({ message: content });
    return;
  }

  const directory = FileSystem.documentDirectory;
  if (!directory) {
    throw new Error('Kein Export-Verzeichnis verfügbar.');
  }

  const filename = `stats-${days.join('-')}-${new Date().toISOString().replace(/[:.]/g, '-')}.${format}`;
  const uri = `${directory}${filename}`;

  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await shareFile(uri, format, `Statistik ${dayLabel} exportieren`);
}
