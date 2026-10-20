const released = new WeakSet<object>();

/**
 * Drop a mounted checkout. The SDK also destroys itself after
 * `onPaymentComplete`. A second `destroy()` is a no-op. Call this from
 * both the cancelled-mount path and the effect cleanup.
 */
export function releaseWidget(instance: { destroy: () => void } | null | undefined): void {
  if (!instance || released.has(instance)) return;
  released.add(instance);
  try {
    instance.destroy();
  } catch {
    // The iframe is already gone.
  }
}
