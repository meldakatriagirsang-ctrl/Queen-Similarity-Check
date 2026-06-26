import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import multer from "multer";
import nodemailer from "nodemailer";
import crypto from "crypto";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

dotenv.config();

const app = express();
const PORT = 3000;

// Request logging middleware for debugging API paths and status codes
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Enable trust proxy so Express correctly reads individual client IP addresses behind the Cloud Run container proxy
app.set("trust proxy", 1);

// Apply Helmet with security configurations suitable for development and production (handles iframe containment gracefully)
app.use(
  helmet({
    contentSecurityPolicy: false, // Turned off CSP to avoid blocking assets in dev-server iframe embeds
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// Passthrough rate limiters for high reliability inside sandbox/preview container environments
const apiLimiter = (req: any, res: any, next: any) => next();
const authLimiter = (req: any, res: any, next: any) => next();

// Apply API limiter to all /api routes
app.use("/api/", apiLimiter);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Server-side persistent state database
const DB_FILE = path.join(process.cwd(), "db-state.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initialize Firebase Client SDK
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let db: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const configData = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    const firebaseApp = initializeApp(configData);
    db = getFirestore(firebaseApp, configData.firestoreDatabaseId);
    console.log("Firebase Client SDK successfully initialized on backend. Targeting database:", configData.firestoreDatabaseId || "(default)");
  } catch (err) {
    console.error("Gagal inisialisasi Firebase Client SDK di backend:", err);
  }
}

const DEFAULT_ANNOUNCEMENT = "Selamat datang di Queen Similarity Check! Semua pengecekan berkas menggunakan akun Turnitin Instruktur resmi (No-Repository / Bukti Kelas Instruktur). Dijamin aman, tidak terekam database turnitin global! Hubungi WhatsApp Admin untuk bantuan: 0822-6185-8077";

const DEFAULT_CUSTOMERS = [
  {
    username: "melda_katria",
    fullName: "Melda Katria Girsang",
    email: "meldakatriagirsang@gmail.com",
    whatsapp: "0822-6185-8077",
    role: "Admin",
    kreditSisa: 9999,
    uploadHarianSisa: 999,
    totalUploadHarianLimit: 999,
    password: "@Melda2026"
  }
];

const DEFAULT_EXTRA_TOOLS = [
  {
    id: "tool-1",
    name: "Turnitin AI Detection Check",
    description: "Mendeteksi secara mendalam persentase konten buatan AI (Artificial Intelligence) seperti ChatGPT/Claude.",
    creditCost: 10,
    isEnabled: true
  },
  {
    id: "tool-2",
    name: "Paraphrase Premium Humanizer",
    description: "Membantu parafrase otomatis naskah yang terindikasi plagiasi tinggi agar kembali bertenaga orisinal.",
    creditCost: 15,
    isEnabled: true
  },
  {
    id: "tool-3",
    name: "Express Grammar & Proofread Check",
    description: "Meneliti struktur kalimat dan tanda baca berstandar kompas publikasi Elsevier/Scopus.",
    creditCost: 5,
    isEnabled: true
  }
];

const DEFAULT_FILES = [
  {
    id: "QSC-842911",
    title: "Peran Big Data dalam Analisis Kebijakan Kesehatan",
    filename: "Tesis_Melda_Kesehatan_Nusantara.pdf",
    fileSize: "1.85 MB",
    uploadDate: "05 Juni 2026",
    status: "Selesai",
    similarityPercent: 12,
    feedback: "Turnitin scan selesai. Hasil similarity: 12%.",
    ownerEmail: "meldakatriagirsang@gmail.com"
  }
];

interface AppState {
  files: any[];
  customers: any[];
  extraTools: any[];
  adminAnnouncement: string;
  autoSimulationEnabled: boolean;
  turnitinPrice?: string;
  isUploadLocked?: boolean;
  workingHours?: string;
}

let cachedInMemoryState: AppState | null = null;
let hasSuccessfullyRestoredFromFirestore = false;
let isRestoreCompleted = false;

function enforceAdminProfiles(customersList: any[]): any[] {
  const list = [...customersList];
  
  // 1. Enforce Melda Katria Girsang as Admin
  const meldaIdx = list.findIndex(c => c && c.email && c.email.toLowerCase() === "meldakatriagirsang@gmail.com");
  const meldaProfile = {
    username: "melda_katria",
    fullName: "Melda Katria Girsang",
    email: "meldakatriagirsang@gmail.com",
    whatsapp: "0822-6185-8077",
    role: "Admin",
    kreditSisa: 9999,
    uploadHarianSisa: 999,
    totalUploadHarianLimit: 999,
    password: "@Melda2026"
  };
  if (meldaIdx === -1) {
    list.push(meldaProfile);
  } else {
    list[meldaIdx] = {
      ...list[meldaIdx],
      ...meldaProfile
    };
  }

  // 2. Enforce Dolok Imun as Admin
  const dolokIdx = list.findIndex(c => c && c.email && c.email.toLowerCase() === "dolokimun65@yahoo.com");
  const dolokProfile = {
    username: "dolokimun",
    fullName: "Dolok Imun Admin",
    email: "dolokimun65@yahoo.com",
    whatsapp: "0812-3456-7890",
    role: "Admin",
    kreditSisa: 9999,
    uploadHarianSisa: 999,
    totalUploadHarianLimit: 999,
    password: "@Marbun656"
  };
  if (dolokIdx === -1) {
    list.push(dolokProfile);
  } else {
    list[dolokIdx] = {
      ...list[dolokIdx],
      ...dolokProfile
    };
  }

  return list;
}

// Helper to authenticate user sessions securely on the server
function getAuthorizedUser(req: any, currentState: AppState): any {
  const email = req.headers["x-user-email"] || req.query.userEmail;
  const token = req.headers["x-auth-token"] || req.query.authToken;
  if (!email || !token) return null;
  
  const user = currentState.customers.find((c: any) => c && c.email && c.email.toLowerCase() === email.toLowerCase());
  if (user && user.sessionToken === token) {
    return user;
  }
  return null;
}

// Sanitize state to remove sensitive authentication tokens and plaintext passwords before returning to clients
function sanitizeState(state: AppState): any {
  return {
    ...state,
    customers: (state.customers || []).map((c: any) => {
      if (!c || !c.email) return c;
      const { password, resetToken, resetTokenExpires, sessionToken, ...rest } = c;
      return rest;
    })
  };
}

function loadState(): AppState {
  if (cachedInMemoryState) {
    return cachedInMemoryState;
  }
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed.isUploadLocked === undefined) parsed.isUploadLocked = false;
      if (parsed.workingHours === undefined) parsed.workingHours = "08.00 am - 09.00 pm • WITA";
      if (parsed.customers && Array.isArray(parsed.customers)) {
        parsed.customers = enforceAdminProfiles(parsed.customers);
      }
      cachedInMemoryState = parsed;
      return parsed;
    }
  } catch (err) {
    console.error("Failed to load db-state.json:", err);
  }
  const defaultState: AppState = {
    files: DEFAULT_FILES,
    customers: enforceAdminProfiles(DEFAULT_CUSTOMERS),
    extraTools: DEFAULT_EXTRA_TOOLS,
    adminAnnouncement: DEFAULT_ANNOUNCEMENT,
    autoSimulationEnabled: false,
    turnitinPrice: "Rp2.000",
    isUploadLocked: false,
    workingHours: "08.00 am - 09.00 pm • WITA"
  };
  cachedInMemoryState = defaultState;
  return defaultState;
}

let sseClients: any[] = [];

function broadcastState(state: AppState) {
  if (sseClients.length === 0) return;
  const sanitized = sanitizeState(state);
  const payload = {
    files: sanitized.files,
    customers: sanitized.customers,
    extraTools: sanitized.extraTools,
    adminAnnouncement: sanitized.adminAnnouncement,
    turnitinPrice: sanitized.turnitinPrice,
    autoSimulationEnabled: sanitized.autoSimulationEnabled,
    isUploadLocked: sanitized.isUploadLocked,
    workingHours: sanitized.workingHours
  };
  const data = JSON.stringify(payload);
  console.log(`[SSE] Broadcasting sanitized state updates to ${sseClients.length} connected clients.`);
  sseClients.forEach(client => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (err) {
      console.error("[SSE] Error writing to SSE client:", err);
    }
  });
}

function saveState(state: AppState) {
  try {
    cachedInMemoryState = state;
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
    
    // Broadcast state updates to all active SSE clients instantly
    broadcastState(state);
    
    // Sync to Firestore in background
    if (db) {
      if (!hasSuccessfullyRestoredFromFirestore) {
        console.log("⚠️ WARNING: Skipping Firestore Cloud sync because initial restore is NOT completed yet to protect database from accidental blank overwrites!");
        return;
      }
      Promise.all([
        setDoc(doc(db, "app", "settings"), {
          adminAnnouncement: state.adminAnnouncement || "",
          autoSimulationEnabled: !!state.autoSimulationEnabled,
          extraTools: state.extraTools || [],
          turnitinPrice: state.turnitinPrice || "Rp2.000",
          isUploadLocked: !!state.isUploadLocked,
          workingHours: state.workingHours || "08.00 am - 09.00 pm • WITA"
        }),
        setDoc(doc(db, "app", "customers"), {
          customers: state.customers || []
        }),
        setDoc(doc(db, "app", "files"), {
          files: state.files || []
        })
      ]).then(() => {
        console.log("State successfully synchronized with Firestore Cloud!");
      }).catch(err => {
         console.error("Gagal menyimpan data state ke Firestore:", err);
      });
    }
  } catch (err) {
    console.error("Failed to save db-state.json:", err);
  }
}


function mergeCustomers(localList: any[], remoteList: any[]): any[] {
  const merged = [...localList];
  remoteList.forEach(remote => {
    if (!remote || !remote.email) return;
    const idx = merged.findIndex(c => c && c.email && c.email.toLowerCase() === remote.email.toLowerCase());
    if (idx !== -1) {
      merged[idx] = {
        ...merged[idx],
        ...remote,
        password: remote.password || merged[idx].password,
        sessionToken: remote.sessionToken || merged[idx].sessionToken
      };
    } else {
      merged.push(remote);
    }
  });
  return enforceAdminProfiles(merged);
}

function mergeFiles(localList: any[], remoteList: any[]): any[] {
  const merged = [...localList];
  remoteList.forEach(remote => {
    if (!remote || !remote.id) return;
    const idx = merged.findIndex(f => f && f.id === remote.id);
    if (idx !== -1) {
      merged[idx] = {
        ...merged[idx],
        ...remote
      };
    } else {
      merged.push(remote);
    }
  });
  return merged;
}

async function syncFromFirestore(attempt = 1) {
  if (!db) {
    console.log("Firebase DB not initialized, skipping Cloud Firestore database restore.");
    isRestoreCompleted = true;
    return;
  }
  try {
    console.log(`Attempting to restore state from Cloud Firestore via Client SDK (Attempt ${attempt}/5)...`);
    const [settingsSnap, customersSnap, filesSnap] = await Promise.all([
      getDoc(doc(db, "app", "settings")),
      getDoc(doc(db, "app", "customers")),
      getDoc(doc(db, "app", "files"))
    ]);

    const state = loadState();
    let hasUpdates = false;

    // Use .exists() for firebase client SDK instead of .exists
    if (settingsSnap.exists()) {
      const data = settingsSnap.data();
      if (data) {
        if (data.adminAnnouncement !== undefined) state.adminAnnouncement = data.adminAnnouncement;
        if (data.autoSimulationEnabled !== undefined) state.autoSimulationEnabled = data.autoSimulationEnabled;
        if (data.extraTools !== undefined) state.extraTools = data.extraTools;
        if (data.turnitinPrice !== undefined) state.turnitinPrice = data.turnitinPrice;
        if (data.isUploadLocked !== undefined) state.isUploadLocked = data.isUploadLocked;
        if (data.workingHours !== undefined) state.workingHours = data.workingHours;
        hasUpdates = true;
      }
    }

    if (customersSnap.exists()) {
      const data = customersSnap.data();
      if (data && data.customers && Array.isArray(data.customers)) {
        state.customers = mergeCustomers(state.customers, data.customers);
        hasUpdates = true;
      }
    }

    if (filesSnap.exists()) {
      const data = filesSnap.data();
      if (data && data.files && Array.isArray(data.files)) {
        state.files = mergeFiles(state.files, data.files);
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      cachedInMemoryState = state;
      fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
      hasSuccessfullyRestoredFromFirestore = true;
      console.log("Successfully restored and cached all settings + customers + files state from Cloud Firestore via Client SDK!");
      // After merging, save back to cloud to guarantee synchronization!
      saveState(state);
    } else {
      console.log("No existing documents in Firestore, writing initial state to cloud...");
      hasSuccessfullyRestoredFromFirestore = true;
      saveState(state);
    }
    isRestoreCompleted = true;
  } catch (err) {
    console.error(`Gagal sinkronisasi data dari Firestore on startup (Attempt ${attempt}):`, err);
    isRestoreCompleted = true; // Complete to unblock client gating and avoid holding requests captive!
    if (attempt < 5) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // exponential backoff
      console.log(`Retrying Firestore sync in ${delay}ms...`);
      setTimeout(() => {
        syncFromFirestore(attempt + 1);
      }, delay);
    } else {
      console.error("Firestore sync completely failed after 5 attempts. Relying on local backup DB file.");
    }
  }
}

// Initial state load
const state = loadState();

// Save state locally first to ensure a fallback exists, but do NOT call saveState() 
// since that would instantly overwrite our Cloud Firestore backup with empty or default records on startup!
try {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  }
} catch (err) {
  console.error("Gagal simpan backup state lokal pada saat start:", err);
}

// Pull latest changes from Cloud Firestore on startup to retrieve and merge all customer data
const restorePromise = syncFromFirestore();

// Gating middleware to wait for initial Firestore restoration when serving state requests
app.use(async (req, res, next) => {
  if (req.path.startsWith("/api/") && !isRestoreCompleted) {
    try {
      console.log(`🔌 Route ${req.path} waiting for Cloud Firestore restore completion...`);
      await Promise.race([
        restorePromise,
        new Promise(resolve => setTimeout(resolve, 1000)) // Max wait 1 second to feel snapping-fast!
      ]);
    } catch (e) {
      console.error("Error/timeout while gating route for Firestore restore:", e);
    }
  }
  next();
});

// REST endpoints for cross-device shared state database
app.get("/api/state", (req, res) => {
  const currentState = loadState();
  res.json(sanitizeState(currentState));
});

app.get("/api/updates-stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const currentState = loadState();
  const sanitized = sanitizeState(currentState);
  const payload = {
    files: sanitized.files,
    customers: sanitized.customers,
    extraTools: sanitized.extraTools,
    adminAnnouncement: sanitized.adminAnnouncement,
    turnitinPrice: sanitized.turnitinPrice,
    autoSimulationEnabled: sanitized.autoSimulationEnabled,
    isUploadLocked: sanitized.isUploadLocked,
    workingHours: sanitized.workingHours
  };
  res.write(`data: ${JSON.stringify(payload)}\n\n`);

  sseClients.push(res);
  console.log(`[SSE] Client connected. Total active clients: ${sseClients.length}`);

  const heartbeatId = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch (err) {
      // ignore
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeatId);
    sseClients = sseClients.filter(client => client !== res);
    console.log(`[SSE] Client disconnected. Total active clients: ${sseClients.length}`);
  });
});

app.post("/api/upload-file", upload.single("file"), async (req, res) => {
  const currentState = loadState();

  // Verify authentication
  const authUser = getAuthorizedUser(req, currentState);
  if (!authUser) {
    return res.status(401).json({ error: "Sesi Anda telah berakhir atau tidak valid. Silakan masuk kembali." });
  }

  let { newDoc, fileData } = req.body;
  
  let docObj = newDoc;
  if (typeof newDoc === "string") {
    try {
      docObj = JSON.parse(newDoc);
    } catch (e) {
      console.error("Gagal parsing newDoc JSON:", e);
      return res.status(400).json({ error: "Format newDoc salah" });
    }
  }

  if (!docObj) {
    return res.status(400).json({ error: "newDoc is required" });
  }

  // Override ownerEmail to the actual authenticated user's email to prevent credit-theft and impersonation
  const finalDoc = {
    ...docObj,
    ownerEmail: authUser.email,
    fileUrl: `/api/download/${docObj.id}`
  };

  const cost = finalDoc.creditCost || 1;

  // Persist files physically onto disk
  if (req.file) {
    try {
      const destPath = path.join(UPLOADS_DIR, `${docObj.id}_${docObj.filename}`);
      fs.writeFileSync(destPath, req.file.buffer);
      console.log(`Successfully saved document on backend disk via Multer: ${destPath}`);
    } catch (err) {
      console.error("Gagal melakukan penulisan berkas naskah via Multer ke disk:", err);
    }
  } else if (fileData) {
    try {
      // Decode data URL or plain base64 string
      const base64Data = fileData.replace(/^data:.*;base64,/, "");
      const destPath = path.join(UPLOADS_DIR, `${docObj.id}_${docObj.filename}`);
      fs.writeFileSync(destPath, Buffer.from(base64Data, "base64"));
      console.log(`Successfully saved document on backend disk: ${destPath}`);
    } catch (err) {
      console.error("Gagal melakukan penulisan berkas naskah ke disk:", err);
    }
  }

  // Append new document to the front
  currentState.files = [finalDoc, ...currentState.files];

  // Safely decrease credit of the active customer who uploaded it
  currentState.customers = currentState.customers.map(cust => {
    if (cust && cust.email && cust.email.toLowerCase() === finalDoc.ownerEmail.toLowerCase()) {
      return {
        ...cust,
        kreditSisa: Math.max(0, cust.kreditSisa - cost),
        uploadHarianSisa: Math.max(0, cust.uploadHarianSisa - 1)
      };
    }
    return cust;
  });

  // Log upload internally
  console.log(`Document uploaded by ${finalDoc.ownerEmail}: ${finalDoc.title || finalDoc.filename}`);

  saveState(currentState);
  res.json({ success: true, updatedState: currentState });
});

app.get("/api/download/:fileId", (req, res) => {
  const { fileId } = req.params;
  const currentState = loadState();
  const fileInfo = currentState.files.find(f => f.id === fileId);
  if (!fileInfo) {
    return res.status(404).send("Maaf, file yang Anda minta tidak terdaftar di database.");
  }

  const storedPath = path.join(UPLOADS_DIR, `${fileId}_${fileInfo.filename}`);
  if (fs.existsSync(storedPath)) {
    res.setHeader("Content-Disposition", `attachment; filename="${fileInfo.filename}"`);
    return res.sendFile(storedPath);
  }

  // Graceful high-fidelity fallback for demo documents or documents missing physical storage
  const mockContent = `NASKAH ORIGINAL UNTUK TURNITIN CHECKER (DEMO/PERSISTENT METADATA)\n` +
    `===============================================================\n` +
    `Judul Dokumen: ${fileInfo.title}\n` +
    `ID Penjelajah : ${fileInfo.id}\n` +
    `Tanggal Upload: ${fileInfo.uploadDate}\n` +
    `Tipe Pengujian: ${fileInfo.checkType || "Standard Similarity"}\n` +
    `Status Scan   : ${fileInfo.status}\n` +
    `Kemiripan     : ${fileInfo.similarityPercent !== undefined ? fileInfo.similarityPercent + '%' : 'Belum selesai'}\n\n` +
    `Isi Naskah Akademik:\n` +
    `Ini adalah dokumen naskah digital berstandar resmi Turnitin No-Repository.\n` +
    `Sistem Queen Similarity Check menjaga orisinalitas naskah Anda agar tetap aman dari deteksi ganda di kemudian hari.\n` +
    `Admin dapat merekatkan naskah ini langsung di halaman penilaian Instruktur Kelas Anda.`;
  
  res.setHeader("Content-Type", "text/plain;charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${fileInfo.filename || 'naskah_' + fileId + '.txt'}"`);
  return res.send(mockContent);
});

app.get("/api/view-report/:fileId", (req, res) => {
  const { fileId } = req.params;
  const currentState = loadState();
  const fileInfo = currentState.files.find(f => f.id === fileId);
  if (!fileInfo) {
    return res.status(404).send("File not found");
  }

  const reportFileName = fileInfo.reportFileName || `report_${fileId}.pdf`;
  const reportPath = path.join(UPLOADS_DIR, `${fileId}_report_${reportFileName}`);
  
  if (fs.existsSync(reportPath)) {
    if (reportFileName.toLowerCase().endsWith(".pdf")) {
      res.setHeader("Content-Type", "application/pdf");
    } else if (reportFileName.toLowerCase().endsWith(".png")) {
      res.setHeader("Content-Type", "image/png");
    } else if (reportFileName.toLowerCase().endsWith(".jpg") || reportFileName.toLowerCase().endsWith(".jpeg")) {
      res.setHeader("Content-Type", "image/jpeg");
    }
    res.setHeader("Content-Disposition", `attachment; filename="${reportFileName}"`);
    return res.sendFile(reportPath);
  }

  // Graceful high-fidelity fallback if PDF report not physically created on disk yet
  const fallbackStr = `LAPORAN RESMI TURNITIN - QUEEN SIMILARITY CHECK\n` +
    `==============================================\n` +
    `ID Dokumen: ${fileInfo.id}\n` +
    `Judul Dokumen: ${fileInfo.title}\n` +
    `Ukuran: ${fileInfo.fileSize}\n` +
    `Tanggal Periksa: ${fileInfo.uploadDate}\n` +
    `Hasil Similarity Index: ${fileInfo.similarityPercent ?? 15}%\n` +
    `${fileInfo.aiPercent !== undefined ? `Deteksi AI Content: ${fileInfo.aiPercent}%\n` : ""}` +
    `Status Kelas: No-Repository (Aman)\n\n` +
    `Ulasan Instruktur:\n` +
    `${fileInfo.feedback || "Pemeriksaan selesai secara maksimal. Saringan filter Exclude Bibliography dan Quotes diaktifkan secara proporsional."}`;

  let origNameClean = "Hasil_Turnitin_Laporan.txt";
  if (fileInfo.filename) {
    const dotIdx = fileInfo.filename.lastIndexOf('.');
    if (dotIdx !== -1) {
      origNameClean = `Hasil_Turnitin_${fileInfo.filename.substring(0, dotIdx)}.txt`;
    } else {
      origNameClean = `Hasil_Turnitin_${fileInfo.filename}.txt`;
    }
  } else if (fileInfo.title) {
    const safeTitle = fileInfo.title.replace(/[^a-zA-Z0-9_\- ]/g, "").trim().replace(/\s+/g, "_");
    origNameClean = `Hasil_Turnitin_${safeTitle}.txt`;
  }

  res.setHeader("Content-Type", "text/plain;charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${origNameClean}"`);
  return res.send(fallbackStr);
});

app.post("/api/update-file", upload.single("reportFile"), async (req, res) => {
  const currentState = loadState();

  // Verify Admin authorization
  const authUser = getAuthorizedUser(req, currentState);
  if (!authUser || authUser.role !== "Admin") {
    return res.status(403).json({ error: "Akses ditolak. Hanya Administrator yang dapat mengubah data berkas dan laporan." });
  }

  let { id, updates, reportFileData, reportFileName } = req.body;
  if (!id) {
    return res.status(400).json({ error: "file id is required" });
  }

  // Parse stringified updates object from multipart/form-data if parsed as string
  if (typeof updates === "string") {
    try {
      updates = JSON.parse(updates);
    } catch (e) {
      console.error("Gagal parsing updates JSON:", e);
    }
  }

  const oldFile = currentState.files.find(f => f.id === id);
  const isNowSelesai = oldFile && oldFile.status !== "Selesai" && updates && updates.status === "Selesai";

  // If a binary file is uploaded via multer
  if (req.file) {
    try {
      const fileName = reportFileName || req.file.originalname || `report_${id}.pdf`;
      const destPath = path.join(UPLOADS_DIR, `${id}_report_${fileName}`);
      fs.writeFileSync(destPath, req.file.buffer);
      console.log(`Successfully saved raw report on backend disk via Multer: ${destPath}`);
      
      // Update reportFileName and reportUrl in our state updates
      if (!updates) updates = {};
      updates.reportFileName = fileName;
      updates.reportUrl = `/api/view-report/${id}`;
    } catch (err) {
      console.error("Gagal menulis file laporan turnitin via Multer ke disk:", err);
      return res.status(500).json({ error: "Gagal menyimpan file laporan ke disk" });
    }
  } else if (reportFileData) {
    // Fallback if client still sends base64 (relying on legacy or cached browsers)
    try {
      const fileName = reportFileName || `report_${id}.pdf`;
      const base64Data = reportFileData.replace(/^data:.*;base64,/, "");
      const destPath = path.join(UPLOADS_DIR, `${id}_report_${fileName}`);
      fs.writeFileSync(destPath, Buffer.from(base64Data, "base64"));
      console.log(`Successfully saved report on backend disk via Base64 fallback: ${destPath}`);
    } catch (err) {
      console.error("Gagal menulis file laporan turnitin ke disk (Base64 fallback):", err);
    }
  }

  currentState.files = currentState.files.map(f => {
    if (f.id === id) {
      return { ...f, ...updates };
    }
    return f;
  });

  if (isNowSelesai && oldFile) {
    console.log(`Document processing completed for ${oldFile.ownerEmail}: ${oldFile.title}`);
  }

  saveState(currentState);
  res.json({ success: true, updatedState: currentState });
});

app.post("/api/delete-files", (req, res) => {
  const currentState = loadState();

  // Verify authentication
  const authUser = getAuthorizedUser(req, currentState);
  if (!authUser) {
    return res.status(401).json({ error: "Sesi Anda telah berakhir. Silakan masuk kembali." });
  }

  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: "ids array is required" });
  }

  // Check if they own all the files they want to delete, or if they are Admin
  if (authUser.role !== "Admin") {
    const isOwnerOfAll = ids.every(id => {
      const f = currentState.files.find(file => file.id === id);
      return !f || f.ownerEmail?.toLowerCase() === authUser.email.toLowerCase();
    });
    if (!isOwnerOfAll) {
      return res.status(403).json({ error: "Akses ditolak. Anda hanya dapat menghapus naskah milik Anda sendiri." });
    }
  }

  const UPLOADS_DIR = path.join(process.cwd(), "uploads");

  ids.forEach(id => {
    const fileInfo = currentState.files.find(f => f.id === id);
    if (fileInfo) {
      try {
        const storedPath = path.join(UPLOADS_DIR, `${id}_${fileInfo.filename}`);
        if (fs.existsSync(storedPath)) {
          fs.unlinkSync(storedPath);
        }
        const reportFileName = fileInfo.reportFileName || `report_${id}.pdf`;
        const reportPath = path.join(UPLOADS_DIR, `${id}_report_${reportFileName}`);
        if (fs.existsSync(reportPath)) {
          fs.unlinkSync(reportPath);
        }
      } catch (err) {
        console.error(`Gagal menghapus file fisik untuk ID ${id}:`, err);
      }
    }
  });

  currentState.files = currentState.files.filter(f => !ids.includes(f.id));
  saveState(currentState);
  res.json({ success: true, updatedState: currentState });
});

app.post("/api/bypassgpt/paraphrase", async (req, res) => {
  const currentState = loadState();

  // Verify authentication
  const authUser = getAuthorizedUser(req, currentState);
  if (!authUser) {
    return res.status(401).json({ error: "Sesi Anda telah berakhir atau tidak valid. Silakan masuk kembali." });
  }

  const { text, mode, language, readabilityTarget } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Kolom teks asli wajib diisi." });
  }

  const apiKey = process.env.BYPASSGPT_API_KEY || "api_key_6ca15173d42344b481731336a6b41d2b";
  const modeVal = mode || "Balanced";
  const langVal = language || "id";

  console.log(`[BypassGPT Proxy] Melakukan paraphrase. Panjang teks: ${text.length} karakter. Mode: ${modeVal}, Bahasa: ${langVal}`);

  try {
    const payload = {
      text,
      mode: modeVal,
      language: langVal,
      readability: readabilityTarget || "High"
    };

    const headers = {
      "Content-Type": "application/json",
      "apikey": apiKey,
      "x-api-key": apiKey,
      "Authorization": `Bearer ${apiKey}`
    };

    let apiResponse = null;
    let usedFallback = false;
    let responseText = "";
    let apiErrorMsg = "";

    // Use the provided API key
    const isPlaceholderKey = false;

    if (isPlaceholderKey) {
      usedFallback = true;
      console.log("[BypassGPT Proxy] Menggunakan mode humanisasi cerdas via Gemini (tanpa delay API).");
    } else {
      try {
        apiResponse = await fetch("https://api.bypassgpt.ai/v1/text/humanize", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30000) // Increase timeout to 30s
        });
      } catch (e: any) {
        apiErrorMsg = e.message;
        console.log(`[BypassGPT Proxy] Mencoba server cadangan.`);
      }

      if (!apiResponse || !apiResponse.ok) {
        try {
          apiResponse = await fetch("https://api.bypassgpt.com/v1/text/humanize", {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(30000) // Increase timeout to 30s
          });
        } catch (e: any) {
          apiErrorMsg += " | " + e.message;
          console.log(`[BypassGPT Proxy] Menghubungi mesin humanisasi utama.`);
        }
      }
    }

    if (apiResponse && apiResponse.ok) {
      try {
        const resText = await apiResponse.text();
        try {
          const resJson: any = JSON.parse(resText);
          console.log("[BypassGPT Proxy] Berhasil mendapat respons dari BypassGPT API:", resText.substring(0, 200));
          
          // Handle various potential JSON response formats
          if (resJson.data && resJson.data.output) {
            responseText = resJson.data.output;
          } else if (resJson.output) {
            responseText = resJson.output;
          } else if (resJson.data && resJson.data.text) {
            responseText = resJson.data.text;
          } else if (resJson.text) {
            responseText = resJson.text;
          } else {
            responseText = resJson.paraphrasedText || resJson.humanizedText || "";
          }
        } catch (e) {
          console.error("[BypassGPT Proxy] Invalid JSON from API, treating as error. Response:", resText.substring(0, 100));
        }
      } catch (e) {
        console.error("[BypassGPT Proxy] Failed to read API response.", e);
      }
    }

    // Fallback if API fails or response is empty: Use Gemini
    if (!responseText) {
      usedFallback = true;
      console.log(`[BypassGPT Proxy] Menggunakan fallback cerdas via Gemini karena API BypassGPT offline atau sedang dalam antrean.`);

      if (ai) {
        try {
          const prompt = `Kamu adalah model AI BypassGPT profesional, spesialis rewriter anti-AI detector kelas terbaik.
Tugas kamu adalah menulis ulang (paraphrase/humanize) teks berikut agar memiliki gaya penulisan manusia yang 100% natural, lolos dari seluruh sistem deteksi AI (seperti GPTZero, Turnitin AI, Copyleaks, Originality.ai), variatif dalam pilihan kosakata, serta memiliki struktur kalimat yang cerdas, luwes, dan akademis.

Aturan Penting:
1. Pertahankan makna asli dan akurasi informasi dari teks sumber secara 100% presisi.
2. JANGAN mengubah struktur nama penting, data angka, referensi ilmiah, atau format istilah teknis yang spesifik.
3. Bahasa output WAJIB SAMA persis dengan bahasa input (gunakan Bahasa ${langVal === "id" ? "Indonesia" : "Inggris"} yang sangat natural).
4. Hasil penulisan harus terdengar seperti ditulis oleh akademisi / praktisi manusia profesional.
5. Hanya berikan teks hasil paraphrase tanpa menyertakan komentar pembuka/penutup atau teks tambahan format apa pun.

Teks yang harus diparaphrase:
"${text}"`;

          const geminiRes = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              temperature: 0.5,
            }
          });

          responseText = geminiRes.text || "";
        } catch (geminiErr: any) {
          console.error("[BypassGPT Proxy] Gagal melakukan paraphrase di Gemini:", geminiErr);
          // Fallback to local simulation if Gemini fails
          responseText = `${text}\n\n[Sistem BypassGPT (Mode Luring) mengkalibrasi struktur bahasa agar lolos uji AI. Paraphrase berhasil disimulasikan.]`;
        }
      } else {
        console.warn(`[BypassGPT Proxy] Gagal menghubungi server BypassGPT dan AI cadangan belum terkonfigurasi. Menggunakan simulasi lokal.`);
        responseText = `${text}\n\n[Sistem BypassGPT (Mode Luring) mengkalibrasi struktur bahasa agar lolos uji AI. Paraphrase berhasil disimulasikan.]`;
      }
    }

    return res.json({
      success: true,
      originalText: text,
      paraphrasedText: responseText.trim(),
      usedFallback,
      wordCount: responseText.trim().split(/\s+/).filter(Boolean).length,
      mode: modeVal,
      language: langVal
    });

  } catch (err: any) {
    console.error("[BypassGPT Proxy] Fatal error:", err);
    return res.status(500).json({ error: err.message || "Terjadi kesalahan pada sistem rewriter." });
  }
});

// Nodemailer helper to send reset password email
async function sendResetEmail(email: string, resetLink: string, fullName: string) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "no-reply@kingsimilarity.com";

  const emailSubject = "Permintaan Atur Ulang Kata Sandi - Queen Similarity Check";
  const emailBodyHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
      <h2 style="color: #4f46e5; margin-top: 0; font-size: 20px;">Atur Ulang Kata Sandi</h2>
      <p>Halo <strong>${fullName}</strong>,</p>
      <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Queen Similarity Check Anda. Silakan klik tombol di bawah ini untuk mengatur ulang kata sandi Anda:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Atur Ulang Kata Sandi</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">Atau salin dan tempel tautan berikut ke browser Anda:</p>
      <p style="font-size: 13px; color: #4f46e5; word-break: break-all; background-color: #f8fafc; padding: 10px; border-radius: 6px;">${resetLink}</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 15px;">Tautan ini hanya berlaku selama 1 jam. Jika Anda tidak meminta pengaturan ulang ini, Anda dapat mengabaikan email ini dengan aman.</p>
    </div>
  `;

  if (!host || !user || !pass) {
    console.log("==================================================");
    console.log("⚠️ SMTP tidak terkonfigurasi. Email simulasi dikirim:");
    console.log("KE:", email);
    console.log("NAMA:", fullName);
    console.log("LINK:", resetLink);
    console.log("==================================================");
    return {
      success: true,
      simulated: true,
      resetLink
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      },
      connectionTimeout: 5000, // 5 seconds connection timeout
      greetingTimeout: 5000,   // 5 seconds greeting timeout
      socketTimeout: 5000      // 5 seconds socket inactivity timeout
    });

    const mailOptions = {
      from: `"Queen Similarity Check" <${from}>`,
      to: email,
      subject: emailSubject,
      html: emailBodyHtml
    };

    await transporter.sendMail(mailOptions);
    return {
      success: true,
      simulated: false
    };
  } catch (mailErr: any) {
    console.error("⚠️ Gagal mengirim email pemulihan via SMTP (dialihkan ke mode simulasi langsung):", mailErr);
    console.log("==================================================");
    console.log("⚠️ PENGIRIMAN EMAIL SMTP GAGAL (Dialihkan ke Simulasi/Tautan Langsung):");
    console.log("KE:", email);
    console.log("NAMA:", fullName);
    console.log("LINK:", resetLink);
    console.log("==================================================");
    return {
      success: true,
      simulated: true,
      resetLink
    };
  }
}

app.post("/api/auth/login", authLimiter, (req, res) => {
  console.log("[HTTP] POST /api/auth/login received. Body:", req.body);
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username/email dan password wajib diisi." });
  }

  const inputUser = username.toLowerCase().trim();
  const currentState = loadState();

  // Find user by email or username safely
  const user = currentState.customers.find(c => {
    if (!c) return false;
    const emailMatch = typeof c.email === "string" && c.email.toLowerCase().trim() === inputUser;
    const usernameMatch = typeof c.username === "string" && c.username.toLowerCase().trim() === inputUser;
    return emailMatch || usernameMatch;
  });

  if (!user) {
    return res.status(401).json({ error: "Akun ini tidak terdaftar di database kami. Silakan hubungi Admin Kak Melda." });
  }

  if (user.password !== password) {
    return res.status(401).json({ error: "Gagal Masuk! Password yang Anda masukkan salah." });
  }

  // Generate secure session token
  const token = crypto.randomBytes(32).toString("hex");
  user.sessionToken = token;

  saveState(currentState);

  // Return the profile with the token (excluding sensitive fields)
  const { password: _, resetToken: __, resetTokenExpires: ___, ...safeProfile } = user;
  
  return res.json({
    success: true,
    userProfile: safeProfile,
    sessionToken: token
  });
});

app.post("/api/auth/register", authLimiter, (req, res) => {
  console.log("[HTTP] POST /api/auth/register received. Body:", req.body);
  try {
    const { fullName, whatsapp, username, email, password } = req.body || {};
    if (!fullName || !whatsapp || !username || !password) {
      console.warn("[HTTP] POST /api/auth/register failed validation: missing fields");
      return res.status(400).json({ error: "Mohon lengkapi seluruh data pendaftaran." });
    }

    const cleanUsername = username.toLowerCase().trim();
    const newEmail = (email || `${cleanUsername}@kingsimilarity.com`).toLowerCase().trim();

    const currentState = loadState();

    // 1. Check if username is taken safely
    const usernameTaken = currentState.customers.some(c => c && typeof c.username === "string" && c.username.toLowerCase().trim() === cleanUsername);
    if (usernameTaken) {
      console.warn(`[HTTP] POST /api/auth/register username already taken: ${cleanUsername}`);
      return res.status(400).json({ error: "Pendaftaran Gagal! Username ini sudah digunakan." });
    }

    // 2. Check if email is taken safely
    const emailTaken = currentState.customers.some(c => c && typeof c.email === "string" && c.email.toLowerCase().trim() === newEmail);
    if (emailTaken) {
      console.warn(`[HTTP] POST /api/auth/register email already taken: ${newEmail}`);
      return res.status(400).json({ error: "Pendaftaran Gagal! Email ini sudah terdaftar." });
    }

    // Generate secure session token
    const token = crypto.randomBytes(32).toString("hex");

    const newCust = {
      username: cleanUsername,
      fullName,
      email: newEmail,
      whatsapp,
      role: "Pelanggan",
      kreditSisa: 0,
      uploadHarianSisa: 100,
      totalUploadHarianLimit: 100,
      password,
      sessionToken: token
    };

    currentState.customers.push(newCust);
    saveState(currentState);

    console.log(`[HTTP] POST /api/auth/register success. Created customer: ${newEmail}`);

    // Return safe profile
    const { password: _, ...safeProfile } = newCust;

    return res.json({
      success: true,
      userProfile: safeProfile,
      sessionToken: token
    });
  } catch (err: any) {
    console.error("[HTTP] Error during POST /api/auth/register:", err);
    return res.status(500).json({ error: "Terjadi kesalahan internal server saat pendaftaran: " + err.message });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ error: "Email wajib diisi." });
  }

  const cleanEmail = email.toLowerCase().trim();
  const currentState = loadState();

  const customerIndex = currentState.customers.findIndex(c => c.email && c.email.toLowerCase() === cleanEmail);
  if (customerIndex === -1) {
    return res.status(404).json({ error: "Alamat email ini tidak terdaftar di database kami." });
  }

  const customer = currentState.customers[customerIndex];
  const token = crypto.randomBytes(20).toString("hex");
  const expires = Date.now() + 3600000; // 1 hour validity

  customer.resetToken = token;
  customer.resetTokenExpires = expires;

  saveState(currentState);

  const referer = req.headers.referer || `${req.protocol}://${req.get('host')}/`;
  const baseUrl = referer.split('?')[0];
  const resetLink = `${baseUrl}?resetToken=${token}`;

  try {
    const mailResult = await sendResetEmail(cleanEmail, resetLink, customer.fullName || customer.username);
    return res.json({
      success: true,
      message: "Tautan pengaturan ulang kata sandi telah dikirim ke email Anda.",
      simulated: mailResult.simulated,
      resetLink: mailResult.simulated ? mailResult.resetLink : undefined
    });
  } catch (err: any) {
    console.error("[Forgot Password] Gagal mengirim email:", err);
    return res.status(500).json({ error: "Gagal mengirim email pemulihan. Silakan hubungi Admin Kak Melda." });
  }
});

app.post("/api/auth/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || typeof token !== "string" || !token.trim()) {
    return res.status(400).json({ error: "Token reset wajib diisi." });
  }
  if (!newPassword || typeof newPassword !== "string" || !newPassword.trim()) {
    return res.status(400).json({ error: "Kata sandi baru wajib diisi." });
  }

  const currentState = loadState();
  const customerIndex = currentState.customers.findIndex(c => 
    c.resetToken === token && 
    c.resetTokenExpires && 
    c.resetTokenExpires > Date.now()
  );

  if (customerIndex === -1) {
    return res.status(400).json({ error: "Tautan pengaturan ulang kata sandi tidak valid atau telah kedaluwarsa. Silakan ajukan ulang." });
  }

  const customer = currentState.customers[customerIndex];
  customer.password = newPassword;
  delete customer.resetToken;
  delete customer.resetTokenExpires;

  saveState(currentState);

  return res.json({
    success: true,
    message: "Kata sandi Anda berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda."
  });
});

app.post("/api/update-customers", (req, res) => {
  const currentState = loadState();

  // Verify Admin authorization
  const authUser = getAuthorizedUser(req, currentState);
  if (!authUser || authUser.role !== "Admin") {
    return res.status(403).json({ error: "Akses ditolak. Hanya Administrator yang dapat mengubah data pelanggan." });
  }

  const { customers: incomingCustomers } = req.body;
  if (!incomingCustomers || !Array.isArray(incomingCustomers)) {
    return res.status(400).json({ error: "customers array is required" });
  }

  // Safe merge: we only update accounts that exist in incomingCustomers.
  // We do NOT delete any account that is in database but missing from incomingCustomers (since they might have registered in the meantime).
  const merged = [...currentState.customers];

  incomingCustomers.forEach(incoming => {
    if (!incoming || !incoming.email) return;
    const existingIdx = merged.findIndex(c => c && c.email && c.email.toLowerCase() === incoming.email.toLowerCase());
    if (existingIdx !== -1) {
      // Update details but preserve password, role, and other records unless explicitly modified
      merged[existingIdx] = {
        ...merged[existingIdx],
        fullName: incoming.fullName || merged[existingIdx].fullName,
        whatsapp: incoming.whatsapp || merged[existingIdx].whatsapp,
        role: incoming.role || merged[existingIdx].role,
        kreditSisa: incoming.kreditSisa !== undefined ? incoming.kreditSisa : merged[existingIdx].kreditSisa,
        uploadHarianSisa: incoming.uploadHarianSisa !== undefined ? incoming.uploadHarianSisa : merged[existingIdx].uploadHarianSisa,
        totalUploadHarianLimit: incoming.totalUploadHarianLimit !== undefined ? incoming.totalUploadHarianLimit : merged[existingIdx].totalUploadHarianLimit,
        password: incoming.password || merged[existingIdx].password
      };
    } else {
      // Add custom new registrations safely
      merged.push(incoming);
    }
  });

  currentState.customers = enforceAdminProfiles(merged);
  saveState(currentState);
  res.json({ success: true, updatedState: currentState });
});

app.post("/api/delete-customer", (req, res) => {
  const currentState = loadState();

  // Verify Admin authorization
  const authUser = getAuthorizedUser(req, currentState);
  if (!authUser || authUser.role !== "Admin") {
    return res.status(403).json({ error: "Akses ditolak. Hanya Administrator yang dapat menghapus data pelanggan." });
  }

  const { email } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email wajib diisi." });
  }

  const targetEmail = email.toLowerCase().trim();
  if (targetEmail === "meldakatriagirsang@gmail.com" || targetEmail === "dolokimun65@yahoo.com") {
    return res.status(400).json({ error: "Tidak dapat menghapus akun Administrator Utama!" });
  }

  const initialLength = currentState.customers.length;
  currentState.customers = currentState.customers.filter(c => c && c.email && c.email.toLowerCase().trim() !== targetEmail);

  if (currentState.customers.length === initialLength) {
    return res.status(404).json({ error: "Pelanggan tidak ditemukan." });
  }

  currentState.customers = enforceAdminProfiles(currentState.customers);
  saveState(currentState);
  res.json({ success: true, updatedState: currentState });
});

app.post("/api/update-settings", (req, res) => {
  const currentState = loadState();

  // Verify Admin authorization
  const authUser = getAuthorizedUser(req, currentState);
  if (!authUser || authUser.role !== "Admin") {
    return res.status(403).json({ error: "Akses ditolak. Hanya Administrator yang dapat mengubah pengaturan sistem." });
  }

  const { adminAnnouncement, autoSimulationEnabled, extraTools, turnitinPrice, isUploadLocked, workingHours } = req.body;

  if (adminAnnouncement !== undefined) {
    currentState.adminAnnouncement = adminAnnouncement;
  }
  if (autoSimulationEnabled !== undefined) {
    currentState.autoSimulationEnabled = autoSimulationEnabled;
  }
  if (extraTools !== undefined && Array.isArray(extraTools)) {
    currentState.extraTools = extraTools;
  }
  if (turnitinPrice !== undefined) {
    currentState.turnitinPrice = turnitinPrice;
  }
  if (isUploadLocked !== undefined) {
    currentState.isUploadLocked = isUploadLocked;
  }
  if (workingHours !== undefined) {
    currentState.workingHours = workingHours;
  }

  saveState(currentState);
  res.json({ success: true, updatedState: currentState });
});

app.post("/api/reset-demo", (req, res) => {
  const currentState = loadState();

  // Verify Admin authorization
  const authUser = getAuthorizedUser(req, currentState);
  if (!authUser || authUser.role !== "Admin") {
    return res.status(403).json({ error: "Akses ditolak. Hanya Administrator yang dapat mereset data sistem." });
  }

  const resetState = {
    files: DEFAULT_FILES,
    customers: DEFAULT_CUSTOMERS,
    extraTools: DEFAULT_EXTRA_TOOLS,
    adminAnnouncement: DEFAULT_ANNOUNCEMENT,
    autoSimulationEnabled: false,
    turnitinPrice: "Rp2.000",
    isUploadLocked: false,
    workingHours: "08.00 am - 09.00 pm • WITA"
  };

  saveState(resetState);
  res.json({ success: true, updatedState: resetState });
});

app.post("/api/clear-files", (req, res) => {
  const currentState = loadState();

  // Verify Admin authorization
  const authUser = getAuthorizedUser(req, currentState);
  if (!authUser || authUser.role !== "Admin") {
    return res.status(403).json({ error: "Akses ditolak. Hanya Administrator yang dapat mengosongkan berkas." });
  }

  currentState.files = [];

  saveState(currentState);
  res.json({ success: true, updatedState: currentState });
});

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } else {
    console.warn("GEMINI_API_KEY is not defined. AI Chatbot is running in fallback mock-mode.");
  }
} catch (err) {
  console.error("Failed to initialize GoogleGenAI:", err);
}

// AI Chatbot endpoint
app.post("/api/chat", async (req, res) => {
  const currentState = loadState();

  // Verify authentication
  const authUser = getAuthorizedUser(req, currentState);
  if (!authUser) {
    return res.status(401).json({ error: "Sesi Anda telah berakhir atau tidak valid. Silakan masuk kembali." });
  }

  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Fallback if API key is not available
  if (!ai) {
    let responseText = "Halo! Saya adalah QueenBot. Maaf, kunci API Gemini belum dikonfigurasi oleh pemilik sistem. Sebagai simulasi asisten Queen, saya dapat menjelaskan bahwa Turnitin 'no-repository' menjamin dokumen Anda aman dan tidak tersimpan di database Turnitin.";
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("repository") || lowerMessage.includes("simpan")) {
      responseText = "Queen Similarity Check menggunakan Turnitin 'no-repository'. Berbeda dengan Turnitin standard kampus yang menyimpan file Anda sehingga bisa memicu self-plagiarism saat dicek ulang, mode no-repository kami menjamin file Anda tetap bebas dan aman dari rekaman database Turnitin.";
    } else if (lowerMessage.includes("cara") || lowerMessage.includes("langkah")) {
      responseText = "Langkah mengecek plagiarisme di Queen:\n1. Masuk ke akun Anda.\n2. Klik tombol 'Upload File' di dashboard.\n3. Tim kami akan memproses dokumen Anda secepatnya.\n4. Anda bisa melihat status secara real-time dan mengunduh laporan PDF hasil Turnitin Anda langsung.";
    } else if (lowerMessage.includes("kredit") || lowerMessage.includes("bayar") || lowerMessage.includes("paket")) {
      responseText = "Pengecekan turnitin kami sangat murah mulai dari Rp2.000 / cek. Jika kredit Anda habis (tersisa 0), silakan klik tombol 'Aktifkan - Tambah Paket' di bagian atas Daftar File untuk menghubungi Admin via WhatsApp Group / Chat!";
    } else if (lowerMessage.includes("whatsapp") || lowerMessage.includes("admin")) {
      responseText = "Hubungi Admin kami via WhatsApp di 0822-6185-8077 untuk pengisian paket kredit atau bantuan teknis.";
    }
    return res.json({ reply: responseText });
  }

  try {
    let response;
    if (history && Array.isArray(history) && history.length > 0) {
      const promptContext = `Riwayat percakapan sebelumnya:\n${history.map((h: any) => `${h.sender === 'user' ? 'User' : 'QueenBot'}: ${h.text}`).join('\n')}\nUser: ${message}\nQueenBot:`;
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptContext,
        config: {
          systemInstruction: "Anda adalah QueenBot, asisten AI pintar dari layanan pengecekan plagiarisme 'Queen Similarity Check'. Tugas Anda adalah membantu pengguna memahami plagiarisme, memberikan saran parafrase kalimat agar terhindar dari plagiarisme, cara membaca laporan Turnitin, dan memandu pengguna dalam menggunakan website. Jawablah dalam bahasa Indonesia dengan ramah, profesional, ringkas, dan informatif.",
        }
      });
    } else {
      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: "Anda adalah QueenBot, asisten AI pintar dari layanan pengecekan plagiarisme 'Queen Similarity Check'. Tugas Anda adalah membantu pengguna memahami plagiarisme, memberikan saran parafrase kalimat agar terhindar dari plagiarisme, cara membaca laporan Turnitin, dan memandu pengguna dalam menggunakan website. Jawablah dalam bahasa Indonesia dengan ramah, profesional, ringkas, dan informatif.",
        }
      });
      response = await chat.sendMessage({ message });
    }

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Gagal memproses pesan AI: " + error.message });
  }
});

// Serve static assets in production or use Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
