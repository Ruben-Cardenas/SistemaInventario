import { Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Productos from "../pages/Productos";
import Inventario from "../pages/Inventario";
import Movimientos from "../pages/Movimientos";
import Sucursales from "../pages/Sucursales";
import Reportes from "../pages/Reportes";
import Usuarios from "../pages/Usuarios";
import Configuracion from "../pages/Configuracion";

function AppRoutes() {
  return (
    <Routes>

      <Route
        path="/login"
        element={<Login />}
      />

      <Route element={<ProtectedRoute />}>

        <Route element={<DashboardLayout />}>

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/productos"
            element={<Productos />}
          />

          <Route
            path="/inventario"
            element={<Inventario />}
          />

          <Route
            path="/movimientos"
            element={<Movimientos />}
          />

          <Route
            path="/sucursales"
            element={<Sucursales />}
          />

          <Route
            path="/reportes"
            element={<Reportes />}
          />

          <Route
            path="/usuarios"
            element={<Usuarios />}
          />

          <Route
            path="/configuracion"
            element={<Configuracion />}
          />

        </Route>

      </Route>

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  );
}

export default AppRoutes;