export interface Product {
  id: string;
  name: string;
  category: string;
  blurb: string;
  priceMinor: number;
  image: string;
}

export interface Brand {
  id: string;
  name: string;
  tagline: string;
  emptyHint: string;
  /** Page chrome: buttons and highlights. */
  accent: string;
  onAccent: string;
  /** SDK `colorPrimary`. Pulse uses the dark lime so type stays readable. */
  primary: string;
  products: Product[];
}

export interface Line {
  product: Product;
  quantity: number;
  lineTotalMinor: number;
}

export const lumen: Brand = {
  id: 'lumen',
  name: 'Lumen',
  tagline: 'Modern essentials. Add a piece, then check out.',
  emptyHint: 'Add a few Lumen pieces from the store, then check out.',
  accent: '#7C4DFF',
  onAccent: '#FFFFFF',
  primary: '#7C4DFF',
  products: [
    { id: 'earbuds', name: 'Aura Earbuds', category: 'Audio', blurb: 'Spatial audio, 32-hour case', priceMinor: 12900, image: 'product_earbuds.webp' },
    { id: 'lamp', name: 'Arc Desk Lamp', category: 'Lighting', blurb: 'Dimmable, brushed aluminum', priceMinor: 8900, image: 'product_lamp.webp' },
    { id: 'pour-over', name: 'Stone Pour-Over', category: 'Kitchen', blurb: 'Matte ceramic, 600 ml', priceMinor: 4200, image: 'product_pourover.webp' },
    { id: 'throw', name: 'Merino Throw', category: 'Home', blurb: 'Undyed wool, 140 × 200', priceMinor: 7500, image: 'product_throw.webp' },
    { id: 'notebooks', name: 'Oak Notebooks', category: 'Stationery', blurb: 'Set of three, linen cover', priceMinor: 2400, image: 'product_notebooks.webp' },
    { id: 'weekender', name: 'Canvas Weekender', category: 'Travel', blurb: 'Vegetable-tanned straps', priceMinor: 11800, image: 'product_weekender.webp' },
    { id: 'diffuser', name: 'Ceramic Diffuser', category: 'Wellness', blurb: 'Ultrasonic, 4-hour timer', priceMinor: 5400, image: 'product_diffuser.webp' },
    { id: 'bottle', name: 'Steel Bottle', category: 'Everyday', blurb: 'Double-wall, 750 ml', priceMinor: 3200, image: 'product_bottle.webp' },
  ],
};

export const hearth: Brand = {
  id: 'hearth',
  name: 'Hearth',
  tagline: 'Neighbourhood café. Add from the menu, then check out.',
  emptyHint: 'Add a coffee or a plate from the menu, then open checkout.',
  accent: '#C45C26',
  onAccent: '#FFFFFF',
  primary: '#C45C26',
  products: [
    { id: 'espresso', name: 'House Espresso', category: 'Drinks', blurb: 'Single origin, 18g', priceMinor: 350, image: 'product_espresso.webp' },
    { id: 'cortado', name: 'Oat Cortado', category: 'Drinks', blurb: 'Equal parts, steamed oat', priceMinor: 420, image: 'product_cortado.webp' },
    { id: 'cold-brew', name: 'Cold Brew', category: 'Drinks', blurb: '16-hour steep, served over ice', priceMinor: 480, image: 'product_coldbrew.webp' },
    { id: 'grain-bowl', name: 'Seasonal Grain Bowl', category: 'Kitchen', blurb: 'Farro, greens, citrus tahini', priceMinor: 1400, image: 'product_grainbowl.webp' },
    { id: 'tartine', name: 'Smoked Salmon Tartine', category: 'Kitchen', blurb: 'Rye, crème fraîche, dill', priceMinor: 1250, image: 'product_tartine.webp' },
    { id: 'croissant', name: 'Butter Croissant', category: 'Bakery', blurb: 'Laminated overnight', priceMinor: 380, image: 'product_croissant.webp' },
    { id: 'morning-bun', name: 'Almond Morning Bun', category: 'Bakery', blurb: 'Orange blossom, toasted nuts', priceMinor: 440, image: 'product_morningbun.webp' },
    { id: 'loaf', name: 'Citrus Loaf', category: 'Bakery', blurb: 'Olive oil, slice', priceMinor: 410, image: 'product_loaf.webp' },
  ],
};

export const pulse: Brand = {
  id: 'pulse',
  name: 'Pulse',
  tagline: 'Studio memberships and classes. Add a plan, then check out.',
  emptyHint: 'Choose a pack or a drop-in, then open checkout.',
  accent: '#DCFC97',
  onAccent: '#3C5708',
  primary: '#3C5708',
  products: [
    { id: 'unlimited', name: 'Monthly Unlimited', category: 'Membership', blurb: 'All classes, guest pass once a month', priceMinor: 7900, image: 'product_pulse_unlimited.webp' },
    { id: 'pack-5', name: '5-Class Pack', category: 'Packs', blurb: 'Use within 8 weeks', priceMinor: 9500, image: 'product_pulse_pack.webp' },
    { id: 'drop-in', name: 'Drop-in Class', category: 'Classes', blurb: 'Any public session today', priceMinor: 2200, image: 'product_pulse_dropin.webp' },
    { id: 'reformer', name: 'Reformer Intro', category: 'Classes', blurb: '50 minutes, small group', priceMinor: 4500, image: 'product_pulse_reformer.webp' },
    { id: 'recovery', name: 'Recovery Session', category: 'Wellness', blurb: 'Stretch + breathwork', priceMinor: 3800, image: 'product_pulse_recovery.webp' },
    { id: 'swim', name: 'Lane Swim Pass', category: 'Wellness', blurb: 'Morning lanes, 10 entries', priceMinor: 6000, image: 'product_pulse_swim.webp' },
    { id: 'heart', name: 'Heart-Rate Lab', category: 'Classes', blurb: 'Guided intervals, 40 minutes', priceMinor: 2800, image: 'product_pulse_heart.webp' },
  ],
};

export function linesOf(quantities: Record<string, number>, products: Product[]): Line[] {
  return products.flatMap((product) => {
    const quantity = quantities[product.id] ?? 0;
    if (quantity <= 0) return [];
    return [{ product, quantity, lineTotalMinor: product.priceMinor * quantity }];
  });
}

export function subtotalOf(lines: Line[]): number {
  return lines.reduce((sum, line) => sum + line.lineTotalMinor, 0);
}

export function itemCount(lines: Line[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}
