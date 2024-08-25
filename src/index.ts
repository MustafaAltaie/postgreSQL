import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { check, validationResult } from 'express-validator';

const app = express();

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

// app.post('/anywhere', async (req, res) => {
//   const { first_name, last_name, email } = req.body;
//   try {
//     const query = `
//     INSERT INTO anywhere (first_name, last_name, email)
//     VALUES ($1, $2, $3)
//     RETURNING *`;

//     const result = await pool.query(query, [first_name, last_name, email]);

//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error('Error inserting film:', err); // Log the error for debugging
//   }
// });

app.post('/anywhere',
  [
    check('first_name').isAlpha().withMessage('First name must be alphabetic.'),
    check('last_name').isAlpha().withMessage('Last name must be alphabetic.'),
    check('email').isEmail().withMessage('Email must be valid.')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, email } = req.body;
    try {
      const query = `
        INSERT INTO anywhere (first_name, last_name, email)
        VALUES ($1, $2, $3)
        RETURNING *`;

      const result = await pool.query(query, [first_name, last_name, email]);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error inserting record:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// app.get('/:table', async (req, res) => {
//   try {
//     const result = await pool.query(`SELECT * FROM ${req.params.table}`);
//     res.json(result.rows);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to retrieve data' });
//   }
// });


app.get('/:table', async (req, res) => {
  const table = req.params.table;

  const validTables = ['anywhere', 'film'];
  if (!validTables.includes(table)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }

  try {
    const result = await pool.query(`SELECT * FROM ${table}`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error retrieving data:', err);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});



// app.get('/:table/:id', async (req, res) => {
//   try {
//     const film = await pool.query(`SELECT * FROM ${req.params.table} WHERE my_id = $1`, [req.params.id]);
//     res.json(film.rows);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to retrieve the film' });
//   }
// });

app.get('/:table/:id', async (req, res) => {
  const { table, id } = req.params;

  const validTables = ['anywhere', 'film'];
  if (!validTables.includes(table)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }

  try {
    const result = await pool.query(`SELECT * FROM ${table} WHERE my_id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error retrieving record:', err);
    res.status(500).json({ error: 'Failed to retrieve the record' });
  }
});

app.patch('/anywhere/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);

  const query = `
    UPDATE anywhere
    SET ${keys.map((key, index) => `${key} = $${index + 1}`).join(', ')}
    WHERE my_id = $${keys.length + 1}
    RETURNING *`;

  values.push(id);

  const result = await pool.query(query, values);
  res.json(result.rows[0]);
});


// app.delete('/:table/:id', async (req, res) => {
//   try {
//     await pool.query(`DELETE FROM ${req.params.table} WHERE my_id = $1`, [req.params.id]);
//     res.status(200).json({ message: 'Data deleted successfully' });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to delete the data' });
//   }
// });

app.delete('/:table/:id', async (req, res) => {
  const { table, id } = req.params;

  const validTables = ['anywhere', 'film'];
  if (!validTables.includes(table)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }

  try {
    const result = await pool.query(`DELETE FROM ${table} WHERE my_id = $1`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.status(200).json({ message: 'Data deleted successfully' });
  } catch (err) {
    console.error('Error deleting record:', err);
    res.status(500).json({ error: 'Failed to delete the data' });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});