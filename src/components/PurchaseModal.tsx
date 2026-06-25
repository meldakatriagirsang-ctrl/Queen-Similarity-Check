import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import { 
  X, 
  Check, 
  Loader2, 
  QrCode, 
  Coins, 
  ShieldCheck, 
  Smartphone, 
  Sparkles, 
  Clock,
  ArrowRight,
  AlertTriangle,
  Upload,
  Phone
} from "lucide-react";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onAddCredits: (amount: number) => void;
  turnitinPrice?: string;
}

export interface CreditPackage {
  credits: number;
  price: number;
  priceText: string;
  badge?: string;
  isPopular?: boolean;
}

// Helper to parse price string to number, e.g. "Rp2.000" or "Rp 1.500" to 2000 or 1500
function parsePrice(priceStr: string | undefined): number {
  if (!priceStr) return 2000;
  // Match the first sequence of digits possibly separated by dot or comma
  const match = priceStr.match(/\d+(?:[\.,]\d+)*/);
  if (!match) return 2000;
  const numericOnly = match[0].replace(/\D/g, "");
  const val = parseInt(numericOnly, 10);
  return isNaN(val) ? 2000 : val;
}

// Generate credit packages dynamically based on configured unit price
export function getCreditPackages(unitPrice: number): CreditPackage[] {
  const creditsList = [1, 5, 10, 15, 20, 30, 50, 100];
  const badgesList: { [key: number]: string } = {
    1: "Paket Eceran",
    5: "Grup Belajar",
    10: "Hemat 5%",
    15: "Revisi Standar",
    20: "Paket Menengah",
    30: "Hemat 10%",
    50: "Rekomendasi Skripsi",
    100: "Paket Premium Tesis"
  };
  
  return creditsList.map((cr) => {
    const rawPrice = unitPrice * cr;
    const priceText = `Rp ${rawPrice.toLocaleString("id-ID")}`;
    
    return {
      credits: cr,
      price: rawPrice,
      priceText: priceText,
      badge: badgesList[cr],
      isPopular: cr === 10
    };
  });
}

// QRIS payload generator helper can be kept as utility or removed. We can leave it simple.
function generateQRISPayload(amount: number = 0, isStatic: boolean = true): string {
  return "Admin_Direct_WA_Payment";
}

export default function PurchaseModal({ isOpen, onClose, userProfile, onAddCredits, turnitinPrice }: PurchaseModalProps) {
  const [selectedCredits, setSelectedCredits] = useState<number>(10);
  const [step, setStep] = useState<"select" | "pay" | "success">("select");
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const unitPrice = parsePrice(turnitinPrice);
  const packages = getCreditPackages(unitPrice);
  const selectedPack = packages.find((p) => p.credits === selectedCredits) || packages[2];

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedCredits(pkg.credits);
  };

  const handleGoToPayment = () => {
    if (!selectedPack) return;
    setStep("pay");
  };

  const handleSimulatePayment = () => {
    if (!selectedPack) return;
    setIsSimulating(true);

    // Simulate verification and database transaction
    setTimeout(() => {
      setIsSimulating(false);
      onAddCredits(selectedPack.credits);
      setStep("success");
    }, 1200);
  };

  const handleClose = () => {
    setStep("select");
    setSelectedCredits(10);
    onClose();
  };

  return (
    <div id="purchase-modal-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      
      {/* Modal Main Board Container */}
      <div 
        id="purchase-modal-board"
        className="bg-[#0B1120]/95 border border-indigo-900/60 rounded-3xl w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row transition-all duration-300 transform scale-100"
      >
        {/* Background glowing decorations */}
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[90px] pointer-events-none" />

        {/* ==================== LEFT PANEL: PACKAGES SELECTOR / INFORMATIONAL ==================== */}
        <div className="w-full md:w-[45%] p-6 md:p-8 border-b md:border-b-0 md:border-r border-indigo-950/70 flex flex-col justify-between relative z-10 bg-slate-950/30">
          <div>
            <div className="flex items-center gap-2 mb-4 bg-indigo-950/40 border border-indigo-500/20 px-3 py-1.5 rounded-full w-fit">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-[10px] uppercase font-black tracking-widest text-[#00E5FF] font-mono">AKTIVASI PAKET INSTAN</span>
            </div>
            
            <h3 className="text-xl font-extrabold text-white tracking-tight leading-snug">
              Queen Similarity Check
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Dapatkan saldo kredit pengerjaan pemeriksaan Turnitin untuk Kak Melda Girsang secara otomatis tanpa antre, aman, dan langsung bertambah.
            </p>

            {/* Current user balance highlight */}
            <div className="mt-6 bg-[#0E172A]/80 border border-indigo-950/60 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">SALDO SAAT INI</span>
                <span className="text-slate-100 text-xs font-semibold mt-1 block">Akun: <strong className="text-indigo-400">{userProfile.email}</strong></span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white font-mono">{userProfile.kreditSisa}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">KREDIT</span>
              </div>
            </div>

            {/* Benefits info check list */}
            <div className="mt-6 space-y-3.5">
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                  <Check size={11} className="stroke-[3]" />
                </div>
                <div>
                  <span className="font-semibold text-slate-200 block">Metode Resmi & Aman</span>
                  <span className="text-slate-450 text-[11px] block text-slate-400">Pemeriksaan tanpa repository, data dokumen dijamin tidak bocor.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                  <Check size={11} className="stroke-[3]" />
                </div>
                <div>
                  <span className="font-semibold text-slate-200 block">Aktivasi Melalui WA Admin</span>
                  <span className="text-slate-450 text-[11px] block text-slate-400">Kirim bukti transfer ke WhatsApp Admin, saldo langsung aktif.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs border-t border-indigo-950/50 pt-3.5 mt-3.5">
                <ShieldCheck size={16} className="text-indigo-400 shrink-0" />
                <span className="text-[10.5px] text-indigo-300 leading-tight">
                  Pembayaran dikonfirmasi langsung oleh <strong>Admin</strong> secara cepat dan handal.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-slate-500 text-[10px] font-mono flex items-center gap-1.5">
            <span>🛡️ Transaksi Langsung & Aman</span>
          </div>
        </div>

        {/* ==================== RIGHT PANEL: STEPS CONTROLLERS ==================== */}
        <div className="w-full md:w-[55%] p-6 md:p-8 flex flex-col justify-between relative z-10">
          
          {/* Header Action with close button */}
          <div className="flex items-center justify-between pb-4 border-b border-indigo-950/55">
            <h4 className="text-sm font-bold text-slate-200 font-display flex items-center gap-1.5">
              <Coins className="text-amber-500 w-4.5 h-4.5" />
              {step === "select" && "Pilih Jumlah Kredit Tambahan"}
              {step === "pay" && "Detail Pembayaran WhatsApp"}
              {step === "success" && "Aktivasi Kredit Berhasil!"}
            </h4>
            <button 
              onClick={handleClose}
              className="p-1 px-1.5 text-slate-400 hover:text-white hover:bg-slate-900 border border-indigo-950/10 rounded-lg transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* ==================== STEP 1: SELECT PACKAGE ==================== */}
          {step === "select" && (
            <div className="flex-1 flex flex-col justify-between py-6">
              
              {/* Packages Lists Grid */}
              <div className="space-y-2.5 overflow-y-auto max-h-[290px] pr-1">
                {packages.map((pkg) => {
                  const isSelected = selectedPack?.credits === pkg.credits;
                  return (
                    <div 
                       key={pkg.credits}
                      onClick={() => handlePackageSelect(pkg)}
                      className={`relative flex items-center justify-between p-3 rounded-xl border transition duration-150 cursor-pointer overflow-hidden ${
                        isSelected 
                          ? "bg-indigo-600/10 border-blue-500/80 shadow-md shadow-indigo-600/5" 
                          : "bg-slate-950/40 border-indigo-950/60 hover:border-indigo-900/50"
                      }`}
                    >
                      {/* Popular selection badge highlighter */}
                      {pkg.isPopular && (
                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-black tracking-widest px-2 py-0.5 rounded-bl-lg uppercase">
                          POPULER
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected ? "bg-indigo-500 text-white" : "bg-indigo-950/60 text-indigo-400 border border-indigo-900/40"
                        }`}>
                          {pkg.credits}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-100 font-mono">
                              {pkg.credits} Kredit
                            </span>
                            {pkg.badge && (
                              <span className="text-[9px] bg-slate-800 text-indigo-300 border border-indigo-950 px-1.5 py-0.5 rounded-full font-bold">
                                {pkg.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Pengerjaan: Turnitin Similarity Check / AI Penulisan
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-white font-mono block">
                          {pkg.priceText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Proceed Selection Action */}
              <div className="pt-6 border-t border-indigo-950/45 flex items-center justify-between gap-4">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-bold font-mono">TOTAL PEMBAYARAN KAK MELDA:</span>
                  <span className="text-base font-black text-white font-mono">
                    {selectedPack ? selectedPack.priceText : "Rp 0"}
                  </span>
                </div>
                <button
                  onClick={handleGoToPayment}
                  disabled={!selectedPack}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 duration-150 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Lanjutkan Pembelian</span>
                  <ArrowRight size={14} className="animate-pulse" />
                </button>
              </div>

            </div>
          )}

          {/* ==================== STEP 2: SHOW CHECKOUT DIRECT TO WHATSAPP ==================== */}
          {step === "pay" && selectedPack && (
            <div className="flex-1 flex flex-col justify-between py-4 space-y-5 animate-fade-in">
              <div className="space-y-4">
                <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">PAKET DIPILIH</span>
                      <h4 className="text-base font-black text-[#00E5FF] mt-1 flex items-center gap-1.5 font-sans">
                        <Coins className="text-amber-400 w-5 h-5 shrink-0" />
                        {selectedPack.credits} Saldo Kredit Turnitin
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Pemeriksaan naskah / Turnitin No-Repository otomatis
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block font-mono">HARGA PAKET</span>
                      <span className="text-lg font-black text-amber-400 font-mono block mt-1">
                        {selectedPack.priceText}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-indigo-950/60 pt-3.5 space-y-3">
                    <div className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Phone className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="text-white block">Metode Order Langsung WhatsApp</strong>
                        <span className="text-slate-440 text-[11px] block text-slate-400">
                          Hubungi WhatsApp Admin untuk mendapatkan nomor rekening / e-wallet transfer, dan kredit akan segera diaktifkan seketika setelah bukti transfer Anda dikirimkan.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main WhatsApp Direct Hub button */}
                <div className="space-y-2.5">
                  <a
                    href={`https://wa.me/6282261858077?text=${encodeURIComponent(
                      `Yth. Admin Queen Similarity Check,

Selamat pagi/siang/sore. Saya ${userProfile.fullName || 'Pelanggan'} (${userProfile.email || ''}) ingin mengajukan pembelian paket kredit uji Turnitin dengan rincian berikut:

- Paket: ${selectedPack.credits} Kredit Turnitin No-Repository
- Total Biaya: Rp ${selectedPack.price.toLocaleString('id-ID')}

Mohon informasi mengenai nomor rekening atau e-wallet untuk pembayaran, serta panduan aktivasi keping kredit ke akun saya setelah pembayaran berhasil. Terima kasih banyak atas bantuan dan pelayanannya.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-[#25D366] hover:bg-[#20BA5A] text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2.5 duration-150 shadow-md cursor-pointer text-center uppercase tracking-wider block"
                  >
                    <Phone size={14} fill="currentColor" className="shrink-0" />
                    <span>Hubungi WhatsApp Admin untuk Membayar</span>
                  </a>

                  <p className="text-[10.5px] text-center text-slate-400 leading-none">
                    WhatsApp Admin: <strong className="text-slate-200">0822-6185-8077</strong>
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setStep("select")}
                  className="w-full text-center text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-wider block hover:underline cursor-pointer"
                >
                  ← Kembali pilih paket
                </button>
              </div>
            </div>
          )}

          {/* ==================== STEP 3: TRANSACTION SUCCESS CONFIRMATION ==================== */}
          {step === "success" && selectedPack && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-6">
              
              {/* Huge animated checkmark */}
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/5 animate-fade-in relative">
                <Check size={32} className="stroke-[3]" />
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping -z-10" />
              </div>

              <div>
                <h5 className="text-xl font-extrabold text-white font-display">
                  Kredit Sukses Ditambahkan!
                </h5>
                <p className="text-xs text-slate-450 mt-2 max-w-md text-slate-400 leading-relaxed font-sans">
                  Saldo pengerjaan sebesar <strong className="text-emerald-400 font-mono">{selectedPack.credits} Kredit</strong> seharga <strong className="text-emerald-400 font-mono">{selectedPack.priceText}</strong> telah diaktifkan pada akun Anda secara sukses!
                </p>
              </div>

              {/* Invoice snapshot styling */}
              <div className="bg-slate-950/60 border border-indigo-950 rounded-2xl p-5 w-full max-w-sm space-y-3.5 text-xs">
                
                <div className="flex justify-between border-b border-indigo-950/60 pb-2 bg-slate-950/20 px-1 font-mono text-[10px] text-slate-400">
                  <span>REF ID: QSC-WA-{Math.floor(100000 + Math.random() * 900000)}</span>
                  <span>{new Date().toLocaleDateString("id-ID")}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Penyedia Layanan</span>
                    <span className="text-slate-200 font-bold text-right text-[11px]">ADMIN QUEEN SIMILARITY CHECK</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-mono">Jumlah Pembayaran</span>
                    <span className="text-slate-200 font-bold font-mono">{selectedPack.priceText}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Paket Diterima</span>
                    <span className="text-[#00E5FF] font-black font-mono">+{selectedPack.credits} Kredit Turnitin</span>
                  </div>
                </div>

                <div className="border-t border-indigo-950/60 pt-3 flex justify-between items-center">
                  <span className="text-slate-450 uppercase text-[10px] font-bold text-slate-400 font-mono">Total Saldo Kredit Baru</span>
                  <span className="text-xl font-black text-white font-mono leading-none flex items-center gap-1">
                    <span>{userProfile.kreditSisa}</span>
                    <span className="text-[10px] text-slate-400 font-normal">Kred</span>
                  </span>
                </div>

              </div>

              {/* Close success action */}
              <button
                onClick={handleClose}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer duration-150 uppercase tracking-widest"
              >
                Kembali ke Dashboard Kerja
              </button>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
