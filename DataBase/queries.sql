/* =====================================================
   DELETE OLD DATABASE (SAFE RESET)
===================================================== */
DROP DATABASE IF EXISTS hospital_db;

/* =====================================================
   CREATE DATABASE
===================================================== */
CREATE DATABASE hospital_db;
USE hospital_db;

/* =====================================================
   USERS TABLE
   (Admin, Staff, Doctor, Patient ALL HERE)
===================================================== */
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role ENUM('admin','staff','doctor','patient') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    mobile VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    password VARCHAR(255) NOT NULL,
    is_first_login TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* =====================================================
   APPOINTMENTS TABLE
===================================================== */
-- Update the appointments table definition
CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bp VARCHAR(20),
    notes TEXT,
    -- Added 'in_progress', 'waiting_for_reports', and 'report_ready'
    status ENUM('waiting', 'in_progress', 'waiting_for_reports', 'report_ready', 'completed', 'cancelled') DEFAULT 'waiting',
    token_number INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

/* =====================================================
   PRESCRIPTIONS TABLE
===================================================== */
CREATE TABLE prescriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    medicine_name VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE TABLE lab_tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT,
    doctor_id INT,
    test_name VARCHAR(255),
    report_file VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* =====================================================
   INDEXES (Performance Optimization)
===================================================== */
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);



INSERT INTO users (role, full_name, email, password, is_first_login)
VALUES (
    'admin', 'System Admin', 'admin@carepoint.com',
    '$2b$10$09n3.WBsuZ6AbDQMLsXgC.uKC/LQ6v887Ihpn55jwvJgC/l7InCPy', -- Hash for 'admin123'
    0
);
