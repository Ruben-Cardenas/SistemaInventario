import {
  ArrowDownLeft,
  ArrowRight,
  FileText,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import "./Movimientos.css";

interface Movimiento {
  id: number;
  folio: string;
  tipo: "Entrada de proveedor" | "Traslado a sucursal";
  origen: string;
  destino: string;
  usuario: string;
  productos: number;
  total: number;
  fecha: string;
  observaciones?: string | null;
}

interface Producto {
  id: number;
  sku: string;
  nombre: string;
  precio: number;
  categoria?: string;
  estado?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: Movimiento[];
}

interface ProductosResponse {
  success: boolean;
  message: string;
  data: Producto[];
}

interface MovimientoForm {
  tipo: "entrada_proveedor" | "traslado_sucursal";
  destino_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  observaciones: string;
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api";

function Movimientos() {
  const [search, setSearch] = useState("");
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [formulario, setFormulario] =
    useState<MovimientoForm>({
      tipo: "entrada_proveedor",
      destino_id: 1,
      producto_id: 0,
      cantidad: 1,
      precio_unitario: 0,
      observaciones: "",
    });

  async function cargarMovimientos() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("No hay una sesión activa.");
        return;
      }

      const response = await fetch(
        `${API_URL}/movimientos`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result: ApiResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "No se pudieron obtener los movimientos."
        );
      }

      setMovimientos(result.data);
    } catch (error) {
      console.error(
        "Error al cargar movimientos:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los movimientos."
      );
    } finally {
      setLoading(false);
    }
  }

  async function cargarProductos() {
    try {
      setLoadingProductos(true);

      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_URL}/productos`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result: ProductosResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "No se pudieron obtener los productos."
        );
      }

      setProductos(result.data);

      if (result.data.length > 0) {
        setFormulario((actual) => ({
          ...actual,
          producto_id: result.data[0].id,
          precio_unitario: Number(
            result.data[0].precio
          ),
        }));
      }
    } catch (error) {
      console.error(
        "Error al cargar productos:",
        error
      );

      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los productos."
      );
    } finally {
      setLoadingProductos(false);
    }
  }

  useEffect(() => {
    cargarMovimientos();
    cargarProductos();
  }, []);

  const movimientosFiltrados =
    movimientos.filter((movimiento) => {
      const texto = search.toLowerCase();

      return (
        movimiento.folio
          .toLowerCase()
          .includes(texto) ||
        movimiento.origen
          .toLowerCase()
          .includes(texto) ||
        movimiento.destino
          .toLowerCase()
          .includes(texto)
      );
    });

  const entradas = movimientos.filter(
    (movimiento) =>
      movimiento.tipo === "Entrada de proveedor"
  ).length;

  const traslados = movimientos.filter(
    (movimiento) =>
      movimiento.tipo === "Traslado a sucursal"
  ).length;

  function abrirFormulario() {
    setFormError("");
    setFormSuccess("");

    const primerProducto = productos[0];

    setFormulario({
      tipo: "entrada_proveedor",
      destino_id: 1,
      producto_id: primerProducto?.id || 0,
      cantidad: 1,
      precio_unitario: primerProducto
        ? Number(primerProducto.precio)
        : 0,
      observaciones: "",
    });

    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    setMostrarFormulario(false);
    setFormError("");
    setFormSuccess("");
  }

  function cambiarProducto(
    productoId: number
  ) {
    const producto = productos.find(
      (item) => item.id === productoId
    );

    setFormulario((actual) => ({
      ...actual,
      producto_id: productoId,
      precio_unitario: producto
        ? Number(producto.precio)
        : 0,
    }));
  }

  function cambiarTipo(
    tipo:
      | "entrada_proveedor"
      | "traslado_sucursal"
  ) {
    setFormulario((actual) => ({
      ...actual,
      tipo,
      destino_id:
        tipo === "entrada_proveedor" ? 1 : 2,
    }));

    setFormError("");
  }

  async function guardarMovimiento() {
    setFormError("");
    setFormSuccess("");

    if (!formulario.producto_id) {
      setFormError("Selecciona un producto.");
      return;
    }

    if (
      !Number.isInteger(formulario.cantidad) ||
      formulario.cantidad <= 0
    ) {
      setFormError(
        "La cantidad debe ser un número entero mayor que 0."
      );
      return;
    }

    if (
      !Number.isFinite(
        formulario.precio_unitario
      ) ||
      formulario.precio_unitario < 0
    ) {
      setFormError(
        "El precio unitario no es válido."
      );
      return;
    }

    if (
      formulario.tipo ===
        "traslado_sucursal" &&
      !formulario.destino_id
    ) {
      setFormError(
        "Selecciona una sucursal de destino."
      );
      return;
    }

    try {
      setGuardando(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setFormError(
          "No hay una sesión activa."
        );
        return;
      }

      const body = {
        tipo: formulario.tipo,

        ...(formulario.tipo ===
          "traslado_sucursal" && {
          destino_id:
            formulario.destino_id,
        }),

        detalles: [
          {
            producto_id:
              formulario.producto_id,
            cantidad:
              formulario.cantidad,
            precio_unitario:
              formulario.precio_unitario,
          },
        ],

        observaciones:
          formulario.observaciones.trim() ||
          undefined,
      };

      const response = await fetch(
        `${API_URL}/movimientos`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "No se pudo registrar el movimiento."
        );
      }

      setFormSuccess(
        `Movimiento ${result.data.folio} registrado correctamente.`
      );

      await cargarMovimientos();

      setTimeout(() => {
        setMostrarFormulario(false);
        setFormSuccess("");
      }, 1200);
    } catch (error) {
      console.error(
        "Error al guardar movimiento:",
        error
      );

      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar el movimiento."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="movimientos-page">
      <div className="page-header">
        <div>
          <span className="page-kicker">
            HISTORIAL
          </span>

          <h1>Movimientos</h1>

          <p>
            Consulta y registra las entradas y
            traslados de inventario.
          </p>
        </div>

        <button
          className="movement-new-button"
          onClick={abrirFormulario}
        >
          <Plus size={18} />
          Nuevo movimiento
        </button>
      </div>

      <section className="movement-summary">
        <div>
          <span>
            Movimientos registrados
          </span>
          <strong>
            {movimientos.length}
          </strong>
        </div>

        <div>
          <span>
            Entradas de proveedor
          </span>
          <strong>{entradas}</strong>
        </div>

        <div>
          <span>Traslados</span>
          <strong>{traslados}</strong>
        </div>
      </section>

      <section className="movements-panel">
        <div className="movements-toolbar">
          <div className="movement-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Buscar por folio, origen o destino..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>
        </div>

        {loading && (
          <div className="movement-state">
            <p>
              Cargando movimientos...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="movement-state movement-error">
            <p>{error}</p>
          </div>
        )}

        {!loading &&
          !error &&
          movimientosFiltrados.length ===
            0 && (
            <div className="movement-state">
              <FileText size={40} />

              <h3>
                {search
                  ? "No se encontraron movimientos"
                  : "No hay movimientos registrados"}
              </h3>

              <p>
                {search
                  ? "Intenta realizar otra búsqueda."
                  : "Cuando registres una entrada o traslado aparecerá aquí."}
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          movimientosFiltrados.length >
            0 && (
            <div className="movement-table-wrapper">
              <table className="movement-table">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Tipo</th>
                    <th>Origen</th>
                    <th>Destino</th>
                    <th>Productos</th>
                    <th>Total</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {movimientosFiltrados.map(
                    (movimiento) => (
                      <tr
                        key={movimiento.id}
                      >
                        <td>
                          <strong>
                            {
                              movimiento.folio
                            }
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`movement-type ${
                              movimiento.tipo ===
                              "Entrada de proveedor"
                                ? "movement-entry"
                                : "movement-transfer"
                            }`}
                          >
                            {movimiento.tipo ===
                            "Entrada de proveedor" ? (
                              <ArrowDownLeft
                                size={13}
                              />
                            ) : (
                              <ArrowRight
                                size={13}
                              />
                            )}

                            {
                              movimiento.tipo
                            }
                          </span>
                        </td>

                        <td>
                          {
                            movimiento.origen
                          }
                        </td>

                        <td>
                          <strong>
                            {
                              movimiento.destino
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            movimiento.productos
                          }
                        </td>

                        <td>
                          <strong>
                            $
                            {Number(
                              movimiento.total
                            ).toLocaleString(
                              "es-MX",
                              {
                                minimumFractionDigits: 2,
                              }
                            )}
                          </strong>
                        </td>

                        <td>
                          {new Date(
                            movimiento.fecha
                          ).toLocaleString(
                            "es-MX",
                            {
                              dateStyle:
                                "short",
                              timeStyle:
                                "short",
                            }
                          )}
                        </td>

                        <td>
                          <button
                            className="movement-detail-button"
                            title="Ver ticket"
                          >
                            <FileText
                              size={16}
                            />
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
      </section>

      {mostrarFormulario && (
        <div
          className="movement-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              cerrarFormulario();
            }
          }}
        >
          <div className="movement-modal">
            <div className="movement-modal-header">
              <div>
                <span className="page-kicker">
                  INVENTARIO
                </span>

                <h2>
                  Nuevo movimiento
                </h2>

                <p>
                  Registra una entrada o
                  traslado de productos.
                </p>
              </div>

              <button
                className="movement-close-button"
                onClick={
                  cerrarFormulario
                }
                title="Cerrar"
                disabled={guardando}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="movement-form-error">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="movement-form-success">
                {formSuccess}
              </div>
            )}

            <div className="movement-form">
              <div className="movement-form-group">
                <label>
                  Tipo de movimiento
                </label>

                <select
                  value={
                    formulario.tipo
                  }
                  onChange={(event) =>
                    cambiarTipo(
                      event.target.value as
                        | "entrada_proveedor"
                        | "traslado_sucursal"
                    )
                  }
                  disabled={guardando}
                >
                  <option value="entrada_proveedor">
                    Entrada de proveedor
                  </option>

                  <option value="traslado_sucursal">
                    Traslado a sucursal
                  </option>
                </select>
              </div>

              <div className="movement-form-group">
                <label>
                  {formulario.tipo ===
                  "entrada_proveedor"
                    ? "Destino"
                    : "Sucursal de destino"}
                </label>

                <select
                  value={
                    formulario.destino_id
                  }
                  onChange={(event) =>
                    setFormulario(
                      (actual) => ({
                        ...actual,
                        destino_id:
                          Number(
                            event.target
                              .value
                          ),
                      })
                    )
                  }
                  disabled={
                    guardando ||
                    formulario.tipo ===
                      "entrada_proveedor"
                  }
                >
                  {formulario.tipo ===
                  "entrada_proveedor" ? (
                    <option value={1}>
                      Matriz
                    </option>
                  ) : (
                    <>
                      <option value={2}>
                        Saucos
                      </option>
                      <option value={3}>
                        450
                      </option>
                    </>
                  )}
                </select>
              </div>

              <div className="movement-form-group movement-form-full">
                <label>
                  Producto
                </label>

                {loadingProductos ? (
                  <div className="movement-loading-input">
                    Cargando productos...
                  </div>
                ) : (
                  <select
                    value={
                      formulario.producto_id
                    }
                    onChange={(event) =>
                      cambiarProducto(
                        Number(
                          event.target
                            .value
                        )
                      )
                    }
                    disabled={
                      guardando ||
                      productos.length ===
                        0
                    }
                  >
                    <option value={0}>
                      Selecciona un producto
                    </option>

                    {productos.map(
                      (producto) => (
                        <option
                          key={
                            producto.id
                          }
                          value={
                            producto.id
                          }
                        >
                          {producto.sku} —{" "}
                          {
                            producto.nombre
                          }
                        </option>
                      )
                    )}
                  </select>
                )}
              </div>

              <div className="movement-form-group">
                <label>
                  Cantidad
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={
                    formulario.cantidad
                  }
                  onChange={(event) =>
                    setFormulario(
                      (actual) => ({
                        ...actual,
                        cantidad:
                          Number(
                            event.target
                              .value
                          ),
                      })
                    )
                  }
                  disabled={guardando}
                />
              </div>

              <div className="movement-form-group">
                <label>
                  Precio unitario
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    formulario.precio_unitario
                  }
                  onChange={(event) =>
                    setFormulario(
                      (actual) => ({
                        ...actual,
                        precio_unitario:
                          Number(
                            event.target
                              .value
                          ),
                      })
                    )
                  }
                  disabled={guardando}
                />
              </div>

              <div className="movement-form-group movement-form-full">
                <label>
                  Observaciones
                </label>

                <textarea
                  placeholder="Ej. Entrada de mercancía del proveedor..."
                  value={
                    formulario.observaciones
                  }
                  onChange={(event) =>
                    setFormulario(
                      (actual) => ({
                        ...actual,
                        observaciones:
                          event.target
                            .value,
                      })
                    )
                  }
                  maxLength={500}
                  disabled={guardando}
                />
              </div>
            </div>

            <div className="movement-form-total">
              <span>
                Total estimado
              </span>

              <strong>
                $
                {(
                  formulario.cantidad *
                  formulario.precio_unitario
                ).toLocaleString(
                  "es-MX",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </strong>
            </div>

            <div className="movement-modal-actions">
              <button
                type="button"
                className="movement-cancel-button"
                onClick={
                  cerrarFormulario
                }
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="movement-save-button"
                onClick={
                  guardarMovimiento
                }
                disabled={
                  guardando ||
                  loadingProductos ||
                  productos.length === 0
                }
              >
                {guardando
                  ? "Registrando..."
                  : "Registrar movimiento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Movimientos;