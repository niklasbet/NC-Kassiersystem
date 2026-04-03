import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, LayoutChangeEvent, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  Button,
  Card,
  Divider,
  Text,
  useTheme,
} from 'react-native-paper';

import { useAppData } from '@/src/store/AppDataContext';
import type { BillRecord } from '@/src/store/types';
import { formatDateTime, formatEuro } from '@/src/utils/format';

const CARD_GAP = 10;
const MIN_PAGE_SIZE = 1;

export default function HistoryScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { bills, products, dayDefinitions, removeBill, selectedDay } = useAppData();
  const isNarrow = width < 680;
  const selectedDayLabel = dayDefinitions.find((entry) => entry.id === selectedDay)?.label ?? `Tag ${selectedDay}`;

  const [page, setPage] = useState(0);
  const [listHeight, setListHeight] = useState(0);
  const [measuredCardHeight, setMeasuredCardHeight] = useState(0);

  const orderedBills = useMemo(
    () => [...bills].sort((a, b) => (a.datetime < b.datetime ? 1 : -1)),
    [bills],
  );

  const pageSize = useMemo(() => {
    if (listHeight <= 0 || measuredCardHeight <= 0) {
      return 5;
    }
    return Math.max(
      MIN_PAGE_SIZE,
      Math.floor((listHeight + CARD_GAP) / (measuredCardHeight + CARD_GAP)),
    );
  }, [listHeight, measuredCardHeight]);

  const pageCount = Math.max(1, Math.ceil(orderedBills.length / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);

  useEffect(() => {
    if (page !== clampedPage) {
      setPage(clampedPage);
    }
  }, [clampedPage, page]);

  const visibleBills = orderedBills.slice(
    clampedPage * pageSize,
    clampedPage * pageSize + pageSize,
  );

  const billLines = (bill: BillRecord) =>
    Object.entries(bill.items)
      .filter(([, amount]) => amount > 0)
      .map(([productIdRaw, amount]) => {
        const productId = Number(productIdRaw);
        const product = products.find((entry) => entry.id === productId);
        const name = product?.name ?? `Produkt #${productId}`;
        const price = product ? formatEuro(product.price * amount) : '-';
        return `${amount}x ${name} · ${price}`;
      });

  const onListLayout = (event: LayoutChangeEvent) => {
    setListHeight(event.nativeEvent.layout.height);
  };

  const onBillCardLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0 && (measuredCardHeight === 0 || Math.abs(measuredCardHeight - height) > 2)) {
      setMeasuredCardHeight(height);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.glowTop} />
      <View style={styles.headerRow}>
        <View style={[styles.headerTopRow, isNarrow && styles.headerTopRowNarrow]}>
          <View>
            <Text variant="headlineMedium" style={styles.title}>Bestellverlauf</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {selectedDayLabel} · {orderedBills.length} gespeicherte Bestellungen
            </Text>
          </View>
          <Button
            mode="contained-tonal"
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/explore');
              }
            }}
          >
            Zurück
          </Button>
        </View>
      </View>

      <View style={styles.content} onLayout={onListLayout}>
        {visibleBills.map((bill) => (
          <Card
            key={bill.id}
            style={[styles.billCard, { backgroundColor: theme.colors.surface }]}
            onLayout={onBillCardLayout}
          >
            <Card.Content>
              <View style={styles.billHeader}>
                <Text variant="titleMedium">{formatDateTime(bill.datetime)}</Text>
                <Button
                  mode="text"
                  compact
                  textColor={theme.colors.error}
                  onPress={() => {
                    Alert.alert(
                      'Bestellung löschen?',
                      'Dieser Eintrag wird dauerhaft entfernt.',
                      [
                        { text: 'Abbrechen', style: 'cancel' },
                        {
                          text: 'Löschen',
                          style: 'destructive',
                          onPress: () => {
                            void removeBill(bill.id);
                          },
                        },
                      ],
                    );
                  }}
                >
                  Löschen
                </Button>
              </View>
              <Divider style={styles.divider} />

              <View style={styles.lineList}>
                {billLines(bill).map((line, index) => (
                  <Text key={`${bill.id}-${index}`} variant="bodySmall" numberOfLines={1}>
                    {line}
                  </Text>
                ))}
              </View>

              <View style={styles.totalRow}>
                <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Gesamt
                </Text>
                <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
                  {formatEuro(bill.total)}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}

        {orderedBills.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surfaceVariant }]}> 
            <Card.Content>
              <Text variant="titleMedium">Noch keine Bestellungen vorhanden</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Sobald du in der Kasse eine Bestellung abschließt, erscheint sie hier.
              </Text>
            </Card.Content>
          </Card>
        ) : null}
      </View>

      <View style={[styles.pagination, isNarrow && styles.paginationNarrow]}>
        <Button
          mode="contained-tonal"
          disabled={clampedPage === 0}
          onPress={() => setPage((prev) => Math.max(0, prev - 1))}
        >
          Zurück
        </Button>
        <Text variant="bodyMedium">
          Seite {clampedPage + 1} / {pageCount}
        </Text>
        <Button
          mode="contained-tonal"
          disabled={clampedPage >= pageCount - 1}
          onPress={() => setPage((prev) => Math.min(pageCount - 1, prev + 1))}
        >
          Weiter
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 58,
    paddingHorizontal: 20,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(239, 106, 106, 0.12)',
  },
  headerRow: {
    marginBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  headerTopRowNarrow: {
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  title: {
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingBottom: 10,
    gap: 10,
  },
  billCard: {
    borderRadius: 14,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    marginVertical: 8,
  },
  lineList: {
    gap: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  emptyCard: {
    borderRadius: 14,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    paddingTop: 8,
    gap: 12,
  },
  paginationNarrow: {
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
