import React, { useState } from "react";
import { X, Download, Printer, ExternalLink, HelpCircle, FileText, CheckCircle2 } from "lucide-react";
import { CheckedDocument } from "../types";

interface TurnitinReportModalProps {
  document: CheckedDocument;
  onClose: () => void;
}

export default function TurnitinReportModal({ document, onClose }: TurnitinReportModalProps) {
  const percentage = document.similarityPercent || 0;
  const [activeTab, setActiveTab] = useState<"PDF" | "ANALISIS">(document.reportUrl ? "PDF" : "ANALISIS");
  
  // Custom color based on similarity percentage
  const getSimColor = (pct: number) => {
    if (pct < 10) return "bg-green-600 text-white";
    if (pct < 25) return "bg-yellow-500 text-slate-900";
    if (pct < 50) return "bg-orange-500 text-white";
    return "bg-red-600 text-white";
  };

  const getSimBorderColor = (pct: number) => {
    if (pct < 10) return "border-green-600 text-green-700";
    if (pct < 25) return "border-yellow-500 text-yellow-700";
    if (pct < 50) return "border-orange-500 text-orange-700";
    return "border-red-600 text-red-700";
  };

  // Static highly-realistic text with plagiarism markers for simulation
  const dummyHighlightedParagraphs = [
    {
      text: "Latar Belakang: Penelitian ini bertujuan untuk menganalisis kegunaan kecerdasan buatan dalam dunia pendidikan tinggi.",
      matchId: 0,
      source: "",
    },
    {
      text: " Menurut Girsang (2025), penerapan teknologi machine learning dapat menghemat waktu pengoreksian dokumen akademik hingga delapan puluh persen dari waktu normal.",
      matchId: 1, // match
      source: "repository.unand.ac.id (Internet Source)",
      pct: "3%",
    },
    {
      text: " Namun demikian, integrasi ini tidak lepas dari berbagai tantangan etis seperti timbulnya bias algoritma, berkurangnya sentuhan humanis dalam bimbingan, serta maraknya isu plagiarisme tidak sengaja (accidental plagiarism) oleh mahasiswa.",
      matchId: 0,
      source: "",
    },
    {
      text: " Oleh karena itu, diperlukan sistem deteksi keaslian karya tulis yang no-repository guna melindungi hak intelektual penulis seutuhnya.",
      matchId: 2, // match
      source: "e-journal.uajy.ac.id (Internet Source)",
      pct: "4%",
    },
    {
      text: " Penelitian terdahulu menyebutkan bahwa sistem no-repository dari Turnitin menjamin berkas atau dokumen yang diuji tidak terekam dalam pangkalan data mana pun.",
      matchId: 3, // match
      source: "Student paper submitted to Universitas Nusantara",
      pct: "3%",
    },
    {
      text: " Ini memberi kebebasan penuh bagi para akademisi tanpa perlu was-was akan terjadinya duplikasi internal tidak terdua saat ujian akhir dilakukan ulang.",
      matchId: 4, // match
      source: "www.researchgate.net (Publication)",
      pct: "2%",
    }
  ];

  const matchedSources = [
    { id: 1, url: "e-journal.uajy.ac.id", type: "Internet Source", pct: 4, color: "bg-red-500 text-white" },
    { id: 2, url: "repository.unand.ac.id", type: "Internet Source", pct: 3, color: "bg-blue-500 text-white" },
    { id: 3, url: "Submitted to Universitas Nusantara", type: "Student Paper", pct: 3, color: "bg-emerald-500 text-white" },
    { id: 4, url: "www.researchgate.net", type: "Publication", pct: 2, color: "bg-purple-500 text-white" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 max-h-[90vh]">
        
        {/* Header bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-rose-600 p-1.5 rounded text-white flex items-center justify-center font-bold text-xs">
              TR
            </div>
            <div>
              <h2 className="font-display font-bold text-md tracking-tight leading-tight">
                Turnitin Quality Report — Queen Similarity Check
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                File ID: {document.id} | {document.filename}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.print()}
              className="p-2 hover:bg-slate-800 rounded bg-slate-800/50 text-slate-300 transition duration-150 flex items-center gap-1.5 text-xs"
              title="Cetak Laporan"
            >
              <Printer size={14} /> <span className="hidden sm:inline">Cetak</span>
            </button>
            {document.reportUrl ? (
              <a 
                href={document.reportUrl}
                download={`Hasil_Turnitin_${document.title.replace(/\s+/g, "_")}.pdf`}
                target="_blank"
                rel="noreferrer"
                className="p-2 hover:bg-slate-800 rounded bg-slate-800/50 text-slate-300 transition duration-150 flex items-center gap-1.5 text-xs font-bold"
                title="Download PDF Laporan Turnitin"
              >
                <Download size={14} /> <span className="hidden sm:inline">Unduh PDF</span>
              </a>
            ) : (
              <button 
                onClick={() => {
                  const content = `LAPORAN RESMI TURNITIN - QUEEN SIMILARITY CHECK\n` +
                    `==============================================\n` +
                    `ID Dokumen: ${document.id}\n` +
                    `Judul Dokumen: ${document.title}\n` +
                    `Ukuran: ${document.fileSize}\n` +
                    `Tanggal Periksa: ${document.uploadDate}\n` +
                    `Hasil Similarity Index: ${document.similarityPercent ?? 15}%\n` +
                    `${document.aiPercent !== undefined ? `Deteksi AI Content: ${document.aiPercent}%\n` : ""}` +
                    `Status Kelas: No-Repository (Aman)\n\n` +
                    `Ulasan Instruktur:\n` +
                    `${document.feedback || "Pemeriksaan selesai secara maksimal. Saringan filter Exclude Bibliography dan Quotes diaktifkan secara proporsional."}\n\n` +
                    `Laporan ini sah sebagai bukti pengecekan Turnitin Instruktur Kelas Queen Similarity Check.`;
                  
                  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const tempLink = window.document.createElement("a");
                  tempLink.href = url;
                  tempLink.download = `Hasil_Turnitin_${document.title.replace(/\s+/g, "_")}.txt`;
                  window.document.body.appendChild(tempLink);
                  tempLink.click();
                  window.document.body.removeChild(tempLink);
                }}
                className="p-2 hover:bg-slate-800 rounded bg-slate-800/50 text-slate-300 transition duration-150 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="Download Hasil Laporan"
              >
                <Download size={14} /> <span className="hidden sm:inline">Unduh PDF</span>
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition duration-150"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Top Info Dashboard inside Report */}
        <div className="bg-slate-50 border-b border-slate-200 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-700">
          <div>
            <span className="text-xs text-slate-400 block font-sans">DOKUMEN UTAMA</span>
            <span className="font-semibold text-sm text-slate-900 truncate block mt-0.5">{document.title}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-sans">UKURAN FILE / DIUNGGAH</span>
            <span className="font-semibold text-sm text-slate-800 block mt-0.5">{document.fileSize} • {document.uploadDate}</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-sans">STATUS DATABASE</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-medium mt-1">
              <CheckCircle2 size={12} /> No-Repository (Clean)
            </span>
          </div>
          <div className="flex justify-end items-center">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-slate-400 block">SIMILARITY INDEX</span>
                <span className="text-xs text-slate-500 block font-mono">Turnitin Resmi</span>
              </div>
              <div className={`p-3 rounded-xl font-display font-bold text-xl flex items-center justify-center shadow-xs ${getSimColor(percentage)} min-w-[70px] aspect-square`}>
                {percentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 flex items-center gap-1.5 sm:gap-4 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab("PDF")}
            className={`py-3.5 px-4 text-xs font-extrabold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "PDF" 
                ? "border-rose-600 text-rose-600 font-extrabold" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            📄 Preview PDF Laporan Resmi
          </button>
          <button
            onClick={() => setActiveTab("ANALISIS")}
            className={`py-3.5 px-4 text-xs font-extrabold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "ANALISIS" 
                ? "border-rose-600 text-rose-600 font-extrabold" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            🔍 Analisis Plagiasi Interaktif
          </button>
        </div>

        {/* Laporan Hasil Turnitin Anda Banner */}
        {document.reportUrl && activeTab === "ANALISIS" && (
          <div className="bg-indigo-600 font-sans text-white px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-white/10 rounded-lg text-white font-bold text-base shrink-0 animate-pulse">📥</span>
              <div className="text-center sm:text-left">
                <span className="text-[10px] font-extrabold text-indigo-200 block uppercase tracking-widest font-mono">HASIL TURNITIN RESMI TELAH TERSEDIA</span>
                <span className="text-xs font-bold text-white font-sans">Laporan hasil pengecekan similarity resmi dari Instruktur Anda telah siap diunduh secara penuh.</span>
              </div>
            </div>
            <a
              href={document.reportUrl}
              download={`Turnitin_Report_${document.title.replace(/\s+/g, "_")}.pdf`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                if (!document.reportUrl?.startsWith("blob:")) {
                  window.open(document.reportUrl, "_blank");
                  e.preventDefault();
                }
              }}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-indigo-700 rounded-xl text-xs font-extrabold transition duration-150 flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/10 cursor-pointer w-full sm:w-auto"
            >
              <Download size={13} /> Unduh File Hasil Turnitin ⬇️
            </a>
          </div>
        )}

        {/* Main Content Area split based on activeTab */}
        {activeTab === "PDF" ? (
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-100 justify-center p-3 sm:p-5 relative min-h-[450px]">
            {document.reportUrl ? (
              <div className="w-full h-full flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
                <iframe
                  id="pdf-preview-frame"
                  src={document.reportUrl}
                  title="PDF Turnitin Preview"
                  className="w-full h-full min-h-[500px]"
                  allow="fullscreen"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white border border-slate-200 text-center rounded-2xl m-4 max-w-md mx-auto shadow-2xs">
                <span className="text-4xl">📥</span>
                <h4 className="font-bold text-slate-800 text-sm mt-3">Laporan PDF Belum Diupload</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Admin belum menautkan berkas laporan PDF resmi dari Turnitin untuk pengujian ini. Silakan hubungi admin atau cek detail ulasan di tab <strong>"Analisis Plagiasi Interaktif"</strong>.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
            
            {/* Left panel: Document markup text */}
            <div className="flex-1 p-6 md:p-8 bg-slate-100 overflow-y-auto">
              <div className="bg-white p-8 rounded-2xl shadow-xs border border-slate-200 max-w-2xl mx-auto min-h-[500px]">
                <div className="border-b border-rose-100 pb-4 mb-6">
                  <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight">
                    {document.title}
                  </h1>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Penulis: Melda Katria Girsang • Queen Similarity Check Turnitin Sandbox
                  </p>
                </div>

                {/* Paragraf content */}
                <div className="text-slate-700 leading-relaxed text-sm space-y-4 font-sans text-justify">
                  <p>
                    {dummyHighlightedParagraphs.map((par, idx) => {
                      if (par.matchId > 0) {
                        // highlighted based on matchId color
                        const colors = [
                          "bg-red-100 text-red-900 border-b-2 border-red-400",
                          "bg-blue-100 text-blue-900 border-b-2 border-blue-400",
                          "bg-emerald-100 text-emerald-900 border-b-2 border-emerald-400",
                          "bg-purple-100 text-purple-900 border-b-2 border-purple-400",
                        ];
                        const matchedColor = colors[(par.matchId - 1) % colors.length];
                        return (
                          <span 
                            key={idx} 
                            className={`relative group inline cursor-pointer px-1 py-0.5 rounded transition ${matchedColor}`}
                            title={`Cocok dengan ${par.source} (${par.pct})`}
                          >
                            <span className="absolute -top-4 -left-1 bg-slate-900 text-white text-[9px] px-1 rounded font-mono font-bold">
                              {par.matchId}
                            </span>
                            {par.text}
                          </span>
                        );
                      }
                      return <span key={idx}>{par.text}</span>;
                    })}
                  </p>
                  
                  <p className="mt-4 pt-4 border-t border-slate-100">
                    <span className="font-semibold block text-slate-800">Catatan Review Turnitin:</span>
                    Dokumen ini telah diperiksa menggunakan modul khusus anti-database. Turnitin tidak akan merekam naskah Anda sehingga naskah ini aman ketika dievaluasi oleh program studi atau penerbit jurnal ilmiah lokal maupun internasional di lain hari.
                  </p>
                </div>
              </div>
            </div>

            {/* Right panel: Turnitin Source breakdown matches */}
            <div className="w-full md:w-80 bg-white flex flex-col overflow-y-auto w-full md:w-80 shrink-0">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-display font-medium text-xs text-slate-500 uppercase tracking-wider">
                  SUMBER PENYUMBANG PLAGIARISME
                </h3>
                <p className="text-xs text-slate-400 leading-tight mt-1">
                  Daftar sumber yang memiliki kemiripan kalimat dengan dokumen Anda.
                </p>
              </div>

              <div className="p-3 divide-y divide-slate-100 flex-1">
                {matchedSources.map((source, index) => (
                  <div key={source.id} className="py-3 hover:bg-slate-50 rounded-lg px-2 transition duration-150">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${source.color}`}>
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-medium text-xs text-slate-800 break-all block">
                            {source.url}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-tight block">
                            {source.type}
                          </span>
                        </div>
                      </div>
                      {/* Percentage box */}
                      <span className="font-semibold font-mono text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded leading-none shrink-0 mt-0.5">
                        {source.pct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom help links in Turnitin */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto text-xs text-slate-500 space-y-2">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <HelpCircle size={14} /> Berpikir Untuk Merevisi?
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Manfaatkan fitur <strong className="text-slate-600">AI Chatbot</strong> kami di menu sebelah kiri untuk memproses revisi, mendapatkan bantuan parafrase langsung, atau mendiskusikan kalimat plagiat Anda!
                </p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
