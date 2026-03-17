import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("medsync.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK(role IN ('patient', 'doctor', 'admin')) NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    specialization TEXT,
    experience INTEGER,
    rating REAL DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    gender TEXT,
    age INTEGER,
    phone TEXT,
    address TEXT,
    is_available INTEGER DEFAULT 1
  );

  -- Migration: Add phone and address if they don't exist (for existing databases)
  PRAGMA table_info(users);
`);

// Check if phone column exists, if not add it
const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
const hasPhone = tableInfo.some(col => col.name === 'phone');
const hasAddress = tableInfo.some(col => col.name === 'address');
const hasAvailability = tableInfo.some(col => col.name === 'is_available');

const apptInfo = db.prepare("PRAGMA table_info(appointments)").all() as any[];
const hasRating = apptInfo.some(col => col.name === 'rating');
const hasComment = apptInfo.some(col => col.name === 'comment');

if (!hasPhone) {
  try { db.exec("ALTER TABLE users ADD COLUMN phone TEXT;"); } catch(e) {}
}
if (!hasAddress) {
  try { db.exec("ALTER TABLE users ADD COLUMN address TEXT;"); } catch(e) {}
}
if (!hasAvailability) {
  try { db.exec("ALTER TABLE users ADD COLUMN is_available INTEGER DEFAULT 1;"); } catch(e) {}
}
if (!hasRating) {
  try { db.exec("ALTER TABLE appointments ADD COLUMN rating INTEGER;"); } catch(e) {}
}
if (!hasComment) {
  try { db.exec("ALTER TABLE appointments ADD COLUMN comment TEXT;"); } catch(e) {}
}

db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    doctor_id INTEGER,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
    type TEXT,
    fee REAL,
    diagnosis TEXT,
    prescription TEXT,
    rating INTEGER,
    comment TEXT,
    FOREIGN KEY(patient_id) REFERENCES users(id),
    FOREIGN KEY(doctor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS doctor_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER,
    day_of_week TEXT,
    start_time TEXT,
    end_time TEXT,
    slot_duration INTEGER DEFAULT 15,
    is_available BOOLEAN DEFAULT 1,
    FOREIGN KEY(doctor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS doctor_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER,
    date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    reason TEXT,
    FOREIGN KEY(doctor_id) REFERENCES users(id)
  );
`);

// Seed Data (if empty)
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare("INSERT INTO users (name, email, role, password, avatar, specialization, experience, rating, reviews_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  
  // Admin
  insertUser.run("Dr. Sarah Smith", "admin@medsync.com", "admin", "password123", "https://lh3.googleusercontent.com/aida-public/AB6AXuCF1elRvwuAu2MC8eLsNLTX7aIaqmLJsT-2EcEJdIP_KSO92xaEsPLy0a97Pa_lWAhOGFZBczaSgiuTAZFulDJeM2pbmBIKuI4o611Fz8r_tDnTSoFBCTyDzyP3VDLg6mmIglW2jMlrp3VvksMPW3ILsxZEH3rpvyMBPmZtMV_dfWNWoB6FcSJKN4dIHgfO6Qg8MxKcW_5imC5d_-NkgVluCGBqG5h6qnT_Dt-Y-GFtbwwolpIMrtbFLXzhYYviWmoWE5Ra_72ZtMuU", null, null, null, null);
  
  // Doctors
  insertUser.run("Dr. Sarah Jenkins", "sarah.j@medsync.com", "doctor", "password123", "https://lh3.googleusercontent.com/aida-public/AB6AXuDLyRN506SKbRXQ5CeEpJOXL2XpPPku5sWw6gJo3PWOxTwkbt9gR5kB5-g4SWeswb220qhhgmz6iuoJlNfpY9r9h1o9haksc3k7cQMpEKAFwE-VEUZfVIeDd4Q1XSbEwTm0QXZ4EBK83UVqr4OonpnT4dEhtBMJW06m_TcAij4AjRkzT4Evop7YRq5i5QAPOpyqQai46OMrxQrtKojofYDzQcsHo3SHZqJ80TaUEFF35vzCTyT8lHzP0f4vYo0LapK36JsygyGxJ2OA", "Senior Cardiologist", 12, 4.8, 124);
  insertUser.run("Dr. Michael Chen", "michael.c@medsync.com", "doctor", "password123", "https://lh3.googleusercontent.com/aida-public/AB6AXuAkyjXS6XiKPhjmsMxhA0wMf_LRXiM27XI5Q1-ouRnnIVpFDq-NTiL2Rp_zeX6q450Ahe5ro1MW5AMblm8fEUrMl5RCD4w73KyufqPhSB1Koh3vWpl-sk2yR9hy0zlYkTRuK4g4VbY8JSNSpHX004qb7HseNk3VE4LaehguFT_yCIfEoW5jGPswfCZbmkoAlW1iuTNOqyqpweCzZlrDixsJGs-H44X7j1J8VUT9C-b6Gb9_1odyq99rve8X_2I4theYJfozyH-tw12i", "Cardiology Specialist", 8, 4.7, 89);
  insertUser.run("Dr. Elena Rodriguez", "elena.r@medsync.com", "doctor", "password123", "https://lh3.googleusercontent.com/aida-public/AB6AXuB8D0-iLn3XT8yO87tdksBupIFcQhWi1_3KI_8T5LHgsfClAB6EEkstpu6T8ty8tLihht42G7iYLyAEDxKqZMBARvIjQuPcL72_cWJX4T_ZKcXcZtVQspgqJUd20Pb-CWt9EMdT7qi_GFHOsry8dW9yh6nKekgEkjnlkL1CxqBfxidUqslO3MEcVGYNOw-izQucEmVIWUY_xrVrSdjYfBhO0IwWg1liVz4jbFEib_lBzOeltMn2Cl3cadASy1RltW8nUGtOZQSMBxuV", "Pediatrics Specialist", 15, 5.0, 210);
  insertUser.run("Dr. James Wilson", "james.w@medsync.com", "doctor", "password123", "https://picsum.photos/seed/doc4/200/200", "Neurology", 10, 4.9, 156);
  insertUser.run("Dr. Lisa Wong", "lisa.w@medsync.com", "doctor", "password123", "https://picsum.photos/seed/doc5/200/200", "Dermatology", 7, 4.6, 72);
  
  // Patient
  insertUser.run("Alex Johnson", "alex@example.com", "patient", "password123", "https://lh3.googleusercontent.com/aida-public/AB6AXuAOLoTTabb9sJ0TjHlM7GQUzXIfprciBUpGjZI_SGZNVK0WvTH_VyuSDaSdN-yMny5xJoWv-bpw5P0RMWvo52KCgClgKZjNHkZoPoOZGNLb2ERUqeREf3d8qkPik6rTzJOSscYVx3_X-yCBKQ-NaKfPwQg7-eB5T9L5FdznrnF10_6pmrZMYk8pqJ-93Vl_5br--IT2EEdvvuUgbPuIeR1kNaPqkUDwYGYy7Gce5mx8CFw0SVrE3akI1pWlaMjm-7wBGam1QmVrQeLI", null, null, null, null);
  insertUser.run("Jane Smith", "jane@example.com", "patient", "password123", "https://picsum.photos/seed/p2/200/200", null, null, null, null);

  // Initial Appointments
  const insertAppt = db.prepare("INSERT INTO appointments (patient_id, doctor_id, date, time, status, type, fee) VALUES (?, ?, ?, ?, ?, ?, ?)");
  insertAppt.run(6, 2, "2026-02-27", "10:00 AM", "confirmed", "Checkup", 150);
  insertAppt.run(6, 3, "2026-02-28", "02:30 PM", "pending", "Consultation", 200);
  insertAppt.run(7, 2, "2026-02-27", "11:15 AM", "completed", "Follow-up", 100);
  insertAppt.run(7, 4, "2026-03-01", "09:00 AM", "pending", "Consultation", 250);

  // Seed Default Schedules for all doctors
  const doctors = db.prepare("SELECT id FROM users WHERE role = 'doctor'").all() as { id: number }[];
  const insertSchedule = db.prepare("INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available) VALUES (?, ?, ?, ?, 1)");
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  doctors.forEach(doc => {
    days.forEach(day => {
      insertSchedule.run(doc.id, day, "09:00", "17:00");
    });
  });
}

// Ensure all doctors have a schedule even if DB was already seeded
const doctorsList = db.prepare("SELECT id FROM users WHERE role = 'doctor'").all() as { id: number }[];
doctorsList.forEach(doc => {
  const hasSchedule = db.prepare("SELECT COUNT(*) as count FROM doctor_schedules WHERE doctor_id = ?").get(doc.id) as { count: number };
  if (hasSchedule.count === 0) {
    const insertSchedule = db.prepare("INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available) VALUES (?, ?, ?, ?, 1)");
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
      insertSchedule.run(doc.id, day, "09:00", "17:00");
    });
  }
  // Also ensure they are marked as available in the users table
  db.prepare("UPDATE users SET is_available = 1 WHERE id = ? AND role = 'doctor'").run(doc.id);
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = Number(process.env.PORT) || 3000;

  // app.use(express.json()); // Removed in favor of limit-aware version above

  // Health check for Render
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  // Socket.io Connection
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    
    socket.on("join", (room) => {
      socket.join(room);
      console.log(`User joined room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // API Routes
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    try {
      const user = db.prepare("SELECT id, name, email, role, avatar, specialization, experience, rating, reviews_count, gender, age, phone, address, is_available FROM users WHERE email = ? AND password = ?").get(email, password) as any;
      if (user) {
        res.json(user);
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/register", (req, res) => {
    const { name, email, password } = req.body;
    try {
      const info = db.prepare("INSERT INTO users (name, email, role, password) VALUES (?, ?, 'patient', ?)")
        .run(name, email, password);
      const newUser = db.prepare("SELECT id, name, email, role, avatar, phone, address, is_available, specialization, experience, rating, reviews_count, gender, age FROM users WHERE id = ?").get(info.lastInsertRowid);
      
      io.to("admin").emit("stats_update");
      res.json(newUser);
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.put("/api/profile", (req, res) => {
    const { id, name, email, avatar, phone, address, specialization, experience, age, gender } = req.body;
    try {
      db.prepare("UPDATE users SET name = ?, email = ?, avatar = ?, phone = ?, address = ?, specialization = ?, experience = ?, age = ?, gender = ? WHERE id = ?")
        .run(name, email, avatar, phone, address, specialization, experience, age, gender, id);
      
      const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.patch("/api/profile/password", (req, res) => {
    const { id, currentPassword, newPassword } = req.body;
    try {
      const user = db.prepare("SELECT password FROM users WHERE id = ?").get(id) as any;
      if (!user || user.password !== currentPassword) {
        return res.status(401).json({ error: "Incorrect current password" });
      }

      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  app.patch("/api/doctors/:id/availability", (req, res) => {
    const { id } = req.params;
    const { is_available } = req.body;
    try {
      db.prepare("UPDATE users SET is_available = ? WHERE id = ?").run(is_available ? 1 : 0, id);
      const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
      const { password, ...userWithoutPassword } = updatedUser;
      io.emit("doctor_availability_updated", { id: parseInt(id), is_available: !!is_available });
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(500).json({ error: "Failed to update availability" });
    }
  });

  app.post("/api/doctors", (req, res) => {
    const { name, email, password, specialization, experience, avatar } = req.body;
    
    if (!name || !email || !password || !specialization || experience === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const info = db.prepare("INSERT INTO users (name, email, role, password, specialization, experience, avatar) VALUES (?, ?, 'doctor', ?, ?, ?, ?)")
        .run(name, email, password, specialization, experience, avatar || `https://ui-avatars.com/api/?name=${name}`);
      
      io.to("admin").emit("stats_update");
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.put("/api/doctors/:id", (req, res) => {
    const { id } = req.params;
    const { name, email, specialization, experience, avatar } = req.body;
    
    try {
      db.prepare("UPDATE users SET name = ?, email = ?, specialization = ?, experience = ?, avatar = ? WHERE id = ? AND role = 'doctor'")
        .run(name, email, specialization, experience, avatar, id);
      
      io.to("admin").emit("stats_update");
      res.json({ success: true });
    } catch (err: any) {
      if (err.message.includes("UNIQUE constraint failed")) {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.get("/api/doctors", (req, res) => {
    try {
      const doctors = db.prepare("SELECT id, name, email, role, avatar, specialization, experience, rating, reviews_count, is_available FROM users WHERE role = 'doctor'").all();
      res.json(doctors);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch doctors" });
    }
  });

  app.get("/api/appointments", (req, res) => {
    const { userId, role } = req.query;
    try {
      let appointments;
      if (role === 'patient') {
        appointments = db.prepare(`
          SELECT a.*, u.name as doctor_name, u.specialization as department, u.avatar as doctor_avatar
          FROM appointments a 
          JOIN users u ON a.doctor_id = u.id 
          WHERE a.patient_id = ?
          ORDER BY a.date DESC, a.time DESC
        `).all(userId);
      } else if (role === 'doctor') {
        appointments = db.prepare(`
          SELECT a.*, u.name as patient_name, u.avatar as patient_avatar
          FROM appointments a 
          JOIN users u ON a.patient_id = u.id 
          WHERE a.doctor_id = ?
          ORDER BY a.date DESC, a.time DESC
        `).all(userId);
      } else {
        appointments = db.prepare(`
          SELECT a.*, p.name as patient_name, p.avatar as patient_avatar, d.name as doctor_name, d.avatar as doctor_avatar, d.specialization as department
          FROM appointments a
          JOIN users p ON a.patient_id = p.id
          JOIN users d ON a.doctor_id = d.id
          ORDER BY a.date DESC, a.time DESC
        `).all();
      }
      res.json(appointments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", (req, res) => {
    const { patient_id, doctor_id, date, time, type, fee } = req.body;

    try {
      // Helper to convert 12h to 24h for comparison
      const to24h = (time12h: string) => {
        const [t, modifier] = time12h.split(' ');
        let [hours, minutes] = t.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
        return `${hours.padStart(2, '0')}:${minutes}`;
      };

      // Validation: Check if doctor is available
      const doctor = db.prepare("SELECT is_available FROM users WHERE id = ? AND role = 'doctor'").get(doctor_id) as any;
      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }
      if (doctor.is_available === 0) {
        return res.status(400).json({ error: "Doctor is currently unavailable for bookings" });
      }

      // Validation: Check if date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDate = new Date(date);
      if (bookingDate < today) {
        return res.status(400).json({ error: "Cannot book appointments for past dates" });
      }

      // Validation: Check Weekly Schedule
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      const schedule = db.prepare("SELECT * FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ? AND is_available = 1").all(doctor_id, dayOfWeek) as any[];
      
      if (schedule.length > 0) {
        const slotTime = to24h(time);
        const isWithinSchedule = schedule.some(s => slotTime >= s.start_time && slotTime < s.end_time);
        if (!isWithinSchedule) {
          return res.status(400).json({ error: "Doctor is not scheduled to work at this time" });
        }
      }

      // Validation: Check Doctor Blocks
      const blocks = db.prepare("SELECT * FROM doctor_blocks WHERE doctor_id = ? AND date = ?").all(doctor_id, date) as any[];
      const slotTime = to24h(time);
      const isBlocked = blocks.some(b => slotTime >= b.start_time && slotTime < b.end_time);
      if (isBlocked) {
        return res.status(400).json({ error: "This time slot is blocked by the doctor" });
      }

      // Validation: Check for double booking
      const existing = db.prepare("SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time = ? AND status != 'cancelled'").get(doctor_id, date, time);
      if (existing) {
        return res.status(400).json({ error: "This time slot is already booked" });
      }

      const info = db.prepare("INSERT INTO appointments (patient_id, doctor_id, date, time, type, fee) VALUES (?, ?, ?, ?, ?, ?)")
        .run(patient_id, doctor_id, date, time, type, fee);
      
      const newAppointmentId = info.lastInsertRowid;
      const appointment = db.prepare(`
        SELECT a.*, p.name as patient_name, d.name as doctor_name, d.specialization as department
        FROM appointments a
        JOIN users p ON a.patient_id = p.id
        JOIN users d ON a.doctor_id = d.id
        WHERE a.id = ?
      `).get(newAppointmentId) as any;

      // Broadcast to doctor and admin
      io.to(`doctor_${doctor_id}`).emit("new_appointment", appointment);
      io.to("admin").emit("new_appointment", appointment);
      io.to("admin").emit("stats_update");
      
      res.json({ id: newAppointmentId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  app.patch("/api/appointments/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      db.prepare("UPDATE appointments SET status = ? WHERE id = ?").run(status, id);
      
      const appointment = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id) as any;
      
      // Notify patient
      io.to(`patient_${appointment.patient_id}`).emit("appointment_updated", appointment);
      // Notify doctor
      io.to(`doctor_${appointment.doctor_id}`).emit("appointment_updated", appointment);
      // Notify admin
      io.to("admin").emit("appointment_updated", appointment);
      io.to("admin").emit("stats_update");

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update appointment status" });
    }
  });

  app.patch("/api/appointments/:id/medical", (req, res) => {
    const { id } = req.params;
    const { diagnosis, prescription } = req.body;
    
    try {
      db.prepare("UPDATE appointments SET diagnosis = ?, prescription = ? WHERE id = ?").run(diagnosis, prescription, id);
      const appointment = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id) as any;
      
      io.to(`patient_${appointment.patient_id}`).emit("appointment_updated", appointment);
      io.to(`doctor_${appointment.doctor_id}`).emit("appointment_updated", appointment);
      io.to("admin").emit("appointment_updated", appointment);
      
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update medical records" });
    }
  });

  app.delete("/api/doctors/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM users WHERE id = ? AND role = 'doctor'").run(id);
      io.to("admin").emit("stats_update");
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete doctor" });
    }
  });

  app.get("/api/doctors/schedule/:id", (req, res) => {
    const { id } = req.params;
    try {
      const schedule = db.prepare("SELECT * FROM doctor_schedules WHERE doctor_id = ?").all(id);
      res.json(schedule);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch schedule" });
    }
  });

  app.post("/api/doctors/schedule", (req, res) => {
    const { doctor_id, day_of_week, slots } = req.body;
    
    try {
      db.transaction(() => {
        // Clear existing slots for this day
        db.prepare("DELETE FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ?").run(doctor_id, day_of_week);
        
        // Insert new slots
        const insert = db.prepare("INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available) VALUES (?, ?, ?, ?, ?)");
        for (const slot of slots) {
          insert.run(doctor_id, day_of_week, slot.start_time, slot.end_time, slot.is_available ? 1 : 0);
        }
      })();
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update schedule" });
    }
  });

  app.get("/api/doctors/blocks/:id", (req, res) => {
    const { id } = req.params;
    try {
      const blocks = db.prepare("SELECT * FROM doctor_blocks WHERE doctor_id = ?").all(id);
      res.json(blocks);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch blocks" });
    }
  });

  app.post("/api/doctors/blocks", (req, res) => {
    const { doctor_id, date, start_time, end_time, reason } = req.body;
    try {
      db.prepare("INSERT INTO doctor_blocks (doctor_id, date, start_time, end_time, reason) VALUES (?, ?, ?, ?, ?)")
        .run(doctor_id, date, start_time, end_time, reason);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to block time slot" });
    }
  });

  app.delete("/api/doctors/blocks/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM doctor_blocks WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete block" });
    }
  });

  app.post("/api/appointments/:id/feedback", (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    try {
      // Update appointment
      db.prepare("UPDATE appointments SET rating = ?, comment = ? WHERE id = ?").run(rating, comment, id);
      
      // Update doctor's overall rating
      const appt = db.prepare("SELECT doctor_id FROM appointments WHERE id = ?").get(id) as any;
      if (appt) {
        const doctorId = appt.doctor_id;
        const stats = db.prepare("SELECT AVG(rating) as avg_rating, COUNT(rating) as count FROM appointments WHERE doctor_id = ? AND rating IS NOT NULL").get(doctorId) as any;
        db.prepare("UPDATE users SET rating = ?, reviews_count = ? WHERE id = ?").run(stats.avg_rating, stats.count, doctorId);
      }
      
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to save feedback" });
    }
  });

  app.get("/api/stats/detailed", (req, res) => {
    try {
      const demographics = db.prepare(`
        SELECT gender, 
               CASE 
                 WHEN age < 18 THEN 'Under 18'
                 WHEN age BETWEEN 18 AND 35 THEN '18-35'
                 WHEN age BETWEEN 36 AND 55 THEN '36-55'
                 ELSE '55+'
               END as age_group,
               COUNT(*) as count
        FROM users 
        WHERE role = 'patient'
        GROUP BY gender, age_group
      `).all();

      const deptTrends = db.prepare(`
        SELECT d.specialization as department, COUNT(a.id) as count
        FROM appointments a
        JOIN users d ON a.doctor_id = d.id
        GROUP BY department
      `).all();

      const doctorPerformance = db.prepare(`
        SELECT name, specialization, rating, reviews_count,
               (SELECT COUNT(*) FROM appointments WHERE doctor_id = users.id AND status = 'completed') as completed_appointments
        FROM users
        WHERE role = 'doctor'
        ORDER BY rating DESC
      `).all();

      res.json({ demographics, deptTrends, doctorPerformance });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch detailed stats" });
    }
  });

  app.get("/api/stats", (req, res) => {
    try {
      const totalRevenue = db.prepare("SELECT SUM(fee) as total FROM appointments WHERE status = 'completed'").get() as any;
      const totalAppointments = db.prepare("SELECT COUNT(*) as count FROM appointments").get() as any;
      const totalPatients = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'patient'").get() as any;
      const activeDoctors = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'doctor'").get() as any;
      
      res.json({
        revenue: totalRevenue.total || 0,
        appointments: totalAppointments.count,
        patients: totalPatients.count,
        doctors: activeDoctors.count
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port http://localhost:${PORT}`);
  });
}

startServer();
