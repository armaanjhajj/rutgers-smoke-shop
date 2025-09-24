// These imports are server-only. This module must not be imported by client components directly.
import { promises as fs } from 'fs';
import path from 'path';

export type Customer = {
  id: string;
  name: string; // canonicalized display case
  normalizedName: string; // lowercased/trimmed for matching
  totalSpentCents: number; // store as cents to avoid float issues
  lastVisitIso: string; // ISO string
};

export type Database = {
  customers: Customer[];
};

const DATA_FILE = path.join(process.cwd(), 'data.json');

function normalizeName(input: string): string {
  return input.trim().replace(/\s+/g, ' ').toLowerCase();
}

function toDisplayCase(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

async function readDb(): Promise<Database> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<Database>;
    if (!parsed.customers) return { customers: [] };
    return { customers: parsed.customers } as Database;
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err && err.code === 'ENOENT') {
      const init: Database = { customers: [] };
      await fs.writeFile(DATA_FILE, JSON.stringify(init, null, 2), 'utf8');
      return init;
    }
    throw error;
  }
}

async function writeDb(db: Database): Promise<void> {
  const tmpFile = DATA_FILE + '.tmp';
  await fs.writeFile(tmpFile, JSON.stringify(db, null, 2), 'utf8');
  await fs.rename(tmpFile, DATA_FILE);
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const db = await readDb();
  const normalized = normalizeName(query);
  if (!normalized) return db.customers;
  return db.customers.filter((c) => c.normalizedName.includes(normalized));
}

export async function listCustomers(): Promise<Customer[]> {
  const db = await readDb();
  return db.customers.sort((a, b) => a.name.localeCompare(b.name));
}

export async function addOrGetCustomer(name: string): Promise<Customer> {
  const db = await readDb();
  const normalized = normalizeName(name);
  const existing = db.customers.find((c) => c.normalizedName === normalized);
  if (existing) return existing;

  const nowIso = new Date().toISOString();
  const customer: Customer = {
    id: crypto.randomUUID(),
    name: toDisplayCase(name),
    normalizedName: normalized,
    totalSpentCents: 0,
    lastVisitIso: nowIso,
  };
  db.customers.push(customer);
  await writeDb(db);
  return customer;
}

export async function incrementSpend(customerId: string, amountDollars: number): Promise<Customer> {
  if (!Number.isFinite(amountDollars)) {
    throw new Error('Amount must be a finite number');
  }
  const cents = Math.max(0, Math.round(amountDollars * 100));
  const db = await readDb();
  const customer = db.customers.find((c) => c.id === customerId);
  if (!customer) throw new Error('Customer not found');
  customer.totalSpentCents += cents;
  customer.lastVisitIso = new Date().toISOString();
  await writeDb(db);
  return customer;
}

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
