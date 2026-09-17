-- StudentHub KZ for MySQL 8.0+ / Open Server.
-- This creates only the structure. Add catalogue entries through /admin after
-- checking their official source; no demonstration records are inserted.

CREATE DATABASE IF NOT EXISTS studenthub_kz
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE studenthub_kz;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(80) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB;

CREATE TABLE universities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(180) NOT NULL,
  name VARCHAR(180) NOT NULL,
  city VARCHAR(80) NOT NULL,
  type VARCHAR(120) NULL,
  website_url VARCHAR(500) NULL,
  description TEXT NOT NULL,
  source_url VARCHAR(500) NOT NULL,
  checked_at DATE NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY universities_slug_unique (slug),
  CONSTRAINT universities_author_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  KEY universities_catalog_index (is_published, city, name)
) ENGINE=InnoDB;

CREATE TABLE student_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  city VARCHAR(80) NULL,
  university_id BIGINT UNSIGNED NULL,
  university_name VARCHAR(180) NULL,
  specialty VARCHAR(140) NULL,
  study_year TINYINT UNSIGNED NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT student_profiles_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT student_profiles_university_fk FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE grants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(180) NOT NULL,
  title VARCHAR(180) NOT NULL,
  provider_name VARCHAR(180) NOT NULL,
  city VARCHAR(80) NULL,
  specialty VARCHAR(140) NULL,
  amount_description VARCHAR(180) NULL,
  eligibility TEXT NOT NULL,
  deadline DATE NOT NULL,
  application_url VARCHAR(500) NULL,
  source_url VARCHAR(500) NOT NULL,
  checked_at DATE NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY grants_slug_unique (slug),
  CONSTRAINT grants_author_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  KEY grants_catalog_index (is_published, deadline, city)
) ENGINE=InnoDB;

CREATE TABLE favorites (
  user_id BIGINT UNSIGNED NOT NULL,
  item_type ENUM('university', 'grant') NOT NULL,
  item_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, item_type, item_id),
  CONSTRAINT favorites_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY favorites_item_index (item_type, item_id)
) ENGINE=InnoDB;

CREATE TABLE audit_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id BIGINT UNSIGNED NOT NULL,
  entity_type ENUM('university', 'grant') NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  action ENUM('created', 'updated', 'published', 'hidden') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT audit_log_actor_fk FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY audit_log_entity_index (entity_type, entity_id, created_at)
) ENGINE=InnoDB;
