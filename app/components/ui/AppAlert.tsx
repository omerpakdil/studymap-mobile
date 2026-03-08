import { LinearGradient } from 'expo-linear-gradient';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export type AppAlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export type AppAlertOptions = {
  cancelable?: boolean;
  onDismiss?: () => void;
};

type AppAlertRequest = {
  title: string;
  message?: string;
  buttons?: AppAlertButton[];
  options?: AppAlertOptions;
};

type AppAlertContextValue = {
  showAlert: (
    title: string,
    message?: string,
    buttons?: AppAlertButton[],
    options?: AppAlertOptions
  ) => void;
};

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

const COLORS = {
  overlay: 'rgba(3,10,18,0.42)',
  card: 'rgba(255,255,255,0.97)',
  cardBorder: 'rgba(15,157,140,0.18)',
  title: '#0A1628',
  body: '#4A6270',
  muted: '#8FA8B2',
  tealA: '#0F9D8C',
  tealB: '#13B5A2',
  tealSoft: 'rgba(15,157,140,0.11)',
  danger: '#E11D48',
  dangerSoft: 'rgba(225,29,72,0.10)',
  white: '#FFFFFF',
};

function AppAlertHost({
  request,
  onClose,
}: {
  request: AppAlertRequest | null;
  onClose: (button?: AppAlertButton) => void;
}) {
  if (!request) return null;

  const buttons = request.buttons?.length
    ? request.buttons
    : [{ text: 'OK', style: 'default' as const }];

  const isCancelable = request.options?.cancelable ?? buttons.some((b) => b.style === 'cancel');

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => isCancelable && onClose()}>
      <Pressable
        style={styles.overlay}
        onPress={() => {
          if (!isCancelable) return;
          request.options?.onDismiss?.();
          onClose();
        }}
      >
        <Pressable style={styles.card}>
          <View style={styles.handle} />
          <Text style={styles.title}>{request.title}</Text>
          {!!request.message && <Text style={styles.body}>{request.message}</Text>}

          <View style={styles.buttonColumn}>
            {buttons.map((button, idx) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              return (
                <TouchableOpacity
                  key={`${button.text}-${idx}`}
                  activeOpacity={0.85}
                  onPress={() => onClose(button)}
                  style={[
                    styles.button,
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive,
                  ]}
                >
                  {!isCancel && !isDestructive ? (
                    <LinearGradient
                      colors={[COLORS.tealA, COLORS.tealB]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.buttonText,
                      (isCancel || isDestructive) && styles.buttonTextAlt,
                      isDestructive && styles.buttonTextDanger,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const queueRef = useRef<AppAlertRequest[]>([]);
  const [current, setCurrent] = useState<AppAlertRequest | null>(null);

  const flush = useCallback(() => {
    if (current || queueRef.current.length === 0) return;
    const [next, ...rest] = queueRef.current;
    queueRef.current = rest;
    setCurrent(next);
  }, [current]);

  const showAlert = useCallback<AppAlertContextValue['showAlert']>((title, message, buttons, options) => {
    queueRef.current.push({ title, message, buttons, options });
    setTimeout(flush, 0);
  }, [flush]);

  const closeCurrent = useCallback((button?: AppAlertButton) => {
    setCurrent((prev) => {
      if (!prev) return prev;
      if (button?.onPress) {
        requestAnimationFrame(() => button.onPress?.());
      }
      if (!button && prev.options?.onDismiss) {
        requestAnimationFrame(() => prev.options?.onDismiss?.());
      }
      return null;
    });

    requestAnimationFrame(() => {
      if (queueRef.current.length > 0) {
        const [next, ...rest] = queueRef.current;
        queueRef.current = rest;
        setCurrent(next);
      }
    });
  }, []);

  const value = useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <AppAlertContext.Provider value={value}>
      {children}
      <AppAlertHost request={current} onClose={closeCurrent} />
    </AppAlertContext.Provider>
  );
}

export function useAppAlert(): AppAlertContextValue {
  const ctx = useContext(AppAlertContext);
  if (!ctx) {
    throw new Error('useAppAlert must be used within AppAlertProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
  },
  handle: {
    width: 34,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.10)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: COLORS.title,
    textAlign: 'center',
  },
  body: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.body,
    textAlign: 'center',
  },
  buttonColumn: {
    marginTop: 16,
    gap: 10,
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonCancel: {
    backgroundColor: COLORS.tealSoft,
  },
  buttonDestructive: {
    backgroundColor: COLORS.dangerSoft,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
  buttonTextAlt: {
    color: COLORS.title,
  },
  buttonTextDanger: {
    color: COLORS.danger,
  },
});
