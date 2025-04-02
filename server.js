const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const schedule = require('node-schedule'); // Add node-schedule for scheduling tasks
const moment = require('moment-timezone'); // Add moment-timezone for timezone handling

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');

        // Create tables
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS waiter (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    unique_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    current_balance REAL NOT NULL,
                    default_balance REAL NOT NULL
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS item (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    price REAL NOT NULL
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS sales (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    waiter_name TEXT NOT NULL,
                    date_time TEXT NOT NULL
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS sale_detail (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sale_id INTEGER NOT NULL,
                    beer_name TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    price REAL NOT NULL,
                    FOREIGN KEY (sale_id) REFERENCES sales (id)
                )
            `);

            console.log('Tables created successfully.');
        });

        // Insert default users
        db.serialize(() => {
            db.run(`
                INSERT OR IGNORE INTO users (id, name, password, role)
                VALUES 
                    (1, 'admin', 'admin123', 'admin'),
                    (2, 'user', 'user123', 'user')
            `);
            console.log('Default users added.');
        });
    }
});

// Schedule a job to reset waiter balances at the start of the day in Nairobi timezone
schedule.scheduleJob('0 0 * * *', () => { // Runs at 00:00 every day
    const nairobiTime = moment.tz('Africa/Nairobi').format('YYYY-MM-DD HH:mm:ss');
    console.log(`Resetting waiter balances at ${nairobiTime}`);

    const query = `UPDATE waiter SET current_balance = default_balance`;
    db.run(query, [], (err) => {
        if (err) {
            console.error('Error resetting waiter balances:', err.message);
        } else {
            console.log('Waiter balances reset successfully.');
        }
    });
});

// Endpoint to check username and password
app.post('/login', (req, res) => {
    const { username, password } = req.body; // Use 'username' instead of 'name'

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' }); // Update error message
    }

    const query = `SELECT role FROM users WHERE name = ? AND password = ?`;
    db.get(query, [username, password], (err, row) => { // Use 'username' in query
        if (err) {
            console.error('Error querying database:', err.message);
            return res.status(500).json({ error: 'Internal server error.' });
        }

        if (row) {
            res.json({ role: row.role });
        } else {
            res.status(401).json({ error: 'Invalid credentials.' });
        }
    });
});

// Endpoint to add a new item
app.post('/add-item', (req, res) => {
    const { name, price } = req.body;

    if (!name || price == null) {
        return res.status(400).json({ error: 'Name and price are required.' });
    }

    const query = `INSERT INTO item (name, price) VALUES (?, ?)`;
    db.run(query, [name, price], function (err) {
        if (err) {
            console.error('Error inserting item:', err.message);
            return res.status(500).json({ error: 'Internal server error.' });
        }

        res.json({ id: this.lastID, name, price });
    });
});

// Endpoint to update item price
app.put('/update-item', (req, res) => {
    const { id, price } = req.body;

    if (!id || price == null) {
        return res.status(400).json({ error: 'Item ID and new price are required.' });
    }

    const query = `UPDATE item SET price = ? WHERE id = ?`;
    db.run(query, [price, id], function (err) {
        if (err) {
            console.error('Error updating item price:', err.message);
            return res.status(500).json({ error: 'Internal server error.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Item not found.' });
        }

        res.json({ success: true });
    });
});

// Endpoint to assign a waiter
app.post('/assign-waiter', (req, res) => {
    const { unique_id, name, default_balance } = req.body;

    if (!unique_id || !name || default_balance == null) {
        return res.status(400).json({ error: 'Unique ID, name, and default balance are required.' });
    }

    const query = `INSERT INTO waiter (unique_id, name, current_balance, default_balance) VALUES (?, ?, 0, ?)`;
    db.run(query, [unique_id, name, default_balance], function (err) {
        if (err) {
            console.error('Error assigning waiter:', err.message);
            return res.status(500).json({ error: 'Internal server error.' });
        }

        res.json({ id: this.lastID, unique_id, name, current_balance: 0, default_balance });
    });
});

// Endpoint to get all waiters
app.get('/get-waiters', (req, res) => {
    const query = `SELECT unique_id, name, current_balance FROM waiter`;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error retrieving waiters:', err.message);
            return res.status(500).json({ error: 'Internal server error.' });
        }

        res.json(rows);
    });
});

// Endpoint to refill balance
app.post('/refill-balance', (req, res) => {
    const { waiter, amount } = req.body;

    if (!waiter || amount == null || amount <= 0) {
        return res.status(400).json({ error: 'Waiter and valid amount are required.' });
    }

    let query, params;

    if (waiter === 'all') {
        query = `UPDATE waiter SET current_balance = ?`;
        params = [amount];
    } else {
        query = `UPDATE waiter SET current_balance = ? WHERE unique_id = ?`;
        params = [amount, waiter];
    }

    db.run(query, params, function (err) {
        if (err) {
            console.error('Error updating balance:', err.message);
            return res.status(500).json({ error: 'Internal server error.' });
        }

        res.json({ success: true, rowsAffected: this.changes });
    });
});

// Endpoint to get all items (beers)
app.get('/get-items', (req, res) => {
    const query = `SELECT id, name, price FROM item`; // Include 'id' in the SELECT query

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error retrieving items:', err.message);
            return res.status(500).json({ error: 'Internal server error.' });
        }

        res.json(rows);
    });
});

// Endpoint to add a sale
app.post('/add-sale', (req, res) => {
    const { waiterName, items } = req.body;

    if (!waiterName || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Waiter name and items are required.' });
    }

    const dateTime = new Date().toISOString(); // Current date and time
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    db.serialize(() => {
        // Fetch the waiter's actual name using the unique_id
        db.get(
            `SELECT name, current_balance FROM waiter WHERE unique_id = ?`,
            [waiterName],
            (err, row) => {
                if (err) {
                    console.error('Error querying waiter:', err.message);
                    return res.status(500).json({ error: 'Internal server error.' });
                }

                if (!row) {
                    return res.status(404).json({ error: 'Waiter not found.' });
                }

                const { name: actualWaiterName, current_balance: currentBalance } = row;

                if (currentBalance < totalAmount) {
                    return res.status(400).json({ error: 'Not enough balance. Please refill.' });
                }

                // Deduct the total amount from the waiter's balance
                db.run(
                    `UPDATE waiter SET current_balance = current_balance - ? WHERE unique_id = ?`,
                    [totalAmount, waiterName],
                    function (err) {
                        if (err) {
                            console.error('Error updating waiter balance:', err.message);
                            return res.status(500).json({ error: 'Internal server error.' });
                        }

                        // Insert into sales table with the actual waiter name
                        db.run(
                            `INSERT INTO sales (waiter_name, date_time) VALUES (?, ?)`,
                            [actualWaiterName, dateTime],
                            function (err) {
                                if (err) {
                                    console.error('Error inserting into sales:', err.message);
                                    return res.status(500).json({ error: 'Internal server error.' });
                                }

                                const saleId = this.lastID;

                                // Insert into sale_detail table
                                const stmt = db.prepare(
                                    `INSERT INTO sale_detail (sale_id, beer_name, quantity, price) VALUES (?, ?, ?, ?)`
                                );

                                items.forEach(item => {
                                    stmt.run(saleId, item.name, item.quantity, item.price, err => {
                                        if (err) {
                                            console.error('Error inserting into sale_detail:', err.message);
                                        }
                                    });
                                });

                                stmt.finalize(err => {
                                    if (err) {
                                        console.error('Error finalizing statement:', err.message);
                                        return res.status(500).json({ error: 'Internal server error.' });
                                    }

                                    res.json({ success: true, saleId });
                                });
                            }
                        );
                    }
                );
            }
        );
    });
});

// Endpoint to get daily sales categorized by beer name and optionally filtered by waiter
app.get('/daily-sales', (req, res) => {
    const isoDate = req.query.date || new Date().toISOString(); // Use query parameter or default to now
    const date = isoDate.split('T')[0]; // Extract YYYY-MM-DD from ISO format
    const waiter = req.query.waiter;

    let query = `
        SELECT sd.beer_name, SUM(sd.quantity) AS total_quantity, SUM(sd.price * sd.quantity) AS total_price
        FROM sales s
        JOIN sale_detail sd ON s.id = sd.sale_id
        WHERE DATE(s.date_time) = ?
    `;
    const params = [date];

    if (waiter) {
        query += ` AND s.waiter_name = ?`;
        params.push(waiter);
    }

    query += ` GROUP BY sd.beer_name`;

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error retrieving daily sales:', err.message);
            return res.status(500).json({ error: 'Internal server error.' });
        }

        res.json(rows);
    });
});

// Endpoint to fetch sales and sales detail data based on date range
app.get('/fetch-sales', (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required.' });
    }

    const queryByItem = `
        SELECT sd.beer_name, SUM(sd.quantity) AS total_quantity, SUM(sd.price * sd.quantity) AS total_price
        FROM sales s
        JOIN sale_detail sd ON s.id = sd.sale_id
        WHERE DATE(s.date_time) BETWEEN DATE(?) AND DATE(?)
        GROUP BY sd.beer_name
        ORDER BY sd.beer_name
    `;

    const queryByDate = `
        SELECT DATE(s.date_time) AS date, SUM(sd.price * sd.quantity) AS total_price
        FROM sales s
        JOIN sale_detail sd ON s.id = sd.sale_id
        WHERE DATE(s.date_time) BETWEEN DATE(?) AND DATE(?)
        GROUP BY DATE(s.date_time)
        ORDER BY DATE(s.date_time)
    `;

    db.serialize(() => {
        const results = {};
        db.all(queryByItem, [startDate, endDate], (err, rows) => {
            if (err) {
                console.error('Error fetching sales by item:', err.message);
                return res.status(500).json({ error: 'Internal server error.' });
            }
            results.byItem = rows;

            db.all(queryByDate, [startDate, endDate], (err, rows) => {
                if (err) {
                    console.error('Error fetching sales by date:', err.message);
                    return res.status(500).json({ error: 'Internal server error.' });
                }
                results.byDate = rows;

                res.json(results);
            });
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});