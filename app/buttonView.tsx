import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import DragList, { type DragListRenderItemInfo } from 'react-native-draglist';

import { useAppData } from '@/src/store/AppDataContext';
import type { DayId, Product } from '@/src/store/types';
import { formatEuro } from '@/src/utils/format';
import { getProductImageSource } from '@/src/utils/productImages';
const ALL_DAYS: DayId[] = [1, 2, 3];

type FormState = {
  name: string;
  price: string;
  availableDays: DayId[];
};

const EMPTY_FORM: FormState = { name: '', price: '', availableDays: [...ALL_DAYS] };

export default function ProductManagementScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 860;
  const {
    products,
    upsertProduct,
    removeProduct,
    toggleProductStats,
    setProductAvailability,
    updateProductImage,
    reorderProducts,
  } = useAppData();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.sortOrder - b.sortOrder),
    [products],
  );

  const openCreate = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      price: product.price.toFixed(2).replace('.', ','),
      availableDays: product.availableDays,
    });
    setEditorOpen(true);
  };

  const toggleFormDay = (day: DayId) => {
    setForm((prev) => {
      const exists = prev.availableDays.includes(day);
      const next = exists
        ? prev.availableDays.filter((entry) => entry !== day)
        : [...prev.availableDays, day].sort((a, b) => a - b);

      return {
        ...prev,
        availableDays: next.length > 0 ? next : prev.availableDays,
      };
    });
  };

  const toggleProductDay = async (product: Product, day: DayId) => {
    const exists = product.availableDays.includes(day);
    const nextDays = exists
      ? product.availableDays.filter((entry) => entry !== day)
      : [...product.availableDays, day].sort((a, b) => a - b);

    if (nextDays.length === 0) {
      return;
    }

    await setProductAvailability(product.id, nextDays as DayId[]);
  };

  const saveEditor = async () => {
    const numericPrice = Number(form.price.replace(',', '.'));
    if (!form.name.trim() || Number.isNaN(numericPrice) || numericPrice < 0 || form.availableDays.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      await upsertProduct(
        {
          name: form.name,
          price: numericPrice,
          availableDays: form.availableDays,
        },
        editingProduct?.id,
      );

      setEditorOpen(false);
      setForm(EMPTY_FORM);
      setEditingProduct(null);
    } finally {
      setIsSaving(false);
    }
  };

  const pickImage = async (product: Product) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled) {
      await updateProductImage(product.id, result.assets[0].uri);
    }
  };

  const reorderByIndex = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      return;
    }

    const ids = sortedProducts.map((entry) => entry.id);
    if (
      fromIndex < 0 ||
      fromIndex >= ids.length ||
      toIndex < 0 ||
      toIndex >= ids.length
    ) {
      return;
    }

    const nextIds = [...ids];
    const [movedId] = nextIds.splice(fromIndex, 1);
    if (movedId === undefined) {
      return;
    }
    nextIds.splice(toIndex, 0, movedId);

    await reorderProducts(nextIds);
  };

  const renderProductCard = ({ item, onDragStart, onDragEnd, isActive }: DragListRenderItemInfo<Product>) => {
    return (
      <Card
        style={[
          styles.productCard,
          { backgroundColor: theme.colors.surface },
          isActive ? styles.dragActiveCard : undefined,
        ]}
      >
        <Card.Content>
          <View style={[styles.productRow, isNarrow && styles.productRowNarrow]}>
            <Image source={getProductImageSource(item)} style={styles.image} />
            <View style={styles.metaCol}>
              <Text variant="titleMedium" style={styles.productName}>{item.name}</Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.primary }}>
                {formatEuro(item.price)}
              </Text>

              <View style={styles.dayChipWrap}>
                {ALL_DAYS.map((day) => {
                  const selected = item.availableDays.includes(day);
                  return (
                    <Chip
                      key={`${item.id}-${day}`}
                      compact
                      selected={selected}
                      showSelectedCheck={false}
                      onPress={() => {
                        void toggleProductDay(item, day);
                      }}
                      style={{ backgroundColor: selected ? theme.colors.secondary : theme.colors.surfaceVariant }}
                      textStyle={{ color: selected ? theme.colors.onSecondary : theme.colors.onSurface }}
                    >
                      T{day}
                    </Chip>
                  );
                })}
              </View>

              <View style={styles.switchRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  In Statistik anzeigen
                </Text>
                <Switch
                  value={item.includeInStats}
                  onValueChange={() => {
                    void toggleProductStats(item.id);
                  }}
                />
              </View>
            </View>
            <View style={[styles.actionsCol, isNarrow && styles.actionsRowNarrow]}>
              <IconButton
                icon="drag"
                mode="contained-tonal"
                onLongPress={onDragStart}
                onPressOut={onDragEnd}
              />
              <IconButton icon="pencil" mode="contained-tonal" onPress={() => openEdit(item)} />
              <IconButton icon="camera" mode="contained-tonal" onPress={() => void pickImage(item)} />
              <IconButton
                icon="trash-can-outline"
                mode="contained-tonal"
                iconColor={theme.colors.error}
                onPress={() => {
                  Alert.alert(
                    'Produkt löschen?',
                    `${item.name} wird aus der Liste und aus allen gespeicherten Bestellungen entfernt.`,
                    [
                      { text: 'Abbrechen', style: 'cancel' },
                      {
                        text: 'Löschen',
                        style: 'destructive',
                        onPress: () => {
                          void removeProduct(item.id);
                        },
                      },
                    ],
                  );
                }}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.glowTop} />
      <View style={[styles.headerRow, isNarrow && styles.headerRowNarrow]}>
        <View>
          <Text variant="headlineMedium" style={styles.title}>Produkte</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Preise, Bilder, Tage und Statistik-Relevanz verwalten
          </Text>
        </View>
        <View style={[styles.headerActions, isNarrow && styles.headerActionsNarrow]}>
          <Button mode="contained" onPress={openCreate}>Neues Produkt</Button>
          <Button
            mode="contained-tonal"
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }}
          >
            Zurück
          </Button>
        </View>
      </View>

      {editorOpen ? (
        <Card style={[styles.editorCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.dialogContent}>
            <Text variant="titleMedium">{editingProduct ? 'Produkt bearbeiten' : 'Neues Produkt'}</Text>
            <TextInput
              mode="outlined"
              label="Name"
              value={form.name}
              onChangeText={(name) => setForm((prev) => ({ ...prev, name }))}
            />
            <TextInput
              mode="outlined"
              label="Preis"
              value={form.price}
              onChangeText={(price) => setForm((prev) => ({ ...prev, price }))}
              right={<TextInput.Affix text="€" />}
              keyboardType="decimal-pad"
            />
            <View style={styles.dayEditorRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Angeboten an Tag:
              </Text>
              <View style={styles.dayChipWrap}>
                {ALL_DAYS.map((day) => {
                  const selected = form.availableDays.includes(day);
                  return (
                    <Chip
                      key={day}
                      selected={selected}
                      onPress={() => toggleFormDay(day)}
                      showSelectedCheck={false}
                      style={{ backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceVariant }}
                      textStyle={{ color: selected ? theme.colors.onPrimary : theme.colors.onSurface }}
                    >
                      Tag {day}
                    </Chip>
                  );
                })}
              </View>
            </View>
            <View style={styles.editorActions}>
              <Button onPress={() => setEditorOpen(false)} disabled={isSaving}>Abbrechen</Button>
              <Button
                mode="contained"
                loading={isSaving}
                disabled={
                  isSaving ||
                  !form.name.trim() ||
                  Number.isNaN(Number(form.price.replace(',', '.'))) ||
                  Number(form.price.replace(',', '.')) < 0 ||
                  form.availableDays.length === 0
                }
                onPress={() => void saveEditor()}
              >
                Speichern
              </Button>
            </View>
          </Card.Content>
        </Card>
      ) : null}

      <Divider style={styles.listDivider} />
      <Text variant="bodySmall" style={[styles.dragHint, { color: theme.colors.onSurfaceVariant }]}>
        Reihenfolge ändern: Produkt am Griffsymbol gedrückt halten und ziehen.
      </Text>

      {sortedProducts.length > 0 ? (
        <DragList
          data={sortedProducts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProductCard}
          onReordered={(fromIndex, toIndex) => {
            void reorderByIndex(fromIndex, toIndex);
          }}
          containerStyle={styles.listContainer}
          contentContainerStyle={styles.content}
        />
      ) : (
        <View style={styles.content}>
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content>
              <Text variant="titleMedium">Noch keine Produkte vorhanden</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Lege dein erstes Produkt über „Neues Produkt“ an.
              </Text>
            </Card.Content>
          </Card>
        </View>
      )}

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
    right: -80,
    bottom: -120,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(120, 167, 255, 0.14)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  headerRowNarrow: {
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionsNarrow: {
    flexWrap: 'wrap',
  },
  title: {
    fontWeight: '700',
  },
  content: {
    paddingBottom: 18,
    gap: 10,
  },
  listContainer: {
    flex: 1,
  },
  listDivider: {
    marginBottom: 6,
  },
  dragHint: {
    marginBottom: 8,
  },
  editorCard: {
    borderRadius: 14,
    marginBottom: 10,
  },
  editorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  dayEditorRow: {
    gap: 8,
  },
  dayChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productCard: {
    borderRadius: 14,
  },
  dragActiveCard: {
    opacity: 0.9,
  },
  productRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  productRowNarrow: {
    alignItems: 'flex-start',
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: 10,
  },
  metaCol: {
    flex: 1,
    gap: 6,
  },
  productName: {
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  actionsCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  actionsRowNarrow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 0,
    width: 120,
  },
  emptyCard: {
    borderRadius: 14,
  },
  dialogContent: {
    gap: 10,
  },
});
