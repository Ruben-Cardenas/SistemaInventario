import {
  BarChart3,
  Boxes,
  Building2,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Users,
  X,
  ArrowRightLeft,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import "./Sidebar.css";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Productos",
    path: "/productos",
    icon: Package,
  },
  {
    name: "Inventario",
    path: "/inventario",
    icon: Boxes,
  },
  {
    name: "Movimientos",
    path: "/movimientos",
    icon: ArrowRightLeft,
  },
  {
    name: "Sucursales",
    path: "/sucursales",
    icon: Building2,
  },
  {
    name: "Reportes",
    path: "/reportes",
    icon: FileBarChart,
  },
  {
    name: "Usuarios",
    path: "/usuarios",
    icon: Users,
  },
];

function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    navigate("/login", {
      replace: true,
    });

    onClose();
  };

  const handleSettings = () => {
    navigate("/configuracion");
    onClose();
  };

  return (
    <>
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside
        className={`sidebar ${
          open ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-logo">
            <BarChart3 size={22} />
          </div>

          <div className="brand-text">
            <strong>MedInventory</strong>
            <span>Gestión de inventario</span>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-label">
          MENÚ PRINCIPAL
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive
                      ? "sidebar-link-active"
                      : ""
                  }`
                }
              >
                <span className="sidebar-icon">
                  <Icon size={19} />
                </span>

                <span>{item.name}</span>

                <span className="sidebar-active-dot" />
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button
            className="sidebar-settings"
            onClick={handleSettings}
          >
            <Settings size={18} />
            <span>Configuración</span>
          </button>

          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;