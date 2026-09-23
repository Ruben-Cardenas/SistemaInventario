import { useEffect, useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  User,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import "./Usuarios.css";

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  ubicacion: string;
  estado: "Activo" | "Inactivo";
  ubicacion_id: number | null;
  activo: boolean;
  fecha_creacion: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Usuario[];
}

interface ActionResponse {
  success: boolean;
  message: string;
  data?: Usuario;
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalPassword, setModalPassword] =
    useState<Usuario | null>(null);

  const [nuevaPassword, setNuevaPassword] =
    useState("");

  const [confirmarPassword, setConfirmarPassword] =
    useState("");

  const [guardandoPassword, setGuardandoPassword] =
    useState(false);

  const [mensaje, setMensaje] = useState("");

  const token = localStorage.getItem("token");

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        setError("No hay una sesión activa.");
        return;
      }

      const response = await fetch(
        "http://localhost:3000/api/usuarios",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result: ApiResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "No se pudieron obtener los usuarios",
        );
      }

      setUsuarios(result.data);
    } catch (error) {
      console.error(
        "Error cargando usuarios:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los usuarios",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cambiarEstado = async (
    usuario: Usuario,
  ) => {
    try {
      setMensaje("");
      setError("");

      if (!token) {
        setError("No hay una sesión activa.");
        return;
      }

      const nuevoEstado = !usuario.activo;

      const response = await fetch(
        `http://localhost:3000/api/usuarios/${usuario.id}/estado`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            activo: nuevoEstado,
          }),
        },
      );

      const result: ActionResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "No se pudo cambiar el estado",
        );
      }

      setMensaje(result.message);

      await cargarUsuarios();
    } catch (error) {
      console.error(
        "Error cambiando estado:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado",
      );
    }
  };

  const abrirModalPassword = (
    usuario: Usuario,
  ) => {
    setNuevaPassword("");
    setConfirmarPassword("");
    setError("");
    setMensaje("");
    setModalPassword(usuario);
  };

  const cerrarModalPassword = () => {
    if (guardandoPassword) {
      return;
    }

    setModalPassword(null);
    setNuevaPassword("");
    setConfirmarPassword("");
  };

  const cambiarPassword = async () => {
    if (!modalPassword) {
      return;
    }

    setError("");
    setMensaje("");

    if (nuevaPassword.length < 8) {
      setError(
        "La contraseña debe tener al menos 8 caracteres.",
      );
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError(
        "Las contraseñas no coinciden.",
      );
      return;
    }

    if (!token) {
      setError("No hay una sesión activa.");
      return;
    }

    try {
      setGuardandoPassword(true);

      const response = await fetch(
        `http://localhost:3000/api/usuarios/${modalPassword.id}/password`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nuevaPassword,
          }),
        },
      );

      const result: ActionResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "No se pudo cambiar la contraseña",
        );
      }

      setMensaje(result.message);

      cerrarModalPassword();

      await cargarUsuarios();
    } catch (error) {
      console.error(
        "Error cambiando contraseña:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar la contraseña",
      );
    } finally {
      setGuardandoPassword(false);
    }
  };

  const totalUsuarios = usuarios.length;

  const administradores = usuarios.filter(
    (usuario) =>
      usuario.rol === "Administrador",
  ).length;

  const encargados = usuarios.filter(
    (usuario) =>
      usuario.rol === "Encargado",
  ).length;

  const activos = usuarios.filter(
    (usuario) => usuario.activo,
  ).length;

  return (
    <div className="usuarios-page">
      <div className="page-header">
        <div>
          <span className="page-kicker">
            ADMINISTRACIÓN
          </span>

          <h1>Usuarios</h1>

          <p>
            Administra el estado y las contraseñas
            de los usuarios del sistema.
          </p>
        </div>
      </div>

      {mensaje && (
        <div className="users-message success">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="users-message error">
          {error}
        </div>
      )}

      <section className="users-summary">
        <div>
          <User size={19} />

          <span>Total de usuarios</span>

          <strong>{totalUsuarios}</strong>
        </div>

        <div>
          <ShieldCheck size={19} />

          <span>Administradores</span>

          <strong>{administradores}</strong>
        </div>

        <div>
          <User size={19} />

          <span>Encargados</span>

          <strong>{encargados}</strong>
        </div>

        <div>
          <UserCheck size={19} />

          <span>Usuarios activos</span>

          <strong>{activos}</strong>
        </div>
      </section>

      <section className="users-panel">
        <div className="users-table-wrapper">
          {loading ? (
            <div className="users-loading">
              Cargando usuarios...
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {usuario.rol ===
                          "Administrador" ? (
                            <ShieldCheck
                              size={16}
                            />
                          ) : (
                            <User size={16} />
                          )}
                        </div>

                        <div>
                          <strong>
                            {usuario.nombre}
                          </strong>

                          <span>
                            {usuario.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`role-badge ${
                          usuario.rol ===
                          "Administrador"
                            ? "admin"
                            : ""
                        }`}
                      >
                        {usuario.rol}
                      </span>
                    </td>

                    <td>
                      {usuario.ubicacion}
                    </td>

                    <td>
                      <span
                        className={`user-status ${
                          usuario.activo
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        <span className="status-dot" />
                        {usuario.estado}
                      </span>
                    </td>

                    <td>
                      {usuario.rol ===
                      "Encargado" ? (
                        <div className="user-actions">
                          <button
                            className={
                              usuario.activo
                                ? "user-action-button deactivate"
                                : "user-action-button activate"
                            }
                            title={
                              usuario.activo
                                ? "Desactivar usuario"
                                : "Activar usuario"
                            }
                            onClick={() =>
                              cambiarEstado(
                                usuario,
                              )
                            }
                          >
                            {usuario.activo ? (
                              <UserX
                                size={16}
                              />
                            ) : (
                              <UserCheck
                                size={16}
                              />
                            )}
                          </button>

                          <button
                            className="user-action-button password"
                            title="Cambiar contraseña"
                            onClick={() =>
                              abrirModalPassword(
                                usuario,
                              )
                            }
                          >
                            <KeyRound
                              size={16}
                            />
                          </button>
                        </div>
                      ) : (
                        <span className="admin-protected">
                          Cuenta protegida
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {modalPassword && (
        <div className="password-modal-overlay">
          <div className="password-modal">
            <div className="password-modal-header">
              <div>
                <span className="page-kicker">
                  SEGURIDAD
                </span>

                <h2>
                  Cambiar contraseña
                </h2>

                <p>
                  {modalPassword.nombre}
                </p>
              </div>

              <button
                className="modal-close-button"
                onClick={
                  cerrarModalPassword
                }
                disabled={guardandoPassword}
                title="Cerrar"
              >
                <X size={19} />
              </button>
            </div>

            <div className="password-form">
              <label>
                Nueva contraseña
              </label>

              <input
                type="password"
                value={nuevaPassword}
                onChange={(event) =>
                  setNuevaPassword(
                    event.target.value,
                  )
                }
                placeholder="Mínimo 8 caracteres"
                disabled={guardandoPassword}
              />

              <label>
                Confirmar contraseña
              </label>

              <input
                type="password"
                value={confirmarPassword}
                onChange={(event) =>
                  setConfirmarPassword(
                    event.target.value,
                  )
                }
                placeholder="Repite la contraseña"
                disabled={guardandoPassword}
              />

              <div className="password-modal-actions">
                <button
                  className="modal-cancel-button"
                  onClick={
                    cerrarModalPassword
                  }
                  disabled={
                    guardandoPassword
                  }
                >
                  Cancelar
                </button>

                <button
                  className="modal-save-button"
                  onClick={
                    cambiarPassword
                  }
                  disabled={
                    guardandoPassword
                  }
                >
                  <KeyRound size={16} />

                  {guardandoPassword
                    ? "Guardando..."
                    : "Cambiar contraseña"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;