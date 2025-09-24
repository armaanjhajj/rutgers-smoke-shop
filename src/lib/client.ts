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

