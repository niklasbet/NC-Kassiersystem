import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
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
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAppData } from '@/app/store/AppDataContext';
import type { DayId, Product } from '@/app/store/types';
import { formatEuro } from '@/app/utils/format';
import { getProductImageSource } from '@/app/utils/productImages';
const ALL_DAYS: DayId[] = [1, 2, 3];

type FormState = {
  name: string;
  price: string;
  availableDays: DayId[];
};

const EMPTY_FORM: FormState = { name: '', price: '', availableDays: [...ALL_DAYS] };

export default function ProductManagementScreen() {
  const theme = useTheme();
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

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <View style={styles.glowTop} />
      <View style={styles.headerRow}>
        <View>
          <Text variant="headlineMedium" style={styles.title}>Produkte</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Preise, Bilder, Tage und Statistik-Relevanz verwalten
          </Text>
        </View>
        <View style={styles.headerActions}>
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
              <Button onPress={() => setEditorOpen(false)}>Abbrechen</Button>
              <Button mode="contained" onPress={() => void saveEditor()}>Speichern</Button>
            </View>
          </Card.Content>
        </Card>
      ) : null}

      <Divider style={styles.listDivider} />

      <GestureHandlerRootView style={styles.listRoot}>
        <DraggableFlatList
          data={sortedProducts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.content}
          onDragEnd={({ data }) => {
            void reorderProducts(data.map((item) => item.id));
          }}
          activationDistance={8}
          renderItem={({ item, drag, isActive }: RenderItemParams<Product>) => (
            <Card
              key={item.id}
              style={[
                styles.productCard,
                { backgroundColor: theme.colors.surface },
                isActive ? styles.dragActiveCard : undefined,
              ]}
            >
              <Card.Content>
                <View style={styles.productRow}>
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
                  <View style={styles.actionsCol}>
                    <IconButton
                      icon="drag"
                      mode="contained-tonal"
                      onLongPress={drag}
                      onPressIn={drag}
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
          )}
          ListEmptyComponent={
            <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Card.Content>
                <Text variant="titleMedium">Noch keine Produkte vorhanden</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Lege dein erstes Produkt über „Neues Produkt“ an.
                </Text>
              </Card.Content>
            </Card>
          }
        />
      </GestureHandlerRootView>

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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontWeight: '700',
  },
  content: {
    paddingBottom: 18,
    gap: 10,
  },
  listRoot: {
    flex: 1,
  },
  listDivider: {
    marginBottom: 10,
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
  emptyCard: {
    borderRadius: 14,
  },
  dialogContent: {
    gap: 10,
  },
});
