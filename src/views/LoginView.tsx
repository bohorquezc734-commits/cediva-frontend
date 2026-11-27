import { useState, type SubmitEvent } from 'react';
import { Package, Lock, Mail, LogIn, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, extraerMensajeError } from '../services/api';
import type { LoginResponseDto } from '../types/cediva';

interface LoginViewProps {
  readonly onLoginExitoso: (sesion: LoginResponseDto) => void;
}

export function LoginView({ onLoginExitoso }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const enviarCredenciales = async (correo: string, clave: string) => {
    try {
      setEnviando(true);
      const { data } = await api.post<LoginResponseDto>('/AuthControlador/login', {
        email: correo.trim(),
        password: clave,
      });
      onLoginExitoso(data);
      toast.success(`Bienvenido, ${data.usuario.nombreCompleto}`);
    } catch (err) {
      toast.error(extraerMensajeError(err, 'No se pudo iniciar sesión. Verifica tus datos.'));
    } finally {
      setEnviando(false);
    }
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    void enviarCredenciales(email, password);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '8px',
            flexWrap: 'wrap',
          }}
        >
          <Package size={30} color="#0284c7" />
          <span style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '1.2px' }}>
            CEDIVA
          </span>
          <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
            Sistema de Control Logístico
          </p>
        </div>

        <p style={{ margin: '0 0 22px', color: 'var(--text-muted)', fontSize: '14px' }}>
          Ingresa con tu cuenta operativa para gestionar bodega, lectores RF y despachos.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={15} />
                <span>Correo electrónico</span>
              </span>
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@cediva.com"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={15} />
                <span>Contraseña</span>
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: '42px' }}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((prev) => !prev)}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
              >
                {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={enviando}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
          >
            <LogIn size={18} />
            <span>{enviando ? 'Ingresando...' : 'Iniciar Sesión'}</span>
          </button>
        </form>

        <div
          style={{
            marginTop: '20px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            lineHeight: 1.45,
          }}
        >
          <ShieldCheck size={16} color="#0284c7" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            Acceso restringido al personal autorizado de bodega. Solicita tus credenciales al Administrador.
          </span>
        </div>
      </div>
    </div>
  );
}