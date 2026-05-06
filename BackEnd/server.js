const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost';
app.use(express.static(path.join(__dirname, '../FrontEnd')));

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/* ================= 1. CONFIGURATION & MIDDLEWARE ================= */

// Auto-create reports folder
const uploadDir = path.join(__dirname, 'reports');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Order is critical: Middleware must come before routes
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// Database Connection
const db = mysql.createPool({
    // CHANGE THIS: 'localhost' won't work inside Docker
    host: process.env.DB_HOST || 'localhost', 
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'hospital_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();


// Multer Storage for Lab Reports
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'reports/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

/* ================= 2. AUTHENTICATION & ADMIN ================= */

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        if (rows.length === 0) return res.status(401).json({ success: false, message: "User not found" });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ success: false, message: "Invalid credentials" });

        res.json({
            success: true,
            user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name, is_first_login: user.is_first_login }
        });
    } catch (err) { res.status(500).json({ success: false, message: "Server Error" }); }
});

app.post('/api/signup', async (req, res) => {
    const { role, fullName, gender, mobile, email, address, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await db.execute(
            `INSERT INTO users (role, full_name, gender, mobile, email, address, password, is_first_login) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [role, fullName, gender, mobile, email.toLowerCase(), address, hash, role === 'patient' ? 0 : 1]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

// Admin: Create User
app.post('/api/users', async (req, res) => {
    const { role, full_name, email, mobile, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await db.execute(
            `INSERT INTO users (role, full_name, email, mobile, password, is_first_login) VALUES (?, ?, ?, ?, ?, ?)`,
            [role, full_name, email.toLowerCase(), mobile, hash, 1]
        );
        res.json({ success: true, message: "User created" });
    } catch (err) { res.status(500).json({ success: false, message: "DB Error" }); }
});

// Admin: Get all users
app.get('/api/admin/users', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, full_name, email, role FROM users ORDER BY role ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: Delete user
app.delete('/api/admin/delete-user/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

/* ================= 3. RECEPTION DESK ================= */

app.get('/api/today-stats', async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT status, COUNT(*) as count FROM appointments WHERE DATE(created_at) = CURDATE() GROUP BY status`);
        let stats = { total: 0, waiting: 0, in_progress: 0, completed: 0, report_ready: 0 };
        rows.forEach(r => { stats.total += r.count; stats[r.status] = r.count; });
        res.json(stats);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/search-patients', async (req, res) => {
    const q = `%${req.query.query}%`;
    const [rows] = await db.execute(`SELECT id, full_name, mobile, gender FROM users WHERE role='patient' AND (full_name LIKE ? OR mobile LIKE ?)`, [q, q]);
    res.json(rows);
});

// Live Queue for Reception
app.get('/api/reception-queue', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT a.id, u.full_name as patient_name, d.full_name as doctor_name, a.status, a.token_number
            FROM appointments a
            JOIN users u ON a.patient_id = u.id
            JOIN users d ON a.doctor_id = d.id
            WHERE DATE(a.created_at) = CURDATE()
            ORDER BY a.token_number DESC`);
        res.json(rows);
    } catch (err) { res.status(500).json([]); }
});

app.post('/api/update-vitals', async (req, res) => {
    const { patientId, doctorId, weight, height, bp } = req.body;
    try {
        const [rows] = await db.execute(`SELECT IFNULL(MAX(token_number), 0) + 1 AS nextToken FROM appointments WHERE DATE(created_at) = CURDATE()`);
        const nextToken = rows[0].nextToken;
        await db.execute(`INSERT INTO appointments (patient_id, doctor_id, weight, height, bp, status, token_number) VALUES (?, ?, ?, ?, ?, 'waiting', ?)`, [patientId, doctorId, weight, height, bp, nextToken]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

/* ================= 4. DOCTOR DESK ================= */

app.get('/api/doctor-queue', async (req, res) => {
    const email = req.query.email?.toLowerCase();
    const [rows] = await db.execute(`
        SELECT a.id, u.id as patient_id, u.full_name as patient_name, a.weight, a.height, a.bp, a.status
        FROM appointments a 
        JOIN users u ON a.patient_id = u.id 
        JOIN users d ON a.doctor_id = d.id 
        WHERE d.email=? AND a.status IN ('waiting','in_progress','report_ready','waiting_for_reports')
        ORDER BY a.token_number ASC`, [email]);
    res.json(rows);
});

// Vitals Chart History
app.get('/api/patient-vitals-chart/:id', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT weight, height, created_at FROM appointments WHERE patient_id = ? ORDER BY created_at ASC`,
            [req.params.id]
        );
        res.json(rows);
    } catch (err) { res.status(500).json([]); }
});

app.post('/api/send-to-lab', async (req, res) => {
    const { appointmentId, tests } = req.body;
    try {
        const [appt] = await db.execute('SELECT doctor_id FROM appointments WHERE id=?', [appointmentId]);
        for (let t of tests) {
            await db.execute(`INSERT INTO lab_tests (appointment_id, doctor_id, test_name, status) VALUES (?, ?, ?, 'pending')`, [appointmentId, appt[0].doctor_id, t]);
        }
        await db.execute(`UPDATE appointments SET status='waiting_for_reports' WHERE id=?`, [appointmentId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/complete-consultation', async (req, res) => {
    const { appointmentId, notes, medicines } = req.body;
    try {
        await db.execute(`UPDATE appointments SET status='completed', notes=? WHERE id=?`, [notes, appointmentId]);
        if (medicines) {
            for (let m of medicines) {
                await db.execute(`INSERT INTO prescriptions (appointment_id, medicine_name, frequency, duration) VALUES (?, ?, ?, ?)`, [appointmentId, m.name, m.frequency, m.duration]);
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

/* ================= 5. LAB DESK ================= */

app.get('/api/lab-queue', async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT l.id, l.test_name, l.status, u.full_name as patient_name, l.appointment_id
            FROM lab_tests l
            JOIN appointments a ON l.appointment_id = a.id
            JOIN users u ON a.patient_id = u.id
            WHERE l.status != 'completed'
            ORDER BY l.created_at ASC`);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/upload-report/:id', upload.single('report'), async (req, res) => {
    const testId = req.params.id;
    if (!req.file) return res.status(400).json({ success: false, message: "No file" });
    try {
        const [testRows] = await db.execute(`SELECT appointment_id FROM lab_tests WHERE id = ?`, [testId]);
        const appointmentId = testRows[0].appointment_id;
        await db.execute(`UPDATE lab_tests SET report_file = ?, status = 'completed' WHERE id = ?`, [req.file.filename, testId]);
        const [rem] = await db.execute(`SELECT id FROM lab_tests WHERE appointment_id = ? AND status != 'completed'`, [appointmentId]);
        if (rem.length === 0) await db.execute(`UPDATE appointments SET status = 'report_ready' WHERE id = ?`, [appointmentId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

/* ================= 6. HISTORY & PDF ================= */

app.get('/api/patient-history/:id', async (req, res) => {
    try {
        const [appts] = await db.execute(`
            SELECT a.id, a.weight, a.height, a.bp, a.notes, a.created_at, u.full_name AS doctor_name
            FROM appointments a
            JOIN users u ON a.doctor_id = u.id
            WHERE a.patient_id=? AND a.status IN ('completed', 'report_ready')
            ORDER BY a.created_at DESC`, [req.params.id]);

        for (let appt of appts) {
            const [meds] = await db.execute(`SELECT medicine_name, frequency, duration FROM prescriptions WHERE appointment_id=?`, [appt.id]);
            appt.medicines = meds;
            const [reps] = await db.execute(`SELECT test_name, report_file FROM lab_tests WHERE appointment_id=? AND status='completed'`, [appt.id]);
            appt.lab_reports = reps;
        }
        res.json(appts);
    } catch (err) { res.status(500).json([]); }
});

app.get('/api/print-prescription/:appointmentId', async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT a.notes, u.full_name AS doctor_name, p.full_name AS patient_name FROM appointments a JOIN users u ON a.doctor_id=u.id JOIN users p ON a.patient_id=p.id WHERE a.id=?`, [req.params.appointmentId]);
        const [meds] = await db.execute(`SELECT medicine_name, frequency, duration FROM prescriptions WHERE appointment_id=?`, [req.params.appointmentId]);
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);
        doc.fontSize(20).text("CarePoint Hospital", { align: "center" });
        doc.moveDown().fontSize(12).text(`Patient: ${rows[0].patient_name}`).text(`Doctor: Dr. ${rows[0].doctor_name}`);
        doc.moveDown().text("Medicines:");
        meds.forEach(m => doc.text(`- ${m.medicine_name} (${m.frequency}) for ${m.duration} days`));
        doc.moveDown().text(`Notes: ${rows[0].notes}`);
        doc.end();
    } catch (err) { res.status(500).send("PDF Error"); }
});

/* ================= RECEPTION: GET DOCTOR LIST ================= */
app.get('/api/users', async (req, res) => {
    try {
        // We select ID and Full Name where role is doctor
        const [rows] = await db.execute(
            'SELECT id, full_name FROM users WHERE LOWER(role) = "doctor"'
        );
        
        console.log("--- DEBUG: Sending Doctors to Frontend ---");
        console.log(rows); // Check your terminal for this!
        
        // Ensure we send an array even if empty
        res.json(rows || []); 
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json([]);
    }
});

// Get all users for Admin
app.get('/api/admin/users', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, full_name, email, role FROM users ORDER BY role ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a user
app.delete('/api/admin/delete-user/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        await db.execute('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/* ================= AUTH: RESET PASSWORD ================= */
app.post('/api/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        const hash = await bcrypt.hash(newPassword, 10);
        // Update password AND set is_first_login to 0
        const [result] = await db.execute(
            `UPDATE users SET password = ?, is_first_login = 0 WHERE email = ?`,
            [hash, email.toLowerCase()]
        );

        if (result.affectedRows > 0) {
            res.json({ success: true, message: "Password updated successfully" });
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    } catch (err) {
        console.error("Reset Error:", err);
        res.status(500).json({ success: false, message: "Database error" });
    }
});


app.listen(3000, () => console.log("Server active on http://localhost:3000"));

