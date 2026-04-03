import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Keyboard,
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
  IconButton,
  Modal,
  Portal,
  Snackbar,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppData } from '@/src/store/AppDataContext';
import type { BillItems, Product } from '@/src/store/types';
import { palette } from '@/src/theme/appTheme';
import { formatEuro } from '@/src/utils/format';
import { ConfirmModal } from '@/components/ConfirmModal';
import { getProductImageSource } from '@/src/utils/productImages';

export default function HomeScreen() {
  const ONBOARDING_SEEN_KEY = 'kasse_onboarding_seen_v1';
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const isCompactLayout = width < 760;
  const isNarrowHeader = width < 940;
  const isSmallScreen = width < 560;
  const isTabletWide = width >= 820;

  const { products, dayDefinitions, addBill, selectedDay } = useAppData();

  const [draft, setDraft] = useState<BillItems>({});
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [undoClearSnapshot, setUndoClearSnapshot] = useState<BillItems | null>(null);
  const [undoClearVisible, setUndoClearVisible] = useState(false);
  const [catalogWidth, setCatalogWidth] = useState(0);

  const visibleProducts = useMemo(() => {
    const base = [...products].sort((a, b) => a.sortOrder - b.sortOrder);
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return base;
    }
    return base.filter((product) => product.name.toLowerCase().includes(query));
  }, [products, searchQuery]);

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const gridColumns = useMemo(() => {
    const effectiveWidth = catalogWidth || width * (isCompactLayout ? 1 : 0.58);
    if (isTabletWide && effectiveWidth > 760) {
      return 4;
    }
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
  }, [catalogWidth, width, isCompactLayout, isTabletWide]);

  const cardGap = 12;
  const cardWidth = useMemo(() => {
    if (gridColumns === 1) {
      return undefined;
    }
    const effectiveWidth = catalogWidth || width * (isCompactLayout ? 1 : 0.58);
    return Math.max(140, (effectiveWidth - cardGap * (gridColumns - 1)) / gridColumns);
  }, [catalogWidth, gridColumns, width, isCompactLayout]);

  const compactCard = gridColumns >= 3;
  const ultraCompactCard = gridColumns >= 4;

  const total = useMemo(() => {
    return Object.entries(draft).reduce((sum, [productIdRaw, amount]) => {
      const productId = Number(productIdRaw);
      const product = productById.get(productId);
      if (!product || amount <= 0) {
        return sum;
      }
      return sum + amount * product.price;
    }, 0);
  }, [draft, productById]);

  const orderLines = useMemo(
    () => {
      return Object.entries(draft)
        .map(([productIdRaw, amount]) => {
          const productId = Number(productIdRaw);
          const product = productById.get(productId);
          if (!product) {
            return null;
          }
          return { product, amount };
        })
        .filter((entry): entry is { product: Product; amount: number } => Boolean(entry && entry.amount > 0))
        .sort((a, b) => a.product.sortOrder - b.product.sortOrder);
    },
    [draft, productById],
  );

  const changeAmount = (product: Product, delta: number) => {
    setDraft((prev) => {
      const current = prev[product.id] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [product.id]: next };
    });
  };

  const completeOrder = async () => {
    if (orderLines.length === 0) {
      return;
    }
    await addBill(draft);
    setDraft({});
  };

  const clearOrder = () => {
    setUndoClearSnapshot(draft);
    setUndoClearVisible(true);
    setDraft({});
    setConfirmClearOpen(false);
  };

  const restoreClearedOrder = () => {
    if (undoClearSnapshot) {
      setDraft(undoClearSnapshot);
    }
    setUndoClearVisible(false);
    setUndoClearSnapshot(null);
  };

  useEffect(() => {
    let mounted = true;
    const hydrateOnboarding = async () => {
      const seen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
      if (mounted && seen !== '1') {
        setShowOnboarding(true);
      }
    };
    void hydrateOnboarding();
    return () => {
      mounted = false;
    };
  }, []);

  const closeOnboarding = async () => {
    setShowOnboarding(false);
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, '1');
  };

  const onCatalogLayout = (event: LayoutChangeEvent) => {
    setCatalogWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.screen, isSmallScreen && styles.screenSmall, { backgroundColor: theme.colors.background }]}>
      <View style={styles.glowTop} />
      <View style={[styles.headerRow, isNarrowHeader && styles.headerRowNarrow]}>
        <View>
          <Text variant={isSmallScreen ? 'titleLarge' : 'headlineMedium'} style={styles.title}>
            Kassensystem
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            Aktueller Tag: {dayDefinitions.find((entry) => entry.id === selectedDay)?.label ?? `Tag ${selectedDay}`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Button
            compact={isNarrowHeader}
            mode="contained-tonal"
            style={isNarrowHeader ? styles.manageButtonNarrow : undefined}
            onPress={() => router.push('/buttonView')}
          >
            Produkte verwalten
          </Button>
          <IconButton
            icon="help-circle-outline"
            mode="contained-tonal"
            size={18}
            onPress={() => setShowOnboarding(true)}
          />
        </View>
      </View>

      <View style={[styles.mainArea, isCompactLayout && styles.mainAreaCompact]}>
        <View
          style={[
            styles.catalogColumn,
            isCompactLayout && styles.catalogColumnCompact,
          ]}
          onLayout={onCatalogLayout}
        >
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 6 }}>
            Ausgegraute Produkte sind am gewählten Tag nicht verfügbar.
          </Text>
          <TextInput
            mode="outlined"
            dense
            placeholder="Produkte suchen..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            blurOnSubmit
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            onBlur={Keyboard.dismiss}
            style={styles.searchInput}
            right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} /> : undefined}
          />
          <FlatList
            data={visibleProducts}
            keyExtractor={(item) => item.id.toString()}
            numColumns={gridColumns}
            key={`grid-${gridColumns}`}
            contentContainerStyle={styles.catalogContent}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
            columnWrapperStyle={gridColumns === 1 ? undefined : styles.catalogRow}
            renderItem={({ item }) => (
              (() => {
                const isAvailableToday = item.availableDays.includes(selectedDay);
                return (
              <Pressable
                style={[
                  styles.productPressable,
                  gridColumns === 1 ? styles.productPressableCompact : styles.productPressableGrid,
                  cardWidth ? { width: cardWidth } : undefined,
                ]}
                onPress={() => {
                  Keyboard.dismiss();
                  if (isAvailableToday) {
                    changeAmount(item, 1);
                  }
                }}
                disabled={!isAvailableToday}
              >
                <Card
                  style={[
                    styles.productCard,
                    ultraCompactCard && styles.productCardUltraCompact,
                    { backgroundColor: theme.colors.surface },
                    !isAvailableToday && styles.unavailableCard,
                  ]}
                >
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
                    <Text
                      numberOfLines={1}
                      variant={ultraCompactCard ? 'titleSmall' : 'titleMedium'}
                      style={[styles.productName, !isAvailableToday && styles.unavailableText]}
                    >
                      {item.name}
                    </Text>
                    <View style={styles.priceRow}>
                      <Text
                        variant={ultraCompactCard ? 'titleSmall' : 'titleMedium'}
                        style={{ color: isAvailableToday ? theme.colors.primary : theme.colors.onSurfaceVariant }}
                      >
                        {formatEuro(item.price)}
                      </Text>
                      <View style={styles.amountControls}>
                        <Button
                          compact
                          mode="contained-tonal"
                          disabled={!isAvailableToday || (draft[item.id] ?? 0) === 0}
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
                );
              })()
            )}
            ListEmptyComponent={
              <Surface style={[styles.emptyState, { backgroundColor: theme.colors.surfaceVariant }]}> 
                <Text variant="titleMedium">
                  Keine Produkte für {dayDefinitions.find((entry) => entry.id === selectedDay)?.label ?? `Tag ${selectedDay}`}
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Passe Tage in „Produkte verwalten“ an oder lege ein neues Produkt an.
                </Text>
              </Surface>
            }
          />
        </View>

        {!isCompactLayout ? (
          <Surface style={[styles.sidePanel, { backgroundColor: theme.colors.surface }]}>
            <Text variant={isSmallScreen ? 'titleMedium' : 'titleLarge'}>Aktuelle Bestellung</Text>
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
                        <Text variant={isSmallScreen ? 'bodyMedium' : 'titleSmall'} style={styles.orderProductName} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text variant={isSmallScreen ? 'bodyMedium' : 'titleSmall'} style={styles.orderLineTotal}>
                          {formatEuro(amount * product.price)}
                        </Text>
                      </View>
                      <View style={styles.orderRowBottom}>
                        <View style={styles.orderUnitPriceWrap}>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            Einzelpreis
                          </Text>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {formatEuro(product.price)}
                          </Text>
                        </View>
                        <View style={styles.orderInlineActions}>
                          <IconButton
                            icon="minus"
                            size={14}
                            mode="contained-tonal"
                            onPress={() => changeAmount(product, -1)}
                          />
                          <IconButton
                            icon="plus"
                            size={14}
                            mode="contained-tonal"
                            onPress={() => changeAmount(product, 1)}
                          />
                        </View>
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

            <Button mode="contained" compact style={isSmallScreen ? styles.bottomActionButtonSmall : undefined} onPress={completeOrder} disabled={orderLines.length === 0}>
              Bestellung abschließen
            </Button>
            <Button
              mode="contained-tonal"
              compact
              buttonColor={palette.danger}
              onPress={() => setConfirmClearOpen(true)}
              textColor="#2d0c0c"
              style={[styles.actionSpacing, isSmallScreen && styles.bottomActionButtonSmall]}
              disabled={orderLines.length === 0}
            >
              Bestellung leeren
            </Button>
          </Surface>
        ) : null}
      </View>

      {isCompactLayout ? (
        <>
          <Portal>
            <Modal
              visible={orderModalOpen}
              onDismiss={() => setOrderModalOpen(false)}
              contentContainerStyle={[
                styles.orderModalWrap,
                { backgroundColor: theme.colors.surface, maxHeight: Math.min(height * 0.86, 680) },
              ]}
            >
              <Text variant="titleLarge">Aktuelle Bestellung</Text>
              <Divider style={styles.divider} />
              <View style={[styles.orderModalListArea, { maxHeight: Math.min(height * 0.52, 380) }]}>
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
                          <Text variant="bodyMedium" style={styles.orderProductName} numberOfLines={1}>
                            {product.name}
                          </Text>
                          <Text variant="bodyMedium" style={styles.orderLineTotal}>
                            {formatEuro(amount * product.price)}
                          </Text>
                        </View>
                        <View style={styles.orderRowBottom}>
                          <View style={styles.orderUnitPriceWrap}>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                              Einzelpreis
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                              {formatEuro(product.price)}
                            </Text>
                          </View>
                          <View style={styles.orderInlineActions}>
                            <IconButton icon="minus" size={14} mode="contained-tonal" onPress={() => changeAmount(product, -1)} />
                            <IconButton icon="plus" size={14} mode="contained-tonal" onPress={() => changeAmount(product, 1)} />
                          </View>
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
              <Button
                mode="contained"
                compact
                onPress={() => {
                  void completeOrder();
                  setOrderModalOpen(false);
                }}
                disabled={orderLines.length === 0}
              >
                Bestellung abschließen
              </Button>
              <Button
                mode="contained-tonal"
                compact
                buttonColor={palette.danger}
                onPress={() => setConfirmClearOpen(true)}
                textColor="#2d0c0c"
                style={styles.actionSpacing}
                disabled={orderLines.length === 0}
              >
                Bestellung leeren
              </Button>
            </Modal>
          </Portal>

          <View style={styles.compactOrderFabWrap}>
            <Button mode="contained" icon="receipt-text" onPress={() => setOrderModalOpen(true)}>
              Bestellung ({orderLines.length}) · {formatEuro(total)}
            </Button>
          </View>
        </>
      ) : null}

      <ConfirmModal
        visible={confirmClearOpen}
        title="Bestellung verwerfen?"
        message="Die aktuelle Auswahl wird gelöscht und nicht in die Statistik übernommen."
        confirmLabel="Löschen"
        tone="danger"
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={clearOrder}
      />

      <Portal>
        <Modal
          visible={showOnboarding}
          onDismiss={() => void closeOnboarding()}
          contentContainerStyle={[styles.onboardingModal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={styles.title}>Hinweise zur Nutzung</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Tippe auf ein Produkt, um es zur aktuellen Bestellung hinzuzufügen.
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Auf kleineren Displays öffnet „Bestellung (...)“ die kompakte Bestellansicht.
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Statistiken und Exportfunktionen findest du im Tab „Statistik“.
          </Text>
          <Button mode="contained" onPress={() => void closeOnboarding()}>
            Schließen
          </Button>
        </Modal>
      </Portal>

      <Snackbar
        visible={undoClearVisible}
        onDismiss={() => setUndoClearVisible(false)}
        duration={5000}
        action={{ label: 'Rückgängig', onPress: restoreClearedOrder }}
      >
        Bestellung geleert
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 44,
    paddingHorizontal: 20,
  },
  screenSmall: {
    paddingHorizontal: 12,
    paddingTop: 36,
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
  headerRowNarrow: {
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 2,
  },
  manageButtonNarrow: {
    alignSelf: 'flex-start',
  },
  title: {
    fontWeight: '700',
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'stretch',
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
  searchInput: {
    marginBottom: 8,
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
  unavailableCard: {
    opacity: 0.55,
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
  unavailableText: {
    textDecorationLine: 'line-through',
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
    height: '100%',
    borderRadius: 18,
    padding: 12,
  },
  sidePanelCompact: {
    flex: 1,
    minHeight: 360,
    marginTop: 2,
    marginBottom: 2,
  },
  divider: {
    marginVertical: 6,
  },
  orderLines: {
    flex: 1.45,
    flexGrow: 1,
    minHeight: 220,
  },
  orderListContent: {
    gap: 8,
    paddingBottom: 4,
  },
  orderItemCard: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  orderRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  orderRowBottom: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  orderUnitPriceWrap: {
    flex: 1,
    gap: 2,
  },
  orderInlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  qtyBadge: {
    minWidth: 24,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 0,
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
    marginBottom: 4,
  },
  actionSpacing: {
    marginTop: 2,
  },
  bottomActionButtonSmall: {
    minHeight: 44,
  },
  emptyState: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  orderModalWrap: {
    marginHorizontal: 12,
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  orderModalListArea: {
    minHeight: 120,
  },
  compactOrderFabWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  onboardingModal: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
});
