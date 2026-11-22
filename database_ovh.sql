-- ==========================================================================
-- BARWETA RECORDS — Schéma de Base de Données MySQL (Pour OVH / phpMyAdmin)
-- ==========================================================================

CREATE TABLE IF NOT EXISTS `admins` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `vinyls` (
    `id` VARCHAR(50) PRIMARY KEY,
    `artist` VARCHAR(150) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `genre` VARCHAR(100) NOT NULL,
    `year` VARCHAR(20) NOT NULL,
    `format` VARCHAR(50) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `photo_url` LONGTEXT DEFAULT NULL,
    `jacket_color` VARCHAR(150) DEFAULT NULL,
    `label_color` VARCHAR(50) DEFAULT '#c93b2b',
    `tracks_json` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
