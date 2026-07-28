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

// Serve uploads and iOS apps statically
app.use('/uploads', express.static(uploadsDir));

const appsDir = path.join(__dirname, 'apps');
if (!fs.existsSync(appsDir)) {
  fs.mkdirSync(appsDir, { recursive: true });
}
app.use('/apps', express.static(appsDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.plist')) {
      res.setHeader('Content-Type', 'text/xml');
    } else if (filePath.endsWith('.ipa')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
  }
}));

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

// Database Abstraction & Local JSON DB Fallback
class LocalDBEngine {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {
      users: [],
      boats: [],
      tours: [],
      gallery: [],
      bookings: [],
      expenses: [],
      settings: [
        { key_name: 'general', val_data: JSON.stringify({ maintenanceMode: false }) }
      ]
    };
    this.load();
  }

  load() {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
      } catch (err) {
        console.error('Error reading local_db.json, re-initializing...', err);
        this.save();
      }
    } else {
      this.seedDefaultData();
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving local_db.json:', err);
    }
  }

  seedDefaultData() {
    this.data.boats = [
      {
        id: 'b-1',
        name: 'Sea-Doo GTI 130',
        size: '3.3m',
        engine: '130 HP Rotax',
        capacity: 3,
        price4h: '180€',
        price8h: '280€',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=80'
        ]),
        slug: 'sea-doo-gti-130',
        range_type: 'mid',
        boat_order: 1,
        image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=800&q=80',
        features: JSON.stringify(['Coletes de Salvação', 'Sistema de Áudio Bluetooth', 'Modo Eco/Sport']),
        cost4h: '100€',
        cost8h: '150€',
        useMarkup4h: 0,
        useMarkup8h: 0,
        deliveryCost4h: '',
        deliveryCost8h: '',
        useDelivery4h: 0,
        useDelivery8h: 0,
        extraOptions: JSON.stringify([])
      },
      {
        id: 'b-2',
        name: 'Yamaha FX Cruiser SVHO',
        size: '3.58m',
        engine: '250 HP Supercharged',
        capacity: 3,
        price4h: '230€',
        price8h: '350€',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80'
        ]),
        slug: 'yamaha-fx-cruiser',
        range_type: 'high',
        boat_order: 2,
        image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80',
        features: JSON.stringify(['Ecran Tátil 7"', 'Som ConnecTV', 'Cruise Control']),
        cost4h: '140€',
        cost8h: '200€',
        useMarkup4h: 0,
        useMarkup8h: 0,
        deliveryCost4h: '',
        deliveryCost8h: '',
        useDelivery4h: 0,
        useDelivery8h: 0,
        extraOptions: JSON.stringify([])
      }
    ];

    this.data.tours = [
      {
        id: 't-1',
        name: 'Passeio Arrábida & Tróia',
        slug: 'passeio-arrabida',
        packs: JSON.stringify([{ name: 'Pack Básico', price: 150 }]),
        capacity: 6,
        price4h: '200€',
        price8h: '350€',
        extraOptions: JSON.stringify([]),
        theme: 'ocean',
        tour_order: 1,
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
      }
    ];

    this.data.settings = [
      { key_name: 'general', val_data: JSON.stringify({ maintenanceMode: false }) }
    ];
  }
}

let useMySQL = false;
let pool = null;
let localDB = null;

function executeLocalQuery(sql, params = []) {
  const norm = sql.trim().replace(/\s+/g, ' ');
  const lower = norm.toLowerCase();

  // --- USERS ---
  if (lower.startsWith('select * from users where email =')) {
    const row = localDB.data.users.find(u => u.email === params[0]);
    return row ? [row] : [];
  }
  if (lower.startsWith('select uid, email, displayname') && lower.includes('where uid =')) {
    const row = localDB.data.users.find(u => u.uid === params[0]);
    return row ? [row] : [];
  }
  if (lower.startsWith('select uid, email, displayname') && lower.includes('from users order by')) {
    return [...localDB.data.users].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }
  if (lower.startsWith('insert into users')) {
    const [uid, email, displayName, password_hash, referralCode] = params;
    const user = {
      uid, email, displayName, password_hash, referralCode,
      photoURL: null, provider: 'password', firstName: null, lastName: null,
      phonePrefix: null, phoneNumber: null, birthDate: null,
      lastLogin: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    localDB.data.users.push(user);
    localDB.save();
    return { affectedRows: 1 };
  }
  if (lower.startsWith('update users set lastlogin =')) {
    const user = localDB.data.users.find(u => u.uid === params[0]);
    if (user) { user.lastLogin = new Date().toISOString(); localDB.save(); }
    return { affectedRows: user ? 1 : 0 };
  }
  if (lower.startsWith('update users set displayname = coalesce')) {
    const [displayName, firstName, lastName, phonePrefix, phoneNumber, birthDate, uid] = params;
    const user = localDB.data.users.find(u => u.uid === uid);
    if (user) {
      if (displayName !== null && displayName !== undefined) user.displayName = displayName;
      if (firstName !== null && firstName !== undefined) user.firstName = firstName;
      if (lastName !== null && lastName !== undefined) user.lastName = lastName;
      if (phonePrefix !== null && phonePrefix !== undefined) user.phonePrefix = phonePrefix;
      if (phoneNumber !== null && phoneNumber !== undefined) user.phoneNumber = phoneNumber;
      if (birthDate !== null && birthDate !== undefined) user.birthDate = birthDate;
      user.updatedAt = new Date().toISOString();
      localDB.save();
    }
    return { affectedRows: user ? 1 : 0 };
  }
  if (lower.startsWith('update users set password_hash =')) {
    const [password_hash, uid] = params;
    const user = localDB.data.users.find(u => u.uid === uid);
    if (user) { user.password_hash = password_hash; user.updatedAt = new Date().toISOString(); localDB.save(); }
    return { affectedRows: user ? 1 : 0 };
  }
  if (lower.startsWith('update users set photourl =')) {
    const [photoURL, uid] = params;
    const user = localDB.data.users.find(u => u.uid === uid);
    if (user) { user.photoURL = photoURL; user.updatedAt = new Date().toISOString(); localDB.save(); }
    return { affectedRows: user ? 1 : 0 };
  }
  if (lower.startsWith('delete from users where uid =')) {
    const idx = localDB.data.users.findIndex(u => u.uid === params[0]);
    if (idx !== -1) { localDB.data.users.splice(idx, 1); localDB.save(); }
    return { affectedRows: idx !== -1 ? 1 : 0 };
  }

  // --- BOATS ---
  if (lower.startsWith('select * from boats order by boat_order asc')) {
    return [...localDB.data.boats].sort((a, b) => (a.boat_order || 0) - (b.boat_order || 0));
  }
  if (lower.startsWith('insert into boats')) {
    const [id, name, size, engine, capacity, price4h, price8h, images, slug, range_type, boat_order, image, features, cost4h, cost8h, useMarkup4h, useMarkup8h, deliveryCost4h, deliveryCost8h, useDelivery4h, useDelivery8h, extraOptions] = params;
    const boat = { id, name, size, engine, capacity, price4h, price8h, images, slug, range_type, boat_order, image, features, cost4h, cost8h, useMarkup4h, useMarkup8h, deliveryCost4h, deliveryCost8h, useDelivery4h, useDelivery8h, extraOptions, created_at: new Date().toISOString() };
    localDB.data.boats.push(boat);
    localDB.save();
    return { affectedRows: 1 };
  }
  if (lower.startsWith('update boats set name=')) {
    const [name, size, engine, capacity, price4h, price8h, images, slug, range_type, boat_order, image, features, cost4h, cost8h, useMarkup4h, useMarkup8h, deliveryCost4h, deliveryCost8h, useDelivery4h, useDelivery8h, extraOptions, id] = params;
    const boat = localDB.data.boats.find(b => b.id === id);
    if (boat) {
      Object.assign(boat, { name, size, engine, capacity, price4h, price8h, images, slug, range_type, boat_order, image, features, cost4h, cost8h, useMarkup4h, useMarkup8h, deliveryCost4h, deliveryCost8h, useDelivery4h, useDelivery8h, extraOptions });
      localDB.save();
    }
    return { affectedRows: boat ? 1 : 0 };
  }
  if (lower.startsWith('update boats set boat_order =')) {
    const [order, id] = params;
    const boat = localDB.data.boats.find(b => b.id === id);
    if (boat) { boat.boat_order = order; localDB.save(); }
    return { affectedRows: boat ? 1 : 0 };
  }
  if (lower.startsWith('delete from boats where id =')) {
    const idx = localDB.data.boats.findIndex(b => b.id === params[0]);
    if (idx !== -1) { localDB.data.boats.splice(idx, 1); localDB.save(); }
    return { affectedRows: idx !== -1 ? 1 : 0 };
  }

  // --- TOURS ---
  if (lower.startsWith('select * from tours order by tour_order asc')) {
    return [...localDB.data.tours].sort((a, b) => (a.tour_order || 0) - (b.tour_order || 0));
  }
  if (lower.startsWith('insert into tours')) {
    const [id, name, slug, packs, capacity, price4h, price8h, extraOptions, theme, tour_order, image, images] = params;
    const tour = { id, name, slug, packs, capacity, price4h, price8h, extraOptions, theme, tour_order, image, images: images || JSON.stringify([image]), created_at: new Date().toISOString() };
    localDB.data.tours.push(tour);
    localDB.save();
    return { affectedRows: 1 };
  }
  if (lower.startsWith('update tours set name=')) {
    const [name, slug, packs, capacity, price4h, price8h, extraOptions, theme, tour_order, image, images, id] = params;
    const tour = localDB.data.tours.find(t => t.id === id);
    if (tour) {
      Object.assign(tour, { name, slug, packs, capacity, price4h, price8h, extraOptions, theme, tour_order, image, images: images || JSON.stringify([image]) });
      localDB.save();
    }
    return { affectedRows: tour ? 1 : 0 };
  }
  if (lower.startsWith('update tours set tour_order =')) {
    const [order, id] = params;
    const tour = localDB.data.tours.find(t => t.id === id);
    if (tour) { tour.tour_order = order; localDB.save(); }
    return { affectedRows: tour ? 1 : 0 };
  }
  if (lower.startsWith('delete from tours where id =')) {
    const idx = localDB.data.tours.findIndex(t => t.id === params[0]);
    if (idx !== -1) { localDB.data.tours.splice(idx, 1); localDB.save(); }
    return { affectedRows: idx !== -1 ? 1 : 0 };
  }

  // --- GALLERY ---
  if (lower.startsWith('select * from gallery order by created_at desc')) {
    return [...localDB.data.gallery].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }
  if (lower.startsWith('select url from gallery where id =')) {
    const row = localDB.data.gallery.find(g => g.id === params[0]);
    return row ? [{ url: row.url }] : [];
  }
  if (lower.startsWith('insert into gallery')) {
    const [id, url, alt] = params;
    const item = { id, url, alt, created_at: new Date().toISOString() };
    localDB.data.gallery.push(item);
    localDB.save();
    return { affectedRows: 1 };
  }
  if (lower.startsWith('delete from gallery where id =')) {
    const idx = localDB.data.gallery.findIndex(g => g.id === params[0]);
    if (idx !== -1) { localDB.data.gallery.splice(idx, 1); localDB.save(); }
    return { affectedRows: idx !== -1 ? 1 : 0 };
  }

  // --- BOOKINGS ---
  if (lower.startsWith('select * from bookings')) {
    let list = [...localDB.data.bookings];
    let pIdx = 0;
    if (lower.includes('confirmed = ?')) {
      const confVal = params[pIdx++];
      list = list.filter(b => (b.confirmed ? 1 : 0) === confVal);
    }
    if (lower.includes('booking_date >= ?')) {
      const startDate = params[pIdx++];
      list = list.filter(b => b.booking_date >= startDate);
    }
    if (lower.includes('booking_date <= ?')) {
      const endDate = params[pIdx++];
      list = list.filter(b => b.booking_date <= endDate);
    }
    return list.sort((a, b) => (b.booking_date || '').localeCompare(a.booking_date || ''));
  }
  if (lower.startsWith('insert into bookings')) {
    const [id, client_name, client_email, client_phone, pack_name, extra_preferences, extra_durations, extra_start_times, booking_date, booking_time, num_people, location, referralCode, price, confirmed, payment_method, created_by, extras, notes] = params;
    const bk = { id, client_name, client_email, client_phone, pack_name, extra_preferences, extra_durations, extra_start_times, booking_date, booking_time, num_people, location, referralCode, price, confirmed, payment_method, created_by, extras, notes, created_at: new Date().toISOString() };
    localDB.data.bookings.push(bk);
    localDB.save();
    return { affectedRows: 1 };
  }
  if (lower.startsWith('update bookings set')) {
    const id = params[params.length - 1];
    const bk = localDB.data.bookings.find(b => b.id === id);
    if (bk) {
      const setPart = norm.substring(norm.toLowerCase().indexOf('set') + 3, norm.toLowerCase().indexOf('where')).trim();
      const fields = setPart.split(',').map(f => f.trim().replace(/`/g, '').split('=')[0].trim());
      fields.forEach((field, i) => {
        bk[field] = params[i];
      });
      localDB.save();
    }
    return { affectedRows: bk ? 1 : 0 };
  }
  if (lower.startsWith('delete from bookings where booking_date < ? and confirmed = 0')) {
    const dateLimit = params[0];
    const initialLen = localDB.data.bookings.length;
    localDB.data.bookings = localDB.data.bookings.filter(b => !(b.booking_date < dateLimit && !b.confirmed));
    localDB.save();
    return { affectedRows: initialLen - localDB.data.bookings.length };
  }
  if (lower.startsWith('delete from bookings where id =')) {
    const idx = localDB.data.bookings.findIndex(b => b.id === params[0]);
    if (idx !== -1) { localDB.data.bookings.splice(idx, 1); localDB.save(); }
    return { affectedRows: idx !== -1 ? 1 : 0 };
  }

  // --- EXPENSES ---
  if (lower.startsWith('select * from expenses')) {
    let list = [...localDB.data.expenses];
    let pIdx = 0;
    if (lower.includes('date >= ?')) {
      list = list.filter(e => e.date >= params[pIdx++]);
    }
    if (lower.includes('date <= ?')) {
      list = list.filter(e => e.date <= params[pIdx++]);
    }
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }
  if (lower.startsWith('insert into expenses')) {
    const [id, date, type, amount] = params;
    const exp = { id, date, type, amount, created_at: new Date().toISOString() };
    localDB.data.expenses.push(exp);
    localDB.save();
    return { affectedRows: 1 };
  }
  if (lower.startsWith('delete from expenses where id =')) {
    const idx = localDB.data.expenses.findIndex(e => e.id === params[0]);
    if (idx !== -1) { localDB.data.expenses.splice(idx, 1); localDB.save(); }
    return { affectedRows: idx !== -1 ? 1 : 0 };
  }

  // --- SETTINGS ---
  if (lower.startsWith('select val_data from settings where key_name =')) {
    const row = localDB.data.settings.find(s => s.key_name === params[0]);
    return row ? [{ val_data: row.val_data }] : [];
  }
  if (lower.startsWith('insert into settings')) {
    const [key_name, val_data] = params;
    const idx = localDB.data.settings.findIndex(s => s.key_name === key_name);
    if (idx !== -1) {
      localDB.data.settings[idx].val_data = val_data;
    } else {
      localDB.data.settings.push({ key_name, val_data });
    }
    localDB.save();
    return { affectedRows: 1 };
  }

  return [];
}

async function queryDB(sql, params = []) {
  if (useMySQL && pool) {
    return await pool.query(sql, params);
  } else {
    return [executeLocalQuery(sql, params)];
  }
}

async function connectDB() {
  const configsToTry = [
    // 1. Environmental config
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'royalcoast',
      label: 'Environment Config'
    },
    // 2. Local MySQL fallback credentials
    {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'royalcoast',
      label: 'Local MySQL (root without password)'
    },
    {
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'root',
      database: 'royalcoast',
      label: 'Local MySQL (root / root)'
    }
  ];

  for (const dbConfig of configsToTry) {
    try {
      try {
        const tempConn = await mysql.createConnection({
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.user,
          password: dbConfig.password
        });
        await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
        await tempConn.end();
      } catch (e) {
        // Continue if user cannot create DB
      }

      pool = mysql.createPool({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      const testConn = await pool.getConnection();
      testConn.release();

      useMySQL = true;
      console.log(`✅ Connected to MySQL database (${dbConfig.label})!`);
      await initializeTables();
      return;
    } catch (err) {
      // Try next config
    }
  }

  useMySQL = false;
  localDB = new LocalDBEngine(path.join(__dirname, 'local_db.json'));
  console.log('------------------------------------------------------------------------');
  console.log('⚠️ MySQL server not reachable on localhost:3306.');
  console.log('✅ Using Local JSON Database fallback (server/local_db.json).');
  console.log('   All data will be loaded and saved locally seamlessly!');
  console.log('------------------------------------------------------------------------');
}

async function initializeTables() {
  if (!useMySQL || !pool) return;
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
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
    const [existing] = await queryDB('SELECT uid FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Utilizador já registado' });

    const passwordHash = await bcrypt.hash(password, 10);
    const uid = 'u-' + Math.random().toString(36).substring(2, 15);

    const namePart = (displayName || 'user').trim().toLowerCase().replace(/\s+/g, '').slice(0, 5);
    const randomPart = Math.random().toString(36).substring(2, 6);
    const referralCode = `${namePart}-${randomPart}`;

    await queryDB(
      `INSERT INTO users (uid, email, displayName, password_hash, referralCode) VALUES (?, ?, ?, ?, ?)`,
      [uid, email, displayName, passwordHash, referralCode]
    );

    const token = jwt.sign({ uid, email }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.json({ token, user: { uid, email, displayName, referralCode } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Google Auth
app.post('/api/auth/google', async (req, res) => {
  const { email, displayName, name, photoURL, picture, sub, googleId } = req.body;
  const userEmail = email;
  const userName = displayName || name || 'Utilizador Google';
  const userPhoto = photoURL || picture || null;
  const gId = sub || googleId || Math.random().toString(36).substring(2, 15);

  if (!userEmail) return res.status(400).json({ error: 'Email do Google em falta' });

  try {
    const [rows] = await queryDB('SELECT * FROM users WHERE email = ?', [userEmail]);
    let user;

    if (rows.length === 0) {
      const uid = 'g-' + gId;
      const namePart = userName.trim().toLowerCase().replace(/\s+/g, '').slice(0, 5);
      const randomPart = Math.random().toString(36).substring(2, 6);
      const referralCode = `${namePart}-${randomPart}`;
      const dummyHash = await bcrypt.hash(Math.random().toString(36), 10);

      await queryDB(
        `INSERT INTO users (uid, email, displayName, photoURL, provider, referralCode, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uid, userEmail, userName, userPhoto, 'google.com', referralCode, dummyHash]
      );

      user = { uid, email: userEmail, displayName: userName, photoURL: userPhoto, provider: 'google.com', referralCode };
    } else {
      user = rows[0];
      if (userPhoto && userPhoto !== user.photoURL) {
        await queryDB('UPDATE users SET photoURL = ?, updatedAt = CURRENT_TIMESTAMP WHERE uid = ?', [userPhoto, user.uid]);
        user.photoURL = userPhoto;
      }
      await queryDB('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE uid = ?', [user.uid]);
    }

    const token = jwt.sign({ uid: user.uid, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function buildAdminBookingWhatsAppMessage(data) {
  const dateFormatted = data.booking_date
    ? (data.booking_date.includes('-') ? data.booking_date.split('-').reverse().join('/') : data.booking_date)
    : 'N/D';
  const priceStr = data.price !== undefined && data.price !== null && data.price !== '' ? `${Number(data.price).toFixed(2)}€` : 'N/D';

  let extrasText = '';
  const allExtraItems = [];

  let parsedExtras = data.extras;
  if (typeof parsedExtras === 'string') {
    try { parsedExtras = JSON.parse(parsedExtras); } catch (e) {}
  }
  let parsedPrefs = data.extra_preferences;
  if (typeof parsedPrefs === 'string') {
    try { parsedPrefs = JSON.parse(parsedPrefs); } catch (e) {}
  }
  let parsedDurations = data.extra_durations;
  if (typeof parsedDurations === 'string') {
    try { parsedDurations = JSON.parse(parsedDurations); } catch (e) {}
  }
  let parsedStartTimes = data.extra_start_times;
  if (typeof parsedStartTimes === 'string') {
    try { parsedStartTimes = JSON.parse(parsedStartTimes); } catch (e) {}
  }

  if (parsedExtras && typeof parsedExtras === 'object') {
    for (const [key, val] of Object.entries(parsedExtras)) {
      if (val) {
        const details = [];
        if (parsedStartTimes && parsedStartTimes[key]) details.push(`início: ${parsedStartTimes[key]}`);
        if (parsedDurations && parsedDurations[key]) details.push(`duração: ${parsedDurations[key]}h`);
        if (parsedPrefs && parsedPrefs[key]) details.push(`nota: ${parsedPrefs[key]}`);
        allExtraItems.push(`• *${key}*${details.length > 0 ? ` (${details.join(', ')})` : ''}`);
      }
    }
  } else if (parsedPrefs && typeof parsedPrefs === 'object') {
    for (const [key, val] of Object.entries(parsedPrefs)) {
      if (val) {
        allExtraItems.push(`• *${key}*: ${val}`);
      }
    }
  }

  if (allExtraItems.length > 0) {
    extrasText = `\n✨ *Extras & Preferências:*\n${allExtraItems.join('\n')}\n`;
  }

  const isConfirmed = data.confirmed === true || data.confirmed === 1 || data.confirmed === '1';

  return `🚨 *NOVA RESERVA ROYALCOAST* 🚨\n\n` +
    `🆔 *ID Reserva:* ${data.id || 'N/D'}\n` +
    `👤 *Cliente:* ${data.client_name || 'N/D'}\n` +
    `📱 *Contacto:* ${data.client_phone || 'N/D'}\n` +
    `📧 *Email:* ${data.client_email || 'N/D'}\n` +
    `🛥️ *Pacote / Experiência:* ${data.pack_name || 'N/D'}\n` +
    `📅 *Data:* ${dateFormatted}\n` +
    `⏰ *Hora:* ${data.booking_time || 'N/D'}\n` +
    `📍 *Local de Embarque:* ${data.location || 'N/D'}\n` +
    `👥 *Número de Pessoas:* ${data.num_people || 1}\n` +
    `💰 *Valor Total:* ${priceStr}\n` +
    (data.payment_method ? `💳 *Método de Pagamento:* ${data.payment_method}\n` : '') +
    (data.referralCode ? `🎁 *Recomendado por (Ref):* ${data.referralCode}\n` : '') +
    extrasText +
    (data.notes ? `📝 *Observações:* ${data.notes}\n` : '') +
    `👤 *Origem:* ${data.created_by || 'Cliente Online'}\n` +
    `📌 *Estado:* ${isConfirmed ? 'Confirmada' : 'Pendente'}`;
}

async function sendGreenApiMessage(to, body) {
  const cleanPhone = (to || '').replace(/\D/g, '');
  if (!cleanPhone || !body) return false;

  const greenInstance = process.env.GREEN_API_INSTANCE_ID || process.env.GREEN_API_ID || process.env.VITE_GREEN_API_INSTANCE_ID || '710722695372';
  const greenToken = process.env.GREEN_API_TOKEN || process.env.VITE_GREEN_API_TOKEN || '30cdd2db86224fdd849399777cd122cd9ea2baf4d1144650a1';
  const greenApiUrl = (process.env.GREEN_API_URL || 'https://7107.api.greenapi.com').replace(/\/+$/, '');

  if (greenInstance && greenToken) {
    try {
      const endpoint = `${greenApiUrl}/waInstance${greenInstance}/sendMessage/${greenToken}`;
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${cleanPhone}@c.us`,
          message: body
        })
      });
      const data = await resp.json();
      console.log(`✅ WhatsApp (Green API): Mensagem enviada para ${cleanPhone}`, data);
      return true;
    } catch (e) {
      console.error('❌ Green API Error:', e.message);
    }
  }
  return false;
}

async function sendMetaWhatsAppMessage(to, body, templateParams = null, templateName = 'reserva_confirmada') {
  const cleanPhone = (to || '').replace(/\D/g, '');
  if (!cleanPhone || !body) return false;

  const metaToken = process.env.META_WA_TOKEN || '';
  const metaPhoneId = process.env.META_WA_PHONE_ID || '';
  if (metaToken && metaPhoneId) {
    try {
      if (templateParams && Array.isArray(templateParams)) {
        const components = [{
          type: 'body',
          parameters: templateParams.map(val => ({ type: 'text', text: String(val) }))
        }];
        const respT = await fetch(`https://graph.facebook.com/v20.0/${metaPhoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${metaToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'pt_PT' },
              components
            }
          })
        });
        const dataT = await respT.json();
        if (dataT.messages && dataT.messages.length > 0) {
          console.log(`✅ WhatsApp (Meta API Modelo ${templateName}): Enviado com sucesso para ${cleanPhone}`);
          return true;
        }
        console.warn(`📱 Modelo ${templateName} ainda em revisão ou indisponível. A tentar envio por texto direto...`);
      }

      const resp = await fetch(`https://graph.facebook.com/v20.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body }
        })
      });
      const data = await resp.json();
      console.log('📱 Meta WA API Response:', JSON.stringify(data));
      if (data.messages && data.messages.length > 0) {
        console.log(`✅ WhatsApp (Meta API Texto): Mensagem enviada com sucesso para ${cleanPhone}`);
        return true;
      }
      if (data.error) console.error('📱 Meta WA API Error:', data.error.message);
    } catch (e) {
      console.error('Meta WA API Error:', e.message);
    }
  }
  return false;
}

async function sendWhatsAppMessage(to, body, templateParams = null, templateName = 'reserva_confirmada', isAdmin = false) {
  if (isAdmin) {
    // Admin: Green API primeiro, Meta como fallback
    const sentGreen = await sendGreenApiMessage(to, body);
    if (sentGreen) return true;
    return await sendMetaWhatsAppMessage(to, body, templateParams, templateName);
  } else {
    // Cliente: Meta API primeiro, Green API como fallback
    const sentMeta = await sendMetaWhatsAppMessage(to, body, templateParams, templateName);
    if (sentMeta) return true;
    return await sendGreenApiMessage(to, body);
  }
}


// WhatsApp Status Route
app.get('/api/whatsapp/status', (req, res) => {
  const metaToken = process.env.META_WA_TOKEN || '';
  const metaPhoneId = process.env.META_WA_PHONE_ID || '';
  const configured = !!(metaToken && metaPhoneId);
  res.json({
    status: configured ? 'CONNECTED' : 'DISCONNECTED',
    connected: configured,
    hasQrCode: false,
    mode: 'meta_api'
  });
});

app.get('/api/whatsapp/qr', (req, res) => {
  res.send(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#0d1117;color:#fff;">
    <div style="text-align:center;background:#161b22;padding:40px;border-radius:24px;">
      <h1 style="color:#2ea44f;">✅ WhatsApp via Meta API Oficial</h1>
      <p style="color:#8b949e;">A ligação WhatsApp é feita via Meta Cloud API. Não é necessário QR Code.</p>
    </div>
  </body></html>`);
});

// WhatsApp Notification Route
app.post('/api/notify/whatsapp', async (req, res) => {
  const { to, message, templateParams } = req.body;

  let sentClient = false;
  if (to && message) {
    console.log('📱 ENVIANDO MENSAGEM WHATSAPP PARA O CLIENTE:', to);
    sentClient = await sendWhatsAppMessage(to, message, templateParams, 'reserva_confirmada');
  }

  res.json({ success: true, clientSent: sentClient });
});

// EmailJS Notification Helper & Route (Backend API)
async function sendEmailJSNotification(templateParams) {
  const serviceId = process.env.VITE_EMAILJS_SERVICE_ID || process.env.EMAILJS_SERVICE_ID || 'service_souo4bi';
  const templateId = process.env.VITE_EMAILJS_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID || 'template_lyoryda';
  const publicKey = process.env.VITE_EMAILJS_PUBLIC_KEY || process.env.EMAILJS_PUBLIC_KEY || 'YAyeqW_hAHwLaV3Ho';

  const servicesToTry = [serviceId, 'default_service'];



  for (const sId of Array.from(new Set(servicesToTry))) {
    try {
      const payload = {
        service_id: sId,
        template_id: templateId,
        user_id: publicKey,
        template_params: templateParams
      };

      console.log(`📧 ENVIANDO EMAIL VIA EMAILJS REST API (Service: ${sId}) PARA:`, templateParams.to_email || templateParams.email);
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://www.royalcoast.pt'
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      if (response.ok) {
        console.log(`✅ EmailJS enviado com sucesso via Backend API (Service: ${sId})! Resposta:`, text);
        return true;
      } else {
        console.warn(`⚠️ Tentativa EmailJS com Service ID "${sId}" retornou ${response.status}: ${text}`);
      }
    } catch (err) {
      console.error('❌ Exceção ao enviar EmailJS via Backend API:', err.message);
    }
  }
  return false;
}


app.post('/api/notify/email', async (req, res) => {
  const { templateParams } = req.body;
  if (!templateParams) return res.status(400).json({ error: 'Falta templateParams' });
  const success = await sendEmailJSNotification(templateParams);
  res.json({ success });
});


// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Falta email ou password' });

  try {
    const [rows] = await queryDB('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(400).json({ error: 'Email ou password incorretos' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Email ou password incorretos' });

    await queryDB('UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE uid = ?', [user.uid]);

    const token = jwt.sign({ uid: user.uid, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.json({ token, user: { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL, referralCode: user.referralCode, firstName: user.firstName, lastName: user.lastName, phonePrefix: user.phonePrefix, phoneNumber: user.phoneNumber, birthDate: user.birthDate } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Me (Get profile)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await queryDB('SELECT uid, email, displayName, photoURL, provider, referralCode, firstName, lastName, phonePrefix, phoneNumber, birthDate FROM users WHERE uid = ?', [req.user.uid]);
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
    await queryDB(
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
    await queryDB('UPDATE users SET password_hash = ?, updatedAt = CURRENT_TIMESTAMP WHERE uid = ?', [passwordHash, req.user.uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete account
app.delete('/api/auth/account', authenticateToken, async (req, res) => {
  try {
    await queryDB('DELETE FROM users WHERE uid = ?', [req.user.uid]);
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
    await queryDB('UPDATE users SET photoURL = ?, updatedAt = CURRENT_TIMESTAMP WHERE uid = ?', [photoURL, req.user.uid]);
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
    const [rows] = await queryDB('SELECT * FROM boats ORDER BY boat_order ASC');
    const parsed = rows.map(b => ({
      ...b,
      images: b.images ? (typeof b.images === 'string' ? JSON.parse(b.images) : b.images) : [],
      features: b.features ? (typeof b.features === 'string' ? JSON.parse(b.features) : b.features) : [],
      extraOptions: b.extraOptions ? (typeof b.extraOptions === 'string' ? JSON.parse(b.extraOptions) : b.extraOptions) : [],
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
    await queryDB(
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
    await queryDB(
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
  const orders = req.body;
  try {
    for (const item of orders) {
      await queryDB('UPDATE boats SET boat_order = ? WHERE id = ?', [item.order, item.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/boats/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await queryDB('DELETE FROM boats WHERE id = ?', [id]);
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
    const [rows] = await queryDB('SELECT * FROM tours ORDER BY tour_order ASC');
    const parsed = rows.map(t => ({
      ...t,
      packs: t.packs ? (typeof t.packs === 'string' ? JSON.parse(t.packs) : t.packs) : [],
      extraOptions: t.extraOptions ? (typeof t.extraOptions === 'string' ? JSON.parse(t.extraOptions) : t.extraOptions) : [],
      images: t.images ? (typeof t.images === 'string' ? JSON.parse(t.images) : t.images) : (t.image ? [t.image] : [])
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tours', async (req, res) => {
  const data = req.body;
  const id = 't-' + Math.random().toString(36).substring(2, 15);
  const imgs = data.images || [];
  const img = data.image || (imgs[0] || '');
  try {
    await queryDB(
      `INSERT INTO tours (id, name, slug, packs, capacity, price4h, price8h, extraOptions, theme, tour_order, image, images) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, data.name, data.slug, JSON.stringify(data.packs || []), data.capacity, data.price4h || '', data.price8h || '',
        JSON.stringify(data.extraOptions || []), data.theme || 'ocean', data.order || 0, img, JSON.stringify(imgs)
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
  const imgs = data.images || [];
  const img = data.image || (imgs[0] || '');
  try {
    await queryDB(
      `UPDATE tours SET name=?, slug=?, packs=?, capacity=?, price4h=?, price8h=?, extraOptions=?, theme=?, tour_order=?, image=?, images=? WHERE id=?`,
      [
        data.name, data.slug, JSON.stringify(data.packs || []), data.capacity, data.price4h || '', data.price8h || '',
        JSON.stringify(data.extraOptions || []), data.theme || 'ocean', data.order || 0, img, JSON.stringify(imgs), id
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
      await queryDB('UPDATE tours SET tour_order = ? WHERE id = ?', [item.order, item.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tours/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await queryDB('DELETE FROM tours WHERE id = ?', [id]);
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
    const [rows] = await queryDB('SELECT * FROM gallery ORDER BY created_at DESC');
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
    await queryDB(
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
    const [rows] = await queryDB('SELECT url FROM gallery WHERE id = ?', [id]);
    if (rows.length > 0) {
      const fileUrl = rows[0].url;
      if (fileUrl.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    await queryDB('DELETE FROM gallery WHERE id = ?', [id]);
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
    const [rows] = await queryDB(queryStr, params);
    const parsed = rows.map(b => ({
      ...b,
      extra_preferences: b.extra_preferences ? (typeof b.extra_preferences === 'string' ? JSON.parse(b.extra_preferences) : b.extra_preferences) : {},
      extra_durations: b.extra_durations ? (typeof b.extra_durations === 'string' ? JSON.parse(b.extra_durations) : b.extra_durations) : {},
      extra_start_times: b.extra_start_times ? (typeof b.extra_start_times === 'string' ? JSON.parse(b.extra_start_times) : b.extra_start_times) : {},
      extras: b.extras ? (typeof b.extras === 'string' ? JSON.parse(b.extras) : b.extras) : {},
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
    await queryDB(
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

    // ─── Auto-send Email Confirmation ─────────────────────────────────────────
    if (data.client_email) {
      const firstName = (data.client_name || '').split(' ')[0] || data.client_name || '';
      // Format date: YYYY-MM-DD → DD/MM/YYYY
      const dateFormatted = data.booking_date
        ? data.booking_date.split('-').reverse().join('/')
        : '';
      const priceStr = data.price ? `${Number(data.price).toFixed(2)}€` : '';

      const emailParams = {
        to_name: firstName,
        to_email: data.client_email,
        email: data.client_email,
        reply_to: data.client_email,
        pack_name: data.pack_name || '',
        booking_date: dateFormatted,
        booking_time: data.booking_time || '',
        num_people: String(data.num_people || 1),
        phone: data.client_phone || '',
        location: data.location || '',
        extras: 'Nenhum',
        pack_price: priceStr,
      };

      sendEmailJSNotification(emailParams).catch(err =>
        console.error('❌ Erro ao enviar email de confirmação:', err)
      );
    }

    // ─── Auto-send WhatsApp Notification ──────────────────────────────────────
    const firstName = (data.client_name || '').split(' ')[0] || '';
    const dateFormatted = data.booking_date
      ? data.booking_date.split('-').reverse().join('/')
      : '';
    const priceStr = data.price ? `${Number(data.price).toFixed(2)}€` : '';

    const adminPhone = process.env.WHATSAPP_ADMIN_PHONE || '351927314506';
    const adminMsg = buildAdminBookingWhatsAppMessage({ id, ...data });

    const clientMsg =
      `🌊 *ROYALCOAST - RESERVA REGISTADA!* 🌊\n\n` +
      `Olá ${firstName}! 👋\n\n` +
      `A tua reserva na *RoyalCoast* foi registada com sucesso!\n\n` +
      `📋 *Detalhes da Reserva:*\n` +
      `• *Experiência:* ${data.pack_name || ''}\n` +
      `• *Data:* ${dateFormatted}\n` +
      `• *Hora:* ${data.booking_time || 'N/D'}\n` +
      `• *Local:* ${data.location || 'N/D'}\n` +
      `• *Pessoas:* ${data.num_people || 1}\n` +
      `• *Valor Total:* ${priceStr}\n\n` +
      `📍 Por favor, chega 15 minutos antes no ponto de embarque.\n\n` +
      `Dúvidas? Liga para +351 927 314 506.\n\nAté breve! 🚤`;

    // Admin WhatsApp alert via Green API (isAdmin = true)
    console.log('📱 Enviando notificação detalhada da reserva para o Admin via Green API:', adminPhone);
    sendWhatsAppMessage(adminPhone, adminMsg, null, 'nova_reserva_admin', true).catch((e) => console.error('Erro ao enviar mensagem admin Green API:', e));


    // Client WhatsApp (if phone available)
    if (data.client_phone) {
      const cleanClientPhone = data.client_phone.replace(/\D/g, '');
      sendWhatsAppMessage(cleanClientPhone, clientMsg, null, 'reserva_confirmada').catch(() => null);
    }

    res.json({ id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.put('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
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
      await queryDB(`UPDATE bookings SET ${sets.join(', ')} WHERE id = ?`, params);
    }
    res.json({ id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await queryDB('DELETE FROM bookings WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete unconfirmed past bookings
app.delete('/api/bookings/cleanup/past-unconfirmed', async (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    const [result] = await queryDB(
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
    const [rows] = await queryDB(queryStr, params);
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
    await queryDB(
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
    await queryDB('DELETE FROM expenses WHERE id = ?', [id]);
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
    const [rows] = await queryDB('SELECT val_data FROM settings WHERE key_name = ?', [key]);
    if (rows.length === 0) return res.json({});
    const valData = rows[0].val_data;
    res.json(typeof valData === 'string' ? JSON.parse(valData) : valData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/:key', async (req, res) => {
  const { key } = req.params;
  const data = req.body;
  try {
    await queryDB(
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
    const [rows] = await queryDB('SELECT uid, email, displayName, photoURL, provider, referralCode, firstName, lastName, phonePrefix, phoneNumber, birthDate, updatedAt FROM users ORDER BY updatedAt DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    await queryDB('DELETE FROM users WHERE uid = ?', [uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static frontend files in production (React build)
const distDir = path.join(__dirname, '../dist');
app.use(express.static(distDir));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(distDir, 'index.html'));
  }
});

// Start Server
app.listen(PORT, async () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  await connectDB();
  const metaToken = process.env.META_WA_TOKEN || '';
  const metaPhoneId = process.env.META_WA_PHONE_ID || '';
  if (metaToken && metaPhoneId) {
    console.log('✅ WhatsApp via Meta Cloud API configurado e pronto!');
  } else {
    console.warn('⚠️ META_WA_TOKEN ou META_WA_PHONE_ID não configurados no .env');
  }
});
