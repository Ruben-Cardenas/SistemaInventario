import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    usuario: {
      id: number;
      nombre: string;
      email: string;
      rol: "admin" | "encargado";
      ubicacion_id: number | null;
      ubicacion_nombre: string | null;
    };
    token: string;
  };
}

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] =
    useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setNotification(null);
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const data: LoginResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success ||
        !data.data
      ) {
        setNotification({
          type: "error",
          message:
            "Correo electrónico o contraseña incorrectos.",
        });

        setLoading(false);

        return;
      }

      localStorage.setItem(
        "token",
        data.data.token,
      );

      localStorage.setItem(
        "usuario",
        JSON.stringify(data.data.usuario),
      );

      setNotification({
        type: "success",
        message: "Inicio de sesión exitoso.",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error(
        "Error al iniciar sesión:",
        error,
      );

      setNotification({
        type: "error",
        message:
          "No se pudo conectar con el servidor.",
      });

      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      {notification && (
        <div
          className={`login-notification ${
            notification.type === "success"
              ? "login-notification-success"
              : "login-notification-error"
          }`}
        >
          <div className="login-notification-icon">
            {notification.type === "success" ? (
              <CheckCircle2 size={24} />
            ) : (
              <XCircle size={24} />
            )}
          </div>

          <div className="login-notification-content">
            <strong>
              {notification.type === "success"
                ? "¡Éxito!"
                : "Error"}
            </strong>

            <span>
              {notification.message}
            </span>
          </div>

          <button
            type="button"
            className="login-notification-close"
            onClick={() =>
              setNotification(null)
            }
          >
            ×
          </button>
        </div>
      )}

      <section className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-logo">
            <BarChart3 size={30} />
          </div>

          <span className="login-label">
            SISTEMA EMPRESARIAL
          </span>

          <h1>
            Controla tu inventario.
            <br />
            Simplifica tu operación.
          </h1>

          <p>
            Una plataforma centralizada para controlar
            productos, existencias y movimientos entre
            la matriz y sus sucursales.
          </p>

          <div className="login-locations">
            <div>
              <strong>3</strong>
              <span>Ubicaciones</span>
            </div>

            <div>
              <strong>100%</strong>
              <span>Centralizado</span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-container">
          <div className="login-mobile-logo">
            <div className="login-logo">
              <BarChart3 size={25} />
            </div>

            <span>Inventario</span>
          </div>

          <div className="login-heading">
            <span>BIENVENIDO</span>

            <h2>Iniciar sesión</h2>

            <p>
              Ingresa tus datos para acceder al sistema.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            <div className="form-group">
              <label htmlFor="email">
                Correo electrónico
              </label>

              <div className="input-wrapper">
                <Mail size={18} />

                <input
                  id="email"
                  type="email"
                  placeholder="admin@inventario.local"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Contraseña
              </label>

              <div className="input-wrapper">
                <LockKeyhole size={18} />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="remember-option">
                <input type="checkbox" />
                <span>Recordarme</span>
              </label>

              <button
                type="button"
                className="forgot-button"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Iniciando sesión..."
                  : "Ingresar al sistema"}
              </span>

              {!loading && (
                <ArrowRight size={19} />
              )}
            </button>
          </form>

          <div className="login-footer">
            <span>
              Sistema de Inventario
            </span>

            <span>
              © 2026
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;