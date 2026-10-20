import type { OrderUpdate, OrderUpdateResult } from '@xmoney/xmoney-js';
import { secretsError } from './config';
import { createPaymentIntent, type DemoOrder } from './demo-backend';
import { errorText } from './errors';

export interface SampleOrderState {
  order: DemoOrder | null;
  error: string | null;
  loading: boolean;
}

export interface LiveOrderState {
  mountOrder: DemoOrder | null;
  error: string | null;
  preparing: boolean;
  updating: boolean;
}

export interface OrderUpdater {
  updateOrder: (order: OrderUpdate) => Promise<OrderUpdateResult>;
}

export interface LiveOrderInput {
  amountMinor: number;
  description: string;
  resetKey: string;
}

export function loadSampleOrder(
  amountMinor: number,
  description: string,
  onChange: (state: SampleOrderState) => void,
): { reload: () => void; stop: () => void } {
  let current = 0;
  let stopped = false;

  function run() {
    const id = ++current;
    const blocked = secretsError();
    if (blocked) {
      onChange({ order: null, error: blocked, loading: false });
      return;
    }
    onChange({ order: null, error: null, loading: true });
    createPaymentIntent(amountMinor, description)
      .then((order) => {
        if (id === current && !stopped) onChange({ order, error: null, loading: false });
      })
      .catch((cause: unknown) => {
        if (id === current && !stopped) onChange({ order: null, error: errorText(cause), loading: false });
      });
  }

  run();
  return {
    reload: run,
    stop: () => {
      stopped = true;
      current += 1;
    },
  };
}

/**
 * Creates an order for `amountMinor`, then keeps that mounted form and calls
 * `updateOrder` when the amount or description changes. Passing `0` tears the
 * form down. A cover should sit on the form while `updating` is true.
 */
export function watchLiveOrder(
  read: () => LiveOrderInput,
  updater: () => OrderUpdater | null,
  onChange: (state: LiveOrderState) => void,
): { sync: () => void; stop: () => void } {
  let seq = 0;
  let bound = false;
  let epoch = read().resetKey;
  let timer = 0;
  let stopped = false;
  const state: LiveOrderState = {
    mountOrder: null,
    error: null,
    preparing: false,
    updating: false,
  };

  function emit() {
    if (!stopped) onChange({ ...state, mountOrder: state.mountOrder });
  }

  function run() {
    window.clearTimeout(timer);
    const id = ++seq;
    const input = read();
    if (epoch !== input.resetKey) {
      epoch = input.resetKey;
      bound = false;
      state.mountOrder = null;
    }
    if (input.amountMinor <= 0) {
      bound = false;
      state.mountOrder = null;
      state.preparing = false;
      state.updating = false;
      emit();
      return;
    }

    const blocked = secretsError();
    if (blocked) {
      state.error = blocked;
      state.preparing = false;
      state.updating = false;
      emit();
      return;
    }

    const alreadyBound = bound;
    if (alreadyBound) state.updating = true;
    else state.preparing = true;
    state.error = null;
    emit();

    timer = window.setTimeout(() => {
      void (async () => {
        try {
          const next = await createPaymentIntent(input.amountMinor, input.description);
          if (seq !== id || stopped) return;
          if (!bound) {
            bound = true;
            state.mountOrder = next;
            return;
          }
          const result = await updater()?.updateOrder({
            orderPayload: next.payload,
            orderChecksum: next.checksum,
          });
          if (seq !== id || stopped) return;
          if (result && !result.success) {
            state.error = result.error || 'Could not update the order';
          }
        } catch (cause: unknown) {
          if (seq !== id || stopped) return;
          state.error = errorText(cause);
        } finally {
          if (seq === id && !stopped) {
            state.preparing = false;
            state.updating = false;
            emit();
          }
        }
      })();
    }, alreadyBound ? 300 : 0);
  }

  run();
  return {
    sync: run,
    stop: () => {
      stopped = true;
      window.clearTimeout(timer);
      seq += 1;
    },
  };
}
