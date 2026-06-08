import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploads statically
app.use('/uploads', express.static(uploadsDir));

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage });

// Database Connection
let pool;
async function connectDB() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };

  try {
    // Try to ensure database exists if we have privileges (e.g., local development)
    try {
      const tempConn = await mysql.createConnection(dbConfig);
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'royalcoast'}\``);
      await tempConn.end();
    } catch (dbCreateErr) {
      console.log('Note: Could not verify/create database automatically (this is normal on shared hosting). Proceeding...');
    }

    // Create pool with database name
    pool = mysql.createPool({
      ...dbConfig,
      database: process.env.DB_NAME || 'royalcoast',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test the pool connection
    const testConn = await pool.getConnection();
    testConn.release();

    console.log('Connected to MySQL database!');
    await initializeTables();
  } catch (err) {
    console.error('MySQL Connection Error. Make sure your MySQL Server is running and credentials are correct!', err);
    process.exit(1);
  }
}

async function initializeTables() {
  // Read schema.sql and execute it
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      // Split SQL file by semicolon and filter empty queries
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().startsWith('use')) continue;
        if (statement.toLowerCase().startsWith('create database')) continue;
        await pool.query(statement);
      }
      console.log('MySQL Database Tables initialized successfully.');
    }
  } catch (err) {
    console.error('Error executing schema.sql:', err);
  }
}

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// ==========================================
// AUTH API
// ==========================================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Falta email ou password' });

  try {
    const [existing] = await pool.query('SELECT uid FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Utilizador já registado' });

    const passwordHash = await bcrypt.hash(password, 10);
    const uid = 'u-' + Math.random().toString(36).substring(2, 15);

    // Generate referral code
    const namePart = (displayName || 'user').trim().toLowerCase().replace(/\s+/g, '').slice(0, 5);
    const randomPart = Math.random().toString(36).substring(2, 6);
    const referralCode = `${namePart}-${randomPart}`;

    await pool.query(
      `INSERT INTO users (uid, email, displayName, password_hash, referralCode) VALUES (?, ?, ?, ?, ?)`,
      [uid, email, displayName, passwordHash, referralCode]
    );

    const token = jwt.sign({ uid, email }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.json({ token, user: { uid, email, displayName, referralCode } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Falta email ou password' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(400).json({ error: 'Email ou password incorretos' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Email ou password incorretos' });

    await pool.query('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE uid = ?', [user.uid]);

    const token = jwt.sign({ uid: user.uid, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.json({ token, user: { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL, referralCode: user.referralCode, firstName: user.firstName, lastName: user.lastName, phonePrefix: user.phonePrefix, phoneNumber: user.phoneNumber, birthDate: user.birthDate } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Me (Get profile)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT uid, email, displayName, photoURL, provider, referralCode, firstName, lastName, phonePrefix, phoneNumber, birthDate FROM users WHERE uid = ?', [req.user.uid]);
    if (rows.length === 0) return res.status(404).json({ error: 'Utilizador não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile details
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const { displayName, firstName, lastName, phonePrefix, phoneNumber, birthDate } = req.body;
  try {
    await pool.query(
      `UPDATE users SET displayName = COALESCE(?, displayName), firstName = COALESCE(?, firstName), lastName = COALESCE(?, lastName), phonePrefix = COALESCE(?, phonePrefix), phoneNumber = COALESCE(?, phoneNumber), birthDate = COALESCE(?, birthDate), updatedAt = CURRENT_TIMESTAMP WHERE uid = ?`,
      [displayName, firstName, lastName, phonePrefix, phoneNumber, birthDate, req.user.uid]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: 'Nova password em falta' });
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ?, updatedAt = CURRENT_TIMESTAMP WHERE uid = ?', [passwordHash, req.user.uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete account
app.delete('/api/auth/account', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE uid = ?', [req.user.uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload avatar
app.post('/api/auth/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro fornecido' });
  const photoURL = `/uploads/${req.file.filename}`;
  try {
    await pool.query('UPDATE users SET photoURL = ?, updatedAt = CURRENT_TIMESTAMP WHERE uid = ?', [photoURL, req.user.uid]);
    res.json({ photoURL });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// BOATS API
// ==========================================

app.get('/api/boats', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM boats ORDER BY boat_order ASC');
    const parsed = rows.map(b => ({
      ...b,
      images: b.images ? JSON.parse(b.images) : [],
      features: b.features ? JSON.parse(b.features) : [],
      extraOptions: b.extraOptions ? JSON.parse(b.extraOptions) : [],
      useMarkup4h: !!b.useMarkup4h,
      useMarkup8h: !!b.useMarkup8h,
      useDelivery4h: !!b.useDelivery4h,
      useDelivery8h: !!b.useDelivery8h
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/boats', async (req, res) => {
  const data = req.body;
  const id = 'b-' + Math.random().toString(36).substring(2, 15);
  try {
    await pool.query(
      `INSERT INTO boats (id, name, size, engine, capacity, price4h, price8h, images, slug, range_type, boat_order, image, features, cost4h, cost8h, useMarkup4h, useMarkup8h, deliveryCost4h, deliveryCost8h, useDelivery4h, useDelivery8h, extraOptions) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, data.name, data.size, data.engine, data.capacity, data.price4h, data.price8h,
        JSON.stringify(data.images || []), data.slug, data.range || 'mid', data.order || 0,
        data.image || '', JSON.stringify(data.features || []), data.cost4h || '', data.cost8h || '',
        data.useMarkup4h ? 1 : 0, data.useMarkup8h ? 1 : 0, data.deliveryCost4h || '', data.deliveryCost8h || '',
        data.useDelivery4h ? 1 : 0, data.useDelivery8h ? 1 : 0, JSON.stringify(data.extraOptions || [])
      ]
    );
    res.json({ id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/boats/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    await pool.query(
      `UPDATE boats SET name=?, size=?, engine=?, capacity=?, price4h=?, price8h=?, images=?, slug=?, range_type=?, boat_order=?, image=?, features=?, cost4h=?, cost8h=?, useMarkup4h=?, useMarkup8h=?, deliveryCost4h=?, deliveryCost8h=?, useDelivery4h=?, useDelivery8h=?, extraOptions=? WHERE id=?`,
      [
        data.name, data.size, data.engine, data.capacity, data.price4h, data.price8h,
        JSON.stringify(data.images || []), data.slug, data.range || 'mid', data.order || 0,
        data.image || '', JSON.stringify(data.features || []), data.cost4h || '', data.cost8h || '',
        data.useMarkup4h ? 1 : 0, data.useMarkup8h ? 1 : 0, data.deliveryCost4h || '', data.deliveryCost8h || '',
        data.useDelivery4h ? 1 : 0, data.useDelivery8h ? 1 : 0, JSON.stringify(data.extraOptions || []), id
      ]
    );
    res.json({ id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/boats/order/bulk', async (req, res) => {
  const orders = req.body; // Array: [{ id: "...", order: 1 }]
  try {
    for (const item of orders) {
      await pool.query('UPDATE boats SET boat_order = ? WHERE id = ?', [item.order, item.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/boats/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM boats WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Boat upload files
app.post('/api/boats/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Sem imagem' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ==========================================
// TOURS API
// ==========================================

app.get('/api/tours', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tours ORDER BY tour_order ASC');
    const parsed = rows.map(t => ({
      ...t,
      packs: t.packs ? JSON.parse(t.packs) : [],
      extraOptions: t.extraOptions ? JSON.parse(t.extraOptions) : []
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tours', async (req, res) => {
  const data = req.body;
  const id = 't-' + Math.random().toString(36).substring(2, 15);
  try {
    await pool.query(
      `INSERT INTO tours (id, name, slug, packs, capacity, price4h, price8h, extraOptions, theme, tour_order, image) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, data.name, data.slug, JSON.stringify(data.packs || []), data.capacity, data.price4h || '', data.price8h || '',
        JSON.stringify(data.extraOptions || []), data.theme || 'ocean', data.order || 0, data.image || ''
      ]
    );
    res.json({ id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tours/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    await pool.query(
      `UPDATE tours SET name=?, slug=?, packs=?, capacity=?, price4h=?, price8h=?, extraOptions=?, theme=?, tour_order=?, image=? WHERE id=?`,
      [
        data.name, data.slug, JSON.stringify(data.packs || []), data.capacity, data.price4h || '', data.price8h || '',
        JSON.stringify(data.extraOptions || []), data.theme || 'ocean', data.order || 0, data.image || '', id
      ]
    );
    res.json({ id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tours/order/bulk', async (req, res) => {
  const orders = req.body;
  try {
    for (const item of orders) {
      await pool.query('UPDATE tours SET tour_order = ? WHERE id = ?', [item.order, item.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tours/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tours WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// GALLERY API
// ==========================================

app.get('/api/gallery', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM gallery ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gallery', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro fornecido' });
  const url = `/uploads/${req.file.filename}`;
  const id = 'g-' + Math.random().toString(36).substring(2, 15);
  try {
    await pool.query(
      'INSERT INTO gallery (id, url, alt) VALUES (?, ?, ?)',
      [id, url, req.body.alt || 'Imagem da galeria']
    );
    res.json({ id, url, alt: req.body.alt || 'Imagem da galeria', created_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/gallery/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT url FROM gallery WHERE id = ?', [id]);
    if (rows.length > 0) {
      const fileUrl = rows[0].url;
      if (fileUrl.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    await pool.query('DELETE FROM gallery WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// BOOKINGS API
// ==========================================

app.get('/api/bookings', async (req, res) => {
  const { confirmed, date_start, date_end } = req.query;
  let queryStr = 'SELECT * FROM bookings WHERE 1=1';
  const params = [];

  if (confirmed !== undefined) {
    queryStr += ' AND confirmed = ?';
    params.push(confirmed === 'true' ? 1 : 0);
  }
  if (date_start) {
    queryStr += ' AND booking_date >= ?';
    params.push(date_start);
  }
  if (date_end) {
    queryStr += ' AND booking_date <= ?';
    params.push(date_end);
  }

  queryStr += ' ORDER BY booking_date DESC, booking_time ASC';

  try {
    const [rows] = await pool.query(queryStr, params);
    const parsed = rows.map(b => ({
      ...b,
      extra_preferences: b.extra_preferences ? JSON.parse(b.extra_preferences) : {},
      extra_durations: b.extra_durations ? JSON.parse(b.extra_durations) : {},
      extra_start_times: b.extra_start_times ? JSON.parse(b.extra_start_times) : {},
      extras: b.extras ? JSON.parse(b.extras) : {},
      confirmed: !!b.confirmed,
      price: parseFloat(b.price) || 0
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  const data = req.body;
  const id = 'bk-' + Math.random().toString(36).substring(2, 15);
  try {
    await pool.query(
      `INSERT INTO bookings (id, client_name, client_email, client_phone, pack_name, extra_preferences, extra_durations, extra_start_times, booking_date, booking_time, num_people, location, referralCode, price, confirmed, payment_method, created_by, extras, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, data.client_name, data.client_email || null, data.client_phone || null, data.pack_name,
        JSON.stringify(data.extra_preferences || {}), JSON.stringify(data.extra_durations || {}),
        JSON.stringify(data.extra_start_times || {}), data.booking_date, data.booking_time || null,
        data.num_people || 1, data.location || null, data.referralCode || null, data.price || 0.0,
        data.confirmed ? 1 : 0, data.payment_method || null, data.created_by || null,
        JSON.stringify(data.extras || {}), data.notes || null
      ]
    );
    res.json({ id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    // Dynamically build set clause based on properties passed in data
    const sets = [];
    const params = [];
    for (const key of Object.keys(data)) {
      if (['id', 'created_at'].includes(key)) continue;
      sets.push(`\`${key}\` = ?`);
      if (typeof data[key] === 'object' && data[key] !== null) {
        params.push(JSON.stringify(data[key]));
      } else if (typeof data[key] === 'boolean') {
        params.push(data[key] ? 1 : 0);
      } else {
        params.push(data[key]);
      }
    }
    params.push(id);

    if (sets.length > 0) {
      await pool.query(`UPDATE bookings SET ${sets.join(', ')} WHERE id = ?`, params);
    }
    res.json({ id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM bookings WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete unconfirmed past bookings
app.delete('/api/bookings/cleanup/past-unconfirmed', async (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    const [result] = await pool.query(
      'DELETE FROM bookings WHERE booking_date < ? AND confirmed = 0',
      [todayStr]
    );
    res.json({ success: true, deletedCount: result.affectedRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// EXPENSES API
// ==========================================

app.get('/api/expenses', async (req, res) => {
  const { date_start, date_end } = req.query;
  let queryStr = 'SELECT * FROM expenses WHERE 1=1';
  const params = [];
  if (date_start) {
    queryStr += ' AND date >= ?';
    params.push(date_start);
  }
  if (date_end) {
    queryStr += ' AND date <= ?';
    params.push(date_end);
  }
  queryStr += ' ORDER BY date DESC';

  try {
    const [rows] = await pool.query(queryStr, params);
    const parsed = rows.map(e => ({
      ...e,
      amount: parseFloat(e.amount) || 0
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  const data = req.body;
  const id = 'ex-' + Math.random().toString(36).substring(2, 15);
  try {
    await pool.query(
      'INSERT INTO expenses (id, date, type, amount) VALUES (?, ?, ?, ?)',
      [id, data.date, data.type, data.amount]
    );
    res.json({ id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SETTINGS API
// ==========================================

app.get('/api/settings/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const [rows] = await pool.query('SELECT val_data FROM settings WHERE key_name = ?', [key]);
    if (rows.length === 0) return res.json({});
    res.json(JSON.parse(rows[0].val_data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/:key', async (req, res) => {
  const { key } = req.params;
  const data = req.body;
  try {
    await pool.query(
      'INSERT INTO settings (key_name, val_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE val_data = ?',
      [key, JSON.stringify(data), JSON.stringify(data)]
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// USERS API (Admin dashboard list)
// ==========================================

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT uid, email, displayName, photoURL, provider, referralCode, firstName, lastName, phonePrefix, phoneNumber, birthDate, updatedAt FROM users ORDER BY updatedAt DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE uid = ?', [uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, async () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  await connectDB();
});
