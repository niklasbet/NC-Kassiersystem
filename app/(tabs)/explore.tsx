import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import PieChart from 'react-native-pie-chart';
import {
  Button,
  Card,
  Chip,
  Divider,
  Modal,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';

import { ConfirmModal } from '@/components/ConfirmModal';
import { useAppData } from '@/app/store/AppDataContext';
import type { BillRecord, DayId, Product } from '@/app/store/types';
import { palette } from '@/app/theme/appTheme';
import { formatEuro } from '@/app/utils/format';
import { exportStatsReport, type ExportFormat, type ExportSection } from '@/app/utils/statsExport';

const chartPalette = ['#f6b351', '#6fd6b6', '#78a7ff', '#ef6a6a', '#cf93ff', '#62dfff', '#f2dc7f', '#84ec7b'];
const DEFAULT_EXPORT_SECTIONS: ExportSection[] = [
  'summary',
  'products',
  'bills',
  'lineItems',
  'hourlyRevenue',
  'productShare',
  'dayComparison',
  'assortment',
];

function sumProductAmount(product: Product, bills: BillRecord[]): number {
  return bills.reduce((sum, bill) => sum + (bill.items[product.id] ?? 0), 0);
}

function getDayRevenue(bills: BillRecord[]): number {
  return bills.reduce((sum, bill) => sum + bill.total, 0);
}

function getDayItems(bills: BillRecord[]): number {
  return bills.reduce(
    (sum, bill) => sum + Object.values(bill.items).reduce((inner, qty) => inner + Math.max(0, qty), 0),
    0,
  );
}

function withOpacity(hexColor: string, alpha: number): string {
  const hex = hexColor.replace('#', '');
  const normalized = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function StatsScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { products, bills, billsByDay, selectedDay, setSelectedDay, resetDayStats } = useAppData();

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [snackbarText, setSnackbarText] = useState<string | null>(null);
  const [selectedExportSections, setSelectedExportSections] = useState<ExportSection[]>(DEFAULT_EXPORT_SECTIONS);
  const [selectedExportFormat, setSelectedExportFormat] = useState<ExportFormat>('csv');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const productStats = useMemo(
    () =>
      products
        .filter((product) => product.includeInStats)
        .map((product, index) => {
          const amount = sumProductAmount(product, bills);
          const revenue = bills.reduce((sum, bill) => sum + (bill.items[product.id] ?? 0) * product.price, 0);
          return { product, amount, revenue, color: chartPalette[index % chartPalette.length] };
        }),
    [bills, products],
  );

  const totalRevenue = useMemo(() => getDayRevenue(bills), [bills]);
  const totalOrders = bills.length;
  const totalAmount = useMemo(() => getDayItems(bills), [bills]);
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const averageItemsPerOrder = totalOrders > 0 ? totalAmount / totalOrders : 0;

  const topSeller = useMemo(
    () => [...productStats].sort((a, b) => b.amount - a.amount)[0],
    [productStats],
  );

  const soldProductCount = useMemo(
    () => productStats.filter((entry) => entry.amount > 0).length,
    [productStats],
  );

  const activeProductsToday = useMemo(
    () => products.filter((product) => product.availableDays.includes(selectedDay)).length,
    [products, selectedDay],
  );

  const hourlyRevenue = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, value: 0 }));
    bills.forEach((bill) => {
      const hour = new Date(bill.datetime).getHours();
      if (hour >= 0 && hour <= 23) {
        buckets[hour].value += bill.total;
      }
    });
    return buckets;
  }, [bills]);

  const maxHourlyRevenue = Math.max(1, ...hourlyRevenue.map((entry) => entry.value));

  const dayTrend = useMemo(
    () =>
      ([1, 2, 3] as DayId[]).map((day) => {
        const dayBills = billsByDay[day] ?? [];
        return {
          day,
          orders: dayBills.length,
          revenue: getDayRevenue(dayBills),
          items: getDayItems(dayBills),
        };
      }),
    [billsByDay],
  );

  const series = useMemo(() => {
    const active = productStats.filter((entry) => entry.amount > 0);
    if (active.length === 0) {
      return [1];
    }
    return active.map((entry) => entry.amount);
  }, [productStats]);

  const colors = useMemo(() => {
    const active = productStats.filter((entry) => entry.amount > 0);
    if (active.length === 0) {
      return [theme.colors.surfaceVariant];
    }
    return active.map((entry) =>
      selectedProductId === null || entry.product.id === selectedProductId
        ? entry.color
        : withOpacity(entry.color, 0.25),
    );
  }, [productStats, selectedProductId, theme.colors.surfaceVariant]);

  const selectedHourEntry = selectedHour === null ? null : hourlyRevenue.find((entry) => entry.hour === selectedHour);
  const selectedHourShare = selectedHourEntry ? (selectedHourEntry.value * 100) / Math.max(1, totalRevenue) : 0;

  const switchDay = async (day: DayId) => {
    await setSelectedDay(day);
  };

  const handleResetDay = async () => {
    await resetDayStats();
    setConfirmResetOpen(false);
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      await exportStatsReport({
        day: selectedDay,
        bills,
        products,
        format,
        sections: selectedExportSections,
        billsByDay,
      });
      setExportOpen(false);
      setSnackbarText(`Export als ${format.toUpperCase()} erstellt.`);
    } catch (error) {
      setSnackbarText(error instanceof Error ? error.message : 'Export fehlgeschlagen.');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleExportSection = (section: ExportSection) => {
    setSelectedExportSections((prev) => {
      if (prev.includes(section)) {
        const next = prev.filter((entry) => entry !== section);
        return next.length > 0 ? next : prev;
      }
      return [...prev, section];
    });
  };

  const toggleProductHighlight = (productId: number) => {
    setSelectedProductId((prev) => (prev === productId ? null : productId));
  };

  const toggleHourHighlight = (hour: number) => {
    setSelectedHour((prev) => (prev === hour ? null : hour));
  };

  const kpiItems = [
    { label: 'Umsatz', value: formatEuro(totalRevenue) },
    { label: 'Bestellungen', value: String(totalOrders) },
    { label: 'Verkaufte Artikel', value: String(totalAmount) },
    { label: 'Ø Bestellwert', value: formatEuro(averageTicket) },
    { label: 'Artikel/Bestellung', value: averageItemsPerOrder.toFixed(2) },
    { label: 'Top-Seller', value: topSeller ? `${topSeller.product.name} (${topSeller.amount})` : '-' },
  ];

  const kpiColumns = width >= 1180 ? 3 : width >= 760 ? 2 : 1;
  const kpiCardWidth = kpiColumns === 3 ? '32%' : kpiColumns === 2 ? '48.5%' : '100%';

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.glowTop} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text variant="headlineMedium" style={styles.title}>Statistik</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Erweiterte Auswertung für den ausgewählten Tag
            </Text>
          </View>
          <Button mode="contained-tonal" onPress={() => router.push('/historyView')}>
            Bestellverlauf
          </Button>
        </View>

        <View style={styles.dayRow}>
          {[1, 2, 3].map((day) => (
            <Chip
              key={day}
              selected={selectedDay === day}
              onPress={() => void switchDay(day as DayId)}
              showSelectedCheck={false}
              style={[
                styles.dayChip,
                selectedDay === day ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.surfaceVariant },
              ]}
              textStyle={{ color: selectedDay === day ? theme.colors.onPrimary : theme.colors.onSurface, fontWeight: '700' }}
            >
              Tag {day}
            </Chip>
          ))}
        </View>

        <View style={styles.kpiRow}>
          {kpiItems.map((item) => (
            <Card key={item.label} style={[styles.kpiCard, { width: kpiCardWidth, backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.kpiCardContent}>
                <View style={styles.kpiLabelWrap}>
                  <Text variant="labelLarge" style={styles.kpiLabel}>{item.label}</Text>
                </View>
                <View style={styles.kpiValueWrap}>
                  <Text
                    numberOfLines={item.label === 'Top-Seller' ? 2 : 1}
                    variant={item.label === 'Top-Seller' ? 'titleLarge' : 'headlineSmall'}
                    style={styles.kpiValue}
                  >
                    {item.value}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Verkaufsverteilung (Menge)</Text>
            <Divider style={styles.sectionDivider} />
            <View style={styles.chartRow}>
              <PieChart widthAndHeight={220} series={series} sliceColor={colors} />
              <View style={styles.legendWrap}>
                {productStats.map((entry) => {
                  const amountPercent = totalAmount > 0 ? (entry.amount * 100) / totalAmount : 0;
                  const revenuePercent = totalRevenue > 0 ? (entry.revenue * 100) / totalRevenue : 0;
                  const isSelected = selectedProductId === entry.product.id;
                  const isDimmed = selectedProductId !== null && !isSelected;
                  return (
                    <Pressable
                      key={entry.product.id}
                      onPress={() => toggleProductHighlight(entry.product.id)}
                      style={[
                        styles.legendChip,
                        { backgroundColor: theme.colors.surfaceVariant },
                        isSelected && { borderColor: entry.color, borderWidth: 2 },
                        isDimmed && { opacity: 0.72 },
                      ]}
                    >
                      <View style={styles.legendChipTop}>
                        <View style={[styles.colorDot, { backgroundColor: entry.color }]} />
                        <Text variant="bodyMedium" numberOfLines={1} style={styles.legendName}>
                          {entry.product.name}
                        </Text>
                      </View>
                      <Text variant="bodySmall">
                        {entry.amount} ({amountPercent.toFixed(1)}%) · U: {revenuePercent.toFixed(1)}%
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            {selectedProductId !== null ? (
              <Button mode="text" onPress={() => setSelectedProductId(null)}>
                Highlight zurücksetzen
              </Button>
            ) : null}
          </Card.Content>
        </Card>

        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Umsatz pro Stunde</Text>
            <Divider style={styles.sectionDivider} />
            <View style={styles.hourlyWrap}>
              {hourlyRevenue.map((entry) => (
                <Pressable key={entry.hour} onPress={() => toggleHourHighlight(entry.hour)} style={styles.hourBarCol}>
                  <View
                    style={[
                      styles.hourBarTrack,
                      selectedHour === entry.hour && { borderColor: theme.colors.primary, borderWidth: 1.5 },
                    ]}
                  >
                    <View
                      style={[
                        styles.hourBarFill,
                        {
                          height: `${(entry.value / maxHourlyRevenue) * 100}%`,
                          backgroundColor: (() => {
                            const baseColor = entry.value > 0 ? theme.colors.tertiary : 'rgba(255,255,255,0.22)';
                            if (selectedHour === null) {
                              return baseColor;
                            }
                            if (selectedHour === entry.hour) {
                              return theme.colors.primary;
                            }
                            return withOpacity(baseColor, 0.28);
                          })(),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.hourLabel}>{entry.hour}</Text>
                </Pressable>
              ))}
            </View>
            {selectedHourEntry ? (
              <View style={[styles.hourInfoCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text variant="titleMedium">Stunde {selectedHourEntry.hour}:00</Text>
                <Text variant="bodyMedium">Umsatz: {formatEuro(selectedHourEntry.value)}</Text>
                <Text variant="bodyMedium">Anteil am Tagesumsatz: {selectedHourShare.toFixed(1)}%</Text>
                <Button mode="text" onPress={() => setSelectedHour(null)}>Highlight zurücksetzen</Button>
              </View>
            ) : null}
          </Card.Content>
        </Card>

        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Tag-Vergleich</Text>
            <Divider style={styles.sectionDivider} />
            <View style={styles.trendWrap}>
              {dayTrend.map((entry) => (
                <View key={entry.day} style={styles.trendRow}>
                  <Text variant="titleMedium" style={styles.trendDay}>Tag {entry.day}</Text>
                  <Text variant="bodyMedium">{entry.orders} Bestellungen</Text>
                  <Text variant="bodyMedium">{entry.items} Artikel</Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>{formatEuro(entry.revenue)}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Sortimentseffizienz</Text>
            <Divider style={styles.sectionDivider} />
            <View style={styles.trendRow}>
              <Text variant="bodyLarge">Aktive Produkte (Tag {selectedDay})</Text>
              <Text variant="titleMedium">{activeProductsToday}</Text>
            </View>
            <View style={styles.trendRow}>
              <Text variant="bodyLarge">Davon verkauft</Text>
              <Text variant="titleMedium">{soldProductCount}</Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.footerActions}>
          <Button mode="contained-tonal" onPress={() => router.push('/buttonView')}>Produkte verwalten</Button>
          <Button mode="contained-tonal" onPress={() => setExportOpen(true)}>Export</Button>
          <Button mode="contained-tonal" onPress={() => setConfirmResetOpen(true)} textColor="#3d1515" buttonColor={palette.danger}>
            Tag zurücksetzen
          </Button>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={confirmResetOpen}
        title="Statistik löschen?"
        message={`Alle Bestellungen für Tag ${selectedDay} werden dauerhaft entfernt.`}
        confirmLabel="Löschen"
        tone="danger"
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={() => void handleResetDay()}
      />

      <Portal>
        <Modal visible={exportOpen} onDismiss={() => setExportOpen(false)} contentContainerStyle={[styles.exportModalWrap, { backgroundColor: theme.colors.surface }]}>
          <Text variant="headlineSmall" style={styles.sectionTitle}>Statistik exportieren</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
            Tag {selectedDay} in gewünschtem Format exportieren.
          </Text>
          <View style={[styles.exportSectionBox, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={styles.exportSectionHeader}>
              <Text variant="titleMedium">Datenauswahl</Text>
              <Button compact mode="text" onPress={() => setSelectedExportSections(DEFAULT_EXPORT_SECTIONS)}>
                Alles wählen
              </Button>
            </View>
            <View style={styles.sectionChipWrap}>
              <Chip selected={selectedExportSections.includes('summary')} onPress={() => toggleExportSection('summary')}>Summary</Chip>
              <Chip selected={selectedExportSections.includes('products')} onPress={() => toggleExportSection('products')}>Produkte</Chip>
              <Chip selected={selectedExportSections.includes('bills')} onPress={() => toggleExportSection('bills')}>Bestellungen</Chip>
              <Chip selected={selectedExportSections.includes('lineItems')} onPress={() => toggleExportSection('lineItems')}>Positionen</Chip>
              <Chip selected={selectedExportSections.includes('hourlyRevenue')} onPress={() => toggleExportSection('hourlyRevenue')}>Umsatz/Stunde</Chip>
              <Chip selected={selectedExportSections.includes('productShare')} onPress={() => toggleExportSection('productShare')}>Produktanteile</Chip>
              <Chip selected={selectedExportSections.includes('dayComparison')} onPress={() => toggleExportSection('dayComparison')}>Tag-Vergleich</Chip>
              <Chip selected={selectedExportSections.includes('assortment')} onPress={() => toggleExportSection('assortment')}>Sortiment</Chip>
            </View>
          </View>

          <View style={[styles.exportSectionBox, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="titleMedium">Format</Text>
            <View style={styles.formatPicker}>
              {(['csv', 'json', 'md', 'txt'] as ExportFormat[]).map((format) => {
                const active = selectedExportFormat === format;
                return (
                  <Pressable
                    key={format}
                    onPress={() => setSelectedExportFormat(format)}
                    style={[
                      styles.formatOption,
                      {
                        backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                        borderColor: active ? theme.colors.primary : 'rgba(255,255,255,0.12)',
                      },
                    ]}
                  >
                    <Text
                      variant="titleSmall"
                      style={{ color: active ? theme.colors.onPrimary : theme.colors.onSurface }}
                    >
                      {format.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.exportActionRow}>
            <Button style={styles.exportActionButton} mode="contained" loading={isExporting} disabled={isExporting} onPress={() => void handleExport(selectedExportFormat)}>
              Jetzt exportieren
            </Button>
            <Button style={styles.exportActionButton} mode="contained-tonal" disabled={isExporting} onPress={() => setExportOpen(false)}>Schließen</Button>
          </View>
        </Modal>
      </Portal>

      <Snackbar visible={Boolean(snackbarText)} onDismiss={() => setSnackbarText(null)} duration={2400}>
        {snackbarText}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  glowTop: { position: 'absolute', left: -130, top: -110, width: 300, height: 300, borderRadius: 999, backgroundColor: 'rgba(111, 214, 182, 0.12)' },
  content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 24, gap: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { fontWeight: '700' },
  dayRow: { flexDirection: 'row', gap: 10, marginVertical: 4 },
  dayChip: { minWidth: 74, justifyContent: 'center' },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { borderRadius: 14 },
  kpiCardContent: { minHeight: 108, justifyContent: 'space-between' },
  kpiLabelWrap: { minHeight: 42, justifyContent: 'flex-start' },
  kpiLabel: { marginBottom: 8, opacity: 0.75, textTransform: 'uppercase', letterSpacing: 0.8 },
  kpiValueWrap: { minHeight: 46, justifyContent: 'flex-end' },
  kpiValue: { fontWeight: '700' },
  chartCard: { borderRadius: 16 },
  sectionTitle: { fontWeight: '700' },
  sectionDivider: { marginVertical: 12 },
  chartRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'center' },
  legendWrap: { minWidth: 280, flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendChip: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 180,
    maxWidth: 260,
    gap: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  legendChipTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colorDot: { width: 12, height: 12, borderRadius: 999 },
  legendName: { fontWeight: '700', flexShrink: 1 },
  hourlyWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 170 },
  hourBarCol: { width: 18, alignItems: 'center', paddingVertical: 2 },
  hourBarTrack: { width: 14, height: 142, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 7, justifyContent: 'flex-end', overflow: 'hidden' },
  hourBarFill: { width: 14, borderRadius: 7 },
  hourLabel: { fontSize: 9, marginTop: 4 },
  hourInfoCard: { marginTop: 12, borderRadius: 12, padding: 10, gap: 4 },
  trendWrap: { gap: 8 },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  trendDay: { minWidth: 62 },
  footerActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  exportModalWrap: { marginHorizontal: 20, borderRadius: 20, padding: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  exportSectionBox: { borderRadius: 14, padding: 12, gap: 10 },
  exportSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exportButtonWrap: { gap: 10 },
  exportActionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  exportActionButton: { flex: 1 },
  formatPicker: { flexDirection: 'row', gap: 8 },
  formatOption: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
});
