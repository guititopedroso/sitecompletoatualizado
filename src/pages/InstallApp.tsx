import React from "react";
import { Download, Apple, Smartphone, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

export default function InstallApp() {
  const otaUrl = "itms-services://?action=download-manifest&url=https://raw.githubusercontent.com/guititopedroso/sitecompletoatualizado/main/public/apps/manifest.plist";
  const ipaDirectUrl = "https://github.com/guititopedroso/sitecompletoatualizado/releases/download/v1.0.0/royalcoast-admin.ipa";


  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      <Navbar />

      <main className="container max-w-2xl mx-auto px-4 py-20 flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-blue-600/20 border border-blue-500/30 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/10">
          <Apple className="w-10 h-10 text-blue-400" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          App Administrador RoyalCoast
        </h1>
        <p className="text-slate-400 text-base sm:text-lg mb-8 max-w-md">
          Instalação direta da app nativa iOS para iPhone sem passar pela App Store.
        </p>

        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 mb-8 text-left space-y-4">
          <a
            href={otaUrl}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform active:scale-95"
          >
            <Smartphone className="w-6 h-6" />
            <span className="text-lg">Instalar no iPhone (Safari OTA)</span>
          </a>

          <a
            href={ipaDirectUrl}
            download="royalcoast-admin.ipa"
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3 px-4 rounded-xl border border-slate-700 text-sm transition-all"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Descarregar Ficheiro .IPA Direto</span>
          </a>
        </div>

        <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 text-left space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Instruções de Ativação no iPhone:</span>
          </div>

          <ol className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>Abre esta página no <strong>Safari do iPhone</strong> e clica em <strong>"Instalar no iPhone"</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>Quando surgir o aviso do iOS, clica em <strong>"Instalar"</strong>. A app começará a descarregar no ecrã principal.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>Vai às <strong>Definições &gt; Geral &gt; VPN e Gestão de Dispositivos</strong> no iPhone e clica em <strong>"Confiar no Certificado"</strong>.</span>
            </li>
          </ol>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} RoyalCoast Enterprise iOS Sideloading
      </footer>
    </div>
  );
}
