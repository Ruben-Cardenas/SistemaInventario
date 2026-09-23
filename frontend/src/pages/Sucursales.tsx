import {
  ArrowRight,
  Building2,
  Package,
  Search,
  Store,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import "./Sucursales.css";

interface Sucursal {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  productos: number;
  unidades: number;
  stockBajo: number;
  activa: boolean;
}

interface Inventario {
  id: number;
  sku: string;
  producto: string;
  categoria: string;
  stock: number;
  minimo: number;
  precio: number;
  estado: string;
  stock_bajo: boolean;
}

interface SucursalesResponse {
  success: boolean;
  message: string;
  data: Sucursal[];
}

interface InventarioResponse {
  success: boolean;
  message: string;
  data: Inventario[];
}

function Sucursales() {
  const [sucursales, setSucursales] = useState<Sucursal[]>(
    [],
  );

  const [inventario, setInventario] = useState<
    Inventario[]
  >([]);

  const [sucursalSeleccionada, setSucursalSeleccionada] =
    useState<Sucursal | null>(null);

  const [busqueda, setBusqueda] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingInventario, setLoadingInventario] =
    useState(false);

  const [error, setError] = useState("");
  const [errorInventario, setErrorInventario] =
    useState("");

  useEffect(() => {
    async function cargarSucursales() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          setError("No hay una sesión activa.");
          return;
        }

        const response = await fetch(
          "http://localhost:3000/api/sucursales",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const result: SucursalesResponse =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "No se pudieron obtener las sucursales.",
          );
        }

        setSucursales(result.data);
      } catch (error) {
        console.error(
          "Error al cargar sucursales:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las sucursales.",
        );
      } finally {
        setLoading(false);
      }
    }

    cargarSucursales();
  }, []);

  async function verInventario(sucursal: Sucursal) {
    try {
      setSucursalSeleccionada(sucursal);
      setInventario([]);
      setBusqueda("");
      setLoadingInventario(true);
      setErrorInventario("");

      const token = localStorage.getItem("token");

      if (!token) {
        setErrorInventario(
          "No hay una sesión activa.",
        );
        return;
      }

      const response = await fetch(
        `http://localhost:3000/api/sucursales/${sucursal.id}/inventario`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result: InventarioResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "No se pudo obtener el inventario.",
        );
      }

      setInventario(result.data);
    } catch (error) {
      console.error(
        "Error al cargar inventario:",
        error,
      );

      setErrorInventario(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el inventario.",
      );
    } finally {
      setLoadingInventario(false);
    }
  }

  function cerrarInventario() {
    setSucursalSeleccionada(null);
    setInventario([]);
    setBusqueda("");
    setErrorInventario("");
  }

  const inventarioFiltrado = inventario.filter(
    (producto) => {
      const texto = busqueda.toLowerCase();

      return (
        producto.sku
          .toLowerCase()
          .includes(texto) ||
        producto.producto
          .toLowerCase()
          .includes(texto) ||
        producto.categoria
          .toLowerCase()
          .includes(texto)
      );
    },
  );

  return (
    <div className="sucursales-page">
      <div className="page-header">
        <div>
          <span className="page-kicker">
            UBICACIONES
          </span>

          <h1>Sucursales</h1>

          <p>
            Consulta el estado de cada ubicación del
            inventario.
          </p>
        </div>
      </div>

      {loading && (
        <div className="branch-state">
          <p>Cargando sucursales...</p>
        </div>
      )}

      {!loading && error && (
        <div className="branch-state branch-error">
          <p>{error}</p>
        </div>
      )}

      {!loading &&
        !error &&
        sucursales.length > 0 && (
          <>
            <div className="branch-flow">
              {sucursales.map(
                (sucursal, index) => (
                  <div
                    className="flow-item"
                    key={sucursal.id}
                  >
                    <div className="flow-location">
                      {sucursal.nombre ===
                      "Matriz" ? (
                        <Building2 size={20} />
                      ) : (
                        <Store size={20} />
                      )}

                      <span>
                        {sucursal.nombre}
                      </span>
                    </div>

                    {index <
                      sucursales.length - 1 && (
                      <ArrowRight size={20} />
                    )}
                  </div>
                ),
              )}
            </div>

            <section className="branches-grid">
              {sucursales.map((sucursal) => (
                <article
                  className="branch-card"
                  key={sucursal.id}
                >
                  <div className="branch-card-top">
                    <div className="branch-icon">
                      {sucursal.nombre ===
                      "Matriz" ? (
                        <Building2 size={22} />
                      ) : (
                        <Store size={22} />
                      )}
                    </div>

                    <span className="branch-type">
                      {sucursal.tipo}
                    </span>
                  </div>

                  <h2>{sucursal.nombre}</h2>

                  <p>
                    {sucursal.descripcion}
                  </p>

                  <div className="branch-stats">
                    <div>
                      <span>Productos</span>

                      <strong>
                        {sucursal.productos}
                      </strong>
                    </div>

                    <div>
                      <span>Unidades</span>

                      <strong>
                        {sucursal.unidades}
                      </strong>
                    </div>

                    <div>
                      <span>Stock bajo</span>

                      <strong>
                        {sucursal.stockBajo}
                      </strong>
                    </div>
                  </div>

                  <button
                    className="branch-button"
                    type="button"
                    onClick={() =>
                      verInventario(sucursal)
                    }
                  >
                    Ver inventario

                    <ArrowRight size={15} />
                  </button>
                </article>
              ))}
            </section>
          </>
        )}

      {sucursalSeleccionada && (
        <div
          className="inventory-modal-overlay"
          onClick={cerrarInventario}
        >
          <div
            className="inventory-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="inventory-modal-header">
              <div>
                <span className="page-kicker">
                  INVENTARIO
                </span>

                <h2>
                  {sucursalSeleccionada.nombre}
                </h2>

                <p>
                  Inventario actual de esta
                  ubicación.
                </p>
              </div>

              <button
                className="inventory-close-button"
                type="button"
                onClick={cerrarInventario}
              >
                <X size={19} />
              </button>
            </div>

            <div className="inventory-toolbar">
              <div className="inventory-search">
                <Search size={17} />

                <input
                  type="text"
                  placeholder="Buscar producto, SKU o categoría..."
                  value={busqueda}
                  onChange={(event) =>
                    setBusqueda(
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="inventory-total">
                <Package size={17} />

                <span>
                  {inventarioFiltrado.length}{" "}
                  productos
                </span>
              </div>
            </div>

            {loadingInventario && (
              <div className="inventory-state">
                <p>
                  Cargando inventario...
                </p>
              </div>
            )}

            {!loadingInventario &&
              errorInventario && (
                <div className="inventory-state inventory-error">
                  <p>
                    {errorInventario}
                  </p>
                </div>
              )}

            {!loadingInventario &&
              !errorInventario &&
              inventarioFiltrado.length ===
                0 && (
                <div className="inventory-state">
                  <Package size={30} />

                  <p>
                    No hay productos que
                    coincidan con la búsqueda.
                  </p>
                </div>
              )}

            {!loadingInventario &&
              !errorInventario &&
              inventarioFiltrado.length >
                0 && (
                <div className="inventory-table-wrapper">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Stock</th>
                        <th>Mínimo</th>
                        <th>Precio</th>
                        <th>Estado</th>
                      </tr>
                    </thead>

                    <tbody>
                      {inventarioFiltrado.map(
                        (producto) => (
                          <tr
                            key={
                              producto.id
                            }
                          >
                            <td>
                              <strong className="inventory-sku">
                                {producto.sku}
                              </strong>
                            </td>

                            <td>
                              {producto.producto}
                            </td>

                            <td>
                              {producto.categoria}
                            </td>

                            <td>
                              <span
                                className={
                                  producto.stock_bajo
                                    ? "inventory-stock inventory-stock-low"
                                    : "inventory-stock"
                                }
                              >
                                {
                                  producto.stock
                                }
                              </span>
                            </td>

                            <td>
                              {
                                producto.minimo
                              }
                            </td>

                            <td>
                              $
                              {Number(
                                producto.precio,
                              ).toLocaleString(
                                "es-MX",
                                {
                                  minimumFractionDigits: 2,
                                },
                              )}
                            </td>

                            <td>
                              <span
                                className={
                                  producto.estado ===
                                  "activo"
                                    ? "inventory-status inventory-status-active"
                                    : "inventory-status inventory-status-inactive"
                                }
                              >
                                {
                                  producto.estado
                                }
                              </span>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            <div className="inventory-modal-footer">
              <button
                type="button"
                onClick={cerrarInventario}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sucursales;