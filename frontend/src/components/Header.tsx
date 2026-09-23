
import {
  ChevronDown,
  Menu,
  Settings,
  LogOut,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "./Header.css";

interface HeaderProps {
  onMenuClick: () => void;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: "admin" | "encargado";
  ubicacion_id: number | null;
  ubicacion_nombre: string | null;
}

function Header({
  onMenuClick,
}: HeaderProps) {
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  useEffect(() => {
    const cargarUsuario = () => {
      const usuarioGuardado =
        localStorage.getItem("usuario");

      if (!usuarioGuardado) {
        setUsuario(null);
        return;
      }

      try {
        const usuarioParseado =
          JSON.parse(usuarioGuardado);

        setUsuario(usuarioParseado);
      } catch {
        setUsuario(null);
      }
    };

    cargarUsuario();

    window.addEventListener(
      "storage",
      cargarUsuario,
    );

    return () => {
      window.removeEventListener(
        "storage",
        cargarUsuario,
      );
    };
  }, []);

  const esAdministrador =
    usuario?.rol === "admin";

  const nombreUsuario =
    usuario?.nombre || "Usuario";

  const rolUsuario = esAdministrador
    ? "Administrador"
    : usuario?.ubicacion_nombre
      ? `Encargado ${usuario.ubicacion_nombre}`
      : "Encargado";

  const iniciales = nombreUsuario
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((nombre) =>
      nombre.charAt(0).toUpperCase(),
    )
    .join("");

  const handleSettings = () => {
    setProfileOpen(false);

    navigate("/configuracion");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    setProfileOpen(false);
    setUsuario(null);

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <header className="header">

      <div className="header-left">

        <button
          className="header-menu"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>

        <div className="header-title">

          <span>
            Sistema de inventario
          </span>

          <strong>
            Gestión general
          </strong>

        </div>

      </div>

      <div className="header-right">

        <div className="header-profile">

          <button
            className="profile-button"
            onClick={() =>
              setProfileOpen(
                !profileOpen,
              )
            }
          >

            <div className="profile-avatar">
              {iniciales || "US"}
            </div>

            <div className="profile-info">

              <strong>
                {nombreUsuario}
              </strong>

              <span>
                {rolUsuario}
              </span>

            </div>

            <ChevronDown
              size={17}
              className={
                profileOpen
                  ? "profile-chevron-open"
                  : ""
              }
            />

          </button>

          {profileOpen && (
            <div className="profile-menu">

              <div className="profile-menu-header">

                <div className="profile-menu-avatar">
                  {iniciales || "US"}
                </div>

                <div>

                  <strong>
                    {nombreUsuario}
                  </strong>

                  <span>
                    {usuario?.email ||
                      "Sin correo"}
                  </span>

                </div>

              </div>

              <div className="profile-menu-divider" />

              <button
                className="profile-menu-item"
                onClick={handleSettings}
              >
                <Settings size={17} />

                <span>
                  Configuración
                </span>

              </button>

              <div className="profile-menu-divider" />

              <button
                className="profile-menu-item profile-menu-logout"
                onClick={handleLogout}
              >
                <LogOut size={17} />

                <span>
                  Cerrar sesión
                </span>

              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}

export default Header;
