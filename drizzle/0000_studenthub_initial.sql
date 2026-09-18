CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE universities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  type TEXT,
  website_url TEXT,
  description TEXT NOT NULL,
  source_url TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_profiles (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city TEXT,
  university_id INTEGER REFERENCES universities(id) ON DELETE SET NULL,
  university_name TEXT,
  specialty TEXT,
  study_year INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE grants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  city TEXT,
  specialty TEXT,
  amount_description TEXT,
  eligibility TEXT NOT NULL,
  deadline TEXT NOT NULL,
  application_url TEXT,
  source_url TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  city TEXT,
  employment_type TEXT NOT NULL,
  description TEXT NOT NULL,
  application_url TEXT,
  deadline TEXT,
  source_url TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE housing_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  city TEXT NOT NULL,
  housing_type TEXT NOT NULL,
  monthly_price INTEGER,
  description TEXT NOT NULL,
  contact_url TEXT,
  source_url TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE favorites (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('university', 'grant')),
  item_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, item_type, item_id)
);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('university', 'grant')),
  entity_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'published', 'hidden')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_universities_catalog ON universities(is_published, city, name);
CREATE INDEX idx_grants_catalog ON grants(is_published, deadline, city);
CREATE INDEX idx_jobs_catalog ON jobs(is_published, city, employment_type, deadline);
CREATE INDEX idx_housing_catalog ON housing_listings(is_published, city, housing_type);
CREATE INDEX idx_favorites_user ON favorites(user_id, item_type);
