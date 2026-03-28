import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Divider,
  Text,
  useTheme,
} from 'react-native-paper';

import { useAppData } from '@/app/store/AppDataContext';
import type { BillRecord } from '@/app/store/types';
import { formatDateTime, formatEuro } from '@/app/utils/format';

const PAGE_SIZE = 8;

export default function HistoryScreen() {
  const theme = useTheme();
  const { bills, products, removeBill, selectedDay } = useAppData();

  const [page, setPage] = useState(0);

  const orderedBills = useMemo(
    () => [...bills].sort((a, b) => (a.datetime < b.datetime ? 1 : -1)),
    [bills],
  );

  const pageCount = Math.max(1, Math.ceil(orderedBills.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);

  const visibleBills = orderedBills.slice(
    clampedPage * PAGE_SIZE,
    clampedPage * PAGE_SIZE + PAGE_SIZE,
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

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.glowTop} />
      <View style={styles.headerRow}>
        <View style={styles.headerTopRow}>
          <View>
            <Text variant="headlineMedium" style={styles.title}>Bestellverlauf</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Tag {selectedDay} · {orderedBills.length} gespeicherte Bestellungen
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

      <ScrollView contentContainerStyle={styles.content}>
        {visibleBills.map((bill) => (
          <Card key={bill.id} style={[styles.billCard, { backgroundColor: theme.colors.surface }]}> 
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
                {billLines(bill).map((line) => (
                  <Text key={line} variant="bodyMedium">
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
      </ScrollView>

      <View style={styles.pagination}>
        <Button mode="contained-tonal" onPress={() => setPage((prev) => Math.max(0, prev - 1))}>
          Zurück
        </Button>
        <Text variant="bodyMedium">
          Seite {clampedPage + 1} / {pageCount}
        </Text>
        <Button
          mode="contained-tonal"
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
  title: {
    fontWeight: '700',
  },
  content: {
    paddingBottom: 14,
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
});
