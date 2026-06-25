import React, { useState, useEffect } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  ShieldCheck, 
  Zap, 
  Award, 
  Target, 
  ChevronRight, 
  LogIn, 
  UserPlus, 
  ArrowLeft, 
  FileText, 
  Search, 
  Upload, 
  Plus, 
  Sparkles, 
  User, 
  MessageSquare, 
  FileCheck2, 
  Info, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Bell,
  TrendingDown,
  Trash2,
  LogOut,
  Phone,
  Bookmark,
  RefreshCw,
  Crown,
  Lock,
  Eye,
  Calendar,
  Check,
  Globe2,
  LockKeyhole
} from "lucide-react";

import { CheckedDocument, UserProfile, AppView, DashboardView, ExtraTool } from "./types";
import UploadModal from "./components/UploadModal";
import TurnitinReportModal from "./components/TurnitinReportModal";
import AIChatbotView from "./components/AIChatbotView";
import PurchaseModal from "./components/PurchaseModal";
import AdminTurnitinResultModal from "./components/AdminTurnitinResultModal";
import QueenLogo from "./components/QueenLogo";

export default function App() {
  // App views
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const saved = localStorage.getItem("queen_current_view");
    return (saved as AppView) || "landing";
  });
  const [dashboardTab, setDashboardTab] = useState<DashboardView>(() => {
    const saved = localStorage.getItem("queen_dashboard_tab");
    return (saved as DashboardView) || "list-file";
  });

  // User details state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("queen_user_profile");
    if (saved) return JSON.parse(saved);
    return {
      username: "",
      fullName: "",
      email: "",
      whatsapp: "",
      role: "Guest",
      kreditSisa: 0,
      uploadHarianSisa: 0,
      totalUploadHarianLimit: 0
    };
  });

  // Customers list state (Seeded with standard accounts)
  const [customers, setCustomers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem("queen_customers_list");
    if (saved) return JSON.parse(saved);
    return [
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
  });

  // Dynamic extra tools/features that admin can manage
  const [extraTools, setExtraTools] = useState<ExtraTool[]>(() => {
    const saved = localStorage.getItem("queen_extra_tools");
    if (saved) return JSON.parse(saved);
    return [
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
  });

  // Login form inputs
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerWhatsApp, setRegisterWhatsApp] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Files list state
  const [files, setFiles] = useState<CheckedDocument[]>(() => {
    const saved = localStorage.getItem("queen_files_list");
    return saved ? JSON.parse(saved) : []; 
  });

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Upload and Report Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<CheckedDocument | null>(null);
  const [activeAdminModalDoc, setActiveAdminModalDoc] = useState<CheckedDocument | null>(null);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);

  // Auto processing toggle. Default to false so admin can check and input Turnitin reports manually
  const [autoSimulationEnabled, setAutoSimulationEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("queen_auto_simulation_enabled");
    return saved ? JSON.parse(saved) : false;
  });

  // Dynamic announcement/pemberitahuan custom-editable by admin
  const [adminAnnouncement, setAdminAnnouncement] = useState<string>(() => {
    const saved = localStorage.getItem("queen_admin_announcement");
    return saved || "Selamat datang di Queen Similarity Check! Semua pengecekan berkas menggunakan akun Turnitin Instruktur resmi (No-Repository / Bukti Kelas Instruktur). Dijamin aman, tidak terekam database turnitin global! Hubungi WhatsApp Admin untuk bantuan: 0822-6185-8077";
  });

  // Dynamic Turnitin Cek price custom-editable by admin
  const [turnitinPrice, setTurnitinPrice] = useState<string>(() => {
    const saved = localStorage.getItem("queen_turnitin_price");
    return saved || "Rp2.000";
  });

  // Draft state for admin price setting input to prevent input-shifting during background polling
  const [adminPriceInput, setAdminPriceInput] = useState<string>(() => {
    const saved = localStorage.getItem("queen_turnitin_price");
    return saved || "Rp2.000";
  });

  // Sound notification for Admin when custom uploads a file
  const [adminSoundEnabled, setAdminSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("queen_admin_sound_enabled");
    return saved !== "false";
  });

  // Lock uploads parameter controlled by Admin
  const [isUploadLocked, setIsUploadLocked] = useState<boolean>(() => {
    const saved = localStorage.getItem("queen_is_upload_locked");
    return saved === "true";
  });

  // Operating working hours customizable by Admin
  const [workingHours, setWorkingHours] = useState<string>(() => {
    const saved = localStorage.getItem("queen_working_hours");
    return saved || "08.00 am - 09.00 pm • WITA";
  });

  // Draft state for admin working hours setting input
  const [adminWorkingHoursInput, setAdminWorkingHoursInput] = useState<string>(() => {
    const saved = localStorage.getItem("queen_working_hours");
    return saved || "08.00 am - 09.00 pm • WITA";
  });

  // Customer Directory Search & Sort States
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [customerSortOption, setCustomerSortOption] = useState("name-asc");

  // Settings Tab variable for Admin config
  const [adminSettingsTab, setAdminSettingsTab] = useState<string>("portal");

  // BypassGPT states for Admin rewriter menu
  const [bpOriginalText, setBpOriginalText] = useState("");
  const [bpParaphrasedText, setBpParaphrasedText] = useState("");
  const [bpMode, setBpMode] = useState("Balanced");
  const [bpLanguage, setBpLanguage] = useState("id");
  const [bpLoading, setBpLoading] = useState(false);
  const [bpError, setBpError] = useState("");
  const [bpWordCount, setBpWordCount] = useState(0);
  const [bpUsedFallback, setBpUsedFallback] = useState(false);

  // Selection state for individual or bulk/mass deletion of document queue
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  const handleToggleSelectAllFiles = () => {
    if (selectedFileIds.length === files.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(files.map(f => f.id));
    }
  };

  const handleToggleSelectFile = (id: string) => {
    setSelectedFileIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBypassGptParaphrase = async () => {
    if (!bpOriginalText.trim()) {
      setBpError("Silakan masukkan teks asli yang ingin diparaphrase terlebih dahulu.");
      return;
    }

    setBpLoading(true);
    setBpError("");
    setBpParaphrasedText("");

    try {
      const res = await fetch("/api/bypassgpt/paraphrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: bpOriginalText,
          mode: bpMode,
          language: bpLanguage,
          readabilityTarget: "High"
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Gagal melakukan paraphrase.");
      }

      const data = await res.json();
      if (data.success) {
        setBpParaphrasedText(data.paraphrasedText);
        setBpWordCount(data.wordCount);
        setBpUsedFallback(data.usedFallback || false);
      } else {
        throw new Error(data.error || "Gagal mendapatkan hasil paraphrase.");
      }
    } catch (err: any) {
      setBpError(err.message || "Gagal memproses paraphrase. Silakan coba sesaat lagi.");
    } finally {
      setBpLoading(false);
    }
  };

  const handleDeleteFiles = async (idsToDelete: string[]) => {
    if (idsToDelete.length === 0) return;
    const msg = idsToDelete.length === 1 
      ? "Apakah Kak Melda yakin ingin menghapus naskah ini dari database?"
      : `Apakah Kak Melda yakin ingin menghapus ${idsToDelete.length} naskah terpilih dari daftar antrean secara massal?`;
      
    if (confirm(msg)) {
      // 1. Optimistic update
      setFiles(prev => prev.filter(f => !idsToDelete.includes(f.id)));
      setSelectedFileIds(prev => prev.filter(id => !idsToDelete.includes(id)));
      
      // 2. Background database delete
      try {
        const res = await fetch("/api/delete-files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: idsToDelete })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.updatedState && data.updatedState.files) {
            setFiles(data.updatedState.files);
          }
        }
      } catch (err) {
        console.error("Gagal menghapus naskah dari server:", err);
      }
    }
  };

  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Auto-resume if the browser suspended the AudioContext
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Helper to play a loud, rich dual-frequency digital chime note
      const playNote = (time: number, freq1: number, freq2: number, duration: number, volume: number = 0.85) => {
        // Oscillator 1 (Triangle wave for punchy and sharp presence)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(freq1, time);
        
        // Oscillator 2 (Sine wave for fundamental depth and resonance)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(freq2, time);

        // Amplitude Envelope for Oscillator 1
        gain1.gain.setValueAtTime(0, time);
        gain1.gain.linearRampToValueAtTime(volume * 0.45, time + 0.05); // quick attack
        gain1.gain.exponentialRampToValueAtTime(0.001, time + duration); // smooth decay

        // Amplitude Envelope for Oscillator 2
        gain2.gain.setValueAtTime(0, time);
        gain2.gain.linearRampToValueAtTime(volume * 0.45, time + 0.05); // quick attack
        gain2.gain.exponentialRampToValueAtTime(0.001, time + duration); // smooth decay

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc1.start(time);
        osc1.stop(time + duration);
        osc2.start(time);
        osc2.stop(time + duration);
      };

      const now = ctx.currentTime;
      
      // We play 6 dual-tone melody pulses spaced 0.5s apart (Total duration ~ 3.7 seconds)
      // Pulse 1: Mid-High
      playNote(now, 659.25, 987.77, 0.6, 0.95); // E5 + B5
      
      // Pulse 2: High Chime
      playNote(now + 0.5, 880, 1320, 0.6, 0.95); // A5 + E6
      
      // Pulse 3: Mid-High Chime
      playNote(now + 1.0, 659.25, 987.77, 0.6, 0.95); // E5 + B5
      
      // Pulse 4: High Chime
      playNote(now + 1.5, 880, 1320, 0.6, 0.95); // A5 + E6
      
      // Pulse 5: Bright alarm alarm chord
      playNote(now + 2.0, 659.25, 1320, 0.7, 0.95); // E5 + E6
      
      // Pulse 6: Final lingering warning chord
      playNote(now + 2.5, 880, 1320, 1.2, 1.0); // A5 + E6
      
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  // Keep track of notified file IDs using Ref initialized from localStorage to prevent duplicate sound triggers on page reloads
  const seenFileIdsRef = React.useRef<string[]>([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("queen_seen_file_ids_v3");
      if (saved) {
        seenFileIdsRef.current = JSON.parse(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  // Simulation parameters for progress tracking
  const [processingProgress, setProcessingProgress] = useState<{ [id: string]: number }>({});

  const [currentTimeText, setCurrentTimeText] = useState("");

  // Synchronise state with data fetched from backend (or pushed via real-time SSE stream)
  const updateClientStateWithData = (data: any) => {
    if (data.files) {
      setFiles((prevFiles) => {
        if (userProfile.role === "Admin") {
          const currentIds = data.files.map((f: any) => f.id);
          const seenIds = seenFileIdsRef.current;
          
          if (seenIds.length === 0) {
            // Initialize seen list silently the first time so we do not alert historical files
            seenFileIdsRef.current = currentIds;
            try {
              localStorage.setItem("queen_seen_file_ids_v3", JSON.stringify(currentIds));
            } catch (e) { /* ignore */ }
          } else {
            // We have a base list of seen files. Any new files trigger alarm!
            const unseenFiles = data.files.filter((f: any) => !seenIds.includes(f.id));
            if (unseenFiles.length > 0) {
              const updatedSeen = Array.from(new Set([...seenIds, ...currentIds]));
              seenFileIdsRef.current = updatedSeen;
              try {
                localStorage.setItem("queen_seen_file_ids_v3", JSON.stringify(updatedSeen));
              } catch (e) { /* ignore */ }
              if (adminSoundEnabled) {
                playNotificationSound();
              }
            }
          }
        }
        return data.files;
      });
    }
    if (data.customers) {
      setCustomers(data.customers);
      
      // Sync currently logged-in user profile with values in customers database
      const myEmail = userProfile.email;
      if (myEmail && userProfile.role === "Pelanggan") {
        const updatedProfileObj = data.customers.find((c: any) => c.email.toLowerCase() === myEmail.toLowerCase());
        if (updatedProfileObj) {
          setUserProfile(prev => ({
            ...prev,
            kreditSisa: updatedProfileObj.kreditSisa,
            uploadHarianSisa: updatedProfileObj.uploadHarianSisa,
            fullName: updatedProfileObj.fullName,
            whatsapp: updatedProfileObj.whatsapp
          }));
        }
      }
    }
    if (data.extraTools) {
      setExtraTools(data.extraTools);
    }
    if (data.adminAnnouncement) {
      setAdminAnnouncement(data.adminAnnouncement);
    }
    if (data.turnitinPrice) {
      setTurnitinPrice((prevPrice) => {
        if (data.turnitinPrice !== prevPrice) {
          setAdminPriceInput(data.turnitinPrice);
          return data.turnitinPrice;
        }
        return prevPrice;
      });
    }
    if (data.autoSimulationEnabled !== undefined) {
      setAutoSimulationEnabled(data.autoSimulationEnabled);
    }
    if (data.isUploadLocked !== undefined) {
      setIsUploadLocked(data.isUploadLocked);
    }
    if (data.workingHours !== undefined) {
      setWorkingHours((prevHours) => {
        if (data.workingHours !== prevHours) {
          setAdminWorkingHoursInput(data.workingHours);
          return data.workingHours;
        }
        return prevHours;
      });
    }
  };

  // Fetch Server state to synchronise files across devices
  const fetchServerState = async () => {
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        updateClientStateWithData(data);
      }
    } catch (err) {
      // Gracefully handle periodic background refresh drops (e.g., during server restarts)
      console.warn("Gagal mengambil status dari database server (reconnecting):", err);
    }
  };

  // Run synchronization on mount and periodically query the database server
  const isAnyFileProcessing = files.some(f => f.status === "Memproses");
  useEffect(() => {
    fetchServerState();
    
    let worker: Worker | null = null;
    let fallbackInterval: any = null;
    const intervalDuration = isAnyFileProcessing ? 1000 : 2500;

    try {
      if (typeof window !== "undefined" && window.Worker) {
        const workerCode = `
          let intervalId;
          self.onmessage = function(e) {
            if (e.data.action === 'start') {
              if (intervalId) clearInterval(intervalId);
              intervalId = setInterval(() => {
                self.postMessage('tick');
              }, e.data.interval || 2500);
            } else if (e.data.action === 'stop') {
              if (intervalId) clearInterval(intervalId);
            }
          };
        `;
        const blob = new Blob([workerCode], { type: "application/javascript" });
        const blobURL = URL.createObjectURL(blob);
        worker = new Worker(blobURL);
        
        worker.onmessage = () => {
          fetchServerState();
        };

        worker.postMessage({ action: "start", interval: intervalDuration });
        console.log(`Precise background sync Web Worker initialized successfully (interval: ${intervalDuration}ms)!`);
      } else {
        throw new Error("Worker unsupported");
      }
    } catch (err) {
      console.warn("Falling back to legacy background interval:", err);
      fallbackInterval = setInterval(() => {
        fetchServerState();
      }, intervalDuration);
    }

    return () => {
      if (worker) {
        worker.postMessage({ action: "stop" });
        worker.terminate();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [userProfile.email, isAnyFileProcessing]);

  // Establish a persistent, sub-second real-time SSE stream connection to the backend
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectRealtimeSSE = () => {
      console.log("🔌 Connecting to real-time update stream...");
      eventSource = new EventSource("/api/updates-stream");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("⚡ Real-time update received from server!");
          updateClientStateWithData(data);
        } catch (err) {
          console.error("Gagal memproses pesan real-time dari stream:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn("Koneksi real-time terputus. Menghubungkan kembali dalam 3 detik...");
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        reconnectTimeout = setTimeout(connectRealtimeSSE, 3000);
      };
    };

    connectRealtimeSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [userProfile.email, adminSoundEnabled]);

  // Sync state with local storage as a robust local backup
  useEffect(() => {
    if (files.length > 0) {
      localStorage.setItem("queen_files_list", JSON.stringify(files));
    }
  }, [files]);

  useEffect(() => {
    localStorage.setItem("queen_user_profile", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem("queen_current_view", currentView);
  }, [currentView]);

  // Security guard: Force redirect guest user to landing if they somehow enter dashboard mode
  useEffect(() => {
    if (userProfile.role === "Guest" && currentView === "dashboard") {
      setCurrentView("landing");
    }
  }, [userProfile.role, currentView]);

  useEffect(() => {
    localStorage.setItem("queen_dashboard_tab", dashboardTab);
  }, [dashboardTab]);

  useEffect(() => {
    if (customers.length > 0) {
      localStorage.setItem("queen_customers_list", JSON.stringify(customers));
    }
  }, [customers]);

  useEffect(() => {
    if (extraTools.length > 0) {
      localStorage.setItem("queen_extra_tools", JSON.stringify(extraTools));
    }
  }, [extraTools]);

  useEffect(() => {
    localStorage.setItem("queen_auto_simulation_enabled", JSON.stringify(autoSimulationEnabled));
  }, [autoSimulationEnabled]);

  useEffect(() => {
    localStorage.setItem("queen_admin_announcement", adminAnnouncement);
  }, [adminAnnouncement]);

  useEffect(() => {
    localStorage.setItem("queen_turnitin_price", turnitinPrice);
  }, [turnitinPrice]);

  useEffect(() => {
    localStorage.setItem("queen_admin_sound_enabled", String(adminSoundEnabled));
  }, [adminSoundEnabled]);

  useEffect(() => {
    localStorage.setItem("queen_is_upload_locked", String(isUploadLocked));
  }, [isUploadLocked]);

  useEffect(() => {
    localStorage.setItem("queen_working_hours", workingHours);
  }, [workingHours]);

  // Real-time Indonesian clock emulation
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Makassar",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      };
      setCurrentTimeText(`${now.toLocaleTimeString("id-ID", options)} (Asia/Makassar)`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulated processing timer. When a new file has state "Memproses"
  // Tick up its progress representation. If auto-simulation is enabled, it completes.
  // If auto-simulation is disabled (manual check mode), progress caps at 98%, awaiting manual input.
  useEffect(() => {
    const processingFiles = files.filter(f => f.status === "Memproses");
    if (processingFiles.length === 0) return;

    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        const next = { ...prev };
        let hasChanges = false;

        setFiles(currentFiles => {
          let filesUpdated = false;
          const nextFiles = currentFiles.map(file => {
            if (file.status === "Memproses") {
              const currentProg = next[file.id] || 0;
              const maxProg = autoSimulationEnabled ? 100 : 98;

              if (currentProg >= maxProg) {
                if (autoSimulationEnabled) {
                  filesUpdated = true;
                  const similarityScore = Math.floor(4 + Math.random() * 24);
                  const feedbackVal = `Turnitin scan selesai. Index kemiripan: ${similarityScore}%. Seluruh naskah Anda selamat dari database repository.`;
                  
                  // Notify backend virtual DB of simulated completion
                  fetch("/api/update-file", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: file.id,
                      updates: {
                        status: "Selesai",
                        similarityPercent: similarityScore,
                        feedback: feedbackVal
                      }
                    })
                  }).catch(err => console.error("Gagal simpan hasil sim otomatis:", err));

                  return {
                    ...file,
                    status: "Selesai",
                    similarityPercent: similarityScore,
                    feedback: feedbackVal
                  };
                } else {
                  // In manual mode, keep it suspended at 98% progress
                  return file;
                }
              } else {
                hasChanges = true;
                next[file.id] = currentProg + Math.floor(18 + Math.random() * 22);
                if (next[file.id] > maxProg) next[file.id] = maxProg;
              }
            }
            return file;
          });

          if (filesUpdated) {
            return nextFiles;
          }
          return currentFiles;
        });

        if (hasChanges) return next;
        return prev;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [files, autoSimulationEnabled]);

  // Handle login triggers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) {
      setAuthError("Username atau email tidak boleh kosong.");
      return;
    }
    
    setAuthError("");
    const inputUser = loginUsername.toLowerCase().trim();
    
    // Explicit hardcoded fallback or override for primary master Admin
    if (inputUser === "dolokimun65@yahoo.com" && loginPassword === "@Marbun656") {
      setUserProfile({
        username: "dolokimun",
        fullName: "Dolok Imun Admin",
        email: "dolokimun65@yahoo.com",
        whatsapp: "0812-3456-7890",
        role: "Admin",
        kreditSisa: 9999,
        uploadHarianSisa: 999,
        totalUploadHarianLimit: 999
      });
      setDashboardTab("workspace-admin");
      setCurrentView("dashboard");
      return;
    }

    // Unified customer database matching
    const existingCust = customers.find(c => 
      c.email.toLowerCase() === inputUser || 
      c.username.toLowerCase() === inputUser
    );

    if (!existingCust) {
      setAuthError("Gagal Masuk! Akun ini tidak terdaftar di database. Silakan klik pendaftaran terlebih dahulu atau hubungi Admin Kak Melda.");
      return;
    }

    // Verify password match
    const storedPassword = existingCust.password || "";
    if (storedPassword && loginPassword !== storedPassword) {
      setAuthError("Gagal Masuk! Password yang Anda masukkan tidak sesuai.");
      return;
    }

    // Successful login!
    setUserProfile(existingCust);
    if (existingCust.role === "Admin") {
      setDashboardTab("workspace-admin");
    } else {
      setDashboardTab("list-file");
    }
    setCurrentView("dashboard");
  };

  // Handle Register actions
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim() || !registerWhatsApp.trim() || !registerUsername.trim() || !registerPassword.trim()) {
      setAuthError("Mohon lengkapi nama, nomor WhatsApp, username, dan password Anda.");
      return;
    }

    setAuthError("");
    const cleanUsername = registerUsername.toLowerCase().trim();
    const newEmail = registerEmail.trim() || `${cleanUsername}@kingsimilarity.com`;

    // 1. Enforce unique database username check
    const usernameTaken = customers.some(c => c.username.toLowerCase() === cleanUsername);
    if (usernameTaken) {
      setAuthError("Pendaftaran Gagal! Username ini sudah digunakan.");
      return;
    }

    // 2. Enforce unique email check
    const emailTaken = customers.some(c => c.email.toLowerCase() === newEmail.toLowerCase());
    if (emailTaken) {
      setAuthError("Pendaftaran Gagal! Email ini sudah terdaftar.");
      return;
    }

    const newCust: UserProfile = {
      username: cleanUsername,
      fullName: registerName,
      email: newEmail,
      whatsapp: registerWhatsApp,
      role: "Pelanggan",
      kreditSisa: 0, // Starts at 0 credits as requested
      uploadHarianSisa: 20,
      totalUploadHarianLimit: 20,
      password: registerPassword
    };

    // Store globally in customers ledger
    const updatedList = [...customers, newCust];
    
    setCustomers(updatedList);
    fetch("/api/update-customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customers: updatedList })
    }).catch(err => console.error("Gagal sinkron pendaftaran baru:", err));

    setUserProfile(newCust);
    setDashboardTab("list-file");
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar dari akun?")) {
      const guestProfile: UserProfile = {
        username: "",
        fullName: "",
        email: "",
        whatsapp: "",
        role: "Guest",
        kreditSisa: 0,
        uploadHarianSisa: 0,
        totalUploadHarianLimit: 0
      };
      setUserProfile(guestProfile);
      localStorage.setItem("queen_user_profile", JSON.stringify(guestProfile));
      localStorage.removeItem("queen_files_list");
      setFiles([]);
      setCurrentView("landing");
    }
  };

  // Add simulated uploaded document
  const handleUploadSuccess = async (newDoc: CheckedDocument, fileData?: string | File) => {
    // Fill owner email
    const ownerEmail = userProfile.email || "meldakatriagirsang@gmail.com";
    const finalDoc: CheckedDocument = {
      ...newDoc,
      ownerEmail
    };

    const cost = newDoc.creditCost || 1;

    // 1. Optimistic update: Subtract credit and decrease upload limit locally for rapid UX feedback
    setUserProfile(prev => ({
      ...prev,
      kreditSisa: Math.max(0, prev.kreditSisa - cost),
      uploadHarianSisa: Math.max(0, prev.uploadHarianSisa - 1)
    }));

    // 2. Optimistic update: Instantly append the document to the local files list so it is shown immediately!
    setFiles(prev => [finalDoc, ...prev]);

    // 3. Initialize starting progress indicators instantly
    setProcessingProgress(prev => ({
      ...prev,
      [newDoc.id]: 0
    }));

    // 4. Synergize with server in the background using FormData
    try {
      const formData = new FormData();
      formData.append("ownerEmail", ownerEmail);
      formData.append("newDoc", JSON.stringify(newDoc));

      if (fileData instanceof File) {
        formData.append("file", fileData);
      } else if (fileData) {
        formData.append("fileData", fileData);
      }

      const res = await fetch("/api/upload-file", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.updatedState) {
          setFiles(data.updatedState.files);
          setCustomers(data.updatedState.customers);
        }
      }
    } catch (err) {
      console.error("Gagal mengunggah file ke database server:", err);
    }
  };

  const handleActivateCredits = () => {
    setIsPurchaseOpen(true);
  };

  const handleUpdateCustomersList = async (updatedList: UserProfile[]) => {
    setCustomers(updatedList);
    try {
      await fetch("/api/update-customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customers: updatedList })
      });
    } catch (err) {
      console.error("Gagal sinkron data pelanggan dengan server:", err);
    }
  };

  const handleAddPurchasedCredits = async (creditsToAdd: number) => {
    if (userProfile.role !== "Admin") {
      alert(`Permintaan pembelian paket pengerjaan berhasil diajukan!\nSilakan lakukan transfer pembayaran sesuai instruksi, lalu kirimkan bukti transfer Anda ke WhatsApp Admin Kak Melda.\n\nKredit Anda akan segera ditambahkan secara manual oleh Admin setelah pembayaran dikonfirmasi.`);
      return;
    }

    setUserProfile(prev => ({
      ...prev,
      kreditSisa: prev.kreditSisa + creditsToAdd
    }));
    
    const updatedCusts = customers.map(cust => {
      if (cust.email.toLowerCase() === userProfile.email.toLowerCase()) {
        return {
          ...cust,
          kreditSisa: cust.kreditSisa + creditsToAdd
        };
      }
      return cust;
    });
    handleUpdateCustomersList(updatedCusts);
  };

  const handleResetDemoData = async () => {
    try {
      const res = await fetch("/api/reset-demo", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.updatedState) {
          setFiles(data.updatedState.files);
          setCustomers(data.updatedState.customers);
          setExtraTools(data.updatedState.extraTools);
          setAdminAnnouncement(data.updatedState.adminAnnouncement);
          setAutoSimulationEnabled(data.updatedState.autoSimulationEnabled);
        }
      }
    } catch (err) {
      console.error("Gagal reset data demo:", err);
    }
    setUserProfile(prev => ({ ...prev, kreditSisa: 12 }));
  };

  const handleClearAllFiles = async () => {
    if (confirm("Apakah Kak Melda yakin ingin menghapus katalog riwayat file di akun Anda?")) {
      try {
        const res = await fetch("/api/clear-files", { method: "POST" });
        if (res.ok) {
          setFiles([]);
        }
      } catch (err) {
        console.error("Gagal menghapus berkas:", err);
      }
    }
  };

  // Filter file list according to Query
  const filteredFiles = files.filter(f => {
    // Partition files: normal customers only see files they owned
    if (userProfile.role !== "Admin") {
      const isMyFile = (f.ownerEmail || "").toLowerCase() === (userProfile.email || "").toLowerCase() ||
                       (!f.ownerEmail && (userProfile.email || "").toLowerCase() === "meldakatriagirsang@gmail.com");
      if (!isMyFile) return false;
    }

    return (
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Filter & Sort customers directory list for Admin Workspace
  const filteredAndSortedCustomers = React.useMemo(() => {
    let result = [...customers];
    
    // 1. Filter by search query
    if (customerSearchQuery.trim()) {
      const q = customerSearchQuery.toLowerCase().trim();
      result = result.filter(cust => 
        (cust.fullName || "").toLowerCase().includes(q) ||
        (cust.email || "").toLowerCase().includes(q) ||
        (cust.username || "").toLowerCase().includes(q) ||
        (cust.whatsapp || "").toLowerCase().includes(q)
      );
    }
    
    // 2. Sort
    result.sort((a, b) => {
      if (customerSortOption === "name-asc") {
        return (a.fullName || "").localeCompare(b.fullName || "");
      } else if (customerSortOption === "name-desc") {
        return (b.fullName || "").localeCompare(a.fullName || "");
      } else if (customerSortOption === "credit-desc") {
        return b.kreditSisa - a.kreditSisa;
      } else if (customerSortOption === "credit-asc") {
        return a.kreditSisa - b.kreditSisa;
      } else if (customerSortOption === "files-desc") {
        const aCount = files.filter(f => f.ownerEmail === a.email).length;
        const bCount = files.filter(f => f.ownerEmail === b.email).length;
        return bCount - aCount;
      }
      return 0;
    });
    
    return result;
  }, [customers, customerSearchQuery, customerSortOption, files]);

  // File status counting caches
  const totalCount = files.length;
  const selesaiCount = files.filter(f => f.status === "Selesai").length;
  const memprosesCount = files.filter(f => f.status === "Memproses").length;
  const gagalCount = files.filter(f => f.status === "Gagal").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white antialiased">
      
      {/* -------------------- VIEW 1: LANDING PAGE -------------------- */}
      {currentView === "landing" && (
        <div className="flex flex-col min-h-screen">
          
          {/* Header Navigation */}
          <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100 shadow-2xs">
            <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
              
              {/* Logo branding */}
              <QueenLogo size={36} />

              {/* Navigation CTAs */}
              <div className="flex items-center gap-3">
                {userProfile.role !== "Guest" ? (
                  <>
                    <button 
                      onClick={() => {
                        setDashboardTab(userProfile.role === "Admin" ? "workspace-admin" : "list-file");
                        setCurrentView("dashboard");
                      }}
                      className="px-4 py-2 text-indigo-600 hover:text-indigo-800 text-xs font-bold hover:bg-slate-50 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5"
                    >
                      🚀 Buka Dashboard ({userProfile.fullName.split(" ")[0]})
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold hover:bg-slate-50 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1"
                    >
                      <LogOut size={13} /> Keluar
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setCurrentView("login")}
                      className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold hover:bg-slate-50 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1"
                    >
                      <LogIn size={14} /> Masuk
                    </button>
                    <button 
                      onClick={() => setCurrentView("register")}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold rounded-xl transition duration-150 shadow-xs hover:shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      Daftar Gratis
                    </button>
                  </>
                )}
              </div>

            </div>
          </header>

          {/* Hero Section */}
          <section className="relative overflow-hidden pt-12 pb-20 md:py-28 bg-radial from-slate-50 to-indigo-50/20">
            <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column Text */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Badge Mulai Dari */}
                <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full text-indigo-700 text-xs font-semibold shadow-2xs animate-fade-in mx-auto lg:mx-0">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                  <span>Mulai Dari {turnitinPrice} / Cek Turnitin</span>
                </div>

                {/* Main Heading Text */}
                <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight leading-tight">
                  Cek Plagiarisme Dokumen <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800">Cepat & Akurat</span>
                </h1>

                {/* Subtitle description */}
                <p className="text-slate-500 text-md sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans font-light">
                  Layanan pengecekan plagiarisme profesional menggunakan Turnitin untuk memastikan keaslian dokumen akademik Anda. Terpercaya, aman, dan tanpa tersimpan di server database.
                </p>

                {/* Action CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <button 
                    onClick={() => setCurrentView("register")}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-6 py-4 rounded-xl shadow-md transition duration-150 transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Daftar Sekarang <ChevronRight size={15} />
                  </button>
                  
                  <button 
                    onClick={() => setCurrentView("login")}
                    className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-6 py-4 rounded-xl shadow-2xs transition duration-150 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Sudah Punya Akun <LogIn size={15} />
                  </button>
                </div>

                {/* Trust labels info */}
                <div className="pt-8 border-t border-slate-200/60 max-w-md mx-auto lg:mx-0 grid grid-cols-3 gap-4">
                  <div className="text-center lg:text-left">
                    <span className="block font-display font-semibold text-slate-900 text-xl leading-none">100%</span>
                    <span className="text-[10px] text-slate-400 font-medium">Aman & Rahasia</span>
                  </div>
                  <div className="text-center lg:text-left">
                    <span className="block font-display font-semibold text-slate-900 text-xl leading-none">5-15m</span>
                    <span className="text-[10px] text-slate-400 font-medium font-sans">Durasi Selesai</span>
                  </div>
                  <div className="text-center lg:text-left">
                    <span className="block font-display font-semibold text-slate-900 text-xl leading-none">Turnitin</span>
                    <span className="text-[10px] text-slate-400 font-medium font-sans">Sistem Resmi</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Graphic Panel */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-sm">
                  
                  {/* Decorative background grid elements */}
                  <div className="absolute -inset-4 bg-indigo-500/10 rounded-3xl blur-2xl -z-10 transform rotate-6"></div>
                  
                  {/* Outer Main Premium Card */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
                    
                    {/* Visual header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                        <span className="text-[10.5px] font-mono text-slate-500">TURNITIN SANDBOX</span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">No-Repository</span>
                    </div>

                    {/* Progress visual representation */}
                    <div className="space-y-3.5">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FileText size={18} className="text-indigo-600" />
                          <div className="min-w-0">
                            <span className="block font-semibold text-xs text-slate-800 truncate max-w-[150px]">Skripsi_Publik_Melda.pdf</span>
                            <span className="text-[9px] text-slate-400 font-mono">2.4 MB • Diunduh</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-slate-400 block font-sans">Similarity</span>
                          <span className="text-xs font-bold text-red-600 bg-red-100/60 px-1.5 py-0.5 rounded font-mono">14%</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-105/50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FileText size={18} className="text-indigo-600" />
                          <div className="min-w-0">
                            <span className="block font-semibold text-xs text-slate-800 truncate max-w-[150px]">Bab1_Tesis_Dokumen_Final.docx</span>
                            <span className="text-[9px] text-slate-400 font-mono">1.1 MB • Diunduh</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-slate-400 block">Similarity</span>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded font-mono">6%</span>
                        </div>
                      </div>
                    </div>

                    {/* Quality info snippet */}
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-inner space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold font-display">
                        <Sparkles size={13} /> AI Parafrase Aktif
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        "Terima naskah asli dari anda, kami bersihkan struktur plagiatnya untuk indeks kelolosan Turnitin terbaik kampus."
                      </p>
                    </div>

                  </div>

                </div>
              </div>

            </div>
          </section>

          {/* Section "Mengapa Memilih Kami?" */}
          <section className="bg-white py-16 border-t border-b border-slate-200/50">
            <div className="max-w-7xl mx-auto px-6">
              
              <div className="text-center max-w-xl mx-auto space-y-2 mb-12">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider font-display block">KEUNGGULAN LAYANAN</span>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-950 tracking-tight leading-tight">
                  Mengapa Memilih Kami?
                </h2>
                <p className="text-slate-500 text-sm">
                  Keunggulan layanan pengecekan plagiarisme kami yang dirancang khusus untuk mahasiswa dan peneliti.
                </p>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. Terpercaya */}
                <div className="bg-slate-50 hover:bg-white rounded-2xl p-6 border border-slate-100/80 hover:border-indigo-100 shadow-2xs hover:shadow-md transition duration-200 group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition duration-200">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="font-display font-bold text-slate-800 text-sm mb-2">Terpercaya</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Menggunakan sistem Turnitin resmi dan no-repository sehingga data naskah Anda sama sekali tidak terekam dalam pangkalan data global.
                  </p>
                </div>

                {/* 2. Cepat */}
                <div className="bg-slate-50 hover:bg-white rounded-2xl p-6 border border-slate-100/80 hover:border-indigo-100 shadow-2xs hover:shadow-md transition duration-200 group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition duration-200">
                    <Zap size={20} />
                  </div>
                  <h3 className="font-display font-bold text-slate-800 text-sm mb-2">Cepat</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Kami menghargai tenggat waktu Anda. Unggahan file naskah Anda diproses dalam hitungan menit (rata-rata 5-15 menit).
                  </p>
                </div>

                {/* 3. Profesional */}
                <div className="bg-slate-50 hover:bg-white rounded-2xl p-6 border border-slate-100/80 hover:border-indigo-100 shadow-2xs hover:shadow-md transition duration-200 group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition duration-200">
                    <Award size={20} />
                  </div>
                  <h3 className="font-display font-bold text-slate-800 text-sm mb-2">Profesional</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tim administrator dan asisten AI kami yang berpengalaman siap mendampingi kebutuhan bimbingan penulisan Anda kapan pun diperlukan.
                  </p>
                </div>

                {/* 4. Akurat */}
                <div className="bg-slate-50 hover:bg-white rounded-2xl p-6 border border-slate-100/80 hover:border-indigo-100 shadow-2xs hover:shadow-md transition duration-200 group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition duration-200">
                    <Target size={20} />
                  </div>
                  <h3 className="font-display font-bold text-slate-800 text-sm mb-2">Akurat</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Pencocokan plagiarisme menyeluruh terhadap ribuan database buku ilmiah, publikasi, dan internet untuk laporan yang presisi.
                  </p>
                </div>

              </div>

            </div>
          </section>

          {/* Section "Cara Kerja" */}
          <section className="bg-slate-50/50 py-16">
            <div className="max-w-7xl mx-auto px-6">
              
              <div className="text-center max-w-xl mx-auto space-y-2 mb-12">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider font-display block">PANDUAN SISTEM</span>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-950 tracking-tight leading-tight">
                  Cara Kerja
                </h2>
                <p className="text-slate-500 text-sm">
                  Langkah mudah untuk mengecek plagiarisme dokumen Anda dengan sistem terpadu kami.
                </p>
              </div>

              {/* 4 Vertical Timeline Steps Columns */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                
                {/* 01 Daftar Akun */}
                <div className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-2xs relative">
                  <div className="absolute -top-4 -left-3 bg-indigo-600 text-white text-xs font-mono font-bold px-3 py-1 rounded-lg">
                    01
                  </div>
                  <h3 className="font-display font-bold text-slate-800 text-sm mb-2 mt-2">Daftar Akun</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Buat akun dengan nama lengkap dan nomor WhatsApp untuk memonitor riwayat kiriman naskah berkala.
                  </p>
                </div>

                {/* 02 Upload Dokumen */}
                <div className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-2xs relative">
                  <div className="absolute -top-4 -left-3 bg-indigo-600 text-white text-xs font-mono font-bold px-3 py-1 rounded-lg">
                    02
                  </div>
                  <h3 className="font-display font-bold text-slate-800 text-sm mb-2 mt-2">Upload Dokumen</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Unggah file PDF atau DOCX yang ingin dicek keamanannya langsung melalui panel kendali pengguna.
                  </p>
                </div>

                {/* 03 Tunggu Proses */}
                <div className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-2xs relative">
                  <div className="absolute -top-4 -left-3 bg-indigo-600 text-white text-xs font-mono font-bold px-3 py-1 rounded-lg">
                    03
                  </div>
                  <h3 className="font-display font-bold text-slate-800 text-sm mb-2 mt-2">Tunggu Proses</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Tim kami bersama dengan sistem Turnitin otomatis akan memproses struktur dan isi materi dokumen secara mendalam.
                  </p>
                </div>

                {/* 04 Download Hasil */}
                <div className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-2xs relative">
                  <div className="absolute -top-4 -left-3 bg-indigo-600 text-white text-xs font-mono font-bold px-3 py-1 rounded-lg">
                    04
                  </div>
                  <h3 className="font-display font-bold text-slate-800 text-sm mb-2 mt-2">Download Hasil</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Unduh file PDF hasil pengecekan plagiarisme beserta highlight visual kalimat plagiat yang interaktif.
                  </p>
                </div>

              </div>

            </div>
          </section>

          {/* Section "Siap Memulai?" */}
          <section className="bg-indigo-950 text-white py-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-radial from-indigo-900 via-indigo-950 to-slate-950 opacity-90"></div>
            <div className="max-w-7xl mx-auto px-6 relative z-10 text-center space-y-6">
              
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
                Siap Memulai?
              </h2>
              <p className="text-slate-300 md:text-sm max-w-lg mx-auto font-sans leading-relaxed">
                Daftar sekarang dan cek plagiarisme dokumen Anda dengan aman, profesional, dan cepat! Manfaatkan asisten chatbot kecerdasan buatan terpadu untuk hasil maksimal.
              </p>
              
              <div className="pt-2">
                <button 
                  onClick={() => setCurrentView("register")}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-8 py-4 rounded-xl shadow-lg transition duration-150 transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-2"
                >
                  Daftar Gratis <UserPlus size={15} />
                </button>
              </div>

            </div>
          </section>

          {/* Footer */}
          <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
              
              <QueenLogo size={32} />

              <div className="text-xs text-center md:text-right font-sans">
                <p>{`© 2026 Queen Similarity Check - Queen Similarity Check.`}</p>
                <p className="text-slate-500 mt-1">Layanan Pengecekan Plagiarisme Profesional & Modern</p>
              </div>

            </div>
          </footer>

        </div>
      )}


      {/* -------------------- VIEW 2 & REGISTER: AUTH MODALS -------------------- */}
      {(currentView === "login" || currentView === "register") && (
        <div className="min-h-screen flex flex-col lg:flex-row bg-slate-100">
          
          {/* Back button link absolute left top */}
          <div className="p-6 absolute left-0 top-0">
            <button 
              onClick={() => setCurrentView("landing")}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl px-4 py-2.5 transition duration-150 shadow-2xs group cursor-pointer"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition" /> 
              Kembali ke Beranda
            </button>
          </div>

          {/* Left panel: Info visual context (hidden on mobile) */}
          <div className="hidden lg:flex w-full lg:w-1/2 bg-slate-900 text-white relative items-center justify-center p-12 overflow-hidden">
            <div className="absolute inset-0 bg-radial from-indigo-900/40 via-indigo-950 to-slate-950 z-0"></div>
            
            <div className="max-w-md space-y-6 relative z-10 text-center">
              <div className="flex justify-center mx-auto mb-2">
                <QueenLogo size={74} showText={false} />
              </div>
              <div className="space-y-2">
                <h2 className="font-display font-bold text-3xl">Queen Similarity Check</h2>
                <div className="h-0.5 w-16 bg-gradient-to-r from-indigo-500 to-indigo-300 mx-auto rounded"></div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Platform perlindungan karya tulis ilmiah terpercaya. Membandingkan kecocokan sumber tanpa menyimpan dokumen Anda di database Turnitin manapun.
              </p>
              
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl max-w-sm mx-auto flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">No-Repository Premium</span>
                  <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">Bebas dari resiko naskah terdeteksi ganda saat pengecekan ulang.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Login or Signup form */}
          <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 space-y-6">
              
              {/* Logo block */}
              <div className="text-center space-y-2">
                <div className="flex justify-center mx-auto mb-2">
                  <QueenLogo size={56} showText={false} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-900">
                    {currentView === "login" ? "Masuk" : "Daftar Akun Baru"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentView === "login" 
                      ? "Masuk ke akun Anda untuk melanjutkan" 
                      : "Buat akun gratis Anda hanya dalam waktu 1 menit"
                    }
                  </p>
                </div>
              </div>

              {authError && (
                <div className="bg-rose-50 text-rose-800 text-xs px-4 py-2.5 rounded-xl border border-rose-100 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Form elements */}
              {currentView === "login" ? (
                // login form
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 block">USERNAME</label>
                    <input
                      type="text"
                      className="w-full text-slate-800 text-sm border border-slate-200 rounded-xl px-4 py-3 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                      placeholder="Masukkan username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-500 block">PASSWORD</label>
                      <a href="#" className="text-[10px] text-indigo-600 hover:underline">Sandi Lupa?</a>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        className="w-full text-slate-800 text-sm border border-slate-200 rounded-xl pl-4 pr-10 py-3 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                        placeholder="Masukkan password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                      <Eye size={16} className="absolute right-3.5 top-3.5 text-slate-400" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition duration-150 shadow-xs hover:shadow-md cursor-pointer text-xs"
                  >
                    Masuk
                  </button>
                </form>
              ) : (
                // register form
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 block">NAMA LENGKAP</label>
                    <input
                      type="text"
                      className="w-full text-slate-800 text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                      placeholder="Masukkan nama lengkap Anda"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 block">NOMOR WHATSAPP</label>
                    <input
                      type="tel"
                      className="w-full text-slate-800 text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                      placeholder="Contoh: 082261858077"
                      value={registerWhatsApp}
                      onChange={(e) => setRegisterWhatsApp(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 block">EMAIL (OPSIONAL)</label>
                    <input
                      type="email"
                      className="w-full text-slate-800 text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                      placeholder="Masukkan email Anda"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 block">MASUKKAN USERNAME</label>
                    <input
                      type="text"
                      className="w-full text-slate-800 text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                      placeholder="Pilih nama username unik"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 block">PASSWORD UNTUK LOGIN</label>
                    <input
                      type="password"
                      className="w-full text-slate-800 text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                      placeholder="Buat password masuk Anda"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition duration-150 shadow-xs hover:shadow-md cursor-pointer text-xs"
                  >
                    Daftar Sekarang
                  </button>
                </form>
              )}

              {/* Login/register switcher footer */}
              <div className="text-center pt-3 border-t border-slate-100 text-xs">
                {currentView === "login" ? (
                  <p className="text-slate-500 font-sans">
                    Belum punya akun?{" "}
                    <button 
                      onClick={() => setCurrentView("register")}
                      className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                    >
                      Daftar gratis sekarang
                    </button>
                  </p>
                ) : (
                  <p className="text-slate-500 font-sans">
                    Sudah punya akun?{" "}
                    <button 
                      onClick={() => setCurrentView("login")}
                      className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                    >
                      Masuk sekarang
                    </button>
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* -------------------- VIEW 3: DASHBOARD PENGGUNA -------------------- */}
      {currentView === "dashboard" && (
        <div id="customer-dashboard" className={`min-h-screen ${userProfile.role === "Pelanggan" ? "customer-light-theme bg-slate-50 text-slate-800" : "admin-light-theme bg-slate-50 text-slate-800"} flex flex-col font-sans relative overflow-x-hidden`}>
          {(userProfile.role === "Pelanggan" || userProfile.role === "Admin") && (
            <style dangerouslySetInnerHTML={{ __html: `
              /* Clean light theme for customer and admin view */
              .customer-light-theme,
              .admin-light-theme {
                background-color: #f8fafc !important; /* beautifully neat slate light background */
                background-image: radial-gradient(#cbd5e1 1px, transparent 1px) !important;
                background-size: 24px 24px !important;
                color: #1e293b !important;
              }

              /* Override specific backdrop overlays to make it polos bening transition */
              .customer-light-theme > .absolute.inset-0,
              .customer-light-theme > .absolute,
              .admin-light-theme > .absolute.inset-0,
              .admin-light-theme > .absolute {
                display: none !important;
              }
              
              /* Top navbar */
              .customer-light-theme header,
              .admin-light-theme header {
                background-color: #ffffff !important;
                border-bottom: 1px solid #e2e8f0 !important;
                color: #0f172a !important;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05) !important;
              }
              
              /* Sidebar */
              .customer-light-theme aside,
              .admin-light-theme aside {
                background-color: #ffffff !important;
                border-right: 1px solid #e2e8f0 !important;
              }
              .customer-light-theme aside button,
              .admin-light-theme aside button {
                color: #475569 !important;
              }
              .customer-light-theme aside button:hover,
              .admin-light-theme aside button:hover {
                background-color: #f1f5f9 !important;
                color: #0f172a !important;
              }
              .customer-light-theme aside button.text-white,
              .admin-light-theme aside button.text-white {
                background-color: #e2e8f0 !important;
                color: #0f172a !important;
              }
              .customer-light-theme aside [class*="bg-[#070B18]"],
              .admin-light-theme aside [class*="bg-[#070B18]"] {
                background-color: #f8fafc !important;
                border-top: 1px solid #e2e8f0 !important;
              }
              .customer-light-theme aside [class*="text-slate-300"],
              .admin-light-theme aside [class*="text-slate-300"] {
                color: #334155 !important;
              }
              
              /* 100% Bulletproof Tailwind card selector mapping via attributes */
              .customer-light-theme [class*="bg-[#0A1128]"],
              .admin-light-theme [class*="bg-[#0A1128]"],
              .customer-light-theme [class*="bg-[#090D1A]"],
              .admin-light-theme [class*="bg-[#090D1A]"],
              .customer-light-theme [class*="bg-[#0A0F1D]"],
              .admin-light-theme [class*="bg-[#0A0F1D]"],
              .customer-light-theme [class*="bg-[#0B0F19]"],
              .admin-light-theme [class*="bg-[#0B0F19]"],
              .customer-light-theme [class*="bg-[#080C16]"],
              .admin-light-theme [class*="bg-[#080C16]"],
              .customer-light-theme [class*="bg-black/30"],
              .admin-light-theme [class*="bg-black/30"],
              .customer-light-theme [class*="bg-slate-900"],
              .admin-light-theme [class*="bg-slate-900"],
              .customer-light-theme [class*="bg-slate-950"],
              .admin-light-theme [class*="bg-slate-950"],
              .customer-light-theme [class*="bg-slate-950/60"],
              .admin-light-theme [class*="bg-slate-950/60"],
              .customer-light-theme [class*="bg-[#0F172A]"],
              .admin-light-theme [class*="bg-[#0F172A]"] {
                background-color: #ffffff !important;
                border: 1px solid #e2e8f0 !important;
                box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04) !important;
                background-image: none !important;
              }

              .customer-light-theme [class*="border-indigo-950"],
              .admin-light-theme [class*="border-indigo-950"],
              .customer-light-theme [class*="border-slate-800"],
              .admin-light-theme [class*="border-slate-800"] {
                border-color: #e2e8f0 !important;
              }
              
              /* Card headers & texts colors */
              .customer-light-theme [class*="text-slate-100"],
              .admin-light-theme [class*="text-slate-100"],
              .customer-light-theme [class*="text-slate-200"],
              .admin-light-theme [class*="text-slate-200"],
              .customer-light-theme [class*="text-slate-350"],
              .admin-light-theme [class*="text-slate-350"],
              .customer-light-theme [class*="text-white"],
              .admin-light-theme [class*="text-white"],
              .customer-light-theme .text-slate-200,
              .admin-light-theme .text-slate-200,
              .customer-light-theme .text-slate-100,
              .admin-light-theme .text-slate-100 {
                color: #0f172a !important;
              }
              
              /* Specific text rules in boxes (slate grey values) */
              .customer-light-theme [class*="text-slate-300"],
              .admin-light-theme [class*="text-slate-300"],
              .customer-light-theme [class*="text-slate-450"],
              .admin-light-theme [class*="text-slate-450"],
              .customer-light-theme p,
              .admin-light-theme p,
              .customer-light-theme .text-slate-400,
              .admin-light-theme .text-slate-400,
              .customer-light-theme .text-slate-450,
              .admin-light-theme .text-slate-450,
              .customer-light-theme .text-slate-350,
              .admin-light-theme .text-slate-350,
              .customer-light-theme .text-slate-300,
              .admin-light-theme .text-slate-300 {
                color: #475569 !important;
              }
              .customer-light-theme [class*="text-slate-400"]:not(h1, h2, h3, h4, font-bold, strong),
              .admin-light-theme [class*="text-slate-400"]:not(h1, h2, h3, h4, font-bold, strong),
              .customer-light-theme [class*="text-slate-500"]:not(h1, h2, h3, h4, font-bold, strong),
              .admin-light-theme [class*="text-slate-500"]:not(h1, h2, h3, h4, font-bold, strong) {
                color: #64748b !important;
              }
              
              /* Stat highlights & headers */
              .customer-light-theme [class*="text-indigo-400"],
              .admin-light-theme [class*="text-indigo-400"],
              .customer-light-theme [class*="text-indigo-500"],
              .admin-light-theme [class*="text-indigo-500"] {
                color: #4f46e5 !important; /* Elegant Indigo-600 */
              }
              .customer-light-theme [class*="text-cyan-400"],
              .admin-light-theme [class*="text-cyan-400"],
              .customer-light-theme [class*="text-cyan-500"],
              .admin-light-theme [class*="text-cyan-500"],
              .customer-light-theme [class*="text-[#00E5FF]"],
              .admin-light-theme [class*="text-[#00E5FF]"] {
                color: #0891b2 !important; /* Elegant Cyan-600 / Dark teal */
              }
              .customer-light-theme [class*="text-[#FF4560]"],
              .admin-light-theme [class*="text-[#FF4560]"] {
                color: #e11d48 !important; /* Rose-600 */
              }
              
              /* Avoid overriding white text inside Solid Buttons/Badges */
              .customer-light-theme [class*="bg-indigo-600"] *,
              .admin-light-theme [class*="bg-indigo-600"] *,
              .customer-light-theme [class*="bg-blue-600"] *,
              .admin-light-theme [class*="bg-blue-600"] *,
              .customer-light-theme button[class*="bg-gradient-to-r"] *,
              .admin-light-theme button[class*="bg-gradient-to-r"] *,
              .customer-light-theme button[class*="bg-gradient-to-r"],
              .admin-light-theme button[class*="bg-gradient-to-r"] {
                color: #ffffff !important;
              }
              
              /* Special formatting for specific orange button */
              .customer-light-theme button[class*="border-[#FF8C00]"],
              .admin-light-theme button[class*="border-[#FF8C00]"] {
                background-color: #fff7ed !important; /* Orange-50 */
                color: #c2410c !important; /* Orange-700 */
                border-color: #fdba74 !important; /* Orange-300 */
              }
              .customer-light-theme button[class*="border-[#FF8C00]"] *,
              .admin-light-theme button[class*="border-[#FF8C00]"] * {
                color: #c2410c !important;
              }
              
              /* Active navigation tab highlight */
              .customer-light-theme aside [class*="bg-[#1E3A8A]"],
              .admin-light-theme aside [class*="bg-[#1E3A8A]"] {
                background-color: #e0f2fe !important; /* light blue bg */
                color: #0369a1 !important; /* sky blue 700 */
                border-left-width: 4px !important;
                border-left-color: #0284c7 !important;
              }
              .customer-light-theme aside [class*="bg-[#1E3A8A]"] *,
              .admin-light-theme aside [class*="bg-[#1E3A8A]"] * {
                color: #0369a1 !important;
              }

              .admin-light-theme aside [class*="bg-rose-950"] {
                background-color: #ffe4e6 !important; /* Rose-100 */
                color: #be123c !important; /* Rose-700 */
                border-left-width: 4px !important;
                border-left-color: #e11d48 !important; /* Rose-600 */
              }
              .admin-light-theme aside [class*="bg-rose-950"] * {
                color: #be123c !important;
              }
              
              /* Reset filters badge colors in file items */
              .customer-light-theme [class*="bg-[#0A0F1D]/60"],
              .admin-light-theme [class*="bg-[#0A0F1D]/60"] {
                background-color: #f1f5f9 !important;
                color: #475569 !important;
                border: 1px solid #e2e8f0 !important;
              }
              
              /* AI Chat bot layout details */
              .customer-light-theme [class*="bg-[#080C16]/20"],
              .admin-light-theme [class*="bg-[#080C16]/20"] {
                background-color: #f8fafc !important;
              }
              .customer-light-theme [class*="bg-[#080C16]/80"],
              .admin-light-theme [class*="bg-[#080C16]/80"] {
                background-color: #ffffff !important;
                border-bottom: 1px solid #e2e8f0 !important;
              }
              .customer-light-theme [class*="bg-[#080C16]/90"],
              .admin-light-theme [class*="bg-[#080C16]/90"] {
                background-color: #ffffff !important;
                border-top: 1px solid #e2e8f0 !important;
              }
              .customer-light-theme [class*="bg-[#0F172A]/90"],
              .admin-light-theme [class*="bg-[#0F172A]/90"] {
                background-color: #f1f5f9 !important;
                border: 1px solid #e2e8f0 !important;
                color: #1e293b !important;
              }
              .customer-light-theme [class*="bg-[#0F172A]/85"],
              .admin-light-theme [class*="bg-[#0F172A]/85"] {
                background-color: #ffffff !important;
                border: 1px solid #e2e8f0 !important;
                color: #475569 !important;
              }
              .customer-light-theme [class*="bg-[#0F172A]/85"]:hover,
              .admin-light-theme [class*="bg-[#0F172A]/85"]:hover {
                background-color: #f1f5f9 !important;
                color: #0f172a !important;
              }
              
              /* Input overrides in search & details */
              .customer-light-theme [class*="bg-[#0F172A]/80"],
              .admin-light-theme [class*="bg-[#0F172A]/80"] {
                background-color: #ffffff !important;
                border: 1px solid #cbd5e1 !important;
                color: #1e293b !important;
                box-shadow: inset 0 1px 2px rgba(0,0,0,0.03) !important;
              }
              
              /* Status/Stat cards */
              .customer-light-theme main .grid > div,
              .admin-light-theme main .grid > div {
                background-color: #ffffff !important;
                border: 1px solid #e2e8f0 !important;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05) !important;
              }
              .customer-light-theme main .grid > div span,
              .admin-light-theme main .grid > div span,
              .customer-light-theme main .grid > div div,
              .admin-light-theme main .grid > div div {
                color: #1e293b !important;
              }
              .customer-light-theme main .grid > div span[class*="text-emerald-400"],
              .admin-light-theme main .grid > div span[class*="text-emerald-400"] {
                color: #059669 !important;
              }
              .customer-light-theme main .grid > div span[class*="text-rose-400"],
              .admin-light-theme main .grid > div span[class*="text-rose-400"] {
                color: #dc2626 !important;
              }
              .customer-light-theme main .grid > div span[class*="text-amber-400"],
              .admin-light-theme main .grid > div span[class*="text-amber-400"] {
                color: #d97706 !important;
              }
              
              /* Files Table and inputs inside body contents */
              .customer-light-theme table,
              .admin-light-theme table {
                border-collapse: collapse !important;
              }
              .customer-light-theme thead,
              .admin-light-theme thead {
                background-color: #f8fafc !important;
                color: #475569 !important;
                border-bottom: 2px solid #e2e8f0 !important;
              }
              .customer-light-theme thead th,
              .admin-light-theme thead th {
                color: #475569 !important;
                font-weight: 750 !important;
                border-bottom: 2px solid #e2e8f0 !important;
              }
              .customer-light-theme table tr,
              .admin-light-theme table tr {
                border-bottom: 1px solid #f1f5f9 !important;
              }
              .customer-light-theme table tr:hover,
              .admin-light-theme table tr:hover {
                background-color: #f8fafc !important;
              }
              .customer-light-theme table td,
              .admin-light-theme table td {
                color: #334155 !important;
              }
              .customer-light-theme table td span.text-emerald-400,
              .admin-light-theme table td span.text-emerald-400 {
                color: #10b981 !important;
              }
              .customer-light-theme table td span.text-amber-400,
              .admin-light-theme table td span.text-amber-400 {
                color: #f59e0b !important;
              }
              .customer-light-theme table td span.text-red-400,
              .admin-light-theme table td span.text-red-400 {
                color: #ef4444 !important;
              }
              .customer-light-theme table td .text-slate-100,
              .admin-light-theme table td .text-slate-100 {
                color: #0f172a !important;
              }
              .customer-light-theme table td .text-slate-400,
              .admin-light-theme table td .text-slate-400 {
                color: #64748b !important;
              }
              
              /* Headings/titles */
              .customer-light-theme h1,
              .admin-light-theme h1,
              .customer-light-theme h2,
              .admin-light-theme h2,
              .customer-light-theme h3,
              .admin-light-theme h3,
              .customer-light-theme h4,
              .admin-light-theme h4,
              .customer-light-theme h5,
              .admin-light-theme h5,
              .customer-light-theme h6,
              .admin-light-theme h6,
              .customer-light-theme h2.text-white,
              .admin-light-theme h2.text-white,
              .customer-light-theme strong,
              .admin-light-theme strong,
              .customer-light-theme font-bold,
              .admin-light-theme font-bold {
                color: #0f172a !important;
              }
              
              /* Forms elements */
              .customer-light-theme input,
              .admin-light-theme input,
              .customer-light-theme select,
              .admin-light-theme select {
                background-color: #ffffff !important;
                color: #1e293b !important;
                border: 1px solid #cbd5e1 !important;
              }
              .customer-light-theme ::placeholder,
              .admin-light-theme ::placeholder {
                color: #94a3b8 !important;
              }
            ` }} />
          )}
          {/* Cosmic Galaxy Backdrop styling with light blurs */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0C152E]/50 via-[#040815] to-[#010206] z-0 pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />
          <div className="absolute top-[5%] right-[10%] w-[45%] h-[40%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[10%] left-[5%] w-[45%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
 
          {/* 1. TOP NAVBAR HEADER (Unified wide across screen) */}
          <header className="relative z-20 w-full bg-[#0B0F19]/45 backdrop-blur-lg border-b border-indigo-950/40 h-16 flex items-center justify-between px-6 shrink-0 shadow-lg shadow-indigo-950/10">
            <div className="flex items-center gap-3">
              <QueenLogo size={36} />
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-slate-300 hidden sm:inline">
                Halo, <span className="text-indigo-400 font-bold">{userProfile.fullName}</span>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/25 text-red-400 transition cursor-pointer"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          </header>
 
          {/* 2. BODY CONTENT AREA IN SPLIT COLUMNS */}
          <div className="relative z-10 flex flex-col lg:flex-row flex-1">
            
            {/* Left Sidebar Menu */}
            <aside className="w-full lg:w-64 bg-[#080C16]/50 backdrop-blur-lg text-slate-300 shrink-0 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-indigo-950/40">
              <div className="flex-1 flex flex-col">
                <nav className="p-4 space-y-1.5 font-sans">
                  
                  {/* Tab 1: list files */}
                  <button
                    onClick={() => setDashboardTab("list-file")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition duration-150 cursor-pointer ${
                      dashboardTab === "list-file"
                        ? "bg-[#1E3A8A]/50 text-white border-l-4 border-blue-400 shadow-sm shadow-blue-500/10"
                        : "text-slate-400 hover:bg-[#111827]/60 hover:text-white"
                    }`}
                  >
                    <FileText size={16} className={dashboardTab === "list-file" ? "text-blue-400" : "text-slate-400"} /> 
                    <span>List File</span>
                  </button>

                  {/* Tab 2: AI Chatbot */}
                  <button
                    onClick={() => setDashboardTab("ai-chatbot")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition duration-150 cursor-pointer ${
                      dashboardTab === "ai-chatbot"
                        ? "bg-[#1E3A8A]/50 text-white border-l-4 border-blue-400 shadow-sm shadow-blue-500/10"
                        : "text-slate-400 hover:bg-[#111827]/60 hover:text-white"
                    }`}
                  >
                    <Sparkles size={16} className={dashboardTab === "ai-chatbot" ? "text-blue-400" : "text-slate-400"} /> 
                    <span>AI Chatbot</span>
                  </button>

                  {/* Tab 3: Profil */}
                  <button
                    onClick={() => setDashboardTab("profil")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition duration-150 cursor-pointer ${
                      dashboardTab === "profil"
                        ? "bg-[#1E3A8A]/50 text-white border-l-4 border-blue-400 shadow-sm shadow-blue-500/10"
                        : "text-slate-400 hover:bg-[#111827]/60 hover:text-white"
                    }`}
                  >
                    <User size={16} className={dashboardTab === "profil" ? "text-blue-400" : "text-slate-400"} /> 
                    <span>Profil</span>
                  </button>

                  {/* Tab 4: Layanan Tambahan Storefront (Visible to Customers) */}
                  {userProfile.role !== "Admin" && (
                    <button
                      onClick={() => setDashboardTab("extra-services")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition duration-150 cursor-pointer ${
                        dashboardTab === "extra-services"
                          ? "bg-[#1E3A8A]/50 text-white border-l-4 border-blue-400 shadow-sm shadow-blue-500/10"
                          : "text-slate-400 hover:bg-[#111827]/60 hover:text-white"
                      }`}
                    >
                      <Award size={16} className={dashboardTab === "extra-services" ? "text-amber-400" : "text-amber-500/75"} /> 
                      <span>Layanan Tambahan</span>
                    </button>
                  )}

                  {/* Tab 5: Workspace Admin (Visible to Admin Only) */}
                  {userProfile.role === "Admin" && (
                    <button
                      onClick={() => setDashboardTab("workspace-admin")}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition duration-150 cursor-pointer ${
                        dashboardTab === "workspace-admin"
                          ? "bg-rose-950/50 text-rose-200 border-l-4 border-rose-500 shadow-md shadow-rose-900/10"
                          : "text-slate-400 hover:bg-[#111827]/60 hover:text-white"
                      }`}
                    >
                      <LockKeyhole size={16} className="text-rose-400" /> 
                      <span>Workspace Admin 🔑</span>
                    </button>
                  )}

                </nav>
              </div>

              {/* Sidebar bottom indicator labels & Status Legend - Styled elegantly like screenshot! */}
              <div className="p-5 border-t border-indigo-950/70 bg-[#070B18]/50">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Keterangan Status</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] flex shrink-0"></span>
                    <span className="font-semibold text-emerald-400">Selesai</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] flex shrink-0 animate-pulse"></span>
                    <span className="font-semibold text-amber-400">Memproses</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] flex shrink-0"></span>
                    <span className="font-semibold text-red-400">Gagal</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main content viewport */}
            <main className="flex-1 p-6 md:p-8 space-y-6 overflow-x-hidden bg-transparent">
            
              {/* 1. PESAN DARI ADMIN WIDGET (Frosted card with glowing cyan accents) */}
              <section className="bg-[#0A1128]/70 backdrop-blur-md border border-[#00E5FF]/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-2.5 mb-4 text-[#00E5FF]">
                  <Bell size={16} className="animate-bounce" />
                  <span className="text-[11px] font-bold tracking-wider uppercase font-sans">Pesan dari Admin</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  <div className="md:col-span-8 space-y-3">
                    <h4 className="font-bold text-slate-200 text-xs">𝗣𝗲𝘀𝗮𝗻 𝗣𝗲𝗻𝘁𝗶𝗻𝗴 📄</h4>
                    <p className="text-xs text-slate-350 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                      {adminAnnouncement}
                    </p>
                  </div>
                  
                  <div className="md:col-span-4 bg-black/30 p-4 rounded-xl border border-indigo-950/40 space-y-3.5 flex flex-col justify-between h-full">
                    <div className="space-y-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 font-bold block mb-0.5">JAM KERJA ⏰</span>
                        <span className="text-slate-200 font-semibold font-mono text-[11px]">{workingHours}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block mb-0.5">STATUS PORTAL 💡</span>
                        <span className={isUploadLocked ? "text-amber-400 font-bold animate-pulse text-[11px]" : "text-[#00E5FF] font-semibold text-[11px]"}>
                          {isUploadLocked ? "Tutup Sementara (Upload Locked)" : "Queen Similarity Check Aktif"}
                        </span>
                      </div>
                    </div>
                    <a 
                      href="https://wa.me/6282261858077"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 bg-gradient-to-r from-teal-400 via-[#00E5FF] to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 duration-150 shadow-md shadow-[#00E5FF]/10 cursor-pointer text-center transition-all"
                    >
                      🚀 Group WhatsApp
                    </a>
                  </div>
                </div>
              </section>

              {/* 2. STATISTIK AKUN HORIZONTAL GRIDS (Matching screenshot dark bars!) */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Kredit Tersisa Card */}
                <div className="bg-[#090D1A]/50 backdrop-blur-md border border-indigo-500/10 rounded-2xl p-5 text-center shadow-lg hover:border-indigo-500/30 transition duration-200">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block mb-2 font-mono">
                    STATUS PAKET AKUN
                  </span>
                  <div className="text-4xl font-extrabold text-white tracking-tight font-mono my-2 drop-shadow-[0_0_12px_rgba(129,140,248,0.2)]">
                    {userProfile.kreditSisa}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                    KREDIT PELANGGAN TERSISA
                  </span>
                </div>

                {/* Upload Harian Card */}
                <div className="bg-[#090D1A]/50 backdrop-blur-md border border-indigo-500/10 rounded-2xl p-5 text-center shadow-lg hover:border-indigo-500/30 transition duration-200 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-cyan-405 text-cyan-400 font-bold uppercase tracking-widest block mb-2 font-mono">
                      JUMLAH UPLOAD HARIAN
                    </span>
                    <div className="text-4xl font-extrabold text-white tracking-tight font-mono my-2 drop-shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                      {userProfile.uploadHarianSisa}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans block">
                      DAILY UPLOAD TERSISA
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 italic mt-3 font-medium font-sans">
                    Jatah upload harian Anda akan reset otomatis pada pukul 00:00 (Asia/Makassar).
                  </p>
                </div>

              </section>

              {/* 3. WELCOME TITLE AREA */}
              <div className="pt-4 pb-1">
                <h2 className="text-2xl font-extrabold text-white tracking-tight leading-none">
                  Selamat Datang, {userProfile.fullName}!
                </h2>
                <p className="text-xs text-slate-400 mt-2 font-medium">
                  Kelola file plagiarisme Anda di sini
                </p>
              </div>

              {/* 4. FOUR STATS HIGHLIGHT GRID (Total Dokumen, Selesai, Gagal, Memproses) */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Total Dokumen */}
                <div className="bg-[#0A0F1D]/55 backdrop-blur-md border border-slate-900 rounded-2xl p-5 shadow-inner flex flex-col justify-between h-24 hover:border-slate-800/80 transition cursor-default">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">TOTAL DOKUMEN</span>
                  <span className="text-2xl font-black text-white font-mono">{totalCount}</span>
                </div>

                {/* Selesai */}
                <div className="bg-[#0A0F1D]/55 backdrop-blur-md border border-slate-900 rounded-2xl p-5 shadow-inner flex flex-col justify-between h-24 hover:border-slate-800/80 transition cursor-default">
                  <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider block">SELESAI</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">{selesaiCount}</span>
                </div>

                {/* Gagal */}
                <div className="bg-[#0A0F1D]/55 backdrop-blur-md border border-slate-900 rounded-2xl p-5 shadow-inner flex flex-col justify-between h-24 hover:border-slate-800/80 transition cursor-default">
                  <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wider block">GAGAL</span>
                  <span className="text-2xl font-black text-rose-400 font-mono">{gagalCount}</span>
                </div>

                {/* Memproses */}
                <div className="bg-[#0A0F1D]/55 backdrop-blur-md border border-slate-900 rounded-2xl p-5 shadow-inner flex flex-col justify-between h-24 hover:border-slate-800/80 transition cursor-default">
                  <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider block">MEMPROSES</span>
                  <span className="text-2xl font-black text-amber-500 font-mono">{memprosesCount}</span>
                </div>

              </section>

              {/* TAB-SWITCHED PANELS */}

              {/* TAB PANEL 1: DAFTAR FILE (FILE LIST) */}
              {dashboardTab === "list-file" && (
              <div className="bg-[#0B0F19]/60 backdrop-blur-md rounded-2xl border border-indigo-950/60 shadow-xl flex flex-col min-h-[320px] overflow-hidden">
                
                {/* Search & Actions Area top */}
                {isUploadLocked && userProfile.role !== "Admin" && (
                  <div className="mx-6 mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-xs flex items-center gap-3">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <strong className="block text-amber-300">Hubungi Admin: Layanan Upload Dikunci</strong>
                      <span>Layanan pengunggahan berkas baru sedang dinonaktifkan sementara waktu oleh Admin Kak Melda. Harap tunggu hingga jam operasional aktif kembali atau hubungi WhatsApp Admin.</span>
                    </div>
                  </div>
                )}

                <div className="p-6 border-b border-indigo-950/65 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      Daftar File <span className="text-xs font-normal text-slate-400 ml-2">(Sudah Anda upload)</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-tight mt-1">
                      Pantau progress dan unduh laporan keaslian Turnitin no-repository di sini.
                    </p>
                  </div>

                  {/* Operational actions buttons & search */}
                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search size={16} className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Cari file..." 
                        className="pl-10 pr-4 py-2 bg-[#0F172A]/80 border border-indigo-950 rounded-lg text-xs w-full sm:w-48 focus:ring-2 focus:ring-indigo-500 text-slate-100 placeholder-slate-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={() => {
                        if (isUploadLocked && userProfile.role !== "Admin") {
                          alert("Pemberitahuan: Layanan pengunggahan berkas sedang dinonaktifkan sementara waktu oleh Admin Kak Melda. Silakan hubungi WhatsApp Admin / tunggu jam kerja.");
                          return;
                        }
                        setIsUploadOpen(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/10 cursor-pointer transition-colors"
                    >
                      Upload File
                    </button>
                    <button 
                      onClick={handleActivateCredits}
                      className="px-4 py-2 bg-[#FF8C00]/10 border border-[#FF8C00]/30 hover:bg-[#FF8C00]/20 text-white rounded-lg text-xs font-black transition duration-150 cursor-pointer shadow-sm shadow-[#FF8C00]/5 flex items-center gap-1.5"
                    >
                      <span>Aktifkan - Tambah Paket</span>
                    </button>
                  </div>

                </div>

                {/* Sub-bar for development helpers for consistency */}
                {userProfile.role === "Admin" && (
                  <div className="px-6 py-2.5 bg-[#080C16]/60 border-b border-indigo-950/40 flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={handleResetDemoData}
                      className="text-[10px] font-sans text-indigo-400 hover:text-indigo-300 font-bold bg-indigo-950/40 border border-indigo-500/10 px-2.5 py-1.5 rounded transition duration-150 cursor-pointer"
                    >
                      ⚙️ Reset Demo data
                    </button>
                    {files.length > 0 && (
                      <button
                        onClick={handleClearAllFiles}
                        className="text-[10px] font-sans text-rose-400 hover:text-rose-300 font-bold bg-rose-950/40 border border-rose-500/10 px-2.5 py-1.5 rounded transition duration-150 cursor-pointer"
                      >
                        Hapus Semua
                      </button>
                    )}
                  </div>
                )}

                {/* Master File Table lists */}
                <div className="overflow-x-auto flex-1">
                  {filteredFiles.length === 0 ? (
                    // ------------------ EMPTY STATE VIEW ------------------
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                      <div className="h-20 w-20 bg-indigo-950/30 rounded-full flex items-center justify-center mb-4 border border-indigo-950/40">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <p className="text-slate-400 font-medium mb-1">Belum ada file yang diupload</p>
                      <button 
                        onClick={() => {
                          if (isUploadLocked && userProfile.role !== "Admin") {
                            alert("Pemberitahuan: Layanan pengunggahan berkas sedang dinonaktifkan sementara waktu oleh Admin Kak Melda. Silakan hubungi WhatsApp Admin / tunggu jam kerja.");
                            return;
                          }
                          setIsUploadOpen(true);
                        }}
                        className="text-indigo-400 text-sm font-bold underline hover:text-indigo-300"
                      >
                        Upload File Pertama
                      </button>
                    </div>
                  ) : (
                    // Regular listing list
                    <table className="w-full text-left text-xs whitespace-nowrap overflow-x-auto divide-y divide-indigo-950/60">
                      
                      {/* Table table layout */}
                      <thead className="bg-[#080C16]/80 text-slate-400 text-[10px] tracking-wider uppercase font-extrabold font-mono border-b border-indigo-950/60">
                        <tr>
                          <th className="px-6 py-4">ID FILE</th>
                          <th className="px-6 py-4">JUDUL & PERNYATAAN</th>
                          <th className="px-6 py-4">TANGGAL UPLOAD</th>
                          <th className="px-6 py-4">UKURAN BERKAS</th>
                          <th className="px-6 py-4 text-center">STATUS</th>
                          <th className="px-6 py-4 text-right">AKSI LAPORAN</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-indigo-950/40 text-slate-300">
                        {filteredFiles.map((file) => {
                          const progress = processingProgress[file.id] || 0;
                          
                          return (
                            <tr key={file.id} className="hover:bg-[#1E3A8A]/10 transition duration-150">
                              
                              {/* File ID column */}
                              <td className="px-6 py-4 font-mono text-slate-400 font-semibold">{file.id}</td>
                              
                              {/* Title / filename info */}
                              <td className="px-6 py-4 max-w-xs sm:max-w-md truncate">
                                <span className="font-semibold text-slate-100 block truncate font-sans" title={file.title}>
                                  {file.title}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate font-mono mt-0.5 animate-pulse" title={file.filename}>
                                  📂 {file.filename}
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${file.checkType === "Turnitin-AI" ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" : "bg-blue-500/10 text-blue-300 border border-blue-500/20"}`}>
                                    {file.checkType === "Turnitin-AI" ? "🔬 Turnitin AI Check" : "📊 Similarity Check"}
                                  </span>
                                  {file.filters?.excludeBibliography && (
                                    <span className="bg-[#0A0F1D]/60 text-slate-400 border border-indigo-950 px-1.5 py-0.5 rounded text-[8px] font-bold">Exclude Bibliography</span>
                                  )}
                                  {file.filters?.excludeQuotes && (
                                    <span className="bg-[#0A0F1D]/60 text-slate-400 border border-indigo-950 px-1.5 py-0.5 rounded text-[8px] font-bold">Exclude Quotes</span>
                                  )}
                                  {file.filters?.excludeSmallSources && (
                                    <span className="bg-[#0A0F1D]/60 text-slate-400 border border-indigo-950 px-1.5 py-0.5 rounded text-[8px] font-bold">Exclude Small Sources</span>
                                  )}
                                </div>
                              </td>

                              {/* Upload Date */}
                              <td className="px-6 py-4 text-slate-300 font-medium">{file.uploadDate}</td>

                              {/* File Size */}
                              <td className="px-6 py-4 font-mono text-slate-400">{file.fileSize}</td>

                              {/* Document statuses columns */}
                              <td className="px-6 py-4">
                                <div className="flex flex-col items-center justify-center">
                                  {file.status === "Selesai" && (
                                    <span className="px-2.5 py-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1 shadow-2xs font-sans">
                                      <CheckCircle size={11} /> Selesai
                                    </span>
                                  )}
                                  
                                  {file.status === "Memproses" && (
                                    <span className="px-2.5 py-1 text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-1 animate-pulse font-sans">
                                      <RefreshCw size={10} className="animate-spin" /> Memproses
                                    </span>
                                  )}

                                  {file.status === "Gagal" && (
                                    <span className="px-2.5 py-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center gap-1 font-sans">
                                      <AlertCircle size={11} /> Gagal
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Actions detail link */}
                              <td className="px-6 py-4 text-right">
                                {file.status === "Selesai" ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="text-right mr-2 hidden sm:block">
                                      <span className="text-[9px] text-slate-400 block font-display leading-none">Turnitin Scan</span>
                                      <span className="font-mono font-bold text-xs text-rose-450 text-[#FF4560]">
                                        {file.similarityPercent}% Similarity
                                      </span>
                                    </div>
                                    <a
                                      href={file.reportUrl || `/api/view-report/${file.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download={`Hasil_Turnitin_${file.title.replace(/\s+/g, "_")}.pdf`}
                                      className="bg-indigo-600 text-white hover:bg-indigo-700 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition duration-150 cursor-pointer shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
                                    >
                                      📥 Download Hasil
                                    </a>
                                  </div>
                                ) : file.status === "Memproses" ? (
                                  <span className="text-[11px] font-sans text-slate-400 italic">Memindai database...</span>
                                ) : (
                                  <button
                                    onClick={() => alert(`Informasi Gagal:\n\n${file.feedback || "Dokumen rusak, hubungi admin."}`)}
                                    className="text-slate-400 hover:text-white text-[11px] font-medium border border-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-900 cursor-pointer transition duration-150"
                                  >
                                    Cek Detail Error
                                  </button>
                                )}
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>

                    </table>
                  )}
                </div>

              </div>
            )}

            {/* TAB PANEL 2: AI CHATBOT (INTEGRATION WITH SERVER ENDPOINTS) */}
            {dashboardTab === "ai-chatbot" && (
              <div className="animate-fade-in">
                <div className="mb-4">
                  <h3 className="font-display font-medium text-slate-900 text-sm">Asisten AI QueenBot</h3>
                  <p className="text-xs text-slate-400 mt-1">Menggunakan model Gemini 3.5 untuk memandu parafrase, konsultasi plagiarisme, bimbingan sitasi ilmiah.</p>
                </div>
                <AIChatbotView />
              </div>
            )}

            {/* TAB PANEL 3: USER PROFILE TAB */}
            {dashboardTab === "profil" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm max-w-xl animate-fade-in overflow-hidden">
                
                <div className="p-6 border-b border-slate-50">
                  <h3 className="font-bold text-slate-900 text-sm">Profil Akun Anda</h3>
                  <p className="text-xs text-slate-400 mt-1">Kelola rincian data pelanggan Queen Similarity Check</p>
                </div>

                <div className="p-6 space-y-6">
                  
                  {/* Profile main layout block */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                      <User size={30} />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider block">ID PELANGGAN VERIFIED</span>
                      <strong className="text-slate-900 text-sm block mt-1">{userProfile.fullName}</strong>
                      <span className="text-[11px] text-slate-400 block font-mono">Role: {userProfile.role}</span>
                    </div>
                  </div>

                  {/* Details grid lists */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                    <div className="bg-slate-50 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">NAMA USERNAME</span>
                      <span className="text-slate-800 font-medium font-mono block">{userProfile.username}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">NOMOR WHATSAPP</span>
                      <span className="text-slate-800 font-medium font-mono block">{userProfile.whatsapp}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">ALAMAT EMAIL</span>
                      <span className="text-slate-800 font-medium block">{userProfile.email}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">STATUS AKUN</span>
                      <span className="text-emerald-700 font-semibold inline-flex items-center gap-1 block">
                        ✔️ Aktif & Terdaftar
                      </span>
                    </div>
                  </div>

                  {/* Profile Edit Helpers action block */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => {
                        const newName = prompt("Ubah Nama Lengkap:", userProfile.fullName);
                        const newWhatsApp = prompt("Ubah Kontak WhatsApp:", userProfile.whatsapp);
                        if (newName || newWhatsApp) {
                          setUserProfile(prev => ({
                            ...prev,
                            fullName: newName ? newName.trim() : prev.fullName,
                            whatsapp: newWhatsApp ? newWhatsApp.trim() : prev.whatsapp
                          }));
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 bg-indigo-600 rounded-lg shadow-md transition-colors cursor-pointer"
                    >
                      Ubah Rincian Profil
                    </button>
                  </div>


                </div>

              </div>
            )}

            {/* TAB PANEL 4: EXTRA SERVICES (LAYANAN TAMBAHAN STOREFRONT) */}
            {dashboardTab === "extra-services" && (
              <div className="space-y-6 animate-fade-in font-sans">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">🛒 Hub Pengujian & Layanan Tambahan</h3>
                  <p className="text-xs text-slate-400 mt-1">Eksplorasi modul analisis Turnitin premium dan optimisasi naskah menggunakan saldo kredit Anda.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {extraTools.filter(t => t.isEnabled).map(tool => (
                    <div key={tool.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition">
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold">
                            {tool.id === "tool-1" ? "✨" : tool.id === "tool-2" ? "✍️" : "📚"}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full font-sans">
                            {tool.creditCost} Kredit
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs mb-1">{tool.name}</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-sans">{tool.description}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-4">
                        <button
                          onClick={() => {
                            // Find files owned by this customer with status Selesai or Memproses
                            const myFiles = files.filter(f => f.ownerEmail === userProfile.email || (!f.ownerEmail && userProfile.email === "meldakatriagirsang@gmail.com"));
                            if (myFiles.length === 0) {
                              alert("Anda belum mengunggah file apapun. Unggah file terlebih dahulu di tab 'Daftar File' sebelum mengaktifkan layanan tambahan.");
                              return;
                            }
                            if (userProfile.kreditSisa < tool.creditCost) {
                              alert(`Kredit Anda tidak mencukupi! Layanan ini membutuhkan ${tool.creditCost} kredit, sementara saldo Anda saat ini ${userProfile.kreditSisa} kredit. Silakan tambah paket kredit terlebih dahulu.`);
                              return;
                            }

                            // Let them select which file to apply to
                            const fileOptions = myFiles.map((f, idx) => `${idx + 1}. [${f.id}] ${f.title}`).join("\n");
                            const choice = prompt(`PILIH BERKAS:\n\nKetik nomor file yang ingin dialokasikan fitur "${tool.name}" (Biaya: ${tool.creditCost} Kredit):\n\n${fileOptions}`);
                            if (choice === null) return;
                            const idxChoice = parseInt(choice.trim()) - 1;
                            if (isNaN(idxChoice) || idxChoice < 0 || idxChoice >= myFiles.length) {
                              alert("Pilihan tidak valid! Transaksi dibatalkan.");
                              return;
                            }

                            const selectedFile = myFiles[idxChoice];
                            const confirmed = confirm(`Konfirmasi Pemanfaatan Kredit:\n\nFitur: ${tool.name}\nTarget file: "${selectedFile.title}"\nBiaya: ${tool.creditCost} Kredit\n\nApakah Anda menyetujui pemotongan saldo?`);
                            if (!confirmed) return;

                            // Deduct client credit
                            setUserProfile(prev => ({
                              ...prev,
                              kreditSisa: Math.max(0, prev.kreditSisa - tool.creditCost)
                            }));

                            // Sync customer balance registry
                            setCustomers(prev => prev.map(c => {
                              if (c.email.toLowerCase() === userProfile.email.toLowerCase()) {
                                return { ...c, kreditSisa: Math.max(0, c.kreditSisa - tool.creditCost) };
                              }
                              return c;
                            }));

                            // Append tool info
                            setFiles(prev => prev.map(f => {
                              if (f.id === selectedFile.id) {
                                return {
                                  ...f,
                                  title: `[${tool.name.split(" ")[0]}] ${f.title}`,
                                  feedback: `[Layanan ${tool.name} diterapkan pada ${new Date().toLocaleDateString("id-ID")}] Hasil pengecekan akan diupdate segera.`,
                                  similarityPercent: tool.id === "tool-1" ? undefined : f.similarityPercent, // Reset score if check types changes
                                  aiPercent: tool.id === "tool-1" ? Math.floor(10 + Math.random() * 25) : f.aiPercent,
                                  status: "Memproses" // triggers recheck!
                                };
                              }
                              return f;
                            }));

                            alert(`Sukses! Fitur "${tool.name}" berhasil didelegasikan ke dokumen "${selectedFile.title}". Tim editor sedang me-running naskah.`);
                          }}
                          className="w-full py-2 bg-slate-900 hover:bg-indigo-600 hover:text-white text-slate-100 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Gunakan Fitur ({tool.creditCost} Kredit)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB PANEL 5: WORKSPACE ADMIN (DASHBOARD KENDALI ADMIN) */}
            {dashboardTab === "workspace-admin" && (
              <div className="space-y-6 animate-fade-in font-sans text-slate-300">
                
                {/* Clean Matte Header Banner */}
                <div className="bg-[#0B0F19]/60 border border-indigo-950/60 rounded-2xl p-6 shadow-lg">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                        Pusat Kendali Admin • Kak Melda
                      </span>
                      <h3 className="text-base font-extrabold text-white mt-1.5 tracking-tight">Setelan & Pengawasan Portal</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Sesi aktif: <strong className="text-indigo-400">{userProfile.email}</strong></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={async () => {
                          const nextVal = !autoSimulationEnabled;
                          setAutoSimulationEnabled(nextVal);
                          try {
                            await fetch("/api/update-settings", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ autoSimulationEnabled: nextVal })
                            });
                          } catch (err) {
                            console.error("Gagal mengupdate pengaturan auto-simulasi:", err);
                          }
                          alert(!nextVal 
                            ? "Mode Instruktur Manual AKTIF. Naskah baru dari pelanggan tidak akan otomatis selesai sampai Anda memasukkan skor Turnitin secara manual." 
                            : "Auto-Simulasi Cek AKTIF. Naskah baru akan selesai secara instan dengan nilai simulasi.");
                        }}
                        className={`text-[11px] font-bold px-3.5 py-1.5 rounded-xl border transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-sm ${
                          autoSimulationEnabled
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700"
                        }`}
                        title={autoSimulationEnabled ? "Sistem mensimulasikan hasil dlm 10 detik" : "Sistem menunggu input akun Instruktur Anda"}
                      >
                        {autoSimulationEnabled ? "⚡ Auto-Simulasi: Aktif (Instant)" : "🛡️ Turnitin Manual: Aktif (Instruktur)"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bento Statistics Showcase */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Stat 1: Total Users */}
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-sm hover:border-indigo-500/20 transition duration-150">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Pelanggan</span>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="text-2xl font-extrabold text-white font-sans">{customers.length}</span>
                      <span className="text-xs text-indigo-400 font-semibold">Aktif terdaftar</span>
                    </div>
                  </div>
                  
                  {/* Stat 2: Active files in Queue */}
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-sm hover:border-indigo-500/20 transition duration-150">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Antrean Memproses</span>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="text-2xl font-extrabold text-white font-sans">
                        {files.filter(f => f.status === "Memproses").length}
                      </span>
                      {files.filter(f => f.status === "Memproses").length > 0 ? (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      ) : null}
                      <span className="text-xs text-amber-300 font-semibold font-mono">Naskah berjalan</span>
                    </div>
                  </div>

                  {/* Stat 3: Completed Files */}
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-sm hover:border-indigo-500/20 transition duration-150">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Selesai Cek</span>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="text-2xl font-extrabold text-white font-sans">
                        {files.filter(f => f.status === "Selesai").length}
                      </span>
                      <span className="text-xs text-emerald-400 font-semibold">Tersinkronisasi</span>
                    </div>
                  </div>

                  {/* Stat 4: Upload System Status */}
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-sm hover:border-indigo-500/20 transition duration-155 duration-150">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Sistem Unggah Berkas</span>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[10.5px] font-bold ${isUploadLocked ? "text-rose-400 bg-rose-500/10 border border-rose-500/20" : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"} px-2.5 py-0.5 rounded-full`}>
                        {isUploadLocked ? "🔒 Terkunci" : "🟢 Aktif"}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          const nextL = !isUploadLocked;
                          setIsUploadLocked(nextL);
                          try {
                            await fetch("/api/update-settings", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ isUploadLocked: nextL })
                            });
                          } catch (e) { console.error(e); }
                        }}
                        className="text-[9.5px] font-bold hover:underline text-indigo-400 focus:outline-none cursor-pointer"
                      >
                        {isUploadLocked ? "Buka" : "Kunci"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main 2-Column Split Layout for Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Customers & Balance Directory Table (col-span-7) */}
                  <div className={`col-span-12 lg:col-span-12 ${adminSettingsTab === "bypassgpt" ? "xl:col-span-4" : "xl:col-span-7"} bg-[#0B0F19]/60 border border-indigo-950/60 rounded-2xl p-5 shadow-lg space-y-4 transition-all duration-300`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-950/40 pb-3 gap-2">
                      <div>
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider">👥 Direktori & Saldo Kredit Pelanggan ({filteredAndSortedCustomers.length})</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Kelola verifikasi saldo langsung dari satu interface basis data.</p>
                      </div>
                    </div>

                    {/* Compact Filter Tool bar */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 bg-[#070B18]/60 p-2 rounded-xl border border-indigo-950/55">
                      <div className="relative flex-1 w-full">
                        <input
                          type="text"
                          placeholder="Cari pelanggan berdasarkan nama, email, username..."
                          value={customerSearchQuery}
                          onChange={(e) => setCustomerSearchQuery(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs text-slate-200 bg-transparent border-none focus:outline-none font-sans"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 border-t sm:border-t-0 sm:border-l border-indigo-950/80 pt-2 sm:pt-0 pl-0 sm:pl-3">
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">Urutkan:</span>
                        <select
                          value={customerSortOption}
                          onChange={(e) => setCustomerSortOption(e.target.value)}
                          className="text-xs text-slate-300 bg-[#0F172A]/85 border border-indigo-950 rounded-lg px-2 py-1 focus:outline-none cursor-pointer w-full font-sans"
                        >
                          <option value="name-asc">Nama (A-Z)</option>
                          <option value="name-desc">Nama (Z-A)</option>
                          <option value="credit-desc">Kredit Terbanyak</option>
                          <option value="credit-asc">Kredit Tersedikit</option>
                          <option value="files-desc">Banyak File Terupload</option>
                        </select>
                      </div>
                    </div>

                    {/* Premium customer table */}
                    <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-1">
                      {filteredAndSortedCustomers.length === 0 ? (
                        <div className="text-center py-10 font-sans text-xs text-slate-500">Tidak ada pelanggan ditemukan.</div>
                      ) : (
                        <table className="w-full text-xs text-slate-300 border-collapse">
                          <thead>
                            <tr className="border-b border-indigo-950/60 text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                              <th className="py-2 text-left">PROFIL PELANGGAN</th>
                              <th className="py-2 text-center">SISA KREDIT</th>
                              <th className="py-2 text-right">TINDAKAN SALDO</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-indigo-950/30">
                            {filteredAndSortedCustomers.map(cust => {
                              const custFiles = files.filter(f => f.ownerEmail === cust.email);
                              const inputId = `credit-input-${cust.email.replace(/[@.]/g, "-")}`;
                              return (
                                <tr key={cust.email} className="hover:bg-indigo-950/15 duration-75">
                                  <td className="py-2.5 pr-2">
                                    <div className="font-semibold text-slate-100 text-xs flex items-center gap-1">
                                      {cust.fullName}
                                      {cust.role === "Admin" && (
                                        <span className="text-[8px] text-rose-400 font-bold bg-rose-500/10 px-1 py-0.2 rounded font-mono">ADMIN</span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{cust.email}</div>
                                    <div className="text-[9px] text-slate-550 font-mono mt-0.5">WA: {cust.whatsapp} • {custFiles.length} file</div>
                                  </td>
                                  <td className="py-2.5 text-center font-mono font-bold text-indigo-400 text-xs">
                                    {cust.kreditSisa} Cek
                                  </td>
                                  <td className="py-2.5 text-right">
                                    <div className="inline-flex items-center gap-1">
                                      {/* Direct quick step button */}
                                      <button
                                        onClick={() => {
                                          const updated = customers.map(c => {
                                            if (c.email.toLowerCase() === cust.email.toLowerCase()) {
                                              return { ...c, kreditSisa: Math.max(0, c.kreditSisa - 1) };
                                            }
                                            return c;
                                          });
                                          handleUpdateCustomersList(updated);
                                          if (userProfile.email.toLowerCase() === cust.email.toLowerCase()) {
                                            setUserProfile(prev => ({ ...prev, kreditSisa: Math.max(0, prev.kreditSisa - 1) }));
                                          }
                                        }}
                                        className="h-6 w-6 rounded bg-slate-800 hover:bg-rose-600 hover:text-white border border-indigo-950 text-[10px] font-bold text-rose-400 flex items-center justify-center cursor-pointer font-mono duration-100"
                                        title="-1 Cek"
                                      >
                                        -1
                                      </button>
                                      
                                      <input
                                        id={inputId}
                                        type="number"
                                        min="0"
                                        defaultValue={cust.kreditSisa}
                                        className="w-11 px-1 py-0.5 text-center font-bold rounded bg-[#090D1A] border border-indigo-950 text-white text-xs focus:ring-1 focus:ring-indigo-500 font-mono h-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        onBlur={(e) => {
                                          const amt = parseInt(e.target.value);
                                          if (isNaN(amt) || amt < 0) return;
                                          if (amt === cust.kreditSisa) return;
                                          const updated = customers.map(c => {
                                            if (c.email.toLowerCase() === cust.email.toLowerCase()) {
                                              return { ...c, kreditSisa: amt };
                                            }
                                            return c;
                                          });
                                          handleUpdateCustomersList(updated);
                                          if (userProfile.email.toLowerCase() === cust.email.toLowerCase()) {
                                            setUserProfile(prev => ({ ...prev, kreditSisa: amt }));
                                          }
                                        }}
                                      />

                                      <button
                                        onClick={() => {
                                          const updated = customers.map(c => {
                                            if (c.email.toLowerCase() === cust.email.toLowerCase()) {
                                              return { ...c, kreditSisa: c.kreditSisa + 5 };
                                            }
                                            return c;
                                          });
                                          handleUpdateCustomersList(updated);
                                          if (userProfile.email.toLowerCase() === cust.email.toLowerCase()) {
                                            setUserProfile(prev => ({ ...prev, kreditSisa: prev.kreditSisa + 5 }));
                                          }
                                        }}
                                        className="h-6 w-6 rounded bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-950 text-[10px] font-bold flex items-center justify-center cursor-pointer font-mono duration-100"
                                        title="+5 Cek"
                                      >
                                        +5
                                      </button>

                                      <button
                                        onClick={() => {
                                          if (cust.role === "Admin" || cust.email.toLowerCase() === "dolokimun65@yahoo.com") {
                                            alert("Tidak dapat menghapus akun Administrator Utama!");
                                            return;
                                          }
                                          if (confirm(`Apakah Kak Melda yakin ingin menghapus pelanggan "${cust.fullName}" (${cust.email})?`)) {
                                            const updated = customers.filter(c => c.email.toLowerCase() !== cust.email.toLowerCase());
                                            handleUpdateCustomersList(updated);
                                          }
                                        }}
                                        className="h-6 w-6 rounded bg-rose-950/30 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-955/60 flex items-center justify-center cursor-pointer duration-100 transition"
                                        title="Hapus Pelanggan"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Portal Consolidated Configuration (col-span-4) */}
                  <div className={`col-span-12 ${adminSettingsTab === "bypassgpt" ? "xl:col-span-8" : "xl:col-span-4"} bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 backdrop-blur-md transition-all duration-300`}>
                    <div className="border-b border-slate-800 pb-2.5">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider">⚙️ Setelan Sistem & Layanan</h4>
                      <p className="text-[10px] text-slate-404 text-slate-400 mt-0.5 font-sans">Atur jam operasional, tarif, broadcasters, dan katalog.</p>
                    </div>

                    {/* Compact Tabs Switch */}
                    <div className="flex flex-wrap gap-1 bg-slate-950/50 p-1 rounded-xl border border-slate-800/90">
                      <button
                        type="button"
                        onClick={() => setAdminSettingsTab("portal")}
                        className={`flex-1 text-center py-1.5 rounded-lg text-[9.5px] font-bold transition duration-150 cursor-pointer ${adminSettingsTab === "portal" ? "bg-indigo-650 text-white bg-indigo-600" : "text-slate-400 hover:text-white"}`}
                      >
                        Portal
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminSettingsTab("announcement")}
                        className={`flex-1 text-center py-1.5 rounded-lg text-[9.5px] font-bold transition duration-150 cursor-pointer ${adminSettingsTab === "announcement" ? "bg-indigo-650 text-white bg-indigo-600" : "text-slate-400 hover:text-white"}`}
                      >
                        Broadcaster
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminSettingsTab("tools")}
                        className={`flex-1 text-center py-1.5 rounded-lg text-[9.5px] font-bold transition duration-150 cursor-pointer ${adminSettingsTab === "tools" ? "bg-indigo-650 text-white bg-indigo-600" : "text-slate-400 hover:text-white"}`}
                      >
                        Katalog
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminSettingsTab("system")}
                        className={`flex-1 text-center py-1.5 rounded-lg text-[9.5px] font-bold transition duration-150 cursor-pointer ${adminSettingsTab === "system" ? "bg-indigo-650 text-white bg-indigo-600" : "text-slate-400 hover:text-white"}`}
                      >
                        System
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminSettingsTab("bypassgpt")}
                        className={`flex-1 text-center py-1.5 rounded-lg text-[9.5px] font-bold transition duration-150 cursor-pointer ${adminSettingsTab === "bypassgpt" ? "bg-indigo-650 text-white bg-indigo-600" : "text-slate-400 hover:text-white"}`}
                      >
                        Bypass GPT 🤖
                      </button>
                    </div>

                    <div className="pt-1.5">
                      {/* Operational Portal pricing and hours tab */}
                      {adminSettingsTab === "portal" && (
                        <div className="grid grid-cols-1 gap-4 font-sans font-sans">
                          {/* Hours operational limit */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">Jam Operasional</label>
                            <input
                              type="text"
                              value={adminWorkingHoursInput}
                              onChange={(e) => setAdminWorkingHoursInput(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-semibold font-mono"
                              placeholder="e.g. 08.00 - 21.00 WIB"
                            />
                            <button
                              onClick={async () => {
                                if (!adminWorkingHoursInput.trim()) return;
                                try {
                                  await fetch("/api/update-settings", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ isUploadLocked, workingHours: adminWorkingHoursInput.trim() })
                                  });
                                  setWorkingHours(adminWorkingHoursInput.trim());
                                  alert("Jam operasional berhasil disimpan.");
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className="w-full mt-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl transition duration-150 cursor-pointer"
                            >
                              Simpan Jam Operasional
                            </button>
                          </div>

                          {/* Base Price level label */}
                          <div className="space-y-1.5 pt-2.5 border-t border-slate-800/60 font-sans">
                            <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">Label Tarif Kit</label>
                            <input
                              type="text"
                              value={adminPriceInput}
                              onChange={(e) => setAdminPriceInput(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-semibold"
                              placeholder="e.g. Rp2.000"
                            />
                            <button
                              onClick={async () => {
                                localStorage.setItem("queen_turnitin_price", adminPriceInput);
                                setTurnitinPrice(adminPriceInput);
                                try {
                                  await fetch("/api/update-settings", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ turnitinPrice: adminPriceInput })
                                  });
                                  alert("Label tarif dasar berhasil disimpan.");
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className="w-full mt-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl transition duration-150 cursor-pointer"
                            >
                              Simpan Label Tarif
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Broadcaster announcement broadcast widget */}
                      {adminSettingsTab === "announcement" && (
                        <div className="space-y-2 font-sans font-sans">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">Broadcaster Pengumuman Portal</label>
                          <textarea
                            rows={4}
                            value={adminAnnouncement}
                            onChange={(e) => setAdminAnnouncement(e.target.value)}
                            className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 leading-relaxed font-sans"
                            placeholder="Ketik imbauan/pesan penutupan..."
                          />
                          <button
                            onClick={async () => {
                              localStorage.setItem("queen_admin_announcement", adminAnnouncement);
                              try {
                                await fetch("/api/update-settings", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ adminAnnouncement })
                                });
                                alert("Pengumuman berhasil disebarkan!");
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-xl transition duration-150 cursor-pointer"
                          >
                            Siarkan ke Semua Klien
                          </button>
                        </div>
                      )}

                      {/* Katalog Extra Tools services listing */}
                      {adminSettingsTab === "tools" && (
                        <div className="space-y-3 font-sans font-sans font-mono">
                          <div className="flex items-center justify-between gap-1 border-b border-slate-800/60 pb-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Daftar Ekstra Fitur</span>
                            <button
                              onClick={() => {
                                const name = prompt("Nama Layanan Baru (e.g. Paraphrase Premium):");
                                if (!name) return;
                                const desc = prompt("Deskripsi singkat:");
                                if (!desc) return;
                                const credits = prompt("Tarif Saldo Kredit (e.g. 5):", "5");
                                if (!credits) return;
                                const amt = parseInt(credits.trim());
                                if (isNaN(amt) || amt < 0) return;

                                const newTool: ExtraTool = {
                                  id: `tool-${Date.now()}`,
                                  name: name.trim(),
                                  description: desc.trim(),
                                  creditCost: amt,
                                  isEnabled: true
                                };
                                const updated = [...extraTools, newTool];
                                setExtraTools(updated);
                                fetch("/api/update-settings", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ extraTools: updated })
                                });
                              }}
                              className="px-2 py-1 text-[9px] bg-indigo-650 text-white rounded-lg hover:bg-indigo-700 font-bold transition flex items-center gap-0.5 cursor-pointer border border-indigo-700"
                            >
                              + New
                            </button>
                          </div>
                          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                            {extraTools.length === 0 ? (
                              <div className="text-center py-5 text-[10px] text-slate-700">Belum ada tools terdaftar.</div>
                            ) : (
                              extraTools.map(tool => (
                                <div key={tool.id} className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs gap-2">
                                  <div className="min-w-0 flex-1">
                                    <span className="font-bold text-slate-200 block text-[11px] truncate">{tool.name}</span>
                                    <span className="text-[10px] text-indigo-400 font-bold font-mono">{tool.creditCost} Kredit</span>
                                  </div>
                                  <button
                                    onClick={async () => {
                                      const updated = extraTools.map(t => t.id === tool.id ? { ...t, isEnabled: !t.isEnabled } : t);
                                      setExtraTools(updated);
                                      fetch("/api/update-settings", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ extraTools: updated })
                                      });
                                    }}
                                    className={`px-2 py-0.5 text-[9px] font-bold rounded cursor-pointer shrink-0 ${tool.isEnabled ? "bg-rose-500/15 text-rose-400 border border-rose-500/20" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"}`}
                                  >
                                    {tool.isEnabled ? "Disable" : "Enable"}
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sound & system checks diagnostics */}
                      {adminSettingsTab === "system" && (
                        <div className="space-y-4 font-sans font-sans font-mono">
                          {/* Sound Alarm Checkbox */}
                          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">Suara Alarm Notifikasi</span>
                            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                              <span className="text-[11px] text-slate-350 font-medium">{adminSoundEnabled ? "🔔 Alarm Menyala" : "🔕 Alarm Bisu"}</span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => {
                                    const nextS = !adminSoundEnabled;
                                    setAdminSoundEnabled(nextS);
                                    localStorage.setItem("queen_admin_sound_enabled", String(nextS));
                                  }}
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition duration-150 ${adminSoundEnabled ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"}`}
                                >
                                  {adminSoundEnabled ? "Mute" : "Unmute"}
                                </button>
                                <button
                                  onClick={playNotificationSound}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold text-[10px] rounded-md transition flex items-center justify-center cursor-pointer border border-slate-700/60"
                                >
                                  🔊 Test
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Quick Diagnosis information block */}
                          <div className="p-3 bg-slate-100/5 border border-slate-800 rounded-xl text-[10px] text-slate-400 leading-relaxed font-mono">
                            <div className="font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">⚡ Diagnostik Portal</div>
                            <div>- Status Server: Berjalan (OK)</div>
                            <div>- DB Synced: Firestore Backend</div>
                            <div>- Media Storage: Local Cloud Storage</div>
                          </div>
                        </div>
                      )}

                      {/* BypassGPT Paraphrase Panel is active */}
                      {adminSettingsTab === "bypassgpt" && (
                        <div className="space-y-4 font-sans text-slate-300">
                          <div className="p-4 bg-slate-950/60 rounded-xl border border-indigo-950/40 relative overflow-hidden backdrop-blur-md">
                            {/* Decorative banner */}
                            <div className="absolute top-0 right-0 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 font-mono text-[8px] font-bold rounded-bl uppercase tracking-wider">
                              PRO BYPASS ENGINE
                            </div>
                            
                            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider mb-1 font-sans">
                              🛡️ Bypass GPT Rephrase Tool
                            </h4>
                            <p className="text-[10px] text-slate-400 mb-4 font-sans">
                              Tulis ulang naskah buatan AI (ChatGPT, Claude, Gemini, dll.) menjadi gaya bahasa manusia natural yang lolos dari detektor plagiat & AI (Turnitin AI, Copyleaks, GPTZero).
                            </p>

                            {/* Options row */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div>
                                <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1 font-sans">Mode Rewrite ⚙️</label>
                                <select
                                  value={bpMode}
                                  onChange={(e) => setBpMode(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition cursor-pointer font-sans"
                                >
                                  <option value="Standard">Standard (Luwes & Natural)</option>
                                  <option value="Balanced">Balanced (Optimal - Rekomendasi)</option>
                                  <option value="Advanced">Advanced (Sangat Akademis/Kompleks)</option>
                                  <option value="Creative">Creative (Lebih Ekspresif & Mengalir)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1 font-sans">Bahasa Target 🌐</label>
                                <select
                                  value={bpLanguage}
                                  onChange={(e) => setBpLanguage(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition cursor-pointer font-sans"
                                >
                                  <option value="id">Bahasa Indonesia 🇮🇩</option>
                                  <option value="en">English (US/UK) 🇺🇸🇬🇧</option>
                                </select>
                              </div>
                            </div>

                            {/* Split Editors: Stacked or Side-By-Side */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Left Text Block: Original */}
                              <div className="flex flex-col space-y-1">
                                <div className="flex justify-between items-center px-1">
                                  <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider font-sans">Teks Sumber (AI Generated)</span>
                                  <span className="text-[9px] text-slate-500 font-mono">
                                    {bpOriginalText.length} karakter / {bpOriginalText.split(/\s+/).filter(Boolean).length} kata
                                  </span>
                                </div>
                                <textarea
                                  placeholder="Tempel / ketik teks buatan AI Anda di sini..."
                                  value={bpOriginalText}
                                  onChange={(e) => setBpOriginalText(e.target.value)}
                                  className="w-full h-64 bg-[#050812] border border-slate-800 rounded-xl p-3 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition font-sans resize-none leading-relaxed"
                                />
                              </div>

                              {/* Right Text Block: Paraphrased Result */}
                              <div className="flex flex-col space-y-1">
                                <div className="flex justify-between items-center px-1 font-sans">
                                  <span className="text-[9.5px] font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                    Hasil Humanisasi ✨
                                    {bpUsedFallback && (
                                      <span className="text-[8px] bg-indigo-500/25 text-indigo-300 font-bold px-1.5 py-0.2 rounded font-mono font-sans">GEMINI FALLBACK</span>
                                    )}
                                  </span>
                                  {bpParaphrasedText && (
                                    <span className="text-[9px] text-indigo-300 font-mono">
                                      {bpParaphrasedText.length} karakter / {bpWordCount} kata
                                    </span>
                                  )}
                                </div>
                                
                                <div className="relative w-full h-64 bg-[#050812]/40 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-sans leading-relaxed overflow-y-auto min-h-[16rem]">
                                  {bpParaphrasedText ? (
                                    <pre className="whitespace-pre-wrap font-sans break-words bg-transparent border-none p-0 text-xs">
                                      {bpParaphrasedText}
                                    </pre>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-600 font-sans py-12">
                                      {bpLoading ? (
                                        <div className="flex flex-col items-center space-y-2">
                                          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin font-sans"></div>
                                          <span className="text-[10px] text-indigo-400 font-medium font-sans">Bypass GPT sedang menulis ulang...</span>
                                        </div>
                                      ) : (
                                        <>
                                          <span className="text-xl">🤖 &rarr; 🧑‍💻</span>
                                          <span className="text-[10px] mt-1 text-slate-500 text-center px-6 font-sans">Centang parameter Anda & ketik di sebelah kiri, lalu klik tombol Bypass di bawah.</span>
                                        </>
                                      )}
                                    </div>
                                  )}

                                  {/* Copy button overlay */}
                                  {bpParaphrasedText && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(bpParaphrasedText);
                                        alert("Teks hasil paraphrase berhasil disalin!");
                                      }}
                                      className="absolute bottom-2.5 right-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-2.5 py-1 text-[9px] font-bold shadow transition duration-150 cursor-pointer flex items-center gap-1 border border-indigo-500 font-sans"
                                    >
                                      Salin Hasil 📋
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Error section */}
                            {bpError && (
                              <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] font-sans">
                                <strong>⚠️ Terjadi galat:</strong> {bpError}
                              </div>
                            )}

                            {/* Actions block */}
                            <div className="mt-4 flex items-center gap-3 font-sans">
                              <button
                                type="button"
                                disabled={bpLoading || !bpOriginalText.trim()}
                                onClick={handleBypassGptParaphrase}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer border font-sans ${
                                  bpLoading 
                                    ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed" 
                                    : "bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] text-white border-indigo-500 shadow-lg shadow-indigo-600/15"
                                }`}
                              >
                                {bpLoading ? (
                                  <>Memproses rewrite...</>
                                ) : (
                                  <>Bypass AI Detector Sekarang ✨</>
                                )}
                              </button>

                              {bpOriginalText && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBpOriginalText("");
                                    setBpParaphrasedText("");
                                    setBpError("");
                                  }}
                                  className="px-4 py-2.5 bg-slate-900 border border-slate-805 border-slate-800 text-slate-400 hover:text-white rounded-xl text-[11px] font-bold transition duration-150 cursor-pointer font-sans"
                                >
                                  Reset
                                </button>
                              )}
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Master queue checking segment - Real Interactive Instructor check! (Full Width) */}
                <div className="bg-[#0B0F19]/60 border border-indigo-950/60 rounded-2xl p-5 shadow-lg space-y-4 font-sans text-slate-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-950/40 pb-3">
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-0.5">📋 Antrean Naskah Integrasi Turnitin (Master Queue)</h4>
                      <p className="text-[10px] text-slate-400">Berkas plagiasi terbaru pelanggan yang butuh pelaporan Turnitin Kelas Instruktur.</p>
                    </div>
                    <div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${autoSimulationEnabled ? "bg-amber-400/10 text-amber-305 border border-amber-500/10" : "bg-indigo-500/10 text-indigo-400 shrink-0 inline-block font-mono border border-indigo-500/20"}`}>
                        {autoSimulationEnabled ? "Auto-Simulate Active" : "🛡️ Turnitin Instructor manual mode"}
                      </span>
                    </div>
                  </div>

                  {!autoSimulationEnabled && (
                    <div className="bg-amber-500/5 rounded-xl p-3 border border-amber-500/10 flex items-start gap-2.5 text-xs text-amber-200">
                      <span className="p-0.5 px-1.5 bg-amber-500/10 rounded text-amber-400 font-bold shrink-0">💡</span>
                      <div>
                        Naskah baru tertahan di status <span className="font-mono bg-amber-500/10 text-amber-400 px-1 py-0.5 rounded text-[10px] uppercase font-bold">Memproses</span>. Jalankan file di akun Turnitin Instruktur Kelas Anda, lalu klik <span className="font-bold text-white hover:underline">"Input Hasil Turnitin"</span> di baris antrean di bawah untuk mengupload skor/file pdf laporan hasil cek.
                      </div>
                    </div>
                  )}

                  {/* Selected files bulk actions header */}
                  {selectedFileIds.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-750 text-xs font-bold font-mono">
                          {selectedFileIds.length}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-rose-950 font-sans">
                            Kak Melda memilih {selectedFileIds.length} naskah dari antrean.
                          </p>
                          <p className="text-[10px] text-rose-600 font-sans mt-0.5">
                            Menghapusnya akan membersihkan data serta ruang penyimpanan berkas fisik pada server secara permanen.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                        <button
                          onClick={() => setSelectedFileIds([])}
                          className="px-3 py-1.5 text-[10.5px] font-bold text-slate-500 hover:text-slate-700 font-sans transition cursor-pointer selection:bg-rose-200"
                        >
                          Batal Pilihan
                        </button>
                        <button
                          onClick={() => handleDeleteFiles(selectedFileIds)}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10.5px] rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 size={12} /> Hapus Massal ({selectedFileIds.length}) 🗑️
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    {files.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">Tidak ada naskah yang terdaftar dalam queue.</p>
                    ) : (
                      <table className="w-full text-xs font-sans text-slate-600 whitespace-nowrap">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 select-none">
                            <th className="p-3 text-center w-10">
                              <input 
                                type="checkbox" 
                                checked={selectedFileIds.length === files.length && files.length > 0} 
                                onChange={handleToggleSelectAllFiles} 
                                className="w-3.5 h-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer" 
                              />
                            </th>
                            <th className="p-3 text-left">ID File</th>
                            <th className="p-3 text-left">Identitas Berkas</th>
                            <th className="p-3 text-left">Nama Pembayar</th>
                            <th className="p-3 text-left">Konfigurasi Filter</th>
                            <th className="p-3 text-left">Status Terkini</th>
                            <th className="p-3 text-center">Operasi Turnitin Instruktur</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {files.map(file => {
                            const ownerObj = customers.find(c => c.email.toLowerCase() === (file.ownerEmail || "").toLowerCase());
                            const isChecked = selectedFileIds.includes(file.id);
                            return (
                              <tr key={file.id} className={`hover:bg-slate-50/50 transition duration-75 ${isChecked ? "bg-rose-50/15" : ""}`}>
                                <td className="p-3 text-center w-10">
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked} 
                                    onChange={() => handleToggleSelectFile(file.id)} 
                                    className="w-3.5 h-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer" 
                                  />
                                </td>
                                <td className="p-3 font-mono text-[10px] font-bold text-slate-500">
                                  <span className="cursor-pointer hover:underline" onClick={() => handleToggleSelectFile(file.id)}>
                                    {file.id}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-slate-800 max-w-[200px] truncate" title={file.title}>{file.title}</div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mt-1">
                                    <span className="text-[10px] text-slate-400 font-mono leading-none">{file.filename} ({file.fileSize})</span>
                                    {file.fileUrl ? (
                                      <a
                                        href={file.fileUrl}
                                        download={file.filename || "naskah-pelanggan.pdf"}
                                        className="inline-flex items-center justify-center gap-0.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200 transition select-none w-max"
                                        title="Download Berkas Asli Pelanggan"
                                      >
                                        Unduh Berkas 📥
                                      </a>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          const mockContent = `NASKAH ORIGINAL UNTUK TURNITIN CHECKER\n======================================\nJudul: ${file.title}\nID Dokumen: ${file.id}\nTanggal: ${file.uploadDate}\n\nIsi Dokumen:\nIni adalah naskah asli dari ${file.title} yang dikirimkan oleh pengguna untuk diperiksa di Turnitin.`;
                                          const blob = new Blob([mockContent], { type: "text/plain;charset=utf-8" });
                                          const url = URL.createObjectURL(blob);
                                          const tempLink = document.createElement("a");
                                          tempLink.href = url;
                                          tempLink.download = file.filename || "naskah-klien.txt";
                                          document.body.appendChild(tempLink);
                                          tempLink.click();
                                          document.body.removeChild(tempLink);
                                        }}
                                        className="inline-flex items-center justify-center gap-0.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200 transition cursor-pointer w-max"
                                        title="Download Berkas Asli (Simulasi)"
                                      >
                                        Unduh Berkas 📥
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="font-semibold text-slate-700">{ownerObj ? ownerObj.fullName : "Klien Sistem"}</div>
                                  <span className="text-[9px] text-slate-400 block">{file.ownerEmail || "meldakatriagirsang@gmail.com"}</span>
                                </td>
                                <td className="p-3">
                                  <div className="space-y-1 text-[9px] font-medium text-slate-500">
                                    <span className="block font-bold text-indigo-700">Tipe Cek: {file.checkType === "Turnitin-AI" ? "Turnitin AI ✨" : "Similarity Standard"}</span>
                                    {file.filters && (
                                      <span className="block text-slate-400">
                                        Excludes: {file.filters.excludeBibliography ? "✅ Bibliography " : "❌ Bibliography "}
                                        • {file.filters.excludeQuotes ? "✅ Quotes " : "❌ Quotes "}
                                        • {file.filters.excludeSmallSources ? "✅ Small Sources " : "❌ Small Sources "}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                    file.status === "Selesai" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700 animate-pulse"
                                  }`}>
                                    {file.status} {file.similarityPercent !== undefined ? `(${file.similarityPercent}% Similarity)` : ""}
                                    {file.aiPercent !== undefined ? ` [AI Detected: ${file.aiPercent}%]` : ""}
                                  </span>
                                </td>
                                <td className="p-3 font-medium">
                                  <div className="flex items-center gap-2 justify-center">
                                    {ownerObj && (
                                      <a
                                        href={`https://wa.me/${ownerObj.whatsapp.replace(/[^0-9]/g, "")}?text=Halo%20${encodeURIComponent(ownerObj.fullName)},%20saya%20Admin%20Queen%20Similarity%20ingin%20mengabarkan%20bahwa%20file%20kamu%20"${encodeURIComponent(file.title)}"%20sedang%20diverifikasi%20oleh%20akun%20Instruktur.`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-2 py-1.5 text-[10px] font-bold border border-emerald-500/30 text-emerald-600 bg-emerald-50/20 hover:bg-emerald-50 rounded-xl transition flex items-center gap-1 cursor-pointer"
                                      >
                                        WhatsApp 💬
                                      </a>
                                    )}
 
                                    <button
                                      onClick={() => setActiveAdminModalDoc(file)}
                                      className="px-3 py-1.5 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition duration-150 cursor-pointer"
                                    >
                                      Input Hasil Turnitin 📝
                                    </button>

                                    <button
                                      onClick={() => handleDeleteFiles([file.id])}
                                      className="p-1.5 px-2 text-[10px] font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded-xl shadow-2xs transition duration-150 cursor-pointer flex items-center justify-center gap-1"
                                      title="Hapus naskah ini"
                                    >
                                      <Trash2 size={12} /> Hapus 🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

              </div>
            )}
          </main>

        </div>
      </div>
    )}

      {/* -------------------- POPUPS AND DIALOGS PANEL -------------------- */}

      {/* Upload File dialog box modal */}
      {isUploadOpen && (
        <UploadModal 
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={handleUploadSuccess}
          kreditSisa={userProfile.kreditSisa}
        />
      )}

      {/* Turnitin interactive pdf report viewer popup */}
      {activeReport && (
        <TurnitinReportModal 
          document={activeReport}
          onClose={() => setActiveReport(null)}
        />
      )}

      {/* Admin Turnitin Manual Result Input Modal */}
      {activeAdminModalDoc && (
        <AdminTurnitinResultModal
          document={activeAdminModalDoc}
          customer={customers.find(c => c.email.toLowerCase() === (activeAdminModalDoc.ownerEmail || "").toLowerCase()) || null}
          onClose={() => setActiveAdminModalDoc(null)}
           onSave={async (docId, similarity, aiScore, feedbackText, repUrl, reportFileData, reportFileName) => {
            const updates = {
              status: "Selesai" as const,
              similarityPercent: similarity,
              aiPercent: aiScore,
              feedback: feedbackText,
              reportUrl: repUrl || `/api/view-report/${docId}`,
              reportFileName: reportFileName
            };

            // 1. Instantly update the local React state (Optimistic Update)
            setFiles(prev => prev.map(f => {
              if (f.id === docId) {
                return {
                  ...f,
                  ...updates,
                  reportUrl: repUrl || `/api/view-report/${docId}`
                };
              }
              return f;
            }));

            // 2. Instantly close the admin modal so there's zero UI lag!
            setActiveAdminModalDoc(null);

            // Helper to post to the server in the background using FormData
            const uploadToServer = async (fileObj?: File, textReportData?: string) => {
              try {
                const formData = new FormData();
                formData.append("id", docId);
                formData.append("updates", JSON.stringify(updates));
                formData.append("reportFileName", reportFileName || "");
                
                if (fileObj) {
                  formData.append("reportFile", fileObj);
                } else if (textReportData) {
                  formData.append("reportFileData", textReportData);
                }

                const res = await fetch("/api/update-file", {
                  method: "POST",
                  body: formData
                });

                if (res.ok) {
                  const data = await res.json();
                  if (data.updatedState && data.updatedState.files) {
                    setFiles(data.updatedState.files);
                  }
                } else {
                  console.error("Gagal menyimpan pembaharuan laporan Turnitin ke server (Status BAD)");
                }
              } catch (err) {
                console.error("Gagal mengunggah laporan Turnitin di background:", err);
              }
            };

            // 3. Trigger server sync in background asynchronously
            if (reportFileData && ((reportFileData as any) instanceof File)) {
              uploadToServer(reportFileData as any as File);
            } else {
              uploadToServer(undefined, reportFileData as string | undefined);
            }
          }}
        />
      )}

      <PurchaseModal 
        isOpen={isPurchaseOpen}
        onClose={() => setIsPurchaseOpen(false)}
        userProfile={userProfile}
        onAddCredits={handleAddPurchasedCredits}
        turnitinPrice={turnitinPrice}
      />

    </div>
  );
}

// Visual helpers arrows elements
function RightArrowIcon() {
  return (
    <svg className="w-3 h-3 text-current inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
