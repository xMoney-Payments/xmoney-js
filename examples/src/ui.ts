export const page = 'mx-auto max-w-[1040px]';
export const h1 = 'text-[32px] leading-[1.05] font-bold tracking-[-0.03em]';
export const h2 = 'text-lg font-bold tracking-[-0.02em]';
export const lead = 'mt-1.5 max-w-[62ch] text-black/55 dark:text-zinc-400';
export const muted = 'text-black/55 dark:text-zinc-400';
export const eyebrow =
  'mb-1.5 text-xs font-bold tracking-[0.1em] text-black/55 uppercase dark:text-zinc-400';
export const card =
  'rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/12 dark:bg-[#18181b]';
export const price = 'mt-2 text-[28px] font-bold tracking-[-0.03em]';
export const btnSecondary =
  'mt-4 cursor-pointer rounded-full border border-black/[0.08] bg-transparent px-[18px] py-3 font-semibold disabled:cursor-default disabled:opacity-45 dark:border-white/12';
export const btnGhost =
  'cursor-pointer rounded-full border border-black/[0.08] bg-transparent px-[18px] py-3 font-semibold dark:border-white/12';
export const btnAccent =
  'mt-4 w-full cursor-pointer rounded-full border-0 bg-[#dcfc97] px-[18px] py-3 font-semibold text-[#3c5708] shadow-[0_8px_24px_rgba(220,252,151,0.28)] hover:bg-[#c8f070] disabled:cursor-default disabled:opacity-45';
export const storeBtn =
  'cursor-pointer rounded-full bg-(--accent) px-[18px] py-3 font-semibold text-(--on-accent) hover:brightness-95 disabled:cursor-default disabled:opacity-45';
export const chip =
  'my-3 rounded-xl bg-[#f4f3fb] px-3 py-2.5 text-sm text-black/55 dark:bg-white/6 dark:text-zinc-400';
export const chipError = 'my-3 rounded-xl bg-[#ff4757]/12 px-3 py-2.5 text-sm text-[#ff4757]';
export const payWrap = 'relative';
export const payBlocker =
  'absolute inset-0 z-[3] cursor-progress bg-[#f4f3fb]/45 dark:bg-[#09090b]/45';
export const backdrop = 'fixed inset-0 z-30 grid place-items-center bg-[#09090b]/46 px-4 py-8';
export const dialog =
  'w-full rounded-[28px] bg-white p-[22px] text-[#16141a] shadow-[0_16px_40px_rgba(22,20,26,0.08)] dark:bg-[#18181b] dark:text-[#fafafa] dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)]';
export const lightDialog =
  'max-h-[min(860px,100%)] w-full max-w-[480px] overflow-auto rounded-[28px] bg-white p-[22px] text-[#16141a] shadow-[0_16px_40px_rgba(22,20,26,0.08)]';
export const dialogHead = 'mb-4 flex items-start justify-between gap-3';
export const controls = [
  card,
  'grid content-start gap-4 wide:sticky wide:top-6 wide:max-h-[calc(100vh-48px)] wide:overflow-auto',
  '[&_fieldset]:m-0 [&_fieldset]:grid [&_fieldset]:gap-3 [&_fieldset]:border-0 [&_fieldset]:p-0 [&_fieldset:disabled]:opacity-50',
  '[&_fieldset+fieldset]:border-t [&_fieldset+fieldset]:border-black/[0.08] [&_fieldset+fieldset]:pt-3.5',
  'dark:[&_fieldset+fieldset]:border-white/12',
  '[&_legend]:mb-0.5 [&_legend]:text-xs [&_legend]:font-bold [&_legend]:tracking-[0.1em] [&_legend]:text-black/55 [&_legend]:uppercase',
  'dark:[&_legend]:text-zinc-400',
  '[&_label:not(:has(input[type=checkbox]))]:grid [&_label:not(:has(input[type=checkbox]))]:gap-1.5 [&_label:not(:has(input[type=checkbox]))]:text-[13px] [&_label:not(:has(input[type=checkbox]))]:text-black/55',
  'dark:[&_label:not(:has(input[type=checkbox]))]:text-zinc-400',
  '[&_label:has(input[type=checkbox])]:flex [&_label:has(input[type=checkbox])]:items-center [&_label:has(input[type=checkbox])]:gap-2 [&_label:has(input[type=checkbox])]:text-inherit',
  '[&_select]:rounded-xl [&_select]:border [&_select]:border-black/[0.08] [&_select]:bg-[#f4f3fb] [&_select]:px-3 [&_select]:py-2.5',
  'dark:[&_select]:border-white/12 dark:[&_select]:bg-[#09090b]',
  '[&_input[type=color]]:h-10 [&_input[type=color]]:w-full [&_input[type=color]]:rounded-xl [&_input[type=color]]:border [&_input[type=color]]:border-black/[0.08] [&_input[type=color]]:bg-[#f4f3fb] [&_input[type=color]]:p-1',
  'dark:[&_input[type=color]]:border-white/12 dark:[&_input[type=color]]:bg-[#09090b]',
].join(' ');
export const lightMuted = 'text-black/55 dark:text-zinc-400';
export const lightEyebrow =
  'mb-1.5 text-xs font-bold tracking-[0.1em] text-black/55 uppercase dark:text-zinc-400';
export const lightCard =
  'rounded-3xl border border-black/[0.08] bg-white p-5 dark:border-white/12 dark:bg-[#18181b]';
export const storeShell =
  '-mx-10 wide:-mt-8 -mb-16 min-h-full bg-[#f4f3fb] px-10 pt-8 pb-16 text-[#16141a] dark:bg-[#09090b] dark:text-[#fafafa]';
export const qty =
  'inline-flex items-center overflow-hidden rounded-full border border-black/[0.08] dark:border-white/12';
export const qtyBtn = 'h-8 w-8 border-0 bg-transparent disabled:opacity-45';
