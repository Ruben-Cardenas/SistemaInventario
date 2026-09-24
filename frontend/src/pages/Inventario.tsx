import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import "./Inventario.css";

interface Stock {
  sku: string;
  producto: string;
  categoria: string;
  ubicacion: string;
  stock: number;
  minimo: number;
  precio: number;
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api";

function Inventario() {
  const [inventario, setInventario] = useState<Stock[]>([]);
  const [search, setSearch] = useState("");
  const [ubicacion, setUbicacion] = useState("Todas");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarInventario();
  }, []);

  async function cargarInventario() {
    try {
      setCargando(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("No hay sesión de usuario activa.");
        return;
      }

      const response = await fetch(
        `${API_URL}/productos/inventario`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(
          resultado.message ||
            "No se pudo obtener el inventario."
        );
      }

      const datos = Array.isArray(resultado.data)
        ? resultado.data
        : [];

      const inventarioFormateado: Stock[] = datos.map(
        (item: any) => ({
          sku: item.sku,
          producto: item.producto,
          categoria: item.categoria,
          ubicacion: item.ubicacion,
          stock: Number(
            item.stock ?? item.cantidad ?? 0
          ),
          minimo: Number(
            item.minimo ?? item.stock_minimo ?? 0
          ),
          precio: Number(item.precio ?? 0),
        })
      );

      setInventario(inventarioFormateado);
    } catch (error) {
      console.error(
        "Error al cargar inventario:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el inventario."
      );
    } finally {
      setCargando(false);
    }
  }

  const filtrados = useMemo(() => {
    const texto = search.toLowerCase().trim();

    return inventario.filter((item) => {
      const coincideBusqueda =
        item.producto
          .toLowerCase()
          .includes(texto) ||
        item.sku
          .toLowerCase()
          .includes(texto) ||
        item.categoria
          .toLowerCase()
          .includes(texto);

      const coincideUbicacion =
        ubicacion === "Todas" ||
        item.ubicacion === ubicacion;

      return (
        coincideBusqueda &&
        coincideUbicacion
      );
    });
  }, [inventario, search, ubicacion]);

  const totalStock = useMemo(() => {
    return inventario.reduce(
      (total, item) => total + item.stock,
      0
    );
  }, [inventario]);

  const stockBajo = useMemo(() => {
    return inventario.filter(
      (item) => item.stock < item.minimo
    ).length;
  }, [inventario]);

  const ubicaciones = useMemo(() => {
    return [
      ...new Set(
        inventario.map(
          (item) => item.ubicacion
        )
      ),
    ];
  }, [inventario]);

  const cantidadPorUbicacion = useMemo(() => {
    const cantidades: Record<string, number> = {};

    inventario.forEach((item) => {
      cantidades[item.ubicacion] =
        (cantidades[item.ubicacion] || 0) +
        item.stock;
    });

    return cantidades;
  }, [inventario]);

  return (
    <div className="inventario-page">
      <section className="page-header">
        <div>
          <span className="page-kicker">
            CONTROL DE EXISTENCIAS
          </span>

          <h1>Inventario</h1>

          <p>
            Consulta las existencias de productos por
            ubicación.
          </p>
        </div>
      </section>

      <section className="inventory-summary">
        <div className="inventory-summary-card">
          <div className="inventory-icon blue">
            <Boxes size={21} />
          </div>

          <div>
            <span>Stock total</span>

            <strong>
              {totalStock.toLocaleString("es-MX")}
            </strong>
          </div>
        </div>

        <div className="inventory-summary-card">
          <div className="inventory-icon orange">
            <AlertTriangle size={21} />
          </div>

          <div>
            <span>Stock bajo</span>

            <strong>{stockBajo}</strong>
          </div>
        </div>

        <div className="inventory-summary-card">
          <div className="inventory-icon green">
            <Building2 size={21} />
          </div>

          <div>
            <span>Ubicaciones</span>

            <strong>
              {ubicaciones.length}
            </strong>
          </div>
        </div>
      </section>

      <section className="inventory-panel">
        <div className="inventory-toolbar">
          <div className="inventory-search">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar producto o SKU..."
            />
          </div>

          <div className="inventory-filter">
            <Filter size={15} />

            <select
              value={ubicacion}
              onChange={(event) =>
                setUbicacion(event.target.value)
              }
            >
              <option value="Todas">
                Todas
              </option>

              {ubicaciones.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="inventory-locations">
          {ubicaciones.map((item) => (
            <button
              type="button"
              key={item}
              className={`location-pill ${
                ubicacion === item
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setUbicacion(
                  ubicacion === item
                    ? "Todas"
                    : item
                )
              }
            >
              {item}

              <strong>
                {(
                  cantidadPorUbicacion[item] || 0
                ).toLocaleString("es-MX")}
              </strong>
            </button>
          ))}
        </div>

        {cargando ? (
          <div className="inventory-empty">
            <Boxes size={32} />

            <strong>
              Cargando inventario...
            </strong>

            <p>
              Consultando existencias en PostgreSQL.
            </p>
          </div>
        ) : error ? (
          <div className="inventory-empty">
            <XCircle size={32} />

            <strong>
              No se pudo cargar el inventario
            </strong>

            <p>{error}</p>

            <button
              type="button"
              onClick={cargarInventario}
            >
              Reintentar
            </button>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="inventory-empty">
            <Search size={32} />

            <strong>
              No se encontraron productos
            </strong>

            <p>
              Intenta cambiar la búsqueda o el filtro.
            </p>
          </div>
        ) : (
          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>PRODUCTO</th>
                  <th>SKU</th>
                  <th>CATEGORÍA</th>
                  <th>UBICACIÓN</th>
                  <th>STOCK</th>
                  <th>MÍNIMO</th>
                  <th>PRECIO</th>
                  <th>ESTADO</th>
                </tr>
              </thead>

              <tbody>
                {filtrados.map((item) => {
                  const sinStock =
                    item.stock === 0;

                  const bajo =
                    item.stock < item.minimo;

                  return (
                    <tr
                      key={`${item.sku}-${item.ubicacion}`}
                    >
                      <td>
                        <strong>
                          {item.producto}
                        </strong>
                      </td>

                      <td className="inventory-sku">
                        {item.sku}
                      </td>

                      <td>
                        {item.categoria}
                      </td>

                      <td>
                        <span className="location-badge">
                          {item.ubicacion}
                        </span>
                      </td>

                      <td>
                        <strong
                          className={
                            bajo
                              ? "stock-low"
                              : "stock-ok"
                          }
                        >
                          {item.stock}
                        </strong>
                      </td>

                      <td>
                        {item.minimo}
                      </td>

                      <td className="inventory-price">
                        $
                        {item.precio.toLocaleString(
                          "es-MX"
                        )}
                      </td>

                      <td>
                        {sinStock ? (
                          <span className="stock-status danger">
                            <XCircle size={12} />
                            Sin stock
                          </span>
                        ) : bajo ? (
                          <span className="stock-status warning">
                            <AlertTriangle size={12} />
                            Stock bajo
                          </span>
                        ) : (
                          <span className="stock-status success">
                            <CheckCircle2 size={12} />
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!cargando && !error && (
          <div className="inventory-footer">
            Mostrando{" "}
            <strong>{filtrados.length}</strong>{" "}
            registros de inventario
          </div>
        )}
      </section>
    </div>
  );
}

export default Inventario;