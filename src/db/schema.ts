import { pgTable, text, timestamp, doublePrecision, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';

// Enums mirroring the types in src/types.ts
export const accountTypeEnum = pgEnum('account_type', ['checking', 'cash', 'savings', 'investment']);
export const paymentStatusEnum = pgEnum('payment_status', ['paid', 'pending', 'liquidated', 'approved', 'rejected', 'draft', 'overdue', 'cancelled', 'PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']);
export const contactTypeEnum = pgEnum('contact_type', ['supplier', 'client', 'service_provider', 'employee', 'other']);
export const companyTypeEnum = pgEnum('company_type', ['personal', 'business', 'other']);

export const companies = pgTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerEmail: text('owner_email').notNull(),
  type: text('type').notNull(), // personal, business, etc.
  color: text('color'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // expense, income
  icon: text('icon'),
  color: text('color'),
  isDefault: boolean('is_default').default(false),
  monthlyBudget: doublePrecision('monthly_budget').default(0),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // checking, cash, etc.
  bankName: text('bank_name'),
  color: text('color'),
  initialBalance: doublePrecision('initial_balance').default(0),
  isDefault: boolean('is_default').default(false),
});

export const contacts = pgTable('contacts', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  name: text('name').notNull(),
  type: text('type').notNull(), // supplier, client, etc.
  phone: text('phone'),
  email: text('email'),
  document: text('document'),
  address: text('address'),
  pixKey: text('pix_key'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const costCenters = pgTable('cost_centers', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  name: text('name').notNull(),
  clientId: text('client_id').references(() => contacts.id),
  status: text('status').notNull(), // active, completed, etc.
  budget: doublePrecision('budget').default(0),
  startDate: text('start_date'),
  endDate: text('end_date'),
  color: text('color'),
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  type: text('type').notNull(), // expense, income
  description: text('description').notNull(),
  amount: doublePrecision('amount').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  accountId: text('account_id').references(() => accounts.id),
  categoryId: text('category_id').references(() => categories.id),
  contactId: text('contact_id').references(() => contacts.id),
  costCenterId: text('cost_center_id').references(() => costCenters.id),
  status: text('status'),
  paymentMethod: text('payment_method'),
  documentNumber: text('document_number'),
  transacao_id_banco: text('transacao_id_banco'),
  linha_digitavel: text('linha_digitavel'),
  isRecurring: boolean('is_recurring').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});
