import React, { useState } from "react";
import { X, Copy, Check, Download, FileText, Sparkles, AlertCircle, Info, Link2, BookOpen, MessageSquare, Upload, CheckCircle } from "lucide-react";
import { CheckedDocument, UserProfile } from "../types";

interface AdminTurnitinResultModalProps {
  document: CheckedDocument;
  customer: UserProfile | null;
  onClose: () => void;
  onSave: (
    documentId: string,
    similarityPercent: number,
    aiPercent: number | undefined,
    feedback: string,
    reportUrl?: string,
    reportFileData?: string | File,
    reportFileName?: string
  ) => Promise<void> | void;
  authenticatedFetch?: (url: string, options?: RequestInit) => Promise<Response>;
}

export default function AdminTurnitinResultModal({
  document,
  customer,
  onClose,
  onSave,
  authenticatedFetch
}: AdminTurnitinResultModalProps) {
  const [similarity, setSimilarity] = useState<number>(document.similarityPercent ?? 15);
  const [aiPercent, setAiPercent] = useState<number>(document.aiPercent ?? 0);
  const [hasAiCheck, setHasAiCheck] = useState<boolean>(document.checkType === "Turnitin-AI");
  const [feedback, setFeedback] = useState<string>(
    document.feedback ||
    `Hasil pemeriksaan Turnitin Instructor tuntas. Similarity Index ${document.similarityPercent ?? 18}% terbukti aman no-repository.`
  );
  const [reportUrl, setReportUrl] = useState<string>(document.reportUrl || "");
  const [reportFileData, setReportFileData] = useState<string | undefined>(undefined);
  const [reportFileName, setReportFileName] = useState<string | undefined>(document.reportFileName || undefined);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>(
    document.reportUrl ? (document.reportUrl.startsWith("blob:") ? "Berkas Laporan Terunggah" : "Menggunakan Tautan Eksternal") : ""
  );
  const [isFileDragOver, setIsFileDragOver] = useState(false);
  
  // States for automatic AI PDF scanning
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("");

  const handleResultFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileObj = e.target.files[0];
      processResultFile(fileObj);
    }
  };

  const processResultFile = async (fileObj: File) => {
    try {
      const sizeInMB = fileObj.size / (1024 * 1024);
      setReportUrl(`/api/view-report/${document.id}`);
      setUploadedFileName(`${fileObj.name} (${sizeInMB.toFixed(2)} MB)`);
      setReportFileName(fileObj.name);
      setReportFileData(fileObj as any);

      // 1. Instantly perform name pattern detection as immediate fallback feedback
      const name = fileObj.name;
      let detectedSim: number | null = null;
      let detectedAi: number | null = null;

      // Pattern 1: look for Turnitin standard AI score, e.g. "AI_19%" or "AI-19" or "AI 19%"
      const aiMatch = name.match(/AI[\s-_]*(\d{1,2})\s*%/i) || name.match(/AI[\s-_]*(\b\d{1,2}\b)/i);
      if (aiMatch) {
        detectedAi = parseInt(aiMatch[1]);
      }

      // Pattern 2: look for percentages, e.g., "15%" or "similarity_15%" or "15"
      const pctMatches = Array.from(name.matchAll(/(\d{1,2})\s*%/g));
      if (pctMatches.length > 0) {
        if (pctMatches.length >= 2 && detectedAi !== null) {
          const firstVal = parseInt(pctMatches[0][1]);
          const secondVal = parseInt(pctMatches[1][1]);
          detectedSim = (firstVal === detectedAi) ? secondVal : firstVal;
        } else {
          detectedSim = parseInt(pctMatches[0][1]);
        }
      } else {
        const simMatch = name.match(/sim[a-z_]*[\s-_]*(\d{1,2})/i);
        if (simMatch) {
          detectedSim = parseInt(simMatch[1]);
        } else {
          const standaloneNums = name.match(/\b\d{1,2}\b/g);
          if (standaloneNums && standaloneNums.length > 0) {
            detectedSim = parseInt(standaloneNums[0]);
          }
        }
      }

      if (detectedSim !== null && detectedSim >= 0 && detectedSim <= 100) {
        setSimilarity(detectedSim);
        setFeedback(`Hasil pemeriksaan Turnitin Instructor tuntas. Similarity Index ${detectedSim}% terbukti aman no-repository.`);
      }

      if (detectedAi !== null && detectedAi >= 0 && detectedAi <= 100) {
        setAiPercent(detectedAi);
        setHasAiCheck(true);
      }

      // 2. Perform deep AI parsing if authenticatedFetch is available
      if (authenticatedFetch) {
        setIsAnalyzing(true);
        setAnalysisStatus("Mengunggah & menganalisis isi laporan via AI...");
        try {
          const formData = new FormData();
          formData.append("reportFile", fileObj);
          formData.append("reportFileName", fileObj.name);

          const res = await authenticatedFetch("/api/analyze-report", {
            method: "POST",
            body: formData
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              if (typeof data.similarityPercent === "number") {
                setSimilarity(data.similarityPercent);
              }
              if (typeof data.aiPercent === "number") {
                setAiPercent(data.aiPercent);
                if (data.aiPercent > 0) {
                  setHasAiCheck(true);
                }
              }
              if (data.feedback) {
                setFeedback(data.feedback);
              }
              setAnalysisStatus("Mendeteksi kemiripan dan ulasan akademis secara akurat! ✨");
            } else {
              setAnalysisStatus("AI gagal memproses dokumen, menggunakan pola nama berkas.");
            }
          } else {
            setAnalysisStatus("Respon server bermasalah, menggunakan pola nama berkas.");
          }
        } catch (apiErr) {
          console.error("Gagal melakukan analisis laporan AI:", apiErr);
          setAnalysisStatus("Gagal analisis laporan AI, menggunakan pola nama berkas.");
        } finally {
          setTimeout(() => {
            setIsAnalyzing(false);
          }, 2000);
        }
      }

    } catch (err) {
      console.error(err);
      alert("Format atau pembacaan file gagal!");
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Pre-made academic templates
  const templates = [
    {
      title: "No-Repository Aman",
      text: `Hasil pemeriksaan Turnitin Instructor tuntas. Similarity Index ${similarity}% terbukti aman no-repository. Berkas tidak terekam pada pangkalan data mana pun.`
    },
    {
      title: "Similarity Agak Tinggi",
      text: `Pemeriksaan selesai dengan indeks ${similarity}%. Terdapat kecocokan agak tinggi di tinjauan pustaka. Disarankan melakukan parafrase tipis agar skor kemiripan berada di bawah 20%.`
    },
    {
      title: "AI & Plagiarisme Aman",
      text: `Verifikasi Turnitin Instruktur selesai. Similarity Index sebesar ${similarity}%${hasAiCheck ? ` dan AI detected sebesar ${aiPercent}%` : ""}. Secara akademik dokumen ini siap diajukan.`
    },
    {
      title: "Kecualikan Filter Aktif",
      text: `Pemeriksaan selesai. Daftar pustaka (Excl Bibliography) dan kutipan langsung (Excl Quotes) telah disaring keluar dari kalkulasi indeks saringan kelas instruktur.`
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSave(
        document.id,
        similarity,
        hasAiCheck ? aiPercent : undefined,
        feedback.trim(),
        reportUrl.trim() || undefined,
        reportFileData,
        reportFileName
      );
    } catch (err: any) {
      console.error(err);
      setSubmitError(err?.message || "Gagal mengunggah laporan Turnitin. Silakan periksa konektivitas Anda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSimColor = (pct: number) => {
    if (pct < 10) return "text-green-600 bg-green-50 border-green-200";
    if (pct < 25) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (pct < 50) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getAiColor = (pct: number) => {
    if (pct < 15) return "text-indigo-600 bg-indigo-50 border-indigo-200";
    if (pct < 40) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col font-sans max-h-[92vh] animate-fade-in">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-amber-500 to-indigo-600 p-2 rounded-xl text-white">
              <Sparkles size={16} className="animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Instruktur Portal Integration</h3>
              <h2 className="font-bold text-sm text-slate-100 truncate max-w-[400px]">
                Panduan & Input Turnitin Instruktur Manual
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 px-2 text-slate-400 hover:text-white rounded bg-slate-800/60 hover:bg-slate-800 transition text-[11px] font-bold flex items-center gap-1 cursor-pointer"
          >
            <X size={14} /> Tutup
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Instruksi Manual Turnitin Instruktur */}
          <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/80 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800 text-xs">🛠️ Langkah Integrasi Manual Turnitin Instructor</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Gunakan akun Turnitin Instruktur Kelas Anda untuk melakukan pengujian bebas simpan (No-Repository). Ikuti arahan cepat berikut:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
              {/* Copy data helpers */}
              <div className="bg-white p-3 rounded-lg border border-slate-150 space-y-2 shadow-2xs">
                <span className="font-bold text-slate-700 block border-b border-dashed border-slate-100 pb-1">📋 Data Unggahan Klien</span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <span className="text-slate-400">First Name:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(customer?.fullName.split(" ")[0] || "Queen", "fname")}
                      className="text-indigo-600 hover:underline font-mono font-bold flex items-center gap-0.5"
                    >
                      {copiedText === "fname" ? <Check size={10} /> : <Copy size={9} />}
                      {customer?.fullName.split(" ")[0] || "Queen"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <span className="text-slate-400">Last Name:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(customer?.fullName.split(" ").slice(1).join(" ") || "Similarity", "lname")}
                      className="text-indigo-600 hover:underline font-mono font-bold flex items-center gap-0.5"
                    >
                      {copiedText === "lname" ? <Check size={10} /> : <Copy size={9} />}
                      {customer?.fullName.split(" ").slice(1).join(" ") || "Similarity"}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <span className="text-slate-400">Naskah Title:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(document.title, "title")}
                      className="text-indigo-600 hover:underline font-bold font-sans truncate max-w-[120px] flex items-center gap-0.5"
                      title={document.title}
                    >
                      {copiedText === "title" ? <Check size={10} /> : <Copy size={9} />}
                      {document.title}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action directives */}
              <div className="bg-white p-3 rounded-lg border border-slate-150 flex flex-col justify-between shadow-2xs">
                <div>
                  <span className="font-bold text-slate-700 block border-b border-dashed border-slate-100 pb-1">📂 Langkah Pemeriksaan</span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    Unduh file asli pelanggan, lalu unggah secara manual di halaman pengelolaan Turnitin Instruktur Anda.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <a
                    href="https://www.turnitin.com/login_page.asp"
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-[10px] transition flex items-center gap-1.5"
                  >
                    Buka Turnitin 🌐
                  </a>
                  {document.fileUrl ? (
                    <a
                      href={document.fileUrl}
                      download={document.filename || "naskah-pelanggan.pdf"}
                      className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-[10px] transition flex items-center justify-center gap-1.5 select-none"
                    >
                      <Download size={10} /> Download Naskah
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const mockContent = `NASKAH ORIGINAL UNTUK TURNITIN CHECKER\n======================================\nJudul: ${document.title}\nID Dokumen: ${document.id}\nTanggal: ${document.uploadDate}\n\nIsi Dokumen:\nIni adalah naskah asli dari ${document.title} yang diunggah oleh pelanggan untuk diuji di Turnitin Instruktur Kelas.`;
                        const blob = new Blob([mockContent], { type: "text/plain;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const tempLink = window.document.createElement("a");
                        tempLink.href = url;
                        tempLink.download = document.filename || "naskah-klien.txt";
                        window.document.body.appendChild(tempLink);
                        tempLink.click();
                        window.document.body.removeChild(tempLink);
                      }}
                      className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-[10px] transition flex items-center justify-center gap-1.5 cursor-pointer selection:bg-indigo-200"
                    >
                      <Download size={10} /> Download Naskah
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Highlight Badge list */}
            <div className="bg-white/60 p-2.5 rounded-lg border border-slate-150 flex flex-wrap items-center gap-2 text-[10px]">
              <span className="font-bold text-slate-500">Filter Aktif yang Dipesan Klien:</span>
              <span className="bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                {document.checkType === "Turnitin-AI" ? "🧪 Turnitin AI Check" : "📊 Similarity Standard"}
              </span>
              {document.filters?.excludeBibliography && (
                <span className="bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded">Exclude Bibliography ✅</span>
              )}
              {document.filters?.excludeQuotes && (
                <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">Exclude Quotes ✅</span>
              )}
              {document.filters?.excludeSmallSources && (
                <span className="bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">Exclude Small Sources ✅</span>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500" /> Hasil Input Nilai Deteksi Instruktur
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Slider 1: Similarity Score */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Similarity Index (%)</span>
                  <span className={`px-2 py-0.5 text-xs font-bold font-mono rounded border ${getSimColor(similarity)}`}>
                    {similarity}% Similarity
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={similarity}
                  onChange={(e) => setSimilarity(Number(e.target.value))}
                  className="w-full accent-indigo-600 block cursor-pointer"
                />
                <p className="text-[10px] text-slate-400">
                  Geser slider sesuai dengan indeks kemiripan Turnitin Instruktur Anda.
                </p>
              </div>

              {/* Slider 2: AI Percentage (Conditioned based on selection toggler) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={hasAiCheck}
                        onChange={(e) => setHasAiCheck(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      Turnitin AI Score
                    </label>
                    {hasAiCheck && (
                      <span className={`px-2 py-0.5 text-xs font-bold font-mono rounded border ${getAiColor(aiPercent)}`}>
                        {aiPercent}% AI Content
                      </span>
                    )}
                  </div>

                  {hasAiCheck ? (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={aiPercent}
                      onChange={(e) => setAiPercent(Number(e.target.value))}
                      className="w-full accent-emerald-600 block cursor-pointer transition-all"
                    />
                  ) : (
                    <div className="text-[10px] text-slate-400 bg-white p-2 border border-slate-200 rounded leading-snug">
                      Pilihan ini tidak meminta skor AI secara bawaan. Centang checkbox di atas jika Anda ingin memaksa memasukkan skor AI Content.
                    </div>
                  )}
                </div>
                {hasAiCheck && (
                  <p className="text-[10px] text-slate-400 mt-2">
                    Geser slider sesuai dengan grafik deteksi AI (Artificial Intelligence %) di samping panel Turnitin.
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* Section 3: Tempat Upload File Kembali (Turnitin Output PDF/Zip/Doc) & Link Option */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider mb-1">
                📤 Upload File Hasil Turnitin (Simpan & Kirim ke Pelanggan)
              </label>
              <p className="text-[10px] text-slate-400">
                Hubungkan file hasil pengecekan Turnitin (PDF/ZIP/DOCX) agar bisa langsung didownload oleh pelanggan Anda.
              </p>
            </div>

            {/* Drag & drop or Click to upload area */}
            <input
              id="admin-result-file-input"
              type="file"
              className="hidden"
              onChange={handleResultFileChange}
              onClick={(e) => e.stopPropagation()}
            />
            <div
              onDragOver={(e) => { e.preventDefault(); setIsFileDragOver(true); }}
              onDragLeave={() => setIsFileDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsFileDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  processResultFile(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition duration-150 cursor-pointer ${
                isFileDragOver 
                  ? "border-indigo-500 bg-indigo-50/50" 
                  : isAnalyzing
                    ? "border-indigo-400 bg-indigo-50/20"
                    : uploadedFileName 
                      ? "border-emerald-300 bg-emerald-50/20" 
                      : "border-slate-300 hover:border-indigo-400 bg-white"
              }`}
              onClick={() => window.document.getElementById("admin-result-file-input")?.click()}
            >
              {isAnalyzing ? (
                <div className="space-y-2 py-2">
                  <div className="inline-flex items-center justify-center p-2 bg-indigo-100 rounded-full text-indigo-600 mb-1">
                    <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-indigo-700 animate-pulse font-sans">Membaca Dokumen Laporan... 🤖</p>
                  <p className="text-[10px] text-slate-500 leading-normal max-w-sm mx-auto font-sans">{analysisStatus}</p>
                </div>
              ) : uploadedFileName ? (
                <div className="space-y-1">
                  <div className="inline-flex items-center justify-center p-1.5 bg-emerald-100 rounded-full text-emerald-600 mb-1">
                    <CheckCircle className="w-5 h-5 animate-pulse" />
                  </div>
                  <p className="text-xs font-bold text-emerald-800">File Hasil Turnitin Berhasil Terlampir!</p>
                  <p className="text-[11px] text-slate-605 font-mono break-all text-slate-600">{uploadedFileName}</p>
                  <p className="text-[9px] text-slate-400 underline mt-1">Klik di sini untuk mengganti berkas unggahan</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="inline-flex items-center justify-center p-1.5 bg-slate-100 rounded-full text-slate-500 mb-1">
                    <Upload className="w-5 h-5 text-indigo-500 animate-bounce" style={{ animationDuration: '3s' }} />
                  </div>
                  <p className="text-[11px] font-bold text-slate-705 font-sans text-slate-700">Tarik & Lepas File di sini atau <span className="text-indigo-600 underline">Cari Berkas</span></p>
                  <p className="text-[9px] text-slate-400 font-sans">Mendukung format PDF, ZIP, DOCX, dll.</p>
                </div>
              )}
            </div>

            {/* OR text separator */}
            <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold font-mono">
              <span className="h-px bg-slate-200 flex-1"></span>
              <span>ATAU TARUH TAUTAN (LINK)</span>
              <span className="h-px bg-slate-200 flex-1"></span>
            </div>

            {/* Alternatif link Drive url input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Link2 size={12} className="text-slate-400" /> Link File Report PDF / Drive (Alternatif / Cadangan)
              </label>
              <input
                type="text"
                value={reportUrl}
                onChange={(e) => {
                  setReportUrl(e.target.value);
                  if (e.target.value === "") {
                    setUploadedFileName("");
                  } else if (!e.target.value.startsWith("blob:")) {
                    setUploadedFileName("Menggunakan Tautan Eksternal");
                  }
                }}
                placeholder="e.g. https://drive.google.com/file/d/... atau taruh file url"
                className="w-full p-2 bg-white text-xs text-slate-800 border border-slate-350 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
              />
              <p className="text-[9px] text-slate-400 leading-snug font-sans">
                Jika Anda mengunggah berkas secara langsung di atas, bidang tautan ini akan otomatis terisi Object Blob. Anda tetap bebas menimpa dengan tautan Google Drive / OneDrive Anda secara manual.
              </p>
            </div>
          </div>

          {/* Section 4: Academic Feedback Remarks with Quick Templates */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare size={13} className="text-slate-400" /> Catatan Akademik & Ulasan Instruktur
              </label>
              <span className="text-[10px] font-bold text-slate-400">Format Human-Readable</span>
            </div>

            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed text-slate-700"
              placeholder="Kebebasan penyusunan saran akademik kepada penulis..."
            />

            {/* Template Selector Grid */}
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Saran Kilat (Template):</span>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFeedback(tpl.text)}
                    className="p-2 text-left bg-white hover:bg-slate-50 border border-slate-250 rounded-lg text-[9.5px] text-slate-650 transition truncate hover:border-slate-400 select-none cursor-pointer"
                    title={tpl.text}
                  >
                    💡 <strong className="text-slate-800">{tpl.title}</strong>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-2.5">
            <Info size={14} className="text-indigo-600 shrink-0" />
            <p className="text-[10.5px] text-slate-500 leading-normal font-sans">
              Menyetujui postingan ini akan secara otomatis mengubah status dokumen menjadi <strong className="text-green-700">Selesai (Completed)</strong>. Pelanggan akan melihat ikon unduhan dan tombol <strong>"Lihat Hasil Plagiasi"</strong> seketika pada halaman utama mereka.
            </p>
          </div>

        </form>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {submitError ? (
            <div className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
              <AlertCircle size={14} className="shrink-0 text-red-500 animate-bounce" /> {submitError}
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer disabled:opacity-40"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className={`px-5 py-2.5 bg-indigo-600 ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-indigo-700 cursor-pointer'} text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Mengunggah Laporan...
                </>
              ) : (
                "Post Hasil Turnitin Instruktur ✨"
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
