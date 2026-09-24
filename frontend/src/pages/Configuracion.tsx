import {
  Bell,
  Check,
  Database,
  Globe,
  Lock,
  Save,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

import "./Configuracion.css";

type Section =
  | "general"
  | "notificaciones"
  | "seguridad"
  | "sistema";

interface ConfiguracionData {
  id: number;
  nombre_sistema: string;
  nombre_empresa: string;
  correo_administrativo: string;
  ubicacion_principal_id: number | null;
  ubicacion_principal: string | null;
  moneda: string;
  idioma: string;
  notificar_stock_bajo: boolean;
  notificar_movimientos: boolean;
  notificar_nuevos_usuarios: boolean;
  resumen_diario: boolean;
  contrasenas_seguras: boolean;
  cierre_automatico: boolean;
  proteccion_sesion: boolean;
  stock_minimo: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

interface Ubicacion {
  id: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
}

interface UsuarioActual {
  id: number;
  nombre: string;
  email: string;
  rol: "admin" | "encargado";
  ubicacion_id: number | null;
  ubicacion_nombre: string | null;
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api";

export default function Configuracion() {
  const [section, setSection] =
    useState<Section>("general");

  const [configuracion, setConfiguracion] =
    useState<ConfiguracionData | null>(null);

  const [ubicaciones, setUbicaciones] =
    useState<Ubicacion[]>([]);

  const [usuarioActual, setUsuarioActual] =
    useState<UsuarioActual | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [guardado, setGuardado] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    cargarUsuarioActual();
    cargarConfiguracion();
    cargarUbicaciones();
  }, []);

  function cargarUsuarioActual() {
    const usuarioGuardado =
      localStorage.getItem("usuario");

    if (!usuarioGuardado) {
      setUsuarioActual(null);
      return;
    }

    try {
      const usuario =
        JSON.parse(usuarioGuardado);

      setUsuarioActual(usuario);
    } catch {
      setUsuarioActual(null);
    }
  }

  async function cargarConfiguracion() {
    try {
      setCargando(true);
      setError("");

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/configuracion`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const resultado =
        await response.json();

      if (
        !response.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo obtener la configuración",
        );
      }

      setConfiguracion(resultado.data);
    } catch (error) {
      console.error(
        "Error cargando configuración:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la configuración",
      );
    } finally {
      setCargando(false);
    }
  }

  async function cargarUbicaciones() {
    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/configuracion/ubicaciones`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const resultado =
        await response.json();

      if (
        !response.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudieron obtener las ubicaciones",
        );
      }

      setUbicaciones(resultado.data);
    } catch (error) {
      console.error(
        "Error cargando ubicaciones:",
        error,
      );
    }
  }

  function actualizarCampo<
    K extends keyof ConfiguracionData,
  >(
    campo: K,
    valor: ConfiguracionData[K],
  ) {
    setConfiguracion((actual) => {
      if (!actual) {
        return actual;
      }

      return {
        ...actual,
        [campo]: valor,
      };
    });
  }

  async function guardarCambios() {
    if (!configuracion) {
      return;
    }

    try {
      setGuardando(true);
      setGuardado(false);
      setError("");

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/configuracion`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre_sistema:
              configuracion.nombre_sistema,

            nombre_empresa:
              configuracion.nombre_empresa,

            ubicacion_principal_id:
              configuracion.ubicacion_principal_id,

            moneda:
              configuracion.moneda,

            idioma:
              configuracion.idioma,

            notificar_stock_bajo:
              configuracion.notificar_stock_bajo,

            notificar_movimientos:
              configuracion.notificar_movimientos,

            notificar_nuevos_usuarios:
              configuracion.notificar_nuevos_usuarios,

            resumen_diario:
              configuracion.resumen_diario,

            contrasenas_seguras:
              configuracion.contrasenas_seguras,

            cierre_automatico:
              configuracion.cierre_automatico,

            proteccion_sesion:
              configuracion.proteccion_sesion,

            stock_minimo:
              configuracion.stock_minimo,
          }),
        },
      );

      const resultado =
        await response.json();

      if (
        !response.ok ||
        !resultado.success
      ) {
        throw new Error(
          resultado.message ||
            "No se pudo actualizar la configuración",
        );
      }

      setConfiguracion((actual) => {
        if (!actual) {
          return resultado.data;
        }

        return {
          ...resultado.data,
          correo_administrativo:
            usuarioActual?.email ||
            actual.correo_administrativo,
        };
      });

      setGuardado(true);

      setTimeout(() => {
        setGuardado(false);
      }, 2500);
    } catch (error) {
      console.error(
        "Error guardando configuración:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la configuración",
      );
    } finally {
      setGuardando(false);
    }
  }

  const opciones = [
    {
      id: "general" as Section,
      titulo: "General",
      descripcion: "Información general",
      icono: Settings,
    },
    {
      id: "notificaciones" as Section,
      titulo: "Notificaciones",
      descripcion: "Alertas del sistema",
      icono: Bell,
    },
    {
      id: "seguridad" as Section,
      titulo: "Seguridad",
      descripcion: "Acceso y contraseñas",
      icono: Lock,
    },
    {
      id: "sistema" as Section,
      titulo: "Sistema",
      descripcion: "Información técnica",
      icono: Database,
    },
  ];

  if (cargando) {
    return (
      <div className="configuracion-page">
        <div className="configuracion-loading">
          <Database size={28} />

          <h2>
            Cargando configuración...
          </h2>

          <p>
            Obteniendo la configuración desde
            el servidor.
          </p>
        </div>
      </div>
    );
  }

  if (!configuracion) {
    return (
      <div className="configuracion-page">
        <div className="configuracion-error">
          <ShieldCheck size={28} />

          <h2>
            No se pudo cargar la configuración
          </h2>

          <p>
            {error ||
              "No fue posible obtener los datos del servidor."}
          </p>

          <button
            className="configuracion-save"
            onClick={cargarConfiguracion}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const correoUsuario =
    usuarioActual?.email ||
    "Sin correo";

  const nombreUsuario =
    usuarioActual?.nombre ||
    "Usuario";

  const rolUsuario =
    usuarioActual?.rol === "admin"
      ? "Administrador"
      : usuarioActual?.ubicacion_nombre
        ? `Encargado ${usuarioActual.ubicacion_nombre}`
        : "Encargado";

  return (
    <div className="configuracion-page">
      <div className="configuracion-header">
        <div>
          <span className="configuracion-kicker">
            <Settings size={13} />
            ADMINISTRACIÓN
          </span>

          <h1>
            Configuración
          </h1>

          <p>
            Administra las preferencias y
            configuración de tu sistema de
            inventario.
          </p>

          <div
            style={{
              marginTop: "12px",
              color: "var(--text-secondary)",
              fontSize: "12px",
            }}
          >
            Sesión iniciada como{" "}
            <strong
              style={{
                color: "var(--text-primary)",
              }}
            >
              {nombreUsuario}
            </strong>
            {" · "}
            {rolUsuario}
          </div>
        </div>

        <button
          className="configuracion-save"
          onClick={guardarCambios}
          disabled={guardando}
        >
          {guardando ? (
            <>
              <Save size={16} />
              Guardando...
            </>
          ) : guardado ? (
            <>
              <Check size={16} />
              Cambios guardados
            </>
          ) : (
            <>
              <Save size={16} />
              Guardar cambios
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="configuracion-error-message">
          {error}
        </div>
      )}

      <div className="configuracion-layout">
        <aside className="configuracion-menu">
          {opciones.map((opcion) => {
            const Icon = opcion.icono;

            return (
              <button
                key={opcion.id}
                className={`configuracion-menu-item ${
                  section === opcion.id
                    ? "configuracion-menu-item-active"
                    : ""
                }`}
                onClick={() =>
                  setSection(opcion.id)
                }
              >
                <div className="configuracion-menu-icon">
                  <Icon size={18} />
                </div>

                <div className="configuracion-menu-text">
                  <strong>
                    {opcion.titulo}
                  </strong>

                  <span>
                    {opcion.descripcion}
                  </span>
                </div>
              </button>
            );
          })}
        </aside>

        <section className="configuracion-panel">
          {section === "general" && (
            <div className="configuracion-section">
              <div className="configuracion-section-title">
                <div className="configuracion-section-icon">
                  <Globe size={19} />
                </div>

                <div>
                  <h2>
                    Configuración general
                  </h2>

                  <p>
                    Información principal del sistema.
                  </p>
                </div>
              </div>

              <div className="configuracion-grid">
                <div className="configuracion-field">
                  <label>
                    Nombre del sistema
                  </label>

                  <input
                    type="text"
                    value={
                      configuracion.nombre_sistema
                    }
                    onChange={(e) =>
                      actualizarCampo(
                        "nombre_sistema",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="configuracion-field">
                  <label>
                    Nombre de la empresa
                  </label>

                  <input
                    type="text"
                    value={
                      configuracion.nombre_empresa
                    }
                    onChange={(e) =>
                      actualizarCampo(
                        "nombre_empresa",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="configuracion-field">
                  <label>
                    Correo de la sesión actual
                  </label>

                  <input
                    type="email"
                    value={correoUsuario}
                    readOnly
                  />

                  <small
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "11px",
                      marginTop: "5px",
                      display: "block",
                    }}
                  >
                    Correo utilizado para iniciar
                    sesión en el sistema.
                  </small>
                </div>

                <div className="configuracion-field">
                  <label>
                    Ubicación principal
                  </label>

                  <select
                    value={
                      configuracion
                        .ubicacion_principal_id ?? ""
                    }
                    onChange={(e) => {
                      const id =
                        Number(e.target.value);

                      const ubicacion =
                        ubicaciones.find(
                          (item) =>
                            item.id === id,
                        );

                      actualizarCampo(
                        "ubicacion_principal_id",
                        id,
                      );

                      setConfiguracion(
                        (actual) => {
                          if (!actual) {
                            return actual;
                          }

                          return {
                            ...actual,
                            ubicacion_principal:
                              ubicacion?.nombre ??
                              null,
                          };
                        },
                      );
                    }}
                  >
                    {ubicaciones.map(
                      (ubicacion) => (
                        <option
                          key={ubicacion.id}
                          value={ubicacion.id}
                        >
                          {ubicacion.nombre}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="configuracion-field">
                  <label>
                    Moneda
                  </label>

                  <select
                    value={
                      configuracion.moneda
                    }
                    onChange={(e) =>
                      actualizarCampo(
                        "moneda",
                        e.target.value,
                      )
                    }
                  >
                    <option value="MXN">
                      Peso mexicano (MXN)
                    </option>
                  </select>
                </div>

                <div className="configuracion-field">
                  <label>
                    Idioma
                  </label>

                  <select
                    value={
                      configuracion.idioma
                    }
                    onChange={(e) =>
                      actualizarCampo(
                        "idioma",
                        e.target.value,
                      )
                    }
                  >
                    <option value="es">
                      Español
                    </option>
                  </select>
                </div>

                <div className="configuracion-field">
                  <label>
                    Stock mínimo global
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      configuracion.stock_minimo
                    }
                    onChange={(e) =>
                      actualizarCampo(
                        "stock_minimo",
                        Number(e.target.value),
                      )
                    }
                  />
                </div>
              </div>

              <div className="configuracion-info">
                <div className="configuracion-info-icon">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <strong>
                    Sistema centralizado
                  </strong>

                  <p>
                    La matriz administra el
                    inventario y controla los
                    movimientos hacia las sucursales
                    Saucos y 450.
                  </p>
                </div>
              </div>
            </div>
          )}

          {section === "notificaciones" && (
            <div className="configuracion-section">
              <div className="configuracion-section-title">
                <div className="configuracion-section-icon">
                  <Bell size={19} />
                </div>

                <div>
                  <h2>
                    Notificaciones
                  </h2>

                  <p>
                    Configura las alertas del sistema.
                  </p>
                </div>
              </div>

              <div className="configuracion-options">
                <div className="configuracion-option">
                  <div>
                    <strong>
                      Stock bajo
                    </strong>

                    <span>
                      Recibir una alerta cuando
                      un producto esté por debajo
                      del stock mínimo.
                    </span>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={
                        configuracion
                          .notificar_stock_bajo
                      }
                      onChange={(e) =>
                        actualizarCampo(
                          "notificar_stock_bajo",
                          e.target.checked,
                        )
                      }
                    />

                    <span />
                  </label>
                </div>

                <div className="configuracion-option">
                  <div>
                    <strong>
                      Movimientos
                    </strong>

                    <span>
                      Notificar cuando se registre
                      un nuevo movimiento.
                    </span>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={
                        configuracion
                          .notificar_movimientos
                      }
                      onChange={(e) =>
                        actualizarCampo(
                          "notificar_movimientos",
                          e.target.checked,
                        )
                      }
                    />

                    <span />
                  </label>
                </div>

                <div className="configuracion-option">
                  <div>
                    <strong>
                      Nuevos usuarios
                    </strong>

                    <span>
                      Notificar cuando se registre
                      un nuevo usuario.
                    </span>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={
                        configuracion
                          .notificar_nuevos_usuarios
                      }
                      onChange={(e) =>
                        actualizarCampo(
                          "notificar_nuevos_usuarios",
                          e.target.checked,
                        )
                      }
                    />

                    <span />
                  </label>
                </div>

                <div className="configuracion-option">
                  <div>
                    <strong>
                      Resumen diario
                    </strong>

                    <span>
                      Recibir un resumen diario del
                      estado del inventario.
                    </span>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={
                        configuracion.resumen_diario
                      }
                      onChange={(e) =>
                        actualizarCampo(
                          "resumen_diario",
                          e.target.checked,
                        )
                      }
                    />

                    <span />
                  </label>
                </div>
              </div>
            </div>
          )}

          {section === "seguridad" && (
            <div className="configuracion-section">
              <div className="configuracion-section-title">
                <div className="configuracion-section-icon">
                  <Lock size={19} />
                </div>

                <div>
                  <h2>
                    Seguridad
                  </h2>

                  <p>
                    Administra las opciones de seguridad.
                  </p>
                </div>
              </div>

              <div className="configuracion-options">
                <div className="configuracion-option">
                  <div>
                    <strong>
                      Contraseñas seguras
                    </strong>

                    <span>
                      Requerir contraseñas de mínimo
                      8 caracteres.
                    </span>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={
                        configuracion
                          .contrasenas_seguras
                      }
                      onChange={(e) =>
                        actualizarCampo(
                          "contrasenas_seguras",
                          e.target.checked,
                        )
                      }
                    />

                    <span />
                  </label>
                </div>

                <div className="configuracion-option">
                  <div>
                    <strong>
                      Cierre automático
                    </strong>

                    <span>
                      Cerrar automáticamente la
                      sesión después de un periodo
                      de inactividad.
                    </span>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={
                        configuracion
                          .cierre_automatico
                      }
                      onChange={(e) =>
                        actualizarCampo(
                          "cierre_automatico",
                          e.target.checked,
                        )
                      }
                    />

                    <span />
                  </label>
                </div>

                <div className="configuracion-option">
                  <div>
                    <strong>
                      Protección de sesión
                    </strong>

                    <span>
                      Mantener protegida la sesión
                      del usuario.
                    </span>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={
                        configuracion
                          .proteccion_sesion
                      }
                      onChange={(e) =>
                        actualizarCampo(
                          "proteccion_sesion",
                          e.target.checked,
                        )
                      }
                    />

                    <span />
                  </label>
                </div>
              </div>

              <div className="configuracion-security">
                <div className="configuracion-security-icon">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <strong>
                    Seguridad habilitada
                  </strong>

                  <p>
                    El sistema utilizará autenticación
                    y contraseñas protegidas cuando
                    se conecte con el backend.
                  </p>
                </div>
              </div>
            </div>
          )}

          {section === "sistema" && (
            <div className="configuracion-section">
              <div className="configuracion-section-title">
                <div className="configuracion-section-icon">
                  <Database size={19} />
                </div>

                <div>
                  <h2>
                    Información del sistema
                  </h2>

                  <p>
                    Información técnica de
                    MedInventory.
                  </p>
                </div>
              </div>

              <div className="configuracion-system">
                <div>
                  <span>
                    Versión
                  </span>

                  <strong>
                    1.0.0
                  </strong>
                </div>

                <div>
                  <span>
                    Frontend
                  </span>

                  <strong>
                    React + Vite
                  </strong>
                </div>

                <div>
                  <span>
                    Backend
                  </span>

                  <strong>
                    Node.js + Express
                  </strong>
                </div>

                <div>
                  <span>
                    Base de datos
                  </span>

                  <strong>
                    PostgreSQL
                  </strong>
                </div>

                <div>
                  <span>
                    API
                  </span>

                  <strong>
                    REST API
                  </strong>
                </div>

                <div>
                  <span>
                    Estado del sistema
                  </span>

                  <strong className="sistema-online">
                    ● Operativo
                  </strong>
                </div>
              </div>

              <div className="configuracion-database">
                <Database size={19} />

                <div>
                  <strong>
                    Base de datos conectada
                  </strong>

                  <p>
                    PostgreSQL será utilizado para
                    almacenar productos, usuarios,
                    inventario y movimientos.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}