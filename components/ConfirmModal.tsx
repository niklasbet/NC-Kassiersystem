import { StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Surface, Text, useTheme } from 'react-native-paper';

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'neutral';
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  tone = 'neutral',
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const theme = useTheme();
  const danger = tone === 'danger';

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onCancel} contentContainerStyle={styles.modalWrap}>
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.dot, { backgroundColor: danger ? theme.colors.error : theme.colors.primary }]} />
          <Text variant="headlineSmall" style={styles.title}>{title}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {message}
          </Text>
          <View style={styles.actions}>
            <Button mode="contained-tonal" onPress={onCancel}>{cancelLabel}</Button>
            <Button
              mode="contained"
              onPress={onConfirm}
              buttonColor={danger ? theme.colors.error : theme.colors.primary}
              textColor={danger ? '#2b0f0f' : theme.colors.onPrimary}
            >
              {confirmLabel}
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalWrap: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  title: {
    fontWeight: '700',
  },
  actions: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
