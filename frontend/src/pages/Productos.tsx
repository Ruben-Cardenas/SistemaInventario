import {
  Edit3,
  Package,
  Plus,
  Search,
  Trash2,
  MoreHorizontal,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import "./Productos.css";

interface Producto {
  id: number;
  sku: string;
  nombre: string;
  categoria: string;
  categoria_id?: number;
  precio: number;
  stock: number;
  estado: "Activo" | "Descontinuado";
}

interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface ProductoAPI {
  id: number;
  sku: string;
  nombre: string;
  categoria: string;
  categoria_id?: number;
  precio: string | number;
  stock: number;
  estado: "activo" | "descontinuado";
}

interface ProductoForm {
  sku: string;
  nombre: string;
  categoria_id: string;
  precio: string;
}

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api";

function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("Todas");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoFormulario, setModoFormulario] = useState<
    "crear" | "editar"
  >("crear");

  const [productoEditando, setProductoEditando] =
    useState<number | null>(null);

  const [formulario, setFormulario] =
    useState<ProductoForm>({
      sku: "",
      nombre: "",
      categoria_id: "",
      precio: "",
    });

  const [guardando, setGuardando] = useState(false);

  const obtenerToken = () => {
    return localStorage.getItem("token");
  };

  const convertirProducto = (
    producto: ProductoAPI,
  ): Producto => {
    return {
      id: producto.id,
      sku: producto.sku,
      nombre: producto.nombre,
      categoria: producto.categoria,
      categoria_id: producto.categoria_id,
      precio: Number(producto.precio),
      stock: Number(producto.stock),
      estado:
        producto.estado === "activo"
          ? "Activo"
          : "Descontinuado",
    };
  };

  const cargarProductos = async () => {
    try {
      setLoading(true);
      setError("");

      const token = obtenerToken();

      if (!token) {
        setError(
          "No se encontró el token de autenticación.",
        );

        return;
      }

      const parametros = new URLSearchParams();

      if (search.trim()) {
        parametros.append(
          "search",
          search.trim(),
        );
      }

      if (categoria !== "Todas") {
        parametros.append(
          "categoria",
          categoria,
        );
      }

      const query = parametros.toString();

      const response = await fetch(
        `${API_URL}/productos${
          query ? `?${query}` : ""
        }`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(
          resultado.message ||
            "No se pudieron cargar los productos.",
        );
      }

      const productosConvertidos =
        resultado.data.map(
          (producto: ProductoAPI) =>
            convertirProducto(producto),
        );

      setProductos(productosConvertidos);
    } catch (error) {
      console.error(
        "Error al cargar productos:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los productos.",
      );
    } finally {
      setLoading(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      const token = obtenerToken();

      if (!token) return;

      const response = await fetch(
        `${API_URL}/productos/categorias`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(
          resultado.message ||
            "No se pudieron cargar las categorías.",
        );
      }

      setCategorias(resultado.data);
    } catch (error) {
      console.error(
        "Error al cargar categorías:",
        error,
      );
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      cargarProductos();
    }, 300);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [search, categoria]);

  const abrirCrear = () => {
    setModoFormulario("crear");
    setProductoEditando(null);

    setFormulario({
      sku: "",
      nombre: "",
      categoria_id:
        categorias.length > 0
          ? String(categorias[0].id)
          : "",
      precio: "",
    });

    setModalAbierto(true);
  };

  const abrirEditar = async (
    producto: Producto,
  ) => {
    try {
      const token = obtenerToken();

      if (!token) {
        setError(
          "No se encontró el token de autenticación.",
        );

        return;
      }

      const response = await fetch(
        `${API_URL}/productos/${producto.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(
          resultado.message ||
            "No se pudo obtener el producto.",
        );
      }

      const productoAPI = resultado.data;

      setModoFormulario("editar");
      setProductoEditando(producto.id);

      setFormulario({
        sku: productoAPI.sku,
        nombre: productoAPI.nombre,
        categoria_id: String(
          productoAPI.categoria_id,
        ),
        precio: String(
          Number(productoAPI.precio),
        ),
      });

      setModalAbierto(true);
    } catch (error) {
      console.error(
        "Error al obtener producto:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "No se pudo obtener el producto.",
      );
    }
  };

  const cerrarModal = () => {
    if (guardando) return;

    setModalAbierto(false);
    setProductoEditando(null);
  };

  const guardarProducto = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    try {
      setGuardando(true);
      setError("");

      const token = obtenerToken();

      if (!token) {
        setError(
          "No se encontró el token de autenticación.",
        );

        return;
      }

      if (
        !formulario.sku.trim() ||
        !formulario.nombre.trim() ||
        !formulario.categoria_id ||
        !formulario.precio
      ) {
        setError(
          "Completa todos los campos obligatorios.",
        );

        return;
      }

      const precio = Number(
        formulario.precio,
      );

      if (Number.isNaN(precio) || precio < 0) {
        setError(
          "El precio debe ser un número válido.",
        );

        return;
      }

      const body = {
        sku: formulario.sku.trim(),
        nombre: formulario.nombre.trim(),
        categoria_id: Number(
          formulario.categoria_id,
        ),
        precio,
      };

      const url =
        modoFormulario === "crear"
          ? `${API_URL}/productos`
          : `${API_URL}/productos/${productoEditando}`;

      const method =
        modoFormulario === "crear"
          ? "POST"
          : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(
          resultado.message ||
            "No se pudo guardar el producto.",
        );
      }

      setModalAbierto(false);
      setProductoEditando(null);

      await cargarProductos();
    } catch (error) {
      console.error(
        "Error al guardar producto:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el producto.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (
    producto: Producto,
  ) => {
    const esActivo =
      producto.estado === "Activo";

    const mensaje = esActivo
      ? "¿Deseas marcar este producto como descontinuado?"
      : "¿Deseas reactivar este producto?";

    const confirmar =
      window.confirm(mensaje);

    if (!confirmar) return;

    try {
      const token = obtenerToken();

      if (!token) {
        setError(
          "No se encontró el token de autenticación.",
        );

        return;
      }

      const response = await fetch(
        `${API_URL}/productos/${producto.id}/estado`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            estado: esActivo
              ? "descontinuado"
              : "activo",
          }),
        },
      );

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(
          resultado.message ||
            "No se pudo cambiar el estado.",
        );
      }

      await cargarProductos();
    } catch (error) {
      console.error(
        "Error al cambiar estado:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado.",
      );
    }
  };

  const totalProductos = productos.length;

  const productosActivos =
    productos.filter(
      (producto) =>
        producto.estado === "Activo",
    ).length;

  const stockTotal = productos.reduce(
    (total, producto) =>
      total + producto.stock,
    0,
  );

  return (
    <div className="productos-page">
      <section className="page-header">
        <div>
          <span className="page-kicker">
            CATÁLOGO DE INVENTARIO
          </span>

          <h1>Productos</h1>

          <p>
            Administra todos los productos
            registrados en el sistema.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={abrirCrear}
        >
          <Plus size={17} />
          Nuevo producto
        </button>
      </section>

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "#3a1515",
            border: "1px solid #7f1d1d",
            color: "#fca5a5",
          }}
        >
          {error}
        </div>
      )}

      <section className="productos-summary">
        <div className="summary-card">
          <div className="summary-icon blue">
            <Package size={20} />
          </div>

          <div>
            <span>Total productos</span>

            <strong>
              {totalProductos}
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon green">
            <Package size={20} />
          </div>

          <div>
            <span>Productos activos</span>

            <strong>
              {productosActivos}
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon orange">
            <Package size={20} />
          </div>

          <div>
            <span>Stock total</span>

            <strong>
              {stockTotal}
            </strong>
          </div>
        </div>
      </section>

      <section className="productos-panel">
        <div className="productos-toolbar">
          <div className="productos-search">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar por producto o SKU..."
            />
          </div>

          <select
            value={categoria}
            onChange={(event) =>
              setCategoria(event.target.value)
            }
          >
            <option value="Todas">
              Todas
            </option>

            {categorias.map((item) => (
              <option
                key={item.id}
                value={item.nombre}
              >
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="productos-table-wrapper">
          <table className="productos-table">
            <thead>
              <tr>
                <th>PRODUCTO</th>
                <th>SKU</th>
                <th>CATEGORÍA</th>
                <th>PRECIO</th>
                <th>STOCK</th>
                <th>ESTADO</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "40px",
                    }}
                  >
                    Cargando productos...
                  </td>
                </tr>
              ) : (
                productos.map((producto) => (
                  <tr key={producto.id}>
                    <td>
                      <div className="product-cell">
                        <div className="product-avatar">
                          <Package size={17} />
                        </div>

                        <div>
                          <strong>
                            {producto.nombre}
                          </strong>

                          <span>
                            Producto médico
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="product-sku">
                        {producto.sku}
                      </span>
                    </td>

                    <td>
                      {producto.categoria}
                    </td>

                    <td className="price">
                      $
                      {producto.precio.toLocaleString(
                        "es-MX",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </td>

                    <td>
                      <strong>
                        {producto.stock}
                      </strong>

                      <span>
                        {" "}
                        unidades
                      </span>
                    </td>

                    <td>
                      <span
                        className={`product-status ${
                          producto.estado ===
                          "Activo"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {producto.estado}
                      </span>
                    </td>

                    <td>
                      <div className="product-actions">
                        <button
                          title="Editar"
                          onClick={() =>
                            abrirEditar(
                              producto,
                            )
                          }
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          title={
                            producto.estado ===
                            "Activo"
                              ? "Descontinuar"
                              : "Reactivar"
                          }
                          onClick={() =>
                            cambiarEstado(
                              producto,
                            )
                          }
                        >
                          {producto.estado ===
                          "Activo" ? (
                            <Trash2
                              size={14}
                            />
                          ) : (
                            <RotateCcw
                              size={14}
                            />
                          )}
                        </button>

                        <button title="Más">
                          <MoreHorizontal
                            size={14}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading &&
          productos.length === 0 && (
            <div className="products-empty">
              <Package size={30} />

              <strong>
                No se encontraron productos
              </strong>

              <span>
                Intenta cambiar los filtros
                de búsqueda.
              </span>
            </div>
          )}

        <div className="products-footer">
          Mostrando{" "}
          <strong>
            {productos.length}
          </strong>{" "}
          productos
        </div>
      </section>

      {modalAbierto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#101827",
              border:
                "1px solid #26354d",
              borderRadius: "16px",
              padding: "24px",
              boxShadow:
                "0 20px 50px rgba(0,0,0,.45)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                marginBottom: "24px",
              }}
            >
              <div>
                <span className="page-kicker">
                  CATÁLOGO DE INVENTARIO
                </span>

                <h2
                  style={{
                    margin:
                      "6px 0 0",
                  }}
                >
                  {modoFormulario ===
                  "crear"
                    ? "Nuevo producto"
                    : "Editar producto"}
                </h2>
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                style={{
                  background:
                    "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={guardarProducto}
            >
              <div
                style={{
                  display: "grid",
                  gap: "16px",
                }}
              >
                <label>
                  <span
                    style={{
                      display: "block",
                      marginBottom:
                        "7px",
                      color:
                        "#cbd5e1",
                    }}
                  >
                    SKU
                  </span>

                  <input
                    value={
                      formulario.sku
                    }
                    onChange={(event) =>
                      setFormulario(
                        (actual) => ({
                          ...actual,
                          sku: event
                            .target
                            .value,
                        }),
                      )
                    }
                    placeholder="Ej. ORT-FAJ-006"
                    disabled={
                      guardando
                    }
                    style={{
                      width: "100%",
                      boxSizing:
                        "border-box",
                      padding:
                        "11px 12px",
                      borderRadius:
                        "8px",
                      border:
                        "1px solid #26354d",
                      background:
                        "#0b1220",
                      color: "#fff",
                    }}
                  />
                </label>

                <label>
                  <span
                    style={{
                      display: "block",
                      marginBottom:
                        "7px",
                      color:
                        "#cbd5e1",
                    }}
                  >
                    Nombre
                  </span>

                  <input
                    value={
                      formulario.nombre
                    }
                    onChange={(event) =>
                      setFormulario(
                        (actual) => ({
                          ...actual,
                          nombre:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    placeholder="Nombre del producto"
                    disabled={
                      guardando
                    }
                    style={{
                      width: "100%",
                      boxSizing:
                        "border-box",
                      padding:
                        "11px 12px",
                      borderRadius:
                        "8px",
                      border:
                        "1px solid #26354d",
                      background:
                        "#0b1220",
                      color: "#fff",
                    }}
                  />
                </label>

                <label>
                  <span
                    style={{
                      display: "block",
                      marginBottom:
                        "7px",
                      color:
                        "#cbd5e1",
                    }}
                  >
                    Categoría
                  </span>

                  <select
                    value={
                      formulario.categoria_id
                    }
                    onChange={(event) =>
                      setFormulario(
                        (actual) => ({
                          ...actual,
                          categoria_id:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    disabled={
                      guardando
                    }
                    style={{
                      width: "100%",
                      boxSizing:
                        "border-box",
                      padding:
                        "11px 12px",
                      borderRadius:
                        "8px",
                      border:
                        "1px solid #26354d",
                      background:
                        "#0b1220",
                      color: "#fff",
                    }}
                  >
                    <option value="">
                      Selecciona una
                      categoría
                    </option>

                    {categorias.map(
                      (item) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {
                            item.nombre
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  <span
                    style={{
                      display: "block",
                      marginBottom:
                        "7px",
                      color:
                        "#cbd5e1",
                    }}
                  >
                    Precio
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      formulario.precio
                    }
                    onChange={(event) =>
                      setFormulario(
                        (actual) => ({
                          ...actual,
                          precio:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    placeholder="0.00"
                    disabled={
                      guardando
                    }
                    style={{
                      width: "100%",
                      boxSizing:
                        "border-box",
                      padding:
                        "11px 12px",
                      borderRadius:
                        "8px",
                      border:
                        "1px solid #26354d",
                      background:
                        "#0b1220",
                      color: "#fff",
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: "10px",
                  marginTop:
                    "24px",
                }}
              >
                <button
                  type="button"
                  onClick={
                    cerrarModal
                  }
                  disabled={
                    guardando
                  }
                  style={{
                    padding:
                      "10px 18px",
                    borderRadius:
                      "8px",
                    border:
                      "1px solid #26354d",
                    background:
                      "transparent",
                    color:
                      "#cbd5e1",
                    cursor:
                      "pointer",
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    guardando
                  }
                  className="primary-button"
                >
                  <Plus size={17} />

                  {guardando
                    ? "Guardando..."
                    : modoFormulario ===
                        "crear"
                      ? "Crear producto"
                      : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Productos;