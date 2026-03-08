export const isRevenueCatUninitializedError = (error: unknown): boolean => {
  if (!error) return false;

  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string'
          ? String((error as { message?: unknown }).message)
          : '';

  return message.includes('There is no singleton instance') || message.includes('configure Purchases before trying to get the default instance');
};
