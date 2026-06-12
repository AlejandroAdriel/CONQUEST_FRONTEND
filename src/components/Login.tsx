import React, { useState, useEffect } from 'react';
import {
  Hexagon, Terminal, ShieldAlert, ShieldCheck, Cpu,
  Lock, User, ChevronRight, Eye, EyeOff, Mail, Globe, UserPlus
} from 'lucide-react';
import { authenticateOperator, registerOperator } from '../database/auth';
import type { OperarioUser } from '../types/user';

interface LoginProps {
  onLoginSuccess: (user: OperarioUser) => void;
  onCancel: () => void;
}

type Mode = 'login' | 'register';

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onCancel }) => {
  const [mode, setMode] = useState<Mode>('login');

  // ── LOGIN fields ─────────────────────────────────────────────
  const [loginId, setLoginId]       = useState('');
  const [loginPass, setLoginPass]   = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState<'wrong_pass' | 'wrong_user' | null>(null);
  const [shakePass, setShakePass]   = useState(false);

  // ── REGISTER fields ──────────────────────────────────────────
  const [regNombre,   setRegNombre]   = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPass,     setRegPass]     = useState('');
  const [regPais,     setRegPais]     = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regErrors,   setRegErrors]   = useState<Record<string, string>>({});
  const [regSuccess,  setRegSuccess]  = useState(false);

  // ── Shared ───────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '> INICIANDO SECUENCIA DE ARRANQUE...',
    '> CARGANDO MÓDULOS DE CIFRADO...',
  ]);

  useEffect(() => {
    const t1 = setTimeout(() => setLogs(p => [...p, '> ESTABLECIENDO CONEXIÓN SEGURA P2P...']), 1500);
    const t2 = setTimeout(() => setLogs(p => [...p, '> ESPERANDO CREDENCIALES DE OPERARIO...']), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Limpiar errores de login al cambiar de modo
  useEffect(() => {
    setLoginError(null);
    setRegErrors({});
    setRegSuccess(false);
  }, [mode]);

  // ── HANDLERS ─────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !loginPass) return;
    setIsLoading(true);
    setLoginError(null);
    setLogs(p => [...p, '> VALIDANDO HASH DE ACCESO...']);

    const user = await authenticateOperator(loginId, loginPass);

    if (user) {
      setLogs(p => [...p, '> ENCRIPTACIÓN RSA-4096 CONFIRMADA.']);
      setTimeout(() => {
        setLogs(p => [...p, '> ACCESO AUTORIZADO. REDIRIGIENDO...']);
        onLoginSuccess(user);
      }, 900);
    } else {
      // Distinguir si el username existe o no
      const userExists = loginId.trim().length > 0;
      setLoginError(userExists ? 'wrong_pass' : 'wrong_user');
      setShakePass(true);
      setTimeout(() => setShakePass(false), 600);
      setLogs(p => [...p, '> ERROR: HASH NO COINCIDE. ACCESO DENEGADO.']);
      setIsLoading(false);
    }
  };

  const validateRegister = (): boolean => {
    const errs: Record<string, string> = {};
    if (!regNombre.trim())     errs.nombre   = 'CAMPO REQUERIDO';
    if (!regEmail.trim())      errs.email    = 'CAMPO REQUERIDO';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) errs.email = 'FORMATO INVÁLIDO';
    if (!regUsername.trim())   errs.username = 'CAMPO REQUERIDO';
    else if (regUsername.trim().length < 3) errs.username = 'MÍNIMO 3 CARACTERES';
    if (!regPass)              errs.password = 'CAMPO REQUERIDO';
    else if (regPass.length < 6) errs.password = 'MÍNIMO 6 CARACTERES';
    if (!regPais.trim())       errs.pais     = 'CAMPO REQUERIDO';
    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegister()) return;
    setIsLoading(true);
    setLogs(p => [...p, '> GENERANDO PERFIL DE OPERARIO...']);

    const result = await registerOperator({
      nombre:   regNombre.trim(),
      email:    regEmail.trim(),
      username: regUsername.trim(),
      password: regPass,
      pais:     regPais.trim(),
    });

    if (result.success) {
      setRegSuccess(true);
      setLogs(p => [...p, '> PERFIL CREADO. CREDENCIALES ASIGNADAS.']);
      setTimeout(() => {
        setLogs(p => [...p, '> ACCESO CONCEDIDO. BIENVENIDO, ' + result.user.username + '.']);
        onLoginSuccess(result.user);
      }, 1200);
    } else {
      const errs: Record<string, string> = {};
      if ('error' in result && result.error === 'ID_TOMADO')    errs.username = 'ID YA REGISTRADO EN LA RED';
      if ('error' in result && result.error === 'EMAIL_TOMADO') errs.email    = 'CORREO YA VINCULADO A UNA CUENTA';
      if ('error' in result && result.error === 'RATE_LIMIT')   errs.email    = 'DEMASIADOS INTENTOS — ESPERA UNOS MINUTOS';
      setRegErrors(errs);
      if ('error' in result && result.error === 'RATE_LIMIT') {
        setLogs(p => [...p, '> LÍMITE DE INTENTOS ALCANZADO. ESPERA 5-10 MIN.']);
      } else {
        setLogs(p => [...p, '> ERROR: CONFLICTO DE IDENTIDAD EN LA BASE DE DATOS.']);
      }
      setIsLoading(false);
    }
  };

  // ── FIELD HELPERS ────────────────────────────────────────────
  const fieldClass = (errKey?: string) =>
    `w-full bg-slate-900/50 border rounded-none px-3 py-2.5 text-sm text-cyan-100 placeholder:text-slate-600 
     focus:outline-none focus:ring-1 transition-all font-mono
     ${errKey && regErrors[errKey]
       ? 'border-rose-500/80 focus:border-rose-400 focus:ring-rose-400/30'
       : 'border-slate-700 focus:border-cyan-400 focus:ring-cyan-400/30'}`;

  const FieldError = ({ field }: { field: string }) =>
    regErrors[field] ? (
      <span className="flex items-center gap-1.5 text-[10px] text-rose-400 font-mono tracking-widest mt-1">
        <ShieldAlert className="w-3 h-3 shrink-0" />
        {regErrors[field]}
      </span>
    ) : null;

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#030712] font-mono text-slate-300 uppercase tracking-widest relative overflow-hidden select-none p-4 md:p-8">

      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(6,182,212,0.2) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(6,182,212,0.2) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Radial glow center */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(6,182,212,0.04) 0%, transparent 70%)'
      }} />

      {/* HUD corner decorations */}
      <div className="absolute top-6 left-6 text-[9px] text-slate-600 tracking-[0.2em]">ORBITAL NET: SECURE</div>
      <div className="absolute bottom-6 right-6 text-[9px] text-slate-600 tracking-[0.2em]">GRID ALPHA-01 // AUTH</div>

      {/* Terminal Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Corner brackets */}
        <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-cyan-500/50" />
        <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-cyan-500/50" />
        <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-cyan-500/50" />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-cyan-500/50" />

        <div className="bg-[#050915]/85 backdrop-blur-md border border-cyan-900/50 shadow-[0_0_40px_rgba(6,182,212,0.08)] flex flex-col p-5 md:p-6 h-auto max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">

          {/* Header */}
          <div className="flex items-center gap-4 border-b border-slate-800 pb-4 mb-4 relative">
            <div className="relative shrink-0">
              <Hexagon className="w-10 h-10 text-cyan-400/80 animate-pulse" strokeWidth={1.5} />
              <Cpu className="w-4 h-4 text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-[0.3em] bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                CONQUEST
              </h1>
              <p className="text-[9px] text-cyan-500/70 mt-0.5 tracking-[0.2em]">
                // SISTEMA DE AUTENTICACIÓN TÁCTICA
              </p>
            </div>
            <div className="absolute top-0 right-0 flex gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-rose-500 opacity-50" />
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex mb-4 border border-slate-800 rounded-sm overflow-hidden shrink-0">
            <button
              onClick={() => { setMode('login'); setIsLoading(false); }}
              className={`flex-1 py-2.5 text-[10px] font-bold tracking-[0.2em] transition-all flex items-center justify-center gap-2
                ${mode === 'login'
                  ? 'bg-cyan-950/60 text-cyan-300 border-r border-slate-700'
                  : 'bg-transparent text-slate-500 hover:text-slate-300 border-r border-slate-800'}`}
            >
              <Lock className="w-3 h-3" /> ACCESO
            </button>
            <button
              onClick={() => { setMode('register'); setIsLoading(false); }}
              className={`flex-1 py-2.5 text-[10px] font-bold tracking-[0.2em] transition-all flex items-center justify-center gap-2
                ${mode === 'register'
                  ? 'bg-indigo-950/60 text-indigo-300'
                  : 'bg-transparent text-slate-500 hover:text-slate-300'}`}
            >
              <UserPlus className="w-3 h-3" /> REGISTRO
            </button>
          </div>

          {/* ═══════ LOGIN FORM ═══════ */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-cyan-400/70 flex items-center gap-2">
                  <User className="w-3 h-3" /> ID DE OPERARIO
                </label>
                <input
                  type="text"
                  value={loginId}
                  onChange={e => { setLoginId(e.target.value); setLoginError(null); }}
                  placeholder="[ INGRESE IDENTIFICACIÓN ]"
                  className={fieldClass()}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              {/* Password + inline error */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-cyan-400/70 flex items-center gap-2">
                  <Lock className="w-3 h-3" /> CLAVE DE CIFRADO
                </label>
                <div className={`relative transition-all duration-150 ${shakePass ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
                  style={shakePass ? { animation: 'shake 0.5s ease-in-out' } : {}}>
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    value={loginPass}
                    onChange={e => { setLoginPass(e.target.value); setLoginError(null); }}
                    placeholder="[ INGRESE CONTRASEÑA ]"
                    className={`w-full bg-slate-900/50 border rounded-none px-3 py-2.5 pr-11 text-sm font-mono text-cyan-100 placeholder:text-slate-600
                      focus:outline-none focus:ring-1 transition-all
                      ${loginError === 'wrong_pass'
                        ? 'border-rose-500 focus:border-rose-400 focus:ring-rose-400/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                        : 'border-slate-700 focus:border-cyan-400 focus:ring-cyan-400/30'}`}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Inline password error */}
                {loginError === 'wrong_pass' && (
                  <div className="flex items-center gap-2 bg-rose-950/40 border border-rose-800/60 px-3 py-2 rounded-sm mt-1">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                    <span className="text-[10px] text-rose-400 tracking-widest font-bold">
                      ERROR: CLAVE DE CIFRADO INVÁLIDA
                    </span>
                  </div>
                )}
                {loginError === 'wrong_user' && (
                  <div className="flex items-center gap-2 bg-rose-950/40 border border-rose-800/60 px-3 py-2 rounded-sm mt-1">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                    <span className="text-[10px] text-rose-400 tracking-widest font-bold">
                      ERROR: CREDENCIALES INVÁLIDAS
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !loginId || !loginPass}
                className="mt-1 relative group overflow-hidden border border-slate-700 hover:border-cyan-400
                  bg-slate-900/80 hover:bg-cyan-950/40 text-slate-400 hover:text-cyan-300 py-4
                  transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 w-full h-full bg-cyan-400/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                <span className="relative flex items-center justify-center gap-3 text-xs font-bold">
                  {isLoading ? (
                    <><Terminal className="w-4 h-4 animate-bounce" />AUTENTICANDO...</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" />[ INICIAR ENLACE DE TELEMETRÍA ]</>
                  )}
                </span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors tracking-wider"
                >
                  → REGISTRAR NUEVO OPERARIO
                </button>
              </div>
            </form>
          )}

          {/* ═══════ REGISTER FORM ═══════ */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="flex flex-col gap-3">

              {/* Nombre */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-indigo-400/70 flex items-center gap-2">
                  <User className="w-3 h-3" /> NOMBRE COMPLETO
                </label>
                <input
                  type="text"
                  value={regNombre}
                  onChange={e => { setRegNombre(e.target.value); setRegErrors(p => ({...p, nombre: ''})); }}
                  placeholder="[ EJ: ALEJANDRO MENDEZ ]"
                  className={fieldClass('nombre')}
                  disabled={isLoading || regSuccess}
                  autoComplete="name"
                />
                <FieldError field="nombre" />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-indigo-400/70 flex items-center gap-2">
                  <Mail className="w-3 h-3" /> CORREO ELECTRÓNICO
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => { setRegEmail(e.target.value); setRegErrors(p => ({...p, email: ''})); }}
                  placeholder="[ operario@red.conquest ]"
                  className={fieldClass('email')}
                  disabled={isLoading || regSuccess}
                  autoComplete="email"
                />
                <FieldError field="email" />
              </div>

              {/* Username */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-indigo-400/70 flex items-center gap-2">
                  <Terminal className="w-3 h-3" /> ID DE OPERARIO (USUARIO)
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={e => { setRegUsername(e.target.value); setRegErrors(p => ({...p, username: ''})); }}
                  placeholder="[ EJ: NEXUS-07 ]"
                  className={fieldClass('username')}
                  disabled={isLoading || regSuccess}
                  autoComplete="username"
                />
                <FieldError field="username" />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-indigo-400/70 flex items-center gap-2">
                  <Lock className="w-3 h-3" /> CLAVE DE CIFRADO
                </label>
                <div className="relative">
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    value={regPass}
                    onChange={e => { setRegPass(e.target.value); setRegErrors(p => ({...p, password: ''})); }}
                    placeholder="[ MÍN. 6 CARACTERES ]"
                    className={fieldClass('password') + ' pr-11'}
                    disabled={isLoading || regSuccess}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError field="password" />
              </div>

              {/* País */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-indigo-400/70 flex items-center gap-2">
                  <Globe className="w-3 h-3" /> PAÍS DE ORIGEN
                </label>
                <input
                  type="text"
                  value={regPais}
                  onChange={e => { setRegPais(e.target.value); setRegErrors(p => ({...p, pais: ''})); }}
                  placeholder="[ EJ: MÉXICO, ESPAÑA, COLOMBIA ]"
                  className={fieldClass('pais')}
                  disabled={isLoading || regSuccess}
                />
                <FieldError field="pais" />
              </div>

              {/* Success feedback */}
              {regSuccess && (
                <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-700/60 px-4 py-3 rounded-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 tracking-widest font-bold">
                    PERFIL CREADO — REDIRIGIENDO AL TEATRO DE OPERACIONES...
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || regSuccess}
                className="mt-1 relative group overflow-hidden border border-slate-700 hover:border-indigo-400
                  bg-slate-900/80 hover:bg-indigo-950/40 text-slate-400 hover:text-indigo-300 py-4
                  transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 w-full h-full bg-indigo-400/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                <span className="relative flex items-center justify-center gap-3 text-xs font-bold">
                  {isLoading ? (
                    <><Terminal className="w-4 h-4 animate-bounce" />PROCESANDO REGISTRO...</>
                  ) : (
                    <><UserPlus className="w-4 h-4" />[ CREAR PERFIL DE OPERARIO ]</>
                  )}
                </span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-[10px] text-slate-500 hover:text-cyan-400 transition-colors tracking-wider"
                >
                  → YA TENGO ACCESO
                </button>
              </div>
            </form>
          )}

          {/* System Logs */}
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="text-[9px] text-slate-500 flex flex-col gap-1 h-12 overflow-hidden">
              {logs.slice(-3).map((log, i) => (
                <div key={i} className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-cyan-700 shrink-0" />
                  <span className={i === Math.min(logs.length, 3) - 1 ? 'text-cyan-500' : ''}>{log}</span>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 animate-pulse">
                  <ChevronRight className="w-3 h-3 text-cyan-700 shrink-0" />
                  <span className="text-cyan-500">_</span>
                </div>
              )}
            </div>
          </div>

          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="mt-4 group border border-slate-800 hover:border-rose-500/60 bg-slate-950/40
              hover:bg-rose-950/20 text-slate-600 hover:text-rose-500 py-2.5 text-[10px] font-bold
              tracking-widest transition-all duration-300 disabled:opacity-30"
          >
            [ ABORTAR ENLACE ]
          </button>
        </div>
      </div>

      {/* Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 z-50 opacity-[0.06] bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]" />

      {/* Shake keyframe */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-5px); }
          30%       { transform: translateX(5px); }
          45%       { transform: translateX(-4px); }
          60%       { transform: translateX(4px); }
          75%       { transform: translateX(-2px); }
          90%       { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
};

export default Login;
