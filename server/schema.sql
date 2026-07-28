CREATE DATABASE IF NOT EXISTS royalcoast;
USE royalcoast;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  uid VARCHAR(128) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  displayName VARCHAR(255),
  photoURL VARCHAR(512),
  provider VARCHAR(50) DEFAULT 'password',
  referralCode VARCHAR(100) UNIQUE,
  lastLogin TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  phonePrefix VARCHAR(10),
  phoneNumber VARCHAR(20),
  birthDate VARCHAR(50),
  password_hash VARCHAR(255)
);

-- Boats Table
CREATE TABLE IF NOT EXISTS boats (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  size VARCHAR(100),
  engine VARCHAR(100),
  capacity INT,
  price4h VARCHAR(50),
  price8h VARCHAR(50),
  images TEXT, -- JSON array of URLs
  slug VARCHAR(255) UNIQUE,
  range_type VARCHAR(50) DEFAULT 'mid',
  boat_order INT DEFAULT 0,
  image VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  features TEXT, -- JSON array of strings
  cost4h VARCHAR(50),
  cost8h VARCHAR(50),
  useMarkup4h BOOLEAN DEFAULT FALSE,
  useMarkup8h BOOLEAN DEFAULT FALSE,
  deliveryCost4h VARCHAR(50),
  deliveryCost8h VARCHAR(50),
  useDelivery4h BOOLEAN DEFAULT FALSE,
  useDelivery8h BOOLEAN DEFAULT FALSE,
  extraOptions TEXT -- JSON array of objects
);

-- Tours Table
CREATE TABLE IF NOT EXISTS tours (
  id VARCHAR(128) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  packs TEXT, -- JSON array of objects
  capacity INT,
  price4h VARCHAR(50),
  price8h VARCHAR(50),
  extraOptions TEXT, -- JSON array of objects
  theme VARCHAR(50),
  tour_order INT DEFAULT 0,
  image VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
  id VARCHAR(128) PRIMARY KEY,
  url VARCHAR(512) NOT NULL,
  alt VARCHAR(255) DEFAULT 'Imagem da galeria',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(128) PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(100),
  pack_name VARCHAR(512) NOT NULL,
  extra_preferences TEXT, -- JSON object
  extra_durations TEXT, -- JSON object
  extra_start_times TEXT, -- JSON object
  booking_date VARCHAR(50),
  booking_time VARCHAR(50),
  num_people INT,
  location VARCHAR(255),
  referralCode VARCHAR(100),
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed BOOLEAN DEFAULT FALSE,
  payment_method VARCHAR(100),
  created_by VARCHAR(255),
  extras TEXT, -- JSON object
  notes TEXT
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(128) PRIMARY KEY,
  date VARCHAR(50) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'gasolina', 'manutencao'
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings Table
CREATE TABLE IF NOT EXISTS settings (
  key_name VARCHAR(100) PRIMARY KEY,
  val_data TEXT -- JSON representation of settings values
);

-- Seed Settings
INSERT INTO settings (key_name, val_data) VALUES ('general', '{"maintenanceMode":false}') 
ON DUPLICATE KEY UPDATE key_name=key_name;
