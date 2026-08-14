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

function formatWhatsAppPhone(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (!cleaned) return '';
  if (cleaned.length === 9 && (cleaned.startsWith('9') || cleaned.startsWith('2') || cleaned.startsWith('3'))) {
    cleaned = '351' + cleaned;
  }
  return cleaned;
}

async function sendWhatsAppTemplate(toPhone, templateName, templateParams, languageCode = 'pt_PT') {
  const cleanPhone = formatWhatsAppPhone(toPhone);
  if (!cleanPhone) {
    console.error(`❌ WhatsApp template [${templateName}] failed: phone number missing or invalid`);
    return false;
  }

  const metaToken = process.env.META_WA_TOKEN || 'EAARmrytIMFkBSPDSeAtMF1EZBOgeylnFdZC6tGijlbJYjrdgJsDuYQy3vZBpmvXZBsD4f8ar7dWwKYXpkAITodAOiJEzWmqH1CR6Wpd80hhwt5SDsVnjSZA4tfe41NOdeV7sZAttncdxbVUQ0y8IUHGcW7SDyKxuZAllQcAoDHEJ1A5FQ8R2GF22HqwoZABrDQZDZD';
  const metaPhoneId = process.env.META_WA_PHONE_ID || '1240632239137751';

  const components = [
    {
      type: 'body',
      parameters: (templateParams || []).map(val => ({
        type: 'text',
        text: String(val ?? '')
      }))
    }
  ];

  const languagesToTry = [languageCode, 'pt_PT', 'pt', 'pt_BR', 'en_US'].filter((v, i, a) => a.indexOf(v) === i);

  for (const lang of languagesToTry) {
    try {
      console.log(`📱 Envia Meta WA Template '${templateName}' (lang: ${lang}) -> ${cleanPhone}`);
      const resp = await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}/messages`, {
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
            language: { code: lang },
            components
          }
        })
      });
      const data = await resp.json();
      console.log(`📱 Meta WA Template (${templateName}) Resp [${cleanPhone}]:`, JSON.stringify(data));

      if (data.messages && data.messages.length > 0) {
        return true;
      }
      if (data.error && (data.error.code === 132001 || data.error.message?.toLowerCase().includes('language'))) {
        continue;
      }
      if (data.error) {
        console.error(`❌ Meta WA API Error for template ${templateName}:`, data.error.message || JSON.stringify(data.error));
      }
    } catch (e) {
      console.error(`❌ Meta WA Exception [${templateName}]:`, e.message);
    }
  }
  return false;
}

async function sendWhatsAppMessage(to, body) {
  const cleanPhone = formatWhatsAppPhone(to);
  if (!cleanPhone || !body) return false;

  // 1. Meta WhatsApp Cloud API (Free text message within 24h window)
  const metaToken = process.env.META_WA_TOKEN || 'EAARmrytIMFkBSPDSeAtMF1EZBOgeylnFdZC6tGijlbJYjrdgJsDuYQy3vZBpmvXZBsD4f8ar7dWwKYXpkAITodAOiJEzWmqH1CR6Wpd80hhwt5SDsVnjSZA4tfe41NOdeV7sZAttncdxbVUQ0y8IUHGcW7SDyKxuZAllQcAoDHEJ1A5FQ8R2GF22HqwoZABrDQZDZD';
  const metaPhoneId = process.env.META_WA_PHONE_ID || '1240632239137751';
  if (metaToken && metaPhoneId) {
    try {
      const resp = await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}/messages`, {
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
      console.log('📱 Meta WA Text Response:', JSON.stringify(data));
      if (data.messages && data.messages.length > 0) return true;
      if (data.error) console.error('📱 Meta WA Text Error:', data.error.message);
    } catch (e) {
      console.error('Meta WA API Error:', e.message);
    }
  }

  // 2. Green API Fallback
  const greenInstance = process.env.GREEN_API_INSTANCE_ID || process.env.GREEN_API_ID || '';
  const greenToken = process.env.GREEN_API_TOKEN || '';
  if (greenInstance && greenToken) {
    try {
      await fetch(`https://api.green-api.com/waInstance${greenInstance}/sendMessage/${greenToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${cleanPhone}@c.us`,
          message: body
        })
      });
      return true;
    } catch (e) {
      console.error('Green API Error:', e.message);
    }
  }

  // 3. CallMeBot Fallback
  const callMeBotKey = process.env.CALLMEBOT_API_KEY || '';
  if (callMeBotKey) {
    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(body)}&apikey=${encodeURIComponent(callMeBotKey)}`;
      await fetch(url);
      return true;
    } catch (e) {
      console.error('CallMeBot Error:', e.message);
    }
  }

  return false;
}

// WhatsApp Notification Route
app.post('/api/notify/whatsapp', async (req, res) => {
  const {
    to,
    message,
    adminMessage,
    // Booking structured parameters
    clientPhone,
    clientName,
    firstName,
    clientEmail,
    packName,
    bookingDate,
    bookingTime,
    location,
    numPeople,
    totalPriceStr,
    adminPhone,
    templateParams
  } = req.body;

  const targetClientPhone = clientPhone || to;
  const targetAdminPhone = adminPhone || process.env.ADMIN_PHONE_NUMBER || '351930663083';

  const cName = clientName || firstName || 'Cliente';
  const fName = firstName || (clientName ? clientName.split(' ')[0] : 'Cliente');
  const cPhone = targetClientPhone || '';
  const cEmail = clientEmail || 'Não indicado';
  const pName = packName || 'Reserva Royal Coast';
  const bDate = bookingDate || '';
  const bTime = bookingTime || '';
  const bLoc = location || 'Setúbal';
  const bPeople = String(numPeople || '1');
  const bPrice = totalPriceStr || '';

  let clientSent = false;
  let adminSent = false;

  // 1. Send Template 'reserva_confirmada' to Customer (7 params)
  // Template: Olá {{1}}! ... {{2}} Experiência ... {{3}} Data ... {{4}} Hora ... {{5}} Local ... {{6}} Pessoas ... {{7}} Valor Total
  if (targetClientPhone) {
    const customerParams = templateParams && templateParams.length === 7 ? templateParams : [
      fName,
      pName,
      bDate,
      bTime,
      bLoc,
      bPeople,
      bPrice
    ];
    console.log(`📱 A notificar cliente (${targetClientPhone}) via template 'reserva_confirmada'...`);
    clientSent = await sendWhatsAppTemplate(targetClientPhone, 'reserva_confirmada', customerParams);
    
    // Fallback to text message if template fails
    if (!clientSent && message) {
      console.log(`⚠️ Template falhou. Tentando envio de mensagem de texto direta para o cliente...`);
      clientSent = await sendWhatsAppMessage(targetClientPhone, message);
    }
  }

  // 2. Send Template 'nova_reserva_admin' to Admins (927314506 and 930663083)
  const adminPhones = ['351927314506', '351930663083'];
  if (adminPhone) {
    const cleanReqAdmin = formatWhatsAppPhone(adminPhone);
    if (cleanReqAdmin && !adminPhones.includes(cleanReqAdmin)) {
      adminPhones.push(cleanReqAdmin);
    }
  }

  for (const adminNum of adminPhones) {
    const adminParams = [
      cName,
      cPhone,
      cEmail,
      pName,
      bDate,
      bTime,
      bLoc,
      bPeople,
      bPrice
    ];
    console.log(`📱 A notificar administração (${adminNum}) via template 'nova_reserva_admin'...`);
    const sent = await sendWhatsAppTemplate(adminNum, 'nova_reserva_admin', adminParams);
    if (sent) adminSent = true;
    
    // Fallback to text message if template fails
    if (!sent && (adminMessage || message)) {
      console.log(`⚠️ Template admin falhou para ${adminNum}. Tentando mensagem de texto direta...`);
      const textSent = await sendWhatsAppMessage(adminNum, adminMessage || message);
      if (textSent) adminSent = true;
    }
  }

  res.json({
    success: true,
    clientSent,
    adminSent
  });
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

// ==========================================
// INSTAGRAM API (@royalcoast.pt)
// ==========================================

const FALLBACK_INSTAGRAM_POSTS = [
  {
    id: "ig_post_1",
    caption: "A navegar pelas águas cristalinas do Ribeiro do Cavalo em Sesimbra 🌊🚤 Venha descobrir o paraíso connosco! #royalcoast #sesimbra #arrabida #boattrip #portugal",
    media_type: "IMAGE",
    media_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80",
    permalink: "https://www.instagram.com/royalcoast.pt",
    timestamp: "2026-08-12T14:30:00Z",
    like_count: 248,
    comments_count: 19,
    location: "Praia do Ribeiro do Cavalo, Sesimbra",
    category: "tours"
  },
  {
    id: "ig_post_2",
    caption: "Adrenalina pura no mar de Sesimbra a bordo da nossa Yamaha FX Cruiser! 🔥💨 Reserve já a sua sessão de Jetski. #royalcoast #jetski #seadoo #yamahajetski #sesimbra",
    media_type: "VIDEO",
    media_url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1000&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1000&q=80",
    permalink: "https://www.instagram.com/royalcoast.pt",
    timestamp: "2026-08-10T17:15:00Z",
    like_count: 312,
    comments_count: 27,
    location: "Baía de Sesimbra",
    category: "jetski"
  },
  {
    id: "ig_post_3",
    caption: "Momentos mágicos: golfinhos a nadar ao lado do nosso barco no Estuário do Sado 🐬✨ Uma experiência inesquecível para toda a família! #royalcoast #golfinhos #sado #setubal #arrabida",
    media_type: "CAROUSEL_ALBUM",
    media_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
    permalink: "https://www.instagram.com/royalcoast.pt",
    timestamp: "2026-08-08T11:00:00Z",
    like_count: 489,
    comments_count: 42,
    location: "Reserva Natural do Estuário do Sado",
    category: "dolphins"
  },
  {
    id: "ig_post_4",
    caption: "Pôr do sol único sobre a Serra da Arrábida a partir do oceano 🌅🥂 Brinde a momentos inesquecíveis com a Royal Coast. #royalcoast #sunsettour #arrabida #sesimbra #champagne",
    media_type: "IMAGE",
    media_url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1000&q=80",
    permalink: "https://www.instagram.com/royalcoast.pt",
    timestamp: "2026-08-06T19:45:00Z",
    like_count: 415,
    comments_count: 31,
    location: "Parque Natural da Arrábida",
    category: "sunset"
  },
  {
    id: "ig_post_5",
    caption: "A explorar as grutas secretas da costa da Arrábida. Águas azul-turquesa de tirar o fôlego! 💙 Blue Water Tour. #royalcoast #grutas #arrabidaliving #portugaladventure",
    media_type: "IMAGE",
    media_url: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1000&q=80",
    permalink: "https://www.instagram.com/royalcoast.pt",
    timestamp: "2026-08-04T16:20:00Z",
    like_count: 276,
    comments_count: 14,
    location: "Cabo Espichel / Arrábida",
    category: "tours"
  },
  {
    id: "ig_post_6",
    caption: "Velocidade e liberdade no Atlântico! A nossa frota de Jetskis pronta para acção. Quem vem dar um passeio? 🌊🚀 #royalcoast #jetskisession #watersports #sesimbraturismo",
    media_type: "IMAGE",
    media_url: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1000&q=80",
    permalink: "https://www.instagram.com/royalcoast.pt",
    timestamp: "2026-08-02T13:10:00Z",
    like_count: 350,
    comments_count: 22,
    location: "Sesimbra, Portugal",
    category: "jetski"
  },
  {
    id: "ig_post_7",
    caption: "Festa privada a bordo com amigos! Comemore os seus momentos especiais no mar connosco 🎉🍾 #royalcoast #privatecharter #boatparty #sesimbra #boattrip",
    media_type: "IMAGE",
    media_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80",
    permalink: "https://www.instagram.com/royalcoast.pt",
    timestamp: "2026-07-30T18:00:00Z",
    like_count: 298,
    comments_count: 18,
    location: "Praia de Galapinhos",
    category: "tours"
  },
  {
    id: "ig_post_8",
    caption: "A vista deslumbrante de Tróia e das praias desertas da Arrábida. Reserve a sua viagem de barco! ☀️⚓ #royalcoast #troia #setubal #portugal #oceanvibes",
    media_type: "IMAGE",
    media_url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1000&q=80",
    permalink: "https://www.instagram.com/royalcoast.pt",
    timestamp: "2026-07-28T10:30:00Z",
    like_count: 265,
    comments_count: 12,
    location: "Península de Tróia",
    category: "tours"
  }
];

async function getInstagramToken() {
  if (process.env.INSTAGRAM_ACCESS_TOKEN) {
    return process.env.INSTAGRAM_ACCESS_TOKEN.trim();
  }
  try {
    const [rows] = await queryDB('SELECT val_data FROM settings WHERE key_name = ?', ['instagram_token']);
    if (rows.length > 0) {
      const parsed = typeof rows[0].val_data === 'string' ? JSON.parse(rows[0].val_data) : rows[0].val_data;
      if (parsed && parsed.token) return parsed.token.trim();
    }
  } catch (e) {
    console.error("Error reading instagram token from DB:", e.message);
  }
  return null;
}

app.get('/api/instagram/posts', async (req, res) => {
  try {
    const igToken = await getInstagramToken();
    if (igToken) {
      const resp = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count&access_token=${igToken}`);
      const data = await resp.json();
      if (resp.ok && data && data.data && data.data.length > 0) {
        return res.json(data.data.map(item => ({
          ...item,
          category: item.caption?.toLowerCase().includes('jetski') ? 'jetski' : item.caption?.toLowerCase().includes('golfinhos') ? 'dolphins' : item.caption?.toLowerCase().includes('por do sol') || item.caption?.toLowerCase().includes('sunset') ? 'sunset' : 'tours'
        })));
      } else if (data.error) {
        console.warn('Meta Graph API token error:', data.error.message);
      }
    }
    return res.json(FALLBACK_INSTAGRAM_POSTS);
  } catch (err) {
    console.error('Error fetching Instagram posts:', err.message);
    res.json(FALLBACK_INSTAGRAM_POSTS);
  }
});

app.post('/api/instagram/test-token', authenticateToken, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: 'Token não fornecido' });

  try {
    const resp = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${token.trim()}`);
    const data = await resp.json();

    if (resp.ok && data && data.id) {
      return res.json({
        success: true,
        username: data.username || 'royalcoast.pt',
        id: data.id,
        account_type: data.account_type || 'BUSINESS',
        media_count: data.media_count || 0
      });
    } else {
      return res.status(400).json({
        success: false,
        error: data.error?.message || 'Falha ao validar token com a API do Meta Graph'
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/instagram/profile', async (req, res) => {
  try {
    const token = await getInstagramToken();
    if (token) {
      const resp = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count,profile_picture_url,biography,followers_count,follows_count&access_token=${token}`);
      const data = await resp.json();
      if (resp.ok && data && data.username) {
        if (!data.profile_picture_url) data.profile_picture_url = '/royalcoast_profile.jpg';
        return res.json(data);
      }
    }
  } catch (err) {
    console.error('Error fetching Instagram profile:', err.message);
  }

  res.json({
    username: 'royalcoast.pt',
    biography: "⚓️ Luxury Boat & Jet Ski\n📍 Setúbal — Tróia\nAdrenalina e exclusividade num só lugar. ⚡️\nReservas e valores no nosso site! 👇",
    profile_picture_url: '/royalcoast_profile.jpg',
    followers_count: 522,
    follows_count: 3,
    media_count: 9
  });
});

app.get('/api/instagram/status', async (req, res) => {
  try {
    const token = await getInstagramToken();
    if (!token) {
      return res.json({ configured: false });
    }
    const resp = await fetch(`https://graph.instagram.com/me?fields=id,username,media_count&access_token=${token}`);
    const data = await resp.json();
    if (resp.ok && data.id) {
      return res.json({ configured: true, valid: true, username: data.username, media_count: data.media_count });
    } else {
      return res.json({ configured: true, valid: false, error: data.error?.message });
    }
  } catch (err) {
    res.json({ configured: false, error: err.message });
  }
});

app.post('/api/gallery', upload.single('file'), async (req, res) => {
  let url = req.body?.url;
  if (!url && req.file) {
    url = `/uploads/${req.file.filename}`;
  }
  if (!url) return res.status(400).json({ error: 'Nenhum ficheiro ou URL fornecido' });
  const id = 'g-' + Math.random().toString(36).substring(2, 15);
  const alt = req.body.alt || 'Imagem da galeria';
  try {
    await queryDB(
      'INSERT INTO gallery (id, url, alt) VALUES (?, ?, ?)',
      [id, url, alt]
    );
    res.json({ id, url, alt, created_at: new Date().toISOString() });
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
    if (key === 'instagram_token') {
      const token = await getInstagramToken();
      if (!token) return res.json({ configured: false, hasToken: false });
      return res.json({
        configured: true,
        hasToken: true,
        masked: `${token.substring(0, 6)}••••••••••••${token.substring(token.length - 4)}`
      });
    }

    const [rows] = await queryDB('SELECT val_data FROM settings WHERE key_name = ?', [key]);
    if (rows.length === 0) return res.json({});
    const valData = rows[0].val_data;
    res.json(typeof valData === 'string' ? JSON.parse(valData) : valData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/:key', authenticateToken, async (req, res) => {
  const { key } = req.params;
  const data = req.body;
  try {
    await queryDB(
      'INSERT INTO settings (key_name, val_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE val_data = ?',
      [key, JSON.stringify(data), JSON.stringify(data)]
    );
    res.json({ success: true });
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
});
