import { useState, useRef } from 'react';
import {
  Shield,
  Upload,
  RefreshCw,
  CarFront,
  CheckCircle2,
  FileText,
  Users,
  Siren


} from 'lucide-react';
import './App.css';
import CicomMapModule from './CicomMapModule.jsx';
import SaLesteMapModule from './SaLesteMapModule.jsx';

function App() {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState('mapa'); // 'mapa', 'ocorrencias', 'cicom', 'ocorrencias_cicom'
  const [currentModule, setCurrentModule] = useState('home'); // 'home', 'sa_leste', 'cicom'

  // Global states
  const [logoUrl, setLogoUrl] = useState(() => {
    return localStorage.getItem('mf_logo') || 'logo.png';
  });

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const fileInputRef = useRef(null);

  // Toast notifier helper
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
    }, 3000);
  };

  // Custom logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result;
        setLogoUrl(base64Data);
        localStorage.setItem('mf_logo', base64Data);
        showToast('Logo atualizada com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const resetLogo = () => {
    setLogoUrl('logo.png');
    localStorage.removeItem('mf_logo');
    showToast('Logo redefinida para a padrão.');
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast de Notificação */}
      {toast.visible && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border border-blue-500/20 bg-white animate-bounce glow-accent">
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-semibold text-slate-800">{toast.message}</span>
        </div>
      )}

      {/* Main Header Area - Dark Navy Banner */}
      <header className="relative w-full py-8 bg-[#080c18] border-b border-slate-800 overflow-hidden text-white">
        <div className="absolute inset-0 bg-radial-at-t from-[#1b264f]/30 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-5">
            {/* Customizable Logo */}
            <div className="relative group p-1 bg-white/10 rounded-xl border border-white/20 shadow-inner overflow-hidden">
              <img src={logoUrl} className="w-16 h-16 object-contain rounded" alt="CPA Leste Logo" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="p-1 bg-blue-600 rounded text-white hover:bg-blue-700 cursor-pointer"
                  title="Upload Logo"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
                {logoUrl !== 'logo.png' && (
                  <button
                    onClick={resetLogo}
                    className="p-1 bg-rose-600 rounded text-white hover:bg-rose-700 cursor-pointer"
                    title="Redefinir Logo"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded">PMAM</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded">CPA LESTE</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">MONTAGEM DO MAPA DA FORÇA</h1>
              <p className="text-xs md:text-sm text-slate-400 font-medium">Montagem do Mapa da Força do Batalhão Leste</p>
            </div>
          </div>
          {currentModule !== 'home' && (
            <button
              onClick={() => setCurrentModule('home')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors text-sm font-bold cursor-pointer"
            >
              Voltar ao Início
            </button>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      {currentModule !== 'home' && (
        <nav className="max-w-7xl mx-auto px-6 mt-6 flex border-b border-slate-200 w-full">
          {currentModule === 'sa_leste' && (
            <>
              <button
                onClick={() => setActiveTab('mapa')}
                className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all 
                  cursor-pointer ${activeTab === 'mapa' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <Shield className="w-4 h-4" />
                Mapa da Força
              </button>
              <button
                onClick={() => setActiveTab('ocorrencias')}
                className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer 
                  ${activeTab === 'ocorrencias' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <FileText className="w-4 h-4" />
                Resumo de Ocorrências
              </button>
            </>
          )}
          {currentModule === 'cicom' && (
            <>
              <button
                onClick={() => setActiveTab('cicom')}
                className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer 
                  ${activeTab === 'cicom' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <CarFront className="w-4 h-4" />
                MAPA CICOM'S
              </button>
              <button
                onClick={() => setActiveTab('ocorrencias_cicom')}
                className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer 
                  ${activeTab === 'ocorrencias_cicom' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <FileText className="w-4 h-4" />
                Resumo de Ocorrências
              </button>
            </>
          )}
        </nav>
      )}

      {/* HOME SCREEN MODULES */}
      {currentModule === 'home' && (
        <div className="flex-grow flex items-center justify-center p-6 mt-12 mb-12">
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
            <button
              onClick={() => {
                setCurrentModule('sa_leste');
                setActiveTab('mapa');
              }}
              className="group flex flex-col items-center justify-center gap-6 bg-white p-12 rounded-3xl shadow-lg border border-slate-200 hover:border-blue-500 hover:shadow-2xl transition-all cursor-pointer"
            >
              <div className="p-6 bg-blue-50 rounded-2xl group-hover:bg-blue-600 transition-colors">
                <Users className="w-20 h-20 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 text-center tracking-tight">MAPA DA FORÇA<br />SA LESTE (CPO)</h2>
            </button>

            <button
              onClick={() => {
                setCurrentModule('cicom');
                setActiveTab('cicom');
              }}
              className="group flex flex-col items-center justify-center gap-6 bg-white p-12 rounded-3xl shadow-lg border border-slate-200 hover:border-amber-500 hover:shadow-2xl transition-all cursor-pointer"
            >
              <div className="p-6 bg-amber-50 rounded-2xl group-hover:bg-amber-500 transition-colors">
                <Siren className="w-20 h-20 text-amber-600 group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 text-center tracking-tight">MAPA DA FORÇA<br />POR CICOM</h2>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area - Toggle tabs */}
      {currentModule !== 'home' && (
        <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6 flex-grow w-full flex flex-col gap-8">

          {currentModule === 'sa_leste' && (
            <SaLesteMapModule
              showToast={showToast}
              activeTab={activeTab}
              logoUrl={logoUrl}
              onNavigateHome={() => setCurrentModule('home')}
            />
          )}

          {currentModule === 'cicom' && (
            <CicomMapModule
              showToast={showToast}
              activeTab={activeTab}
              logoUrl={logoUrl}
              onNavigateHome={() => setCurrentModule('home')}
            />
          )}

        </main>
      )}

      {/* Footer institutional */}
      <footer className="text-center text-slate-500 text-xs mt-12 px-6">
        <p className="font-semibold">Batalhão Leste © 2026 - Polícia Militar do Amazonas</p>
        <p className="mt-1">PWA online habilitado. Seus dados são salvos em Banco de Dados e permanecem protegidos.</p>
        <p className="mt-1">Sistema desenvolvido pelo CB PM Luciano Costa com recursos avançados de IA.</p>
      </footer>
    </div>
  );
}

export default App;
