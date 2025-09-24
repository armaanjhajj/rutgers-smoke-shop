'use client';

import { useEffect, useMemo, useState } from 'react';
import { dollarsToProgressPercent, formatCurrency, formatLastVisit } from '@/lib/client';

type Customer = {
  id: string;
  name: string;
  normalizedName: string;
  totalSpentCents: number;
  lastVisitIso: string;
};

type ApiList = { customers: Customer[] };

type ApiCustomer = { customer: Customer };

const GOAL_DOLLARS = 200;

export default function HomePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [amountInput, setAmountInput] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh(q?: string) {
    setLoading(true);
    setError(null);
    try {
      const url = q && q.trim() ? `/api/customers?q=${encodeURIComponent(q)}` : '/api/customers';
      const res = await fetch(url, { cache: 'no-store' });
      const data = (await res.json()) as unknown as ApiList;
      setCustomers(Array.isArray(data.customers) ? data.customers : []);
    } catch {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await refresh(query);
  };

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as unknown;
      if (!res.ok) {
        const msgCandidate = (data as { error?: unknown })?.error;
        const message = typeof msgCandidate === 'string' ? msgCandidate : 'Add failed';
        throw new Error(message);
      }
      setNameInput('');
      await refresh(query);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Add failed');
    } finally {
      setLoading(false);
    }
  };

  const onIncrement = async (id: string) => {
    const input = amountInput[id];
    const amount = Number(input);
    if (!Number.isFinite(amount)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${id}/spend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = (await res.json()) as unknown;
      if (!res.ok) {
        const msgCandidate = (data as { error?: unknown })?.error;
        const message = typeof msgCandidate === 'string' ? msgCandidate : 'Increment failed';
        throw new Error(message);
      }
      await refresh(query);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Increment failed');
    } finally {
      setLoading(false);
    }
  };

  const emptyState = useMemo(() => !loading && customers.length === 0, [loading, customers.length]);

  return (
    <div className="space-y-6">
      <section className="card p-4">
        <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row">
          <input
            className="input flex-1"
            placeholder="Search customers (case-insensitive)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">Search</button>
          <button
            className="btn border border-gray-300"
            type="button"
            onClick={() => { setQuery(''); refresh(); }}
          >
            Clear
          </button>
        </form>
      </section>

      <section className="card p-4">
        <form onSubmit={onAdd} className="flex flex-col gap-2 sm:flex-row">
          <input
            className="input flex-1"
            placeholder="Add customer by name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">Add / Open</button>
        </form>
        <p className="mt-2 text-sm text-gray-600">Names are normalized (spacing, case) and de-duplicated.</p>
      </section>

      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Customers</h2>
          {loading && <span className="text-sm text-gray-500">Loading…</span>}
        </div>
        {error && <div className="mb-3 text-red-700">{error}</div>}
        {emptyState ? (
          <div className="text-gray-600">No customers yet. Add one above.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {customers.map((c) => {
              const percent = dollarsToProgressPercent(c.totalSpentCents, GOAL_DOLLARS);
              return (
                <li key={c.id} className="py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-black">{c.name}</span>
                        <span className="text-sm text-gray-500">Last visit: {formatLastVisit(c.lastVisitIso)}</span>
                      </div>
                      <div className="mt-2">
                        <div className="progress" aria-label="Progress to $200">
                          <div className="progress-bar" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="mt-1 text-sm text-gray-700 flex items-center justify-between">
                          <span>Spent: {formatCurrency(c.totalSpentCents)} / ${GOAL_DOLLARS.toFixed(2)}</span>
                          <span>{percent}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        className="input w-28"
                        placeholder="Amount"
                        inputMode="decimal"
                        value={amountInput[c.id] ?? ''}
                        onChange={(e) => setAmountInput((s) => ({ ...s, [c.id]: e.target.value }))}
                      />
                      <button className="btn btn-primary" onClick={() => onIncrement(c.id)} type="button">Add</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="text-center text-sm text-gray-500">
        Scarlet Knights colors © Rutgers University. This site is for a smoke shop loyalty tracker.
      </footer>
    </div>
  );
}
