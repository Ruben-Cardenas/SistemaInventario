import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Package,
  TrendingUp,
  Building2,
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";

interface DashboardResumen {
  totalProductos: number;
  stockTotal: number;
  stockBajo: number;
  movimientos: number;
}

interface InventarioUbicacion {
  id: number;
  nombre: string;
  cantidad: number;
  descripcion: string;
}

interface StockBajoProducto {
  id: number;
  sku: string;
  producto: string;
  categoria: string;
  ubicacion: string;
  stock: number;
  minimo: number;
  precio: string;
}

interface MovimientoReciente {
  id: number;
  folio: string;
  tipo: string;
  origen: string | null;
  destino: string | null;
  fecha: string;
  total: string;
  cantidad: number;
}

interface GraficaMovimiento {
  mes: string;
  numero_mes: number;
  tipo: string;
  cantidad: number;
}

interface DashboardData {
  resumen: DashboardResumen;
  inventarioPorUbicacion: InventarioUbicacion[];
  stockBajoProductos: StockBajoProducto[];
  movimientosRecientes: MovimientoReciente[];
  graficaMovimientos: GraficaMovimiento[];
}

interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api";

function Dashboard() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const obtenerDashboard = async () => {
      try {
        const token =
          localStorage.getItem("token");

        if (!token) {
          setError(
            "No hay una sesión activa.",
          );

          setLoading(false);

          return;
        }

        const response = await fetch(
          `${API_URL}/dashboard`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const resultado: DashboardResponse =
          await response.json();

        if (
          !response.ok ||
          !resultado.success
        ) {
          throw new Error(
            resultado.message ||
              "No se pudieron obtener los datos.",
          );
        }

        setDashboard(resultado.data);
      } catch (error) {
        console.error(
          "Error al cargar dashboard:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los datos del dashboard.",
        );
      } finally {
        setLoading(false);
      }
    };

    obtenerDashboard();
  }, []);

  const formatearNumero = (
    numero: number,
  ) => {
    return new Intl.NumberFormat(
      "es-MX",
    ).format(numero);
  };

  const formatearFecha = (
    fecha: string,
  ) => {
    const fechaObjeto =
      new Date(fecha);

    if (
      Number.isNaN(
        fechaObjeto.getTime(),
      )
    ) {
      return fecha;
    }

    return fechaObjeto.toLocaleDateString(
      "es-MX",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );
  };

  const datosGrafica = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    const meses = new Map<
      number,
      {
        mes: string;
        entrada: number;
        traslado: number;
      }
    >();

    dashboard.graficaMovimientos.forEach(
      (item) => {
        if (
          !meses.has(
            item.numero_mes,
          )
        ) {
          meses.set(
            item.numero_mes,
            {
              mes: item.mes,
              entrada: 0,
              traslado: 0,
            },
          );
        }

        const actual =
          meses.get(
            item.numero_mes,
          );

        if (!actual) {
          return;
        }

        if (
          item.tipo ===
          "entrada_proveedor"
        ) {
          actual.entrada +=
            item.cantidad;
        }

        if (
          item.tipo ===
          "traslado_sucursal"
        ) {
          actual.traslado +=
            item.cantidad;
        }
      },
    );

    return Array.from(
      meses.values(),
    );
  }, [dashboard]);

  const maxGrafica = useMemo(() => {
    if (
      datosGrafica.length === 0
    ) {
      return 100;
    }

    const maximo = Math.max(
      ...datosGrafica.flatMap(
        (item) => [
          item.entrada,
          item.traslado,
        ],
      ),
    );

    return maximo > 0
      ? maximo
      : 100;
  }, [datosGrafica]);

  const ubicacionMaxima = useMemo(() => {
    if (
      !dashboard ||
      dashboard.inventarioPorUbicacion
        .length === 0
    ) {
      return 1;
    }

    return Math.max(
      ...dashboard.inventarioPorUbicacion.map(
        (ubicacion) =>
          ubicacion.cantidad,
      ),
      1,
    );
  }, [dashboard]);

  if (loading) {
    return (
      <div className="dashboard-page">
        <section className="dashboard-heading">
          <div>
            <span className="dashboard-kicker">
              <Activity size={13} />
              RESUMEN DEL SISTEMA
            </span>

            <h1>
              Dashboard
            </h1>

            <p>
              Consulta el estado general del inventario
              y las operaciones recientes.
            </p>
          </div>
        </section>

        <div className="dashboard-card">
          <div
            style={{
              padding: "40px",
              textAlign: "center",
            }}
          >
            Cargando información del inventario...
          </div>
        </div>
      </div>
    );
  }

  if (
    error ||
    !dashboard
  ) {
    return (
      <div className="dashboard-page">
        <section className="dashboard-heading">
          <div>
            <span className="dashboard-kicker">
              <Activity size={13} />
              RESUMEN DEL SISTEMA
            </span>

            <h1>
              Dashboard
            </h1>

            <p>
              Consulta el estado general del inventario
              y las operaciones recientes.
            </p>
          </div>
        </section>

        <div className="dashboard-card">
          <div
            style={{
              padding: "40px",
              textAlign: "center",
            }}
          >
            <AlertTriangle size={30} />

            <h2>
              No se pudo cargar el dashboard
            </h2>

            <p>
              {error ||
                "No se recibieron datos del servidor."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-heading">
        <div>
          <span className="dashboard-kicker">
            <Activity size={13} />
            RESUMEN DEL SISTEMA
          </span>

          <h1>
            Dashboard
          </h1>

          <p>
            Consulta el estado general del inventario
            y las operaciones recientes.
          </p>
        </div>

        <div className="dashboard-date">
          <span>
            ACTUALIZADO
          </span>

          <strong>
            {new Date().toLocaleDateString(
              "es-MX",
              {
                day: "2-digit",
                month: "long",
                year: "numeric",
              },
            )}
          </strong>
        </div>
      </section>

      <section className="dashboard-kpis">
        <div className="dashboard-kpi blue">
          <div className="kpi-icon">
            <Package size={21} />
          </div>

          <div>
            <span>
              Total de productos
            </span>

            <strong>
              {formatearNumero(
                dashboard.resumen
                  .totalProductos,
              )}
            </strong>

            <small>
              <TrendingUp size={12} />
              Productos activos
            </small>
          </div>
        </div>

        <div className="dashboard-kpi cyan">
          <div className="kpi-icon">
            <Boxes size={21} />
          </div>

          <div>
            <span>
              Stock total
            </span>

            <strong>
              {formatearNumero(
                dashboard.resumen
                  .stockTotal,
              )}
            </strong>

            <small>
              <TrendingUp size={12} />
              Unidades disponibles
            </small>
          </div>
        </div>

        <div className="dashboard-kpi orange">
          <div className="kpi-icon">
            <AlertTriangle size={21} />
          </div>

          <div>
            <span>
              Stock bajo
            </span>

            <strong>
              {formatearNumero(
                dashboard.resumen
                  .stockBajo,
              )}
            </strong>

            <small className="danger-text">
              Requieren atención
            </small>
          </div>
        </div>

        <div className="dashboard-kpi green">
          <div className="kpi-icon">
            <ArrowUpRight size={21} />
          </div>

          <div>
            <span>
              Movimientos
            </span>

            <strong>
              {formatearNumero(
                dashboard.resumen
                  .movimientos,
              )}
            </strong>

            <small>
              <TrendingUp size={12} />
              Movimientos registrados
            </small>
          </div>
        </div>
      </section>

      <section className="dashboard-main-grid">
        <div className="dashboard-card movement-chart">
          <div className="dashboard-card-header">
            <div>
              <h2>
                Movimientos de inventario
              </h2>

              <p>
                Actividad registrada durante los últimos
                6 meses.
              </p>
            </div>

            <select defaultValue="6">
              <option value="6">
                Últimos 6 meses
              </option>

              <option value="12">
                Último año
              </option>
            </select>
          </div>

          <div className="chart-legend">
            <span>
              <i className="legend-entry" />
              Entradas
            </span>

            <span>
              <i className="legend-transfer" />
              Traslados
            </span>
          </div>

          <div className="fake-chart">
            <div className="chart-y">
              <span>
                {maxGrafica}
              </span>

              <span>
                {Math.round(
                  maxGrafica * 0.75,
                )}
              </span>

              <span>
                {Math.round(
                  maxGrafica * 0.5,
                )}
              </span>

              <span>
                {Math.round(
                  maxGrafica * 0.25,
                )}
              </span>

              <span>
                0
              </span>
            </div>

            <div className="chart-area">
              <div className="chart-grid-lines">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>

              {datosGrafica.length > 0 ? (
                <>
                  <svg
                    className="chart-svg"
                    viewBox="0 0 600 220"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      points={datosGrafica
                        .map(
                          (
                            item,
                            index,
                          ) => {
                            const x =
                              datosGrafica.length ===
                              1
                                ? 300
                                : (index /
                                    (datosGrafica.length -
                                      1)) *
                                  600;

                            const y =
                              200 -
                              (item.entrada /
                                maxGrafica) *
                                170;

                            return `${x},${y}`;
                          },
                        )
                        .join(" ")}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <polyline
                      points={datosGrafica
                        .map(
                          (
                            item,
                            index,
                          ) => {
                            const x =
                              datosGrafica.length ===
                              1
                                ? 300
                                : (index /
                                    (datosGrafica.length -
                                      1)) *
                                  600;

                            const y =
                              200 -
                              (item.traslado /
                                maxGrafica) *
                                170;

                            return `${x},${y}`;
                          },
                        )
                        .join(" ")}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <div className="chart-months">
                    {datosGrafica.map(
                      (item) => (
                        <span
                          key={item.mes}
                        >
                          {item.mes}
                        </span>
                      ),
                    )}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    height: "100%",
                    minHeight: "220px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <span>
                    No hay movimientos registrados todavía.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-card locations-card">
          <div className="dashboard-card-header">
            <div>
              <h2>
                Inventario por ubicación
              </h2>

              <p>
                Existencias actuales.
              </p>
            </div>

            <div className="small-blue-icon">
              <Building2 size={17} />
            </div>
          </div>

          {dashboard.inventarioPorUbicacion.map(
            (ubicacion) => {
              const porcentaje =
                (ubicacion.cantidad /
                  ubicacionMaxima) *
                100;

              return (
                <div
                  className="location-item"
                  key={ubicacion.id}
                >
                  <div className="location-info">
                    <strong>
                      {ubicacion.nombre}
                    </strong>

                    <span>
                      {formatearNumero(
                        ubicacion.cantidad,
                      )}{" "}
                      unidades
                    </span>
                  </div>

                  <div className="location-bar">
                    <span
                      style={{
                        width: `${Math.max(
                          porcentaje,
                          2,
                        )}%`,
                      }}
                    />
                  </div>

                  <small>
                    {ubicacion.descripcion}
                  </small>
                </div>
              );
            },
          )}

          <Link
            className="dashboard-link"
            to="/inventario"
          >
            Ver inventario completo
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>

      <section className="dashboard-bottom-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h2>
                Productos con stock bajo
              </h2>

              <p>
                Productos que necesitan reabastecimiento.
              </p>
            </div>

            <Link
              className="dashboard-link"
              to="/inventario"
            >
              Ver todos
            </Link>
          </div>

          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>
                    PRODUCTO
                  </th>

                  <th>
                    SKU
                  </th>

                  <th>
                    UBICACIÓN
                  </th>

                  <th>
                    STOCK
                  </th>

                  <th>
                    ESTADO
                  </th>
                </tr>
              </thead>

              <tbody>
                {dashboard
                  .stockBajoProductos
                  .length > 0 ? (
                  dashboard.stockBajoProductos.map(
                    (
                      item,
                      index,
                    ) => (
                      <tr
                        key={`${item.sku}-${item.ubicacion}-${index}`}
                      >
                        <td>
                          <strong>
                            {item.producto}
                          </strong>
                        </td>

                        <td className="table-sku">
                          {item.sku}
                        </td>

                        <td>
                          {item.ubicacion}
                        </td>

                        <td>
                          <strong className="low-stock">
                            {item.stock}
                          </strong>

                          <span>
                            {" "}
                            / {item.minimo}
                          </span>
                        </td>

                        <td>
                          <span className="status danger">
                            Stock bajo
                          </span>
                        </td>
                      </tr>
                    ),
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign:
                          "center",
                        padding:
                          "30px",
                      }}
                    >
                      No hay productos con stock bajo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-card activity-card">
          <div className="dashboard-card-header">
            <div>
              <h2>
                Actividad reciente
              </h2>

              <p>
                Últimos movimientos.
              </p>
            </div>
          </div>

          <div className="activity-list">
            {dashboard
              .movimientosRecientes
              .length > 0 ? (
              dashboard.movimientosRecientes.map(
                (movimiento) => (
                  <div
                    className="activity-item"
                    key={
                      movimiento.folio
                    }
                  >
                    <div
                      className={`activity-icon ${
                        movimiento.tipo ===
                        "entrada_proveedor"
                          ? "entry"
                          : "transfer"
                      }`}
                    >
                      {movimiento.tipo ===
                      "entrada_proveedor" ? (
                        <ArrowDownLeft
                          size={17}
                        />
                      ) : (
                        <ArrowUpRight
                          size={17}
                        />
                      )}
                    </div>

                    <div className="activity-info">
                      <strong>
                        {movimiento.folio}
                      </strong>

                      <span>
                        {movimiento.origen ||
                          "Proveedor"}{" "}
                        →{" "}
                        {movimiento.destino ||
                          "Sin destino"}
                      </span>

                      <small>
                        {formatearFecha(
                          movimiento.fecha,
                        )}
                      </small>
                    </div>

                    <strong className="activity-amount">
                      {movimiento.cantidad}
                      <small>
                        {" "}
                        uds.
                      </small>
                    </strong>
                  </div>
                ),
              )
            ) : (
              <div
                style={{
                  padding:
                    "30px 20px",
                  textAlign:
                    "center",
                }}
              >
                <Activity size={25} />

                <p>
                  No hay movimientos registrados
                  todavía.
                </p>
              </div>
            )}
          </div>

          <Link
            to="/movimientos"
            className="activity-footer"
          >
            Ver todos los movimientos
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;