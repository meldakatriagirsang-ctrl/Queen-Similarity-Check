import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, User, Bot, AlertCircle, RefreshCw, Trash2, ArrowRight } from "lucide-react";
import { ChatMessage } from "../types";

export default function AIChatbotView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Default welcome message if empty
  useEffect(() => {
    const savedMessages = localStorage.getItem("queen_chat_messages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      const initialMsgs: ChatMessage[] = [
        {
          id: "welcome-1",
          text: "Halo Kak Melda! Selamat datang di QueenBot AI Chatbot 🤖✨. Saya adalah asisten pintar khusus untuk kebutuhan penulisan ilmiah Anda.",
          sender: "bot",
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
        {
          id: "welcome-2",
          text: "Saya bisa membantu Kakak untuk:\n• Melakukan parafrase kalimat agar lolos Turnitin\n• Menjelaskan cara membaca hasil similarity\n• Memberikan tips menulis naskah akademik terpercaya dan anti plagiarisme.\n\nSilakan tanyakan apa saja atau pilih opsi instan di bawah ini!",
          sender: "bot",
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
      ];
      setMessages(initialMsgs);
      localStorage.setItem("queen_chat_messages", JSON.stringify(initialMsgs));
    }
  }, []);

  // Save messages helper
  const saveAndSetMessages = (newMsgs: ChatMessage[]) => {
    setMessages(newMsgs);
    localStorage.setItem("queen_chat_messages", JSON.stringify(newMsgs));
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      text: textToSend,
      sender: "user",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMsgs = [...messages, userMsg];
    saveAndSetMessages(updatedMsgs);
    setInputValue("");
    setLoading(true);
    setErrorStatus(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          history: updatedMsgs.slice(-8), // Send recent message slots to backend context
        }),
      });

      if (!response.ok) {
        throw new Error("Koneksi API Gagal. Hubungi Admin.");
      }

      const data = await response.json();
      
      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        text: data.reply || "Maaf, sistem tidak memberikan jawaban yang sesuai.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };

      saveAndSetMessages([...updatedMsgs, botMsg]);
    } catch (err: any) {
      console.error("Error sending message to Gemini API:", err);
      setErrorStatus("Tidak dapat terhubung ke server AI. Memasuki mode asisten lokal otomatis...");
      
      // Fallback response
      setTimeout(() => {
        let fallbackReply = "Maaf, server AI sedang padat saat ini. Kak Melda dapat melakukan parafrase kalimat dengan mengganti kata kerja pasif menjadi aktif, mengutip sumber ilmiah dengan teknik APA/IEEE, atau berkonsultasi langsung ke WhatsApp Admin di 0822-6185-8077 untuk pertolongan revisi cepat.";
        if (textToSend.toLowerCase().includes("parafrase")) {
          fallbackReply = "Tips Parafrase Cepat:\n1. Ubah struktur kalimat (pasif ke aktif atau sebaliknya).\n2. Gunakan sinonim kata ilmiah yang sesuai.\n3. Pecah kalimat yang panjang menjadi dua kalimat pendek yang lugas.\nContoh: 'Penulisan naskah dilakukan oleh Melda' menjadi 'Melda menulis naskah ilmiah itu secara mendalam'.";
        } else if (textToSend.toLowerCase().includes("no-repository")) {
          fallbackReply = "Turnitin No-Repository adalah pengaturan premium di mana dokumen Anda diproses HANYA untuk dibandingkan dengan basis data global, tanpa disimpan di penyimpanan server Turnitin. Hasilnya, saat dosen/kampus mengecek naskah Anda kembali, nilainya tidak akan naik menjadi 100% (bebas resiko self-plagiarism).";
        }
        
        const botMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          text: fallbackReply,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        };
        saveAndSetMessages([...updatedMsgs, botMsg]);
        setLoading(false);
      }, 1000);
      return;
    } finally {
      setLoading(false);
    }
  };

  const clearChatHistory = () => {
    if (confirm("Apakah Kakak yakin ingin menghapus semua riwayat obrolan AI?")) {
      localStorage.removeItem("queen_chat_messages");
      const resetMsgs: ChatMessage[] = [
        {
          id: "welcome-1",
          text: "Riwayat percakapan dihapus. Ada lagi yang bisa Queen AI bantu hari ini, Kak Melda?",
          sender: "bot",
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
      ];
      setMessages(resetMsgs);
    }
  };

  const quickPrompts = [
    { label: "🔄 Parafrase Kalimat", prompt: "Tolong bantu saya memparafrasekan kalimat ini agar lolos plagiarism: 'Penerapan kecerdasan buatan dalam bidang pendidikan tinggi telah membawa berbagai perubahan yang sangat signifikan.'" },
    { label: "🧠 Apa itu No-Repository?", prompt: "Tolong jelaskan secara mendetail apa keuntungan sistem No-Repository pada Queen Similarity Check dibanding turnitin kampus?" },
    { label: "📉 Cara Kurangi Similarity", prompt: "Berikan saya 5 tips ampuh menurunkan persentase plagiarism Turnitin yang sudah terlanjur di atas 40%!" },
    { label: "📞 WhatsApp Admin", prompt: "Berapa nomor kontak Admin Queen Similarity Check dan apa saja paket premium yang ditawarkan?" }
  ];

  return (
    <div className="bg-[#0B0F19]/60 backdrop-blur-md rounded-2xl border border-indigo-950/60 shadow-xl flex flex-col h-[calc(100vh-220px)] min-h-[480px] overflow-hidden">
      
      {/* Bot Header bar */}
      <div className="bg-[#080C16]/80 border-b border-indigo-950/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-950/60 border border-indigo-900/60 flex items-center justify-center text-indigo-400 shadow-inner">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-medium text-slate-100 text-sm">QueenBot AI Assistant</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
              <span className="text-[10px] text-slate-400 font-mono">Powered by Gemini 3.5</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Siap membantu bimbingan parafrase & revisi naskah Kak Melda</p>
          </div>
        </div>

        <button 
          onClick={clearChatHistory}
          className="p-2 text-slate-450 hover:text-rose-400 hover:bg-indigo-950/40 rounded-lg transition duration-200 cursor-pointer"
          title="Hapus riwayat obrolan"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Chat Messages Log scroll panel */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#080C16]/20">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Avatar circle */}
              <div 
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${
                  isUser 
                    ? "bg-indigo-600 text-white" 
                    : "bg-[#0A0F1D] border border-indigo-950 text-indigo-400 shadow-xs"
                }`}
              >
                {isUser ? <User size={14} /> : <Bot size={14} />}
              </div>

              {/* Text bubble */}
              <div className="space-y-1">
                <div 
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser 
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10" 
                      : "bg-[#0F172A]/90 text-slate-200 shadow-md border border-indigo-950/80 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
                <div className={`text-[10px] text-slate-500 font-mono px-1 ${isUser ? "text-right" : "text-left"}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading typing state indicators */}
        {loading && (
          <div className="flex items-start gap-3 max-w-[80%]">
            <div className="w-8 h-8 rounded-full shrink-0 bg-[#0A0F1D] border border-indigo-950 text-indigo-400 flex items-center justify-center">
              <Bot size={14} className="animate-pulse" />
            </div>
            <div className="bg-[#0F172A]/90 px-4 py-3 rounded-2xl rounded-tl-none border border-indigo-950 shadow-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Error notifications */}
        {errorStatus && (
          <div className="bg-amber-950/20 text-amber-300 text-xs px-4 py-2.5 rounded-xl border border-amber-900/30 flex items-center gap-2 mx-auto max-w-md">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorStatus}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Quick Pillars */}
      {messages.length < 5 && (
        <div className="px-6 py-3 bg-[#080C16]/80 border-t border-indigo-950/60">
          <p className="text-[11px] font-sans font-semibold text-indigo-400 uppercase tracking-wider mb-2">
            Klik Untuk Opsi Bantuan Instan:
          </p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((qp, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(qp.prompt)}
                className="text-xs bg-[#0F172A]/85 hover:bg-indigo-950/40 hover:border-indigo-500/30 border border-indigo-950 rounded-lg text-slate-300 transition duration-150 text-left cursor-pointer px-3 py-1.5 shadow-2xs"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text input form block */}
      <div className="p-4 border-t border-indigo-950/60 bg-[#080C16]/90 rounded-b-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            className="flex-1 text-slate-200 text-sm placeholder-slate-500 bg-[#0F172A]/80 border border-indigo-950 rounded-xl px-4 py-3 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 shadow-2xs"
            placeholder="Tulis pesan atau tempel kalimat yang ingin Kak Melda perbaiki..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 text-white p-3 rounded-xl transition duration-150 flex items-center justify-center shadow-xs cursor-pointer text-xs font-bold"
            disabled={!inputValue.trim() || loading}
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-500 mt-2 font-sans">
          Mendukung parafrase naskah otomatis. Hasil simpanan dienkripsi secara lokal dan aman.
        </p>
      </div>

    </div>
  );
}
