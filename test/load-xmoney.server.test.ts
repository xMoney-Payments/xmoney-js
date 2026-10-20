/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';

import { loadXMoney } from '../src/load-xmoney';

describe('loadXMoney on the server', () => {
  it('does not touch document', async () => {
    expect(typeof document).toBe('undefined');
    await expect(loadXMoney()).rejects.toThrow(/browser/);
  });
});
