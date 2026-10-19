import React, { useState } from 'react';
import { Code, Terminal, Server, X, Check, Copy, ExternalLink, ShieldCheck, ArrowLeft } from 'lucide-react';

interface MonorepoDocsModalProps {
  onClose: () => void;
}

export const MonorepoDocsModal: React.FC<MonorepoDocsModalProps> = ({ onClose }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const shellSteps = [
    {
      title: '1. Repository Clone & Monorepo Initialization',
      cmd: `git clone https://github.com/greencart/greencart-diaspora-app.git
cd greencart-diaspora-app
mkdir -p packages/client packages/server
npm init -y`
    },
    {
      title: '2. Root package.json Workspaces Setup',
      cmd: `{
  "name": "greencart-monorepo",
  "private": true,
  "workspaces": [
    "packages/client",
    "packages/server"
  ],
  "scripts": {
    "dev": "concurrently \\"npm run dev --workspace=packages/server\\" \\"npm run dev --workspace=packages/client\\"",
    "build": "npm run build --workspaces"
  }
}`
    },
    {
      title: '3. Backend Server & WhatsApp / Socket.io Dependencies',
      cmd: `cd packages/server
npm install express socket.io @google/genai dotenv multer cors
npm install -D typescript tsx @types/express @types/multer @types/node esbuild`
    },
    {
      title: '4. WhatsApp Twilio Webhook Configuration',
      cmd: `# Set environment variables in .env
GEMINI_API_KEY="AI_STUDIO_GEMINI_KEY"
TWILIO_ACCOUNT_SID="AC_XXXXXXXXXXXXXXXX"
TWILIO_AUTH_TOKEN="YOUR_TWILIO_AUTH_TOKEN"
PORT=3000

# Twilio Webhook Target URL:
# https://[your-service-url]/api/whatsapp/webhook`
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-white sm:bg-black/70 backdrop-blur-xs flex items-stretch sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-3xl sm:rounded-2xl flex flex-col shadow-2xl border-0 sm:border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1b4332] text-white p-3.5 sm:p-5 border-b border-[#2d6a4f] flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-1 text-stone-200 hover:text-white rounded-lg sm:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="bg-[#d4af37] text-black p-2 rounded-xl font-bold flex-shrink-0">
              <Terminal className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-lg font-serif tracking-wide text-[#d4af37] leading-tight">
                Monorepo Setup & System Architecture
              </h3>
              <p className="text-[10px] sm:text-xs text-emerald-200 line-clamp-1">
                GreenCart MERN Architecture • Socket.io • WhatsApp • Gemini 3.6
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-[#2d6a4f] hidden sm:block"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-stone-800 text-xs">
          {/* Overview */}
          <div className="bg-amber-50 p-3.5 sm:p-4 rounded-xl border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
              <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Production Monorepo Architecture</span>
            </div>
            <p className="text-stone-700 leading-relaxed text-xs">
              This application is structured as a mobile-first collaborative MERN stack monorepo. It features a high-speed React + Vite web frontend, an Express + Socket.io backend server for live family cart state broadcasts, an official server-side Gemini 3.6 Flash pipeline for code-switched African language voice intent parsing, and a low-data WhatsApp Business API fallback webhook.
            </p>
          </div>

          {/* Shell Commands & Code Snippets */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-stone-900 text-sm border-b border-stone-200 pb-2">
              Step-by-Step Shell Initialization Commands
            </h4>

            {shellSteps.map((step, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-stone-900 font-bold flex-wrap gap-1">
                  <span className="text-xs">{step.title}</span>
                  <button
                    onClick={() => copyToClipboard(step.cmd, idx)}
                    className="flex items-center gap-1 text-[11px] text-[#1b4332] hover:text-[#2d6a4f] font-semibold"
                  >
                    {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === idx ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                <pre className="bg-stone-900 text-amber-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto shadow-inner border border-stone-800">
                  {step.cmd}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-100 p-3 px-4 sm:px-5 border-t border-stone-200 flex-shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 font-medium">
            GreenCart Monorepo Deliverables Complete
          </span>
          <button
            onClick={onClose}
            className="bg-[#1b4332] text-white px-4 py-2 rounded-xl text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

