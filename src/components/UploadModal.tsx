import React, { useState } from "react";
import { X, Upload, FileText, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { CheckedDocument } from "../types";

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: (newDoc: CheckedDocument, fileData?: string | File) => void;
  kreditSisa: number;
}

export default function UploadModal({ onClose, onUploadSuccess, kreditSisa }: UploadModalProps) {
  const [docTitle, setDocTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mockFileName, setMockFileName] = useState("");
  const [mockFileSize, setMockFileSize] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Advanced features requested
  const [checkType, setCheckType] = useState<"Standard" | "Turnitin-AI">("Standard");
  const [excludeBibliography, setExcludeBibliography] = useState(false);
  const [excludeQuotes, setExcludeQuotes] = useState(false);
  const [excludeSmallSources, setExcludeSmallSources] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (pickedFile: File) => {
    const extension = pickedFile.name.split(".").pop()?.toLowerCase();
    if (extension !== "pdf" && extension !== "docx") {
      setErrorStatus("Format salah! Sistem hanya menerima file berekstensi .pdf atau .docx.");
      return;
    }

    setFile(pickedFile);
    setMockFileName(pickedFile.name);
    
    // Simulate neat formatted file size
    const sizeInMB = pickedFile.size / (1024 * 1024);
    setMockFileSize(`${sizeInMB.toFixed(2)} MB`);
    
    setErrorStatus(null);

    // Auto-predict title from filename if title is empty
    if (!docTitle) {
      const cleanTitle = pickedFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setDocTitle(cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1));
    }
  };

  // Helper trigger random mock upload
  const triggerMockDoc = (title: string, pType: "pdf" | "docx") => {
    const mockNames = {
      pdf: "Tesis_Akhir_Melda_SimilarityCheck.pdf",
      docx: "Skripsi_Sains_Kebijakan_Publik_Nusantara.docx",
    };
    setMockFileName(mockNames[pType]);
    setMockFileSize(pType === "pdf" ? "2.41 MB" : "1.15 MB");
    setDocTitle(title);
    setErrorStatus(null);
    setFile(new File([], mockNames[pType]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!docTitle.trim()) {
      setErrorStatus("Judul Dokumen wajib diisi untuk penamaan laporan Turnitin.");
      return;
    }

    if (!file && !mockFileName) {
      setErrorStatus("Silakan unggah atau seret file PDF / DOCX terlebih dahulu.");
      return;
    }

    const requiredCredits = checkType === "Turnitin-AI" ? 10 : 1;
    if (kreditSisa < requiredCredits) {
      setErrorStatus(`Maaf, kredit Anda tidak mencukupi untuk Cek ini (Butuh ${requiredCredits} kredit, Anda hanya memiliki ${kreditSisa} kredit). Silakan hubungi Admin.`);
      return;
    }

    // Pass the raw File directly if we have one, otherwise fallback to mock text Base64
    let fileDataToSend: File | string | undefined = undefined;
    if (file && file.size > 0) {
      fileDataToSend = file;
    } else {
      const mockStr = `NASKAH ORIGINAL UNTUK TURNITIN CHECKER\n` +
        `======================================\n` +
        `Judul: ${docTitle.trim()}\n` +
        `Tanggal Unggah: ${new Date().toLocaleDateString("id-ID")}\n` +
        `Konfigurasi Filter:\n` +
        `- Exclude Bibliography: ${excludeBibliography ? "AKTIF" : "NONAKTIF"}\n` +
        `- Exclude Quotes: ${excludeQuotes ? "AKTIF" : "NONAKTIF"}\n` +
        `- Exclude Small Sources: ${excludeSmallSources ? "AKTIF" : "NONAKTIF"}\n\n` +
        `Isi Dokumen:\n` +
        `Ini adalah dokumen simulasi akademik yang diunggah oleh Pelanggan untuk diuji plagiasi menggunakan Turnitin No-Repository.\n` +
        `Sistem mengizinkan Admin Instruktur mengunduh berkas asli ini untuk dimasukkan ke sistem Turnitin Anda.`;
      
      try {
        fileDataToSend = "data:text/plain;base64," + btoa(unescape(encodeURIComponent(mockStr)));
      } catch (err) {
        console.error("Gagal membuat fallback base64 file:", err);
      }
    }

    // Generate relative server download path (the client-side preview will also point here)
    const newDocId = `QSC-${Math.floor(100000 + Math.random() * 900000)}`;

    // Set item structure
    const newDocObj: CheckedDocument = {
      id: newDocId,
      title: docTitle.trim(),
      filename: mockFileName,
      fileSize: mockFileSize || "1.2 MB",
      uploadDate: new Date().toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      status: "Memproses", // Start with processing!
      checkType: checkType,
      creditCost: requiredCredits,
      fileUrl: `/api/download/${newDocId}`,
      filters: {
        excludeBibliography,
        excludeQuotes,
        excludeSmallSources,
      },
    };

    onUploadSuccess(newDocObj, fileDataToSend);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header bar */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-indigo-600" />
            <h3 className="font-display font-bold text-slate-800 text-sm">Upload File Baru (Turnitin No-Repository)</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition duration-150 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Form body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Warning Kredit */}
          {kreditSisa <= 0 ? (
            <div className="bg-rose-50 text-rose-800 text-xs p-3.5 rounded-xl border border-rose-100 flex items-start gap-2.5">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <div>
                <strong>Kredit Pemeriksaan Habis!</strong> Anda membutuhkan minimal 1 kredit pelanggan untuk melakukan pengecekan. Silakan hubungi admin atau klik tombol <em>Tambah Paket</em>.
              </div>
            </div>
          ) : (
            <div className="bg-indigo-50 text-indigo-950 text-xs p-3.5 rounded-xl border border-indigo-100/50 flex gap-2.5">
              <Info size={15} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                Setiap unggahan file Turnitin akan mengurangi saldo kredit Anda sebanyak <strong className="text-indigo-700">1 kredit</strong>. File Anda dijamin <strong className="text-indigo-700">no-repository</strong> (tidak akan tersimpan di database Turnitin).
              </div>
            </div>
          )}

          {/* Title input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 block">JUDUL NASKAH / DOKUMEN UTAMA</label>
            <input
              type="text"
              className="w-full text-slate-800 text-sm border border-slate-200 rounded-xl px-4 py-3 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
              placeholder="Masukan nama judul naskah, jurnal, skripsi, atau nama bab dokumen..."
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              disabled={kreditSisa <= 0}
            />
          </div>

          {/* Pilih Tipe Pemeriksaan & Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
            {/* Tipe Cek */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 tracking-wider block uppercase">
                TIPE PEMERIKSAAN
              </label>
              <div className="space-y-1.5">
                <label className={`flex items-start gap-2 px-2.5 py-2 rounded-lg border transition-all cursor-pointer ${checkType === "Standard" ? "bg-indigo-50/50 border-indigo-200" : "bg-white border-slate-200/60"}`}>
                  <input
                    type="radio"
                    name="checkType"
                    checked={checkType === "Standard"}
                    onChange={() => setCheckType("Standard")}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Similarity Check</span>
                    <span className="text-[10px] text-slate-500 block font-medium">Beban: 1 Kredit</span>
                  </div>
                </label>
                <label className={`flex items-start gap-2 px-2.5 py-2 rounded-lg border transition-all cursor-pointer ${checkType === "Turnitin-AI" ? "bg-indigo-55/10 border-indigo-500 bg-indigo-50/20" : "bg-white border-slate-200/60"}`}>
                  <input
                    type="radio"
                    name="checkType"
                    checked={checkType === "Turnitin-AI"}
                    onChange={() => setCheckType("Turnitin-AI")}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      Cek Turnitin AI Detection ✨
                    </span>
                    <span className="text-[10px] text-indigo-600 font-bold block">Beban: 10 Kredit</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Filter Plagiarisme (Kecualikan) */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 tracking-wider block uppercase">
                FILTER SETTINGS (EXCLUDE)
              </label>
              <div className="space-y-1 bg-white p-2 text-xs rounded-lg border border-slate-200 font-sans">
                <label className="flex items-center gap-2 p-1 text-xs text-slate-700 cursor-pointer hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={excludeBibliography}
                    onChange={(e) => setExcludeBibliography(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-200/50"
                  />
                  <span className="font-medium">Exclude Bibliography</span>
                </label>
                <label className="flex items-center gap-2 p-1 text-xs text-slate-700 cursor-pointer hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={excludeQuotes}
                    onChange={(e) => setExcludeQuotes(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-200/50"
                  />
                  <span className="font-medium">Exclude Quotes</span>
                </label>
                <label className="flex items-center gap-2 p-1 text-xs text-slate-700 cursor-pointer hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={excludeSmallSources}
                    onChange={(e) => setExcludeSmallSources(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-200/50"
                  />
                  <span className="font-medium">Exclude Small Sources</span>
                </label>
              </div>
            </div>
          </div>

          {/* File Upload drag-and-drop zone */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 block">FILE NASKAH (.PDF ATAU .DOCX)</label>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition duration-150 cursor-pointer ${
                isDragOver 
                  ? "border-indigo-500 bg-indigo-50/50" 
                  : "border-slate-200 bg-slate-50/40 hover:bg-slate-50/80"
              } ${kreditSisa <= 0 ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
            >
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                disabled={kreditSisa <= 0}
              />
              
              <label htmlFor="file-input" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-2xs mb-3">
                  <Upload size={20} className="text-indigo-600" />
                </div>
                
                {mockFileName ? (
                  <div className="space-y-1">
                    <p className="font-medium text-xs text-slate-800 truncate max-w-[280px] mx-auto">
                      {mockFileName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded inline-block">
                      {mockFileSize}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Seret file ke sini atau <span className="text-indigo-600 font-semibold hover:underline">Pilih Berkas</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Maksimal ukuran file 15 MB • Mendukung PDF dan DOCX
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Quick Demo File Helpers (Pure Craftsmanship) */}
          {kreditSisa > 0 && !mockFileName && (
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-600 block mb-1">Pilih Dokumen Contoh (Saran Pengujian Cepat):</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => triggerMockDoc("Tesis Ilmu Pemerintahan Nusantara", "pdf")}
                  className="bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/50 px-2.5 py-1.5 rounded transition text-left cursor-pointer text-[10.5px] font-semibold"
                >
                  📄 File Contoh .PDF
                </button>
                <button
                  type="button"
                  onClick={() => triggerMockDoc("Artikel Analisis Ekonomi Melda", "docx")}
                  className="bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50/50 px-2.5 py-1.5 rounded transition text-left cursor-pointer text-[10.5px] font-semibold"
                >
                  📝 File Contoh .DOCX
                </button>
              </div>
            </div>
          )}

          {/* Error alerts */}
          {errorStatus && (
            <div className="bg-rose-50 text-rose-800 text-xs p-3 rounded-xl border border-rose-100 flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0 animate-bounce" />
              <span>{errorStatus}</span>
            </div>
          )}

          {/* Back out CTAs */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3.5">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold px-4 py-3.5 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={kreditSisa <= 0}
              className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 font-semibold px-5 py-3.5 rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
            >
              Proses Cek Turnitin
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
