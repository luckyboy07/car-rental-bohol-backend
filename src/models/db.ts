import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(__dirname, '../../sqlite.db');
const db = new Database(dbPath);

// Initialize database schema
export const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cars (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      type TEXT NOT NULL,
      price_per_day REAL NOT NULL,
      seats INTEGER NOT NULL,
      transmission TEXT NOT NULL,
      fuel_type TEXT NOT NULL,
      image_url TEXT NOT NULL,
      available INTEGER DEFAULT 1,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      car_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      pickup_date TEXT NOT NULL,
      return_date TEXT NOT NULL,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(car_id) REFERENCES cars(id)
    );
  `);

  // Seed default admin if none exist
  const stmt = db.prepare('SELECT COUNT(*) as count FROM admins WHERE email = ?');
  const result: any = stmt.get('admin@boholrentals.com');

  if (result.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Admin1234', salt);
    const insertAdmin = db.prepare('INSERT INTO admins (id, email, password_hash, name) VALUES (?, ?, ?, ?)');
    insertAdmin.run('admin-1', 'admin@boholrentals.com', hash, 'Admin User');
    console.log('Seeded default admin (admin@boholrentals.com / Admin1234)');
  }
};

initDb();

export default db;
