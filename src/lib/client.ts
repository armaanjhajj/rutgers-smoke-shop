export function dollarsToProgressPercent(totalSpentCents: number, goalDollars: number): number {
  const goalCents = Math.max(1, Math.round(goalDollars * 100));
  const pct = (totalSpentCents / goalCents) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function formatCurrency(totalSpentCents: number): string {
  return `$${(totalSpentCents / 100).toFixed(2)}`;
}

export function formatLastVisit(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleString();
}

export async function safeJson<T = unknown>(res: Response): Promise<T | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

