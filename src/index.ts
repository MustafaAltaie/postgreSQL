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

pool.connect()
  .then(client => {
    console.log('Connected to the database');
    client.release();
  })
  .catch(err => console.error('Database connection error', err.stack));

// Middleware för att hantera JSON-data
app.use(express.json());

app.get('/:table', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM ${req.params.table}`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

app.get('/:table/:id', async (req, res) => {
  try {
    const film = await pool.query(`SELECT * FROM ${req.params.table} WHERE my_id = $1`, [req.params.id]);
    res.json(film.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve the film' });
  }
});

app.delete('/:table/:id', async (req, res) => {
  try {
    await pool.query(`DELETE FROM ${req.params.table} WHERE my_id = $1`, [req.params.id]);
    res.status(200).json({ message: 'Data deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete the data' });
  }
});

app.post('/anywhere', async (req, res) => {
  const { first_name, last_name, email } = req.body;
  try {
    const query = `
    INSERT INTO anywhere (first_name, last_name, email)
    VALUES ($1, $2, $3)
    RETURNING *`;

    const result = await pool.query(query, [first_name, last_name, email]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting film:', err); // Log the error for debugging
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});