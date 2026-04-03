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
import { useAppData } from '@/src/store/AppDataContext';
import type { BillRecord, DayId, Product } from '@/src/store/types';
import { palette } from '@/src/theme/appTheme';
import { formatEuro } from '@/src/utils/format';
import { exportStatsReport, type ExportFormat, type ExportSection } from '@/src/utils/statsExport';

const chartPalette = ['#f6b351', '#6fd6b6', '#78a7ff', '#ef6a6a', '#cf93ff', '#62dfff', '#f2dc7f', '#84ec7b'];
const DEFAULT_EXPORT_SECTIONS: ExportSection[] = [
  'summary',
  'hourlyRevenue',
  'productShare',
  'dayComparison',
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
  const isNarrow = width < 760;
  const isVeryNarrow = width < 520;
  const isSmallScreen = width < 620;
  const pieSize = width < 430 ? 150 : width < 620 ? 180 : 220;
  const hourBarWidth = width < 430 ? 14 : 18;
  const hourTrackWidth = width < 430 ? 10 : 14;
  const hourTrackHeight = width < 430 ? 118 : 142;
  const hourBarGap = 4;
  const { products, bills, billsByDay, selectedDay, setSelectedDay, resetDayStats, replaceDayStats, themeMode, toggleThemeMode } = useAppData();

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [snackbarText, setSnackbarText] = useState<string | null>(null);
  const [selectedExportSections, setSelectedExportSections] = useState<ExportSection[]>(DEFAULT_EXPORT_SECTIONS);
  const [selectedExportFormat, setSelectedExportFormat] = useState<ExportFormat>('csv');
  const [selectedExportDays, setSelectedExportDays] = useState<DayId[]>([selectedDay]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [resetUndoBills, setResetUndoBills] = useState<BillRecord[] | null>(null);
  const [resetUndoVisible, setResetUndoVisible] = useState(false);

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
  const hourlyContentWidth = hourlyRevenue.length * hourBarWidth + (hourlyRevenue.length - 1) * hourBarGap;

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
    setResetUndoBills(billsByDay[selectedDay] ?? []);
    await resetDayStats();
    setConfirmResetOpen(false);
    setResetUndoVisible(true);
  };

  const handleUndoReset = async () => {
    if (!resetUndoBills) {
      return;
    }
    await replaceDayStats(selectedDay, resetUndoBills);
    setResetUndoVisible(false);
    setResetUndoBills(null);
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      await exportStatsReport({
        selectedDays: selectedExportDays,
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

  const toggleExportDay = (day: DayId) => {
    setSelectedExportDays((prev) => {
      if (prev.includes(day)) {
        const next = prev.filter((entry) => entry !== day);
        return next.length > 0 ? next : prev;
      }
      return [...prev, day].sort((a, b) => a - b) as DayId[];
    });
  };

  const selectAllDays = () => {
    setSelectedExportDays([1, 2, 3]);
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
        <View style={[styles.headerRow, isNarrow && styles.headerRowNarrow]}>
          <View>
            <Text variant="headlineMedium" style={styles.title}>Statistik</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Erweiterte Auswertung für den ausgewählten Tag
            </Text>
          </View>
          <View style={[styles.headerActions, isVeryNarrow && styles.headerActionsNarrow]}>
            <Button mode="contained-tonal" compact onPress={() => void toggleThemeMode()}>
              {themeMode === 'light' ? 'Dark Mode' : 'Light Mode'}
            </Button>
            <Button mode="contained-tonal" onPress={() => router.push('/historyView')}>
              Bestellverlauf
            </Button>
            <Button mode="contained-tonal" onPress={() => setExportOpen(true)}>
              Export
            </Button>
          </View>
        </View>

        <View style={[styles.dayRow, isVeryNarrow && styles.dayRowNarrow]}>
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
            <View style={[styles.chartRow, isSmallScreen && styles.chartRowSmall]}>
              <PieChart widthAndHeight={pieSize} series={series} sliceColor={colors} />
              <View style={[styles.legendWrap, isSmallScreen && styles.legendWrapSmall]}>
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
                        isSmallScreen && styles.legendChipSmall,
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
            <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.hourlyScrollContent}>
              <View style={[styles.hourlyWrap, { width: hourlyContentWidth, gap: hourBarGap }]}>
              {hourlyRevenue.map((entry) => (
                <Pressable
                  key={entry.hour}
                  onPress={() => toggleHourHighlight(entry.hour)}
                  style={[styles.hourBarCol, { width: hourBarWidth }]}
                >
                  <View
                    style={[
                      styles.hourBarTrack,
                      { width: hourTrackWidth, height: hourTrackHeight, borderRadius: hourTrackWidth / 2 },
                      { backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(71,85,105,0.14)' },
                      selectedHour === entry.hour && { borderColor: theme.colors.primary, borderWidth: 1.5 },
                    ]}
                  >
                    <View
                      style={[
                        styles.hourBarFill,
                        {
                          width: hourTrackWidth,
                          borderRadius: hourTrackWidth / 2,
                          height: `${(entry.value / maxHourlyRevenue) * 100}%`,
                          backgroundColor: (() => {
                            const baseColor = entry.value > 0
                              ? theme.colors.tertiary
                              : theme.dark
                                ? 'rgba(255,255,255,0.22)'
                                : 'rgba(71,85,105,0.34)';
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
            </ScrollView>
            <View pointerEvents="none" style={styles.hourFadeWrap}>
              <View style={[styles.hourFadeStep, { backgroundColor: theme.dark ? 'rgba(15,19,24,0.16)' : 'rgba(248,250,252,0.20)' }]} />
              <View style={[styles.hourFadeStep, { backgroundColor: theme.dark ? 'rgba(15,19,24,0.28)' : 'rgba(248,250,252,0.34)' }]} />
              <View style={[styles.hourFadeStep, { backgroundColor: theme.dark ? 'rgba(15,19,24,0.42)' : 'rgba(248,250,252,0.48)' }]} />
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
                <View key={entry.day} style={[styles.trendRow, isSmallScreen && styles.trendRowSmall]}>
                  <Text variant="titleMedium" style={styles.trendDay}>Tag {entry.day}</Text>
                  <Text variant="bodyMedium">{entry.orders} Bestellungen</Text>
                  <Text variant="bodyMedium">{entry.items} Artikel</Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>{formatEuro(entry.revenue)}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        <View style={styles.footerActions}>
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
        <Modal visible={exportOpen} onDismiss={() => setExportOpen(false)} contentContainerStyle={[styles.exportModalWrap, { backgroundColor: theme.colors.surface }, isNarrow && styles.exportModalWrapNarrow]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.exportScrollContent}>
            <Text variant="headlineSmall" style={styles.sectionTitle}>Statistik exportieren</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
              Tag {selectedDay} in gewünschtem Format exportieren.
            </Text>
            <View style={[styles.exportSectionBox, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View style={[styles.exportSectionHeader, isNarrow && styles.exportSectionHeaderNarrow]}>
                <Text variant="titleMedium">Tage</Text>
                <Button compact mode="text" onPress={selectAllDays}>
                  Alle Tage
                </Button>
              </View>
              <View style={styles.sectionChipWrap}>
                {[1, 2, 3].map((day) => (
                  <Chip
                    key={day}
                    selected={selectedExportDays.includes(day as DayId)}
                    onPress={() => toggleExportDay(day as DayId)}
                  >
                    Tag {day}
                  </Chip>
                ))}
              </View>
            </View>

            <View style={[styles.exportSectionBox, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View style={[styles.exportSectionHeader, isNarrow && styles.exportSectionHeaderNarrow]}>
                <Text variant="titleMedium">Datenauswahl</Text>
                <Button compact mode="text" onPress={() => setSelectedExportSections(DEFAULT_EXPORT_SECTIONS)}>
                  Alles wählen
                </Button>
              </View>
              <View style={styles.sectionChipWrap}>
                <Chip selected={selectedExportSections.includes('summary')} onPress={() => toggleExportSection('summary')}>Übersicht (Kennzahlen)</Chip>
                <Chip selected={selectedExportSections.includes('products')} onPress={() => toggleExportSection('products')}>Produktliste</Chip>
                <Chip selected={selectedExportSections.includes('bills')} onPress={() => toggleExportSection('bills')}>Bestellungen (gesamt)</Chip>
                <Chip selected={selectedExportSections.includes('lineItems')} onPress={() => toggleExportSection('lineItems')}>Verkaufte Artikel je Bestellung</Chip>
                <Chip selected={selectedExportSections.includes('hourlyRevenue')} onPress={() => toggleExportSection('hourlyRevenue')}>Umsatz nach Stunde</Chip>
                <Chip selected={selectedExportSections.includes('productShare')} onPress={() => toggleExportSection('productShare')}>Anteil je Produkt</Chip>
                <Chip selected={selectedExportSections.includes('dayComparison')} onPress={() => toggleExportSection('dayComparison')}>Vergleich der ausgewählten Tage</Chip>
              </View>
            </View>

            <View style={[styles.exportSectionBox, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text variant="titleMedium">Format</Text>
              <View style={styles.formatPicker}>
                {(['csv', 'xlsx', 'json', 'md', 'txt', 'pdf'] as ExportFormat[]).map((format) => {
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

            <View style={[styles.exportActionRow, isNarrow && styles.exportActionRowNarrow]}>
              <Button style={[styles.exportActionButton, isNarrow && styles.exportActionButtonNarrow]} mode="contained" loading={isExporting} disabled={isExporting} onPress={() => void handleExport(selectedExportFormat)}>
                Jetzt exportieren
              </Button>
              <Button style={[styles.exportActionButton, isNarrow && styles.exportActionButtonNarrow]} mode="contained-tonal" disabled={isExporting} onPress={() => setExportOpen(false)}>Schließen</Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      <Snackbar visible={Boolean(snackbarText)} onDismiss={() => setSnackbarText(null)} duration={2400}>
        <Text>{snackbarText}</Text>
      </Snackbar>
      <Snackbar
        visible={resetUndoVisible}
        onDismiss={() => setResetUndoVisible(false)}
        duration={5000}
        action={{ label: 'Rückgängig', onPress: () => void handleUndoReset() }}
      >
        <Text>Tag {selectedDay} wurde zurückgesetzt</Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  glowTop: { position: 'absolute', left: -130, top: -110, width: 300, height: 300, borderRadius: 999, backgroundColor: 'rgba(111, 214, 182, 0.12)' },
  content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 24, gap: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerRowNarrow: { alignItems: 'flex-start', flexWrap: 'wrap' },
  headerActionsNarrow: { flexWrap: 'wrap' },
  title: { fontWeight: '700' },
  dayRow: { flexDirection: 'row', gap: 10, marginVertical: 4 },
  dayRowNarrow: { flexWrap: 'wrap' },
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
  chartRowSmall: { flexDirection: 'column', alignItems: 'stretch' },
  legendWrap: { minWidth: 280, flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendWrapSmall: { minWidth: 0, width: '100%' },
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
  legendChipSmall: { minWidth: 120, flexBasis: '48%', maxWidth: '48%' },
  legendChipTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colorDot: { width: 12, height: 12, borderRadius: 999 },
  legendName: { fontWeight: '700', flexShrink: 1 },
  hourlyScrollContent: { paddingHorizontal: 2, paddingBottom: 4 },
  hourlyWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 160 },
  hourBarCol: { alignItems: 'center', paddingVertical: 2 },
  hourBarTrack: { justifyContent: 'flex-end', overflow: 'hidden' },
  hourBarFill: {},
  hourLabel: { fontSize: 9, marginTop: 4 },
  hourFadeWrap: {
    position: 'absolute',
    right: 2,
    top: 56,
    height: 84,
    width: 18,
    flexDirection: 'row',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    overflow: 'hidden',
  },
  hourFadeStep: {
    flex: 1,
  },
  hourInfoCard: { marginTop: 12, borderRadius: 12, padding: 10, gap: 4 },
  trendWrap: { gap: 8 },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  trendRowSmall: { flexWrap: 'wrap', justifyContent: 'flex-start' },
  trendDay: { minWidth: 62 },
  footerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  exportModalWrap: { marginHorizontal: 20, borderRadius: 20, padding: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  exportModalWrapNarrow: { marginHorizontal: 10, maxHeight: '92%', padding: 12 },
  exportScrollContent: { gap: 12, paddingBottom: 0 },
  exportSectionBox: { borderRadius: 14, padding: 12, gap: 10 },
  exportSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exportSectionHeaderNarrow: { flexWrap: 'wrap', alignItems: 'flex-start', rowGap: 4 },
  sectionChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exportButtonWrap: { gap: 10 },
  exportActionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  exportActionRowNarrow: { flexWrap: 'wrap', justifyContent: 'flex-start' },
  exportActionButton: { flex: 1 },
  exportActionButtonNarrow: { flexBasis: '100%' },
  formatPicker: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  formatOption: { minWidth: 70, borderRadius: 10, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 10, alignItems: 'center' },
});
