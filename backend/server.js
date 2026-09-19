const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = 3000;

app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "database",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "appdb",
  user: process.env.DB_USER || "appuser",
  password: process.env.DB_PASSWORD || "apppassword"
});

async function waitForDatabase() {
  while (true) {
    try {
      await pool.query("SELECT 1");
      console.log("Connected to PostgreSQL.");
      break;
    } catch (error) {
      console.log("Waiting for PostgreSQL...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

app.get("/api/items", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM items ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Database error"
    });
  }
});

app.post("/api/items", async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      error: "Name is required"
    });
  }

  try {
    const result = await pool.query(
      "INSERT INTO items (name) VALUES ($1) RETURNING *",
      [name.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Database error"
    });
  }
});

app.delete("/api/items/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM items WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Item not found"
      });
    }

    res.json({
      message: "Item deleted"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Database error"
    });
  }
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok"
    });
  } catch {
    res.status(500).json({
      status: "database unavailable"
    });
  }
});

waitForDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
});