import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Send, 
  Mic, 
  CheckCheck, 
  Bot, 
  User, 
  X, 
  RefreshCw, 
  Globe, 
  Loader2,
  Sparkles,
  Zap,
  PhoneCall,
  ArrowLeft
} from 'lucide-react';
import { WhatsAppMessage } from '../types';

interface WhatsAppSimulatorProps {
  onClose: () => void;
  onWhatsAppSuccess: () => void;
}

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({
  onClose,
  onWhatsAppSuccess
}) => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedSender, setSelectedSender] = useState<{ name: string; phone: string }>({
    name: 'Gogo Moyo',
    phone: '+263772123456'
  });
  const [loading, setLoading] = useState(false);

  // Fetch log on mount
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/whatsapp/logs');
      const data = await res.json();
      if (data.logs) {
        setMessages(data.logs);
      }
    } catch (e) {
      console.warn('Failed to load WA logs:', e);
    }
  };

  const handleSendMessage = async (text: string, isVoice: boolean = false) => {
    if (!text.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPhone: selectedSender.phone,
          senderName: selectedSender.name,
          text: text,
          isVoiceNote: isVoice
        })
      });

      const data = await res.json();
      if (data.waMessage) {
        setInputText('');
        await fetchLogs();
        onWhatsAppSuccess();
      }
    } catch (err) {
      console.error('WhatsApp Webhook Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b141a] sm:bg-black/75 backdrop-blur-xs flex items-stretch sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="bg-[#0b141a] w-full h-full sm:h-[640px] sm:max-w-lg sm:rounded-2xl flex flex-col shadow-2xl border-0 sm:border sm:border-emerald-900/50 overflow-hidden relative">
        {/* WhatsApp Header */}
        <div className="bg-[#202c33] text-white p-3.5 px-4 flex-shrink-0 flex items-center justify-between border-b border-[#2a3942]">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-1 text-stone-300 hover:text-white rounded-lg sm:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center border border-emerald-500">
                <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#202c33]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs sm:text-sm text-stone-100 leading-tight">
                  GreenCart WhatsApp Bot
                </h3>
                <span className="bg-emerald-900/80 text-emerald-300 text-[10px] font-mono px-1.5 py-0.2 rounded border border-emerald-700 hidden sm:inline-block">
                  Low-Data Mode
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-stone-400">
                Twilio WhatsApp Business Webhook
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-[#2a3942] hidden sm:block"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sender Switcher Banner */}
        <div className="bg-[#111b21] p-2 px-3 border-b border-[#2a3942] flex-shrink-0 flex items-center justify-between text-xs text-stone-300">
          <span className="font-medium text-stone-400 text-[11px]">Sender:</span>
          <div className="flex gap-2">
            {[
              { name: 'Gogo Moyo', phone: '+263772123456' },
              { name: 'Uncle Farai', phone: '+263773987654' }
            ].map((sender) => (
              <button
                key={sender.phone}
                onClick={() => setSelectedSender(sender)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  selectedSender.phone === sender.phone
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-[#202c33] text-stone-400 hover:text-white'
                }`}
              >
                {sender.name}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Body */}
        <div
          className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px] bg-[#0b141a]"
        >
          {messages.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Bot className="w-8 h-8 text-emerald-500 mx-auto opacity-80" />
              <p className="text-xs text-stone-400 font-medium px-4">
                No WhatsApp messages yet. Type or click a voice note preset below!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-[#005c4b] text-white p-2.5 rounded-xl rounded-tr-none max-w-[88%] text-xs shadow-md space-y-1">
                    <div className="flex items-center justify-between gap-3 text-[10px] text-emerald-200/80 border-b border-emerald-600/40 pb-0.5">
                      <span className="font-bold">{msg.senderName} ({msg.fromPhone})</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <p className="font-sans text-stone-100 font-medium whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </p>

                    {msg.parsedIntent && (
                      <div className="bg-[#083a30] p-1.5 rounded text-[10px] text-emerald-300 font-mono flex items-center justify-between">
                        <span>Gemini Action: {msg.parsedIntent.action}</span>
                        <span>Lang: {msg.parsedIntent.detectedLanguage || 'Shona'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* System Reply Message */}
                {msg.replyText && (
                  <div className="flex justify-start">
                    <div className="bg-[#202c33] text-stone-200 p-2.5 rounded-xl rounded-tl-none max-w-[88%] text-xs shadow-md space-y-1 border border-[#2a3942]">
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold border-b border-stone-700 pb-0.5">
                        <Bot className="w-3.5 h-3.5" />
                        <span>GreenCart Automated Bot Response</span>
                      </div>

                      <div className="font-mono text-[11px] whitespace-pre-wrap text-emerald-100 leading-relaxed">
                        {msg.replyText}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Quick Voice Note Shortcuts */}
        <div className="bg-[#111b21] p-2 border-t border-[#2a3942] flex-shrink-0 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold text-stone-400 whitespace-nowrap pl-1">Presets:</span>
          {[
            { label: 'Shona Voice: Hupfu & Mafuta', text: 'Ndinoda hupfu hweSona ne mafuta' },
            { label: 'Ndebele Voice: Upfu & Milk', text: 'Ngicela u-upfu le-bisi' },
            { label: 'Check Cart Status', text: 'CHECK CART' }
          ].map((preset, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(preset.text, true)}
              disabled={loading}
              className="bg-[#202c33] hover:bg-emerald-900/60 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded whitespace-nowrap border border-[#2a3942] transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="bg-[#202c33] p-2.5 sm:p-3 flex-shrink-0 flex items-center gap-2 border-t border-[#2a3942]">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText, false)}
            placeholder={`Message as ${selectedSender.name}...`}
            className="flex-1 bg-[#2a3942] text-white placeholder-stone-400 px-3.5 py-2 sm:py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <button
            onClick={() => handleSendMessage(inputText, false)}
            disabled={loading || !inputText.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

