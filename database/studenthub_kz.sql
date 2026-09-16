-- StudentHub KZ: MySQL 8.0+ schema
-- Import this file with a MySQL account allowed to create databases.

CREATE DATABASE IF NOT EXISTS studenthub_kz
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE studenthub_kz;

CREATE TABLE universities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(180) NOT NULL,
  city VARCHAR(80) NOT NULL,
  website_url VARCHAR(500) NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY universities_name_city_unique (name, city),
  KEY universities_city_index (city)
) ENGINE=InnoDB;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(80) NOT NULL,
  role ENUM('student', 'moderator', 'admin') NOT NULL DEFAULT 'student',
  language ENUM('ru', 'kz') NOT NULL DEFAULT 'ru',
  email_verified_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB;

CREATE TABLE student_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  university_id BIGINT UNSIGNED NULL,
  city VARCHAR(80) NOT NULL,
  specialty VARCHAR(140) NOT NULL,
  study_year TINYINT UNSIGNED NULL,
  study_level ENUM('bachelor', 'master', 'phd') NOT NULL DEFAULT 'bachelor',
  bio VARCHAR(500) NULL,
  avatar_url VARCHAR(500) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT student_profiles_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT student_profiles_university_fk FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE SET NULL,
  KEY student_profiles_city_index (city),
  KEY student_profiles_specialty_index (specialty)
) ENGINE=InnoDB;

CREATE TABLE interests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(50) NOT NULL,
  title_ru VARCHAR(80) NOT NULL,
  title_kz VARCHAR(80) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY interests_slug_unique (slug)
) ENGINE=InnoDB;

CREATE TABLE profile_interests (
  user_id BIGINT UNSIGNED NOT NULL,
  interest_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, interest_id),
  CONSTRAINT profile_interests_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT profile_interests_interest_fk FOREIGN KEY (interest_id) REFERENCES interests(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE vacancies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  author_id BIGINT UNSIGNED NULL,
  title VARCHAR(180) NOT NULL,
  company_name VARCHAR(180) NOT NULL,
  city VARCHAR(80) NOT NULL,
  employment_type ENUM('internship', 'part_time', 'full_time', 'remote') NOT NULL,
  salary_from INT UNSIGNED NULL,
  salary_to INT UNSIGNED NULL,
  description TEXT NOT NULL,
  source_url VARCHAR(500) NULL,
  application_deadline DATE NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT vacancies_author_fk FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  KEY vacancies_discovery_index (is_published, city, employment_type, application_deadline)
) ENGINE=InnoDB;

CREATE TABLE events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  author_id BIGINT UNSIGNED NULL,
  title VARCHAR(180) NOT NULL,
  city VARCHAR(80) NOT NULL,
  venue VARCHAR(180) NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NULL,
  description TEXT NOT NULL,
  registration_url VARCHAR(500) NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT events_author_fk FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  KEY events_discovery_index (is_published, city, starts_at)
) ENGINE=InnoDB;

CREATE TABLE grants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  author_id BIGINT UNSIGNED NULL,
  title VARCHAR(180) NOT NULL,
  provider_name VARCHAR(180) NOT NULL,
  target_city VARCHAR(80) NULL,
  specialty VARCHAR(140) NULL,
  amount_description VARCHAR(160) NULL,
  eligibility TEXT NOT NULL,
  deadline DATE NULL,
  application_url VARCHAR(500) NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT grants_author_fk FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  KEY grants_discovery_index (is_published, deadline, target_city)
) ENGINE=InnoDB;

CREATE TABLE housing_listings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  author_id BIGINT UNSIGNED NULL,
  title VARCHAR(180) NOT NULL,
  city VARCHAR(80) NOT NULL,
  district VARCHAR(120) NULL,
  housing_type ENUM('dormitory', 'room', 'apartment', 'roommate') NOT NULL,
  monthly_price INT UNSIGNED NULL,
  description TEXT NOT NULL,
  contact_method VARCHAR(180) NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT housing_author_fk FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  KEY housing_discovery_index (is_published, city, housing_type, monthly_price)
) ENGINE=InnoDB;

CREATE TABLE marketplace_listings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  author_id BIGINT UNSIGNED NULL,
  title VARCHAR(180) NOT NULL,
  city VARCHAR(80) NOT NULL,
  category ENUM('book', 'electronics', 'supplies', 'other') NOT NULL,
  price INT UNSIGNED NULL,
  is_exchange BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT marketplace_author_fk FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  KEY marketplace_discovery_index (is_published, city, category, created_at)
) ENGINE=InnoDB;

CREATE TABLE saved_items (
  user_id BIGINT UNSIGNED NOT NULL,
  item_type ENUM('vacancy', 'event', 'grant', 'housing', 'marketplace') NOT NULL,
  item_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, item_type, item_id),
  CONSTRAINT saved_items_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY saved_items_lookup_index (item_type, item_id)
) ENGINE=InnoDB;

CREATE TABLE moderation_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  moderator_id BIGINT UNSIGNED NOT NULL,
  entity_type ENUM('vacancy', 'event', 'grant', 'housing', 'marketplace') NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  action ENUM('published', 'hidden', 'deleted') NOT NULL,
  note VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT moderation_log_moderator_fk FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY moderation_log_entity_index (entity_type, entity_id, created_at)
) ENGINE=InnoDB;

INSERT INTO interests (slug, title_ru, title_kz) VALUES
  ('internships', 'Стажировки', 'Тағылымдамалар'),
  ('grants', 'Гранты', 'Гранттар'),
  ('events', 'События', 'Іс-шаралар'),
  ('housing', 'Жильё', 'Тұрғын үй'),
  ('study', 'Учебные материалы', 'Оқу материалдары');

INSERT INTO universities (name, city, website_url, is_verified) VALUES
  ('Международный казахско-турецкий университет имени Х. А. Ясави', 'Туркестан', 'https://ayu.edu.kz/', TRUE),
  ('Казахский национальный университет имени аль-Фараби', 'Алматы', 'https://www.kaznu.kz/', TRUE),
  ('Astana IT University', 'Астана', 'https://astanait.edu.kz/', TRUE),
  ('Международный университет информационных технологий', 'Алматы', 'https://iitu.edu.kz/', TRUE);
