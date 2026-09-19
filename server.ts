import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getDb } from './src/db/index';
import { companies, categories, accounts, contacts, costCenters, transactions } from './src/db/schema';
import { eq, and, or } from 'drizzle-orm';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      database: process.env.DATABASE_URL ? 'configured' : 'missing',
      env: process.env.NODE_ENV
    });
  });

  // --- Companies API ---
  app.get('/api/companies', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    try {
      const db = getDb();
      const userCompanies = await db.select().from(companies).where(eq(companies.ownerEmail, String(email).toLowerCase()));
      res.json(userCompanies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch companies' });
    }
  });

  app.post('/api/companies', async (req, res) => {
    try {
      const db = getDb();
      const data = req.body;
      const [newCompany] = await db.insert(companies).values({
        id: data.id,
        name: data.name,
        ownerEmail: data.ownerEmail.toLowerCase(),
        type: data.type,
        color: data.color,
      }).returning();
      res.json(newCompany);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create company' });
    }
  });

  // --- Transactions API ---
  app.get('/api/companies/:companyId/transactions', async (req, res) => {
    const { companyId } = req.params;
    try {
      const db = getDb();
      const results = await db.select().from(transactions).where(eq(transactions.companyId, companyId));
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  app.post('/api/companies/:companyId/transactions', async (req, res) => {
    const { companyId } = req.params;
    try {
      const db = getDb();
      const data = req.body;
      const [newTx] = await db.insert(transactions).values({
        ...data,
        companyId,
      }).returning();
      res.json(newTx);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  });

  // --- Categories API ---
  app.get('/api/companies/:companyId/categories', async (req, res) => {
    const { companyId } = req.params;
    try {
      const db = getDb();
      const results = await db.select().from(categories).where(eq(categories.companyId, companyId));
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // --- Database Configuration & Test ---
  app.post('/api/db/test', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const testPool = new pg.Pool({
      connectionString: url,
      connectionTimeoutMillis: 5000,
    });

    try {
      const client = await testPool.connect();
      await client.query('SELECT 1');
      client.release();
      await testPool.end();
      res.json({ success: true, message: 'Conexão estabelecida com sucesso!' });
    } catch (error: any) {
      await testPool.end();
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
