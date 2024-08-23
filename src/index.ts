import express from 'express';
import { Pool } from 'pg';

const app = express();
const port = 3000;

// Konfigurera PostgreSQL-klienten
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'dvdrental',
  password: '123456',
  port: 5432,
});

// Testa anslutningen till PostgreSQL
pool.connect()
  .then(client => {
    console.log('Connected to the database');
    client.release();
  })
  .catch(err => console.error('Database connection error', err.stack));

// Middleware för att hantera JSON-data
app.use(express.json());

// Skapa en enkel GET-route för att läsa alla filmer
app.get('/film', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM film');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve films' });
  }
});

// Starta Express-servern
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});