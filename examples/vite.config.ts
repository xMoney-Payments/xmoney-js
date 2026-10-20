import { fileURLToPath, URL } from 'node:url';
import { readFile } from 'node:fs/promises';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const DEMO_CUSTOMER = 'customer-12333';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '');
  const demoApi = (env.VITE_API_BASE || 'https://demo.xmoney.com').replace(/\/$/, '');

  return {
    plugins: [
      tailwindcss(),
      basicSsl(),
      staticExamplesPlugin(),
      savedCardsPlugin(env.VITE_PUBLIC_KEY ?? '', env.VITE_API_KEY ?? ''),
    ],
    resolve: {
      alias: {
        '@xmoney/xmoney-js': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      fs: { allow: ['..'] },
      proxy: {
        '/api/orders': {
          target: demoApi,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});

function staticExamplesPlugin(): Plugin {
  const files = [
    'partials.html',
    'pages/payment-form.html',
    'pages/payment-card.html',
    'pages/pay-with-card.html',
    'pages/wallets.html',
    'pages/lumen.html',
    'pages/hearth.html',
    'pages/pulse.html',
    'pages/merchant-pay.html',
    'pages/update-order.html',
    'pages/cardholder.html',
    'pages/playground.html',
  ];

  return {
    name: 'xmoney-example-html',
    async generateBundle() {
      for (const file of files) {
        const source = await readFile(fileURLToPath(new URL(file, import.meta.url)), 'utf8');
        this.emitFile({ type: 'asset', fileName: file, source });
      }
    },
  };
}

function savedCardsPlugin(publicKey: string, apiKey: string): Plugin {
  return {
    name: 'xmoney-saved-cards',
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res, next) => {
          const path = req.url?.split('?')[0];
          if (path !== '/api/cards' || req.method !== 'POST') {
            next();
            return;
          }
          void writeCards(res, publicKey.trim(), apiKey.trim());
        });
      };
    },
  };
}

async function writeCards(res: JsonResponse, publicKey: string, apiKey: string) {
  try {
    if (!publicKey || !apiKey) {
      send(res, 500, { error: 'Set VITE_PUBLIC_KEY and VITE_API_KEY in examples/.env' });
      return;
    }
    const cards = await listSavedCards(publicKey, apiKey);
    send(res, 200, { cards });
  } catch (cause: unknown) {
    const message = cause instanceof Error ? cause.message : 'Failed to load cards';
    send(res, 500, { error: message });
  }
}

interface JsonResponse {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body: string) => void;
}

function send(res: JsonResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function listSavedCards(publicKey: string, apiKey: string) {
  const host = publicKey.startsWith('pk_live') ? 'https://api.xmoney.com' : 'https://api-stage.xmoney.com';
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  const customerResponse = await fetch(
    `${host}/customer?identifier=${encodeURIComponent(DEMO_CUSTOMER)}`,
    { headers },
  );
  if (customerResponse.status === 404) return [];
  const customerBody = (await customerResponse.json().catch(() => ({}))) as {
    message?: string;
    data?: { id?: number }[];
  };
  if (!customerResponse.ok) {
    throw new Error(customerBody.message || `Customer lookup failed (${customerResponse.status})`);
  }
  const customerId = customerBody.data?.[0]?.id;
  if (!customerId) return [];

  const cardsResponse = await fetch(`${host}/card?customerId=${customerId}`, { headers });
  const cardsBody = (await cardsResponse.json().catch(() => ({}))) as {
    message?: string;
    data?: RawCard[];
  };
  if (!cardsResponse.ok) {
    throw new Error(cardsBody.message || `Card lookup failed (${cardsResponse.status})`);
  }
  return (cardsBody.data ?? []).map(slimCard).filter((card) => card.id > 0);
}

interface RawCard {
  id?: number;
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  type?: string;
  nameOnCard?: string;
  cardHolderCountry?: string;
  cardProvider?: string;
  binInfo?: {
    brand?: string;
    type?: string;
    level?: string;
    countryCode?: string;
    bank?: string;
  };
}

function slimCard(card: RawCard) {
  const bin = card.binInfo;
  return {
    id: card.id ?? 0,
    brand: bin?.brand || card.type || card.cardProvider || 'Card',
    number: card.cardNumber ?? '',
    expiryMonth: card.expiryMonth ?? '',
    expiryYear: card.expiryYear ?? '',
    nameOnCard: card.nameOnCard ?? '',
    funding: bin?.type ?? '',
    level: bin?.level ?? '',
    bank: bin?.bank ?? '',
    country: bin?.countryCode || card.cardHolderCountry || '',
  };
}
