export type FileStatus = "Selesai" | "Memproses" | "Gagal";

export interface DocumentFilters {
  excludeBibliography: boolean;
  excludeQuotes: boolean;
  excludeSmallSources: boolean;
}

export interface CheckedDocument {
  id: string;
  title: string;
  filename: string;
  fileSize: string;
  uploadDate: string;
  status: FileStatus;
  similarityPercent?: number; // e.g. 12
  aiPercent?: number; // Turnitin AI Score (0-100%)
  reportUrl?: string;
  reportFileName?: string;
  fileUrl?: string;
  feedback?: string; // AI summary response or feedback
  filters?: DocumentFilters;
  checkType?: "Standard" | "Turnitin-AI";
  creditCost?: number;
  ownerEmail?: string; // Owner email to trace user files
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: string;
}

export interface ExtraTool {
  id: string;
  name: string;
  description: string;
  creditCost: number;
  isEnabled: boolean;
}

export interface UserProfile {
  username: string;
  fullName: string;
  email: string;
  whatsapp: string;
  role: string; // 'Pelanggan' or 'Admin'
  kreditSisa: number;
  uploadHarianSisa: number;
  totalUploadHarianLimit: number;
  password?: string;
}

export type AppView = "landing" | "login" | "register" | "dashboard";
export type DashboardView = "list-file" | "ai-chatbot" | "profil" | "workspace-admin" | "extra-services";
