import React, { useState, useEffect } from 'react';
import { Hexagon, Terminal, ShieldAlert, Cpu, Lock, User, ChevronRight } from 'lucide-react';

const Login: React.FC = () => {
  const [operatorId, setOperatorId] = useState('');
  const [cipherKey, setCipherKey] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '> INICIANDO SECUENCIA DE ARRANQUE...',
    '> CARGANDO MÓDULOS DE CIFRADO...',
  ]);

  // Simulate logs appending
  useEffect(() => {
    const timer = setTimeout(() => {
      setLogs((prev) => [...prev, '> ESTABLECIENDO CONEXIÓN SEGURA P2P...']);
    }, 1500);
    const timer2 = setTimeout(() => {
      setLogs((prev) => [...prev, '> ESPERANDO CREDENCIALES DE OPERARIO...']);
    }, 3000);
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorId || !cipherKey) return;
    
    setIsAuthenticating(true);
    setLogs((prev) => [...prev, '> VALIDANDO HASH DE ACCESO...']);
    
    setTimeout(() => {
      setLogs((prev) => [...prev, '> ENCRIPTACIÓN RSA-4096 CONFIRMADA.']);
    }, 1000);

    setTimeout(() => {
      setLogs((prev) => [...prev, '> ACCESO AUTORIZADO. REDIRIGIENDO...']);
      // Aca puedes agregar la logica para redirigir al juego
    }, 2500);
  };

  return (
    <div className="h-[100dvh] w-screen flex items-center justify-center bg-[#030712] font-mono text-slate-300 uppercase tracking-widest relative overflow-hidden select-none">
      
      {/* Background Radar/Grid Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      ></div>
      
      {/* Central Terminal Card */}
      <div className="relative z-10 w-full max-w-lg p-1">
        {/* Decorative corner borders */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50"></div>

        <div className="bg-[#050915]/80 backdrop-blur-md border border-cyan-900/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex flex-col p-8">
          
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-slate-800 pb-6 mb-8 relative">
            <div className="relative">
              <Hexagon className="w-10 h-10 text-cyan-400 animate-pulse" strokeWidth={1.5} />
              <Cpu className="w-4 h-4 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-100 tracking-[0.3em] drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">CONQUEST</h1>
              <p className="text-[10px] text-cyan-500/80 mt-1 flex items-center gap-2">
                <span>//</span> SISTEMA DE AUTENTICACIÓN TÁCTICA
              </p>
            </div>
            {/* Status indicators */}
            <div className="absolute top-0 right-0 flex gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-rose-500 opacity-50"></div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="flex flex-col gap-6">
            
            <div className="flex flex-col gap-2">
              <label className="text-xs text-cyan-400/70 flex items-center gap-2">
                <User className="w-3 h-3" />
                ID DE OPERARIO
              </label>
              <input 
                type="text" 
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                placeholder="[ INGRESE IDENTIFICACIÓN ]"
                className="bg-slate-900/50 border border-slate-700 rounded-none px-4 py-3 text-sm text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                disabled={isAuthenticating}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-cyan-400/70 flex items-center gap-2">
                <Lock className="w-3 h-3" />
                CLAVE DE CIFRADO
              </label>
              <input 
                type="password" 
                value={cipherKey}
                onChange={(e) => setCipherKey(e.target.value)}
                placeholder="[ INGRESE CONTRASEÑA ]"
                className="bg-slate-900/50 border border-slate-700 rounded-none px-4 py-3 text-sm text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all"
                disabled={isAuthenticating}
              />
            </div>

            <button 
              type="submit"
              disabled={isAuthenticating || !operatorId || !cipherKey}
              className="mt-4 relative group overflow-hidden border border-slate-700 hover:border-cyan-400 bg-slate-900/80 hover:bg-cyan-950/40 text-slate-400 hover:text-cyan-400 py-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 w-full h-full bg-cyan-400/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
              <span className="relative flex items-center justify-center gap-3 text-sm font-bold">
                {isAuthenticating ? (
                  <>
                    <Terminal className="w-4 h-4 animate-bounce" />
                    AUTENTICANDO...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 group-hover:text-cyan-400" />
                    INICIAR ENLACE DE TELEMETRÍA
                  </>
                )}
              </span>
            </button>
          </form>

          {/* System Logs */}
          <div className="mt-8 pt-4 border-t border-slate-800/80">
            <div className="text-[9px] text-slate-500 flex flex-col gap-1 h-16 overflow-hidden">
              {logs.map((log, index) => (
                <div key={index} className="flex items-center gap-2 animate-fade-in">
                  <ChevronRight className="w-3 h-3 text-cyan-600" />
                  <span className={index === logs.length - 1 ? 'text-cyan-400' : ''}>{log}</span>
                </div>
              ))}
              {isAuthenticating && (
                 <div className="flex items-center gap-2 animate-pulse mt-1">
                   <ChevronRight className="w-3 h-3 text-cyan-600" />
                   <span className="text-cyan-400">...</span>
                 </div>
              )}
            </div>
          </div>

        </div>
      </div>
      
      {/* Scanline overlay effect */}
      <div className="pointer-events-none absolute inset-0 z-50 opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]"></div>
    </div>
  );
};

export default Login;
