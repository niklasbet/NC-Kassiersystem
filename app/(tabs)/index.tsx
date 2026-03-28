import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Button,
  Card,
  Divider,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';

import { useAppData } from '@/app/store/AppDataContext';
import type { BillItems, Product } from '@/app/store/types';
import { palette } from '@/app/theme/appTheme';
import { formatEuro } from '@/app/utils/format';
import { ConfirmModal } from '@/components/ConfirmModal';
import { getProductImageSource } from '@/app/utils/productImages';

export default function HomeScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isCompactLayout = width < 760;

  const { products, addBill, selectedDay } = useAppData();

  const [draft, setDraft] = useState<BillItems>({});
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [catalogWidth, setCatalogWidth] = useState(0);

  const visibleProducts = useMemo(
    () =>
      products
        .filter((product) => product.availableDays.includes(selectedDay))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [products, selectedDay],
  );

  const gridColumns = useMemo(() => {
    const effectiveWidth = catalogWidth || width * 0.58;
    if (effectiveWidth > 900) {
      return 4;
    }
    if (effectiveWidth > 620) {
      return 3;
    }
    if (effectiveWidth > 430) {
      return 2;
    }
    return 1;
  }, [catalogWidth, width]);

  const cardGap = 12;
  const cardWidth = useMemo(() => {
    if (gridColumns === 1) {
      return undefined;
    }
    const effectiveWidth = catalogWidth || width * 0.58;
    return Math.max(140, (effectiveWidth - cardGap * (gridColumns - 1)) / gridColumns);
  }, [catalogWidth, gridColumns, width]);

  const compactCard = gridColumns >= 3;
  const ultraCompactCard = gridColumns >= 4;

  const total = useMemo(
    () =>
      visibleProducts.reduce((sum, product) => {
        const amount = draft[product.id] ?? 0;
        return sum + amount * product.price;
      }, 0),
    [draft, visibleProducts],
  );

  const orderLines = useMemo(
    () =>
      visibleProducts
        .map((product) => ({ product, amount: draft[product.id] ?? 0 }))
        .filter((entry) => entry.amount > 0),
    [draft, visibleProducts],
  );

  const changeAmount = (product: Product, delta: number) => {
    setDraft((prev) => {
      const current = prev[product.id] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [product.id]: next };
    });
  };

  const completeOrder = async () => {
    await addBill(draft);
    setDraft({});
  };

  const clearOrder = () => {
    setDraft({});
    setConfirmClearOpen(false);
  };

  const onCatalogLayout = (event: LayoutChangeEvent) => {
    setCatalogWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.glowTop} />
      <View style={styles.headerRow}>
        <View>
          <Text variant="headlineMedium" style={styles.title}>
            Kassensystem
          </Text>
        </View>
        <Button mode="contained-tonal" onPress={() => router.push('/buttonView')}>
          Produkte verwalten
        </Button>
      </View>

      <View style={[styles.mainArea, isCompactLayout && styles.mainAreaCompact]}>
        <View
          style={[styles.catalogColumn, isCompactLayout && styles.catalogColumnCompact]}
          onLayout={onCatalogLayout}
        >
          <FlatList
            data={visibleProducts}
            keyExtractor={(item) => item.id.toString()}
            numColumns={gridColumns}
            key={`grid-${gridColumns}`}
            contentContainerStyle={styles.catalogContent}
            columnWrapperStyle={gridColumns === 1 ? undefined : styles.catalogRow}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.productPressable,
                  gridColumns === 1 ? styles.productPressableCompact : styles.productPressableGrid,
                  cardWidth ? { width: cardWidth } : undefined,
                ]}
                onPress={() => changeAmount(item, 1)}
              >
                <Card style={[styles.productCard, ultraCompactCard && styles.productCardUltraCompact, { backgroundColor: theme.colors.surface }]}>
                  <Card.Content>
                    <View style={styles.imageWrap}>
                      <Image
                        source={getProductImageSource(item)}
                        style={[
                          styles.image,
                          ultraCompactCard
                            ? styles.imageUltraCompact
                            : compactCard
                              ? styles.imageCompact
                              : styles.imageRegular,
                        ]}
                      />
                    </View>
                    <Text numberOfLines={1} variant={ultraCompactCard ? 'titleSmall' : 'titleMedium'} style={styles.productName}>
                      {item.name}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text variant={ultraCompactCard ? 'titleSmall' : 'titleMedium'} style={{ color: theme.colors.primary }}>
                        {formatEuro(item.price)}
                      </Text>
                      <View style={styles.amountControls}>
                        <Button
                          compact
                          mode="contained-tonal"
                          onPress={() => changeAmount(item, -1)}
                          style={styles.minusButton}
                        >
                          -
                        </Button>
                        <Surface style={[styles.amountBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
                          <Text variant="labelLarge">{draft[item.id] ?? 0}</Text>
                        </Surface>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              </Pressable>
            )}
            ListEmptyComponent={
              <Surface style={[styles.emptyState, { backgroundColor: theme.colors.surfaceVariant }]}> 
                <Text variant="titleMedium">Keine Produkte für Tag {selectedDay}</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Passe Tage in „Produkte verwalten“ an oder lege ein neues Produkt an.
                </Text>
              </Surface>
            }
          />
        </View>

        <Surface style={[styles.sidePanel, isCompactLayout && styles.sidePanelCompact, { backgroundColor: theme.colors.surface }]}> 
          <Text variant="titleLarge">Aktuelle Bestellung</Text>
          <Divider style={styles.divider} />

          <View style={styles.orderLines}>
            {orderLines.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Keine Artikel ausgewählt.
              </Text>
            ) : (
              <ScrollView contentContainerStyle={styles.orderListContent} showsVerticalScrollIndicator={false}>
                {orderLines.map(({ product, amount }) => (
                  <Surface key={product.id} style={[styles.orderItemCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <View style={styles.orderRowTop}>
                      <Surface style={[styles.qtyBadge, { backgroundColor: theme.colors.primary }]}>
                        <Text variant="labelMedium" style={{ color: theme.colors.onPrimary }}>
                          {amount}
                        </Text>
                      </Surface>
                      <Text variant="titleSmall" style={styles.orderProductName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text variant="titleSmall" style={styles.orderLineTotal}>
                        {formatEuro(amount * product.price)}
                      </Text>
                    </View>
                    <View style={styles.orderRowBottom}>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Einzelpreis
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {formatEuro(product.price)}
                      </Text>
                    </View>
                  </Surface>
                ))}
              </ScrollView>
            )}
          </View>

          <Divider style={styles.divider} />
          <View style={styles.totalRow}>
            <Text variant="titleMedium">Gesamt</Text>
            <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
              {formatEuro(total)}
            </Text>
          </View>

          <Button mode="contained" onPress={completeOrder} disabled={orderLines.length === 0}>
            Bestellung abschließen
          </Button>
          <Button
            mode="contained-tonal"
            buttonColor={palette.danger}
            onPress={() => setConfirmClearOpen(true)}
            textColor="#2d0c0c"
            style={styles.actionSpacing}
            disabled={orderLines.length === 0}
          >
            Bestellung leeren
          </Button>
        </Surface>
      </View>

      <ConfirmModal
        visible={confirmClearOpen}
        title="Bestellung verwerfen?"
        message="Die aktuelle Auswahl wird gelöscht und nicht in die Statistik übernommen."
        confirmLabel="Löschen"
        tone="danger"
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={clearOrder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 44,
    paddingHorizontal: 20,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -50,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(246, 179, 81, 0.14)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  title: {
    fontWeight: '700',
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  mainAreaCompact: {
    flexDirection: 'column',
  },
  catalogColumn: {
    flex: 1.3,
  },
  catalogColumnCompact: {
    flex: 1,
  },
  catalogContent: {
    paddingBottom: 8,
    gap: 8,
  },
  catalogRow: {
    gap: 8,
  },
  productPressable: {
    marginBottom: 8,
  },
  productPressableGrid: {
    width: '48.5%',
  },
  productPressableCompact: {
    width: '100%',
  },
  productCard: {
    borderRadius: 16,
  },
  productCardUltraCompact: {
    borderRadius: 12,
  },
  imageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    resizeMode: 'cover',
  },
  imageRegular: {
    height: 112,
  },
  imageCompact: {
    height: 84,
  },
  imageUltraCompact: {
    height: 66,
  },
  productName: {
    fontWeight: '700',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountBadge: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  amountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  minusButton: {
    minWidth: 34,
  },
  sidePanel: {
    flex: 0.85,
    borderRadius: 18,
    padding: 12,
  },
  sidePanelCompact: {
    flex: 0,
    marginTop: 6,
    marginBottom: 6,
  },
  divider: {
    marginVertical: 8,
  },
  orderLines: {
    flex: 3.8,
    minHeight: 520,
  },
  orderListContent: {
    gap: 8,
    paddingBottom: 4,
  },
  orderItemCard: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  orderRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  orderRowBottom: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qtyBadge: {
    minWidth: 24,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
    alignItems: 'center',
  },
  orderProductName: {
    flex: 1,
  },
  orderLineTotal: {
    flexShrink: 0,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  actionSpacing: {
    marginTop: 6,
  },
  emptyState: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
});
