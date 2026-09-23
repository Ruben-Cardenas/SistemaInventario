import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  FileBarChart,
  Package,
  TrendingUp,
  X,
  Search,
  RefreshCw,
  MapPin,
  Calendar,
  DollarSign,
  Boxes,
  FileDown,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./Reportes.css";

const API_URL = "http://localhost:3000/api";

type ReporteTipo =
  | "inventario"
  | "stock"
  | "movimientos"
  | "distribucion";

interface InventarioItem {
  sku: string;
  producto: string;
  categoria: string;
  ubicacion: string;
  stock: number;
  minimo: number;
  precio: number;
  estado: string;
  stock_bajo: boolean;
}

interface Movimiento {
  id: number | string;
  folio: string;
  tipo: string;
  origen_id: number | null;
  destino_id: number | null;
  origen: string | null;
  destino: string | null;
  usuario: string;
  total: number | string;
  fecha: string;
  observaciones: string | null;
}

interface Sucursal {
  id: number;
  nombre: string;
  descripcion: string;
  productos: number;
  unidades: number;
  stock_bajo: number;
}

interface InventarioSucursal {
  id: number;
  sku: string;
  producto: string;
  categoria: string;
  stock: number;
  minimo: number;
  precio: number | string;
  estado: string;
  stock_bajo: boolean;
}

function Reportes() {
  const [reporteActivo, setReporteActivo] =
    useState<ReporteTipo | null>(null);

  const [inventario, setInventario] = useState<
    InventarioItem[]
  >([]);

  const [movimientos, setMovimientos] = useState<
    Movimiento[]
  >([]);

  const [sucursales, setSucursales] = useState<
    Sucursal[]
  >([]);

  const [inventarioSucursal, setInventarioSucursal] =
    useState<InventarioSucursal[]>([]);

  const [busqueda, setBusqueda] = useState("");

  const [sucursalSeleccionada, setSucursalSeleccionada] =
    useState<number | null>(null);

  const [cargando, setCargando] = useState(false);
  const [generandoPDF, setGenerandoPDF] =
    useState(false);

  const [error, setError] = useState("");

  const reportes = [
    {
      tipo: "inventario" as ReporteTipo,
      titulo: "Inventario general",
      descripcion:
        "Consulta las existencias de todos los productos por ubicación.",
      icono: Package,
    },
    {
      tipo: "stock" as ReporteTipo,
      titulo: "Stock bajo",
      descripcion:
        "Identifica productos que se encuentran por debajo del mínimo.",
      icono: AlertTriangle,
    },
    {
      tipo: "movimientos" as ReporteTipo,
      titulo: "Movimientos",
      descripcion:
        "Consulta todas las entradas y traslados realizados.",
      icono: TrendingUp,
    },
    {
      tipo: "distribucion" as ReporteTipo,
      titulo: "Distribución a sucursales",
      descripcion:
        "Consulta qué productos se han enviado a Saucos y 450.",
      icono: ArrowRight,
    },
  ];

  const obtenerToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  };

  const fetchAPI = async (
    endpoint: string,
  ) => {
    const token = obtenerToken();

    const response = await fetch(
      `${API_URL}${endpoint}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "No se pudo obtener la información.",
      );
    }

    return data.data;
  };

  const cargarDatos = async (
    tipo: ReporteTipo,
  ) => {
    try {
      setCargando(true);
      setError("");
      setBusqueda("");
      setInventarioSucursal([]);
      setSucursalSeleccionada(null);

      if (
        tipo === "inventario" ||
        tipo === "stock"
      ) {
        const data = await fetchAPI(
          "/productos/inventario",
        );

        setInventario(data || []);
      }

      if (tipo === "movimientos") {
        const data = await fetchAPI(
          "/movimientos",
        );

        setMovimientos(data || []);
      }

      if (tipo === "distribucion") {
        const [sucursalesData, movimientosData] =
          await Promise.all([
            fetchAPI("/sucursales"),
            fetchAPI("/movimientos"),
          ]);

        setSucursales(sucursalesData || []);
        setMovimientos(movimientosData || []);
      }

      setReporteActivo(tipo);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar el reporte.",
      );
    } finally {
      setCargando(false);
    }
  };

  const cargarInventarioSucursal = async (
    id: number,
  ) => {
    try {
      setCargando(true);
      setError("");
      setBusqueda("");

      const data = await fetchAPI(
        `/sucursales/${id}/inventario`,
      );

      setInventarioSucursal(data || []);
      setSucursalSeleccionada(id);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el inventario.",
      );
    } finally {
      setCargando(false);
    }
  };

  const cerrarReporte = () => {
    setReporteActivo(null);
    setBusqueda("");
    setError("");
    setSucursalSeleccionada(null);
    setInventarioSucursal([]);
  };

  const formatearPrecio = (
    precio: number | string,
  ) => {
    return Number(precio).toLocaleString(
      "es-MX",
      {
        style: "currency",
        currency: "MXN",
      },
    );
  };

  const formatearFecha = (
    fecha: string,
  ) => {
    return new Date(fecha).toLocaleString(
      "es-MX",
      {
        dateStyle: "short",
        timeStyle: "short",
      },
    );
  };

  const obtenerFechaPDF = () => {
    return new Date().toLocaleString(
      "es-MX",
      {
        dateStyle: "long",
        timeStyle: "short",
      },
    );
  };

  const limpiarTextoPDF = (
    texto: string | number | null | undefined,
  ) => {
    return String(texto ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const agregarEncabezadoPDF = (
    doc: jsPDF,
    titulo: string,
  ) => {
    const ancho = doc.internal.pageSize.getWidth();

    doc.setFillColor(12, 29, 54);
    doc.rect(0, 0, ancho, 31, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.setFont("helvetica", "bold");

    doc.text(
      "SISTEMA DE INVENTARIO",
      14,
      13,
    );

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    doc.text(
      limpiarTextoPDF(titulo),
      14,
      23,
    );

    doc.setTextColor(90, 100, 115);
    doc.setFontSize(8);

    doc.text(
      `Generado: ${limpiarTextoPDF(
        obtenerFechaPDF(),
      )}`,
      ancho - 14,
      13,
      {
        align: "right",
      },
    );

    doc.text(
      "Refacciones y equipo medico",
      ancho - 14,
      20,
      {
        align: "right",
      },
    );
  };

  const agregarPiePDF = (
    doc: jsPDF,
  ) => {
    const paginas =
      doc.getNumberOfPages();

    for (
      let pagina = 1;
      pagina <= paginas;
      pagina++
    ) {
      doc.setPage(pagina);

      const alto =
        doc.internal.pageSize.getHeight();

      const ancho =
        doc.internal.pageSize.getWidth();

      doc.setDrawColor(210, 215, 225);

      doc.line(
        14,
        alto - 15,
        ancho - 14,
        alto - 15,
      );

      doc.setTextColor(110, 120, 135);
      doc.setFontSize(8);

      doc.text(
        `Sistema de Inventario - Pagina ${pagina} de ${paginas}`,
        ancho / 2,
        alto - 8,
        {
          align: "center",
        },
      );
    }
  };

  const generarPDFInventario = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    agregarEncabezadoPDF(
      doc,
      "Reporte de Inventario General",
    );

    const totalUnidades =
      inventario.reduce(
        (total, item) =>
          total + Number(item.stock || 0),
        0,
      );

    const totalValor =
      inventario.reduce(
        (total, item) =>
          total +
          Number(item.stock || 0) *
            Number(item.precio || 0),
        0,
      );

    doc.setTextColor(45, 55, 70);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    doc.text(
      `Productos: ${inventario.length}`,
      14,
      40,
    );

    doc.text(
      `Unidades: ${totalUnidades}`,
      75,
      40,
    );

    doc.text(
      `Stock bajo: ${stockBajo.length}`,
      130,
      40,
    );

    doc.text(
      `Valor inventario: ${formatearPrecio(
        totalValor,
      )}`,
      190,
      40,
    );

    autoTable(doc, {
      startY: 47,
      head: [
        [
          "SKU",
          "Producto",
          "Categoria",
          "Ubicacion",
          "Stock",
          "Minimo",
          "Precio",
          "Estado",
        ],
      ],
      body: inventario.map((item) => [
        limpiarTextoPDF(item.sku),
        limpiarTextoPDF(item.producto),
        limpiarTextoPDF(item.categoria),
        limpiarTextoPDF(item.ubicacion),
        item.stock,
        item.minimo,
        formatearPrecio(item.precio),
        item.stock_bajo
          ? "Stock bajo"
          : "Disponible",
      ]),
      styles: {
        fontSize: 7.5,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [29, 106, 229],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 248, 252],
      },
      margin: {
        left: 14,
        right: 14,
      },
    });

    agregarPiePDF(doc);

    doc.save(
      "Reporte_Inventario_General.pdf",
    );
  };

  const generarPDFStockBajo = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    agregarEncabezadoPDF(
      doc,
      "Reporte de Stock Bajo",
    );

    doc.setTextColor(45, 55, 70);
    doc.setFontSize(9);

    doc.text(
      `Productos que requieren atencion: ${stockBajo.length}`,
      14,
      40,
    );

    autoTable(doc, {
      startY: 47,
      head: [
        [
          "SKU",
          "Producto",
          "Categoria",
          "Ubicacion",
          "Stock actual",
          "Minimo",
          "Faltante",
          "Precio",
        ],
      ],
      body: stockBajo.map((item) => [
        limpiarTextoPDF(item.sku),
        limpiarTextoPDF(item.producto),
        limpiarTextoPDF(item.categoria),
        limpiarTextoPDF(item.ubicacion),
        item.stock,
        item.minimo,
        Math.max(
          item.minimo - item.stock,
          0,
        ),
        formatearPrecio(item.precio),
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [220, 53, 69],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [255, 245, 245],
      },
      margin: {
        left: 14,
        right: 14,
      },
    });

    agregarPiePDF(doc);

    doc.save(
      "Reporte_Stock_Bajo.pdf",
    );
  };

  const obtenerTipoMovimiento = (
    tipo: string,
  ) => {
    if (tipo === "entrada_proveedor") {
      return "Entrada de proveedor";
    }

    if (tipo === "traslado_sucursal") {
      return "Traslado a sucursal";
    }

    return tipo;
  };

  const generarPDFMovimientos = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    agregarEncabezadoPDF(
      doc,
      "Reporte de Movimientos",
    );

    const total =
      movimientos.reduce(
        (suma, movimiento) =>
          suma +
          Number(movimiento.total || 0),
        0,
      );

    doc.setTextColor(45, 55, 70);
    doc.setFontSize(9);

    doc.text(
      `Movimientos registrados: ${movimientos.length}`,
      14,
      40,
    );

    doc.text(
      `Valor total: ${formatearPrecio(
        total,
      )}`,
      105,
      40,
    );

    autoTable(doc, {
      startY: 47,
      head: [
        [
          "Folio",
          "Tipo",
          "Origen",
          "Destino",
          "Usuario",
          "Total",
          "Fecha",
        ],
      ],
      body: movimientos.map(
        (movimiento) => [
          limpiarTextoPDF(
            movimiento.folio,
          ),
          limpiarTextoPDF(
            obtenerTipoMovimiento(
              movimiento.tipo,
            ),
          ),
          limpiarTextoPDF(
            movimiento.origen ||
              "Proveedor",
          ),
          limpiarTextoPDF(
            movimiento.destino || "—",
          ),
          limpiarTextoPDF(
            movimiento.usuario,
          ),
          formatearPrecio(
            movimiento.total,
          ),
          limpiarTextoPDF(
            formatearFecha(
              movimiento.fecha,
            ),
          ),
        ],
      ),
      styles: {
        fontSize: 7.5,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [29, 106, 229],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 248, 252],
      },
      margin: {
        left: 14,
        right: 14,
      },
    });

    agregarPiePDF(doc);

    doc.save(
      "Reporte_Movimientos.pdf",
    );
  };

  const generarPDFDistribucion = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    agregarEncabezadoPDF(
      doc,
      "Reporte de Distribucion a Sucursales",
    );

    const traslados =
      movimientos.filter(
        (movimiento) =>
          movimiento.tipo ===
          "traslado_sucursal",
      );

    doc.setTextColor(45, 55, 70);
    doc.setFontSize(9);

    doc.text(
      `Sucursales: ${sucursales.length}`,
      14,
      40,
    );

    doc.text(
      `Traslados registrados: ${traslados.length}`,
      75,
      40,
    );

    autoTable(doc, {
      startY: 47,
      head: [
        [
          "Sucursal",
          "Productos",
          "Unidades",
          "Stock bajo",
          "Descripcion",
        ],
      ],
      body: sucursales.map(
        (sucursal) => [
          limpiarTextoPDF(
            sucursal.nombre,
          ),
          sucursal.productos,
          sucursal.unidades,
          sucursal.stock_bajo,
          limpiarTextoPDF(
            sucursal.descripcion,
          ),
        ],
      ),
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [29, 106, 229],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 248, 252],
      },
      margin: {
        left: 14,
        right: 14,
      },
    });

    const posicionTabla =
      (
        doc as jsPDF & {
          lastAutoTable?: {
            finalY: number;
          };
        }
      ).lastAutoTable?.finalY || 70;

    doc.setTextColor(45, 55, 70);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");

    doc.text(
      "Historial de distribucion",
      14,
      posicionTabla + 12,
    );

    autoTable(doc, {
      startY: posicionTabla + 17,
      head: [
        [
          "Folio",
          "Origen",
          "Destino",
          "Total",
          "Fecha",
        ],
      ],
      body: traslados.map(
        (movimiento) => [
          limpiarTextoPDF(
            movimiento.folio,
          ),
          limpiarTextoPDF(
            movimiento.origen ||
              "Matriz",
          ),
          limpiarTextoPDF(
            movimiento.destino ||
              "—",
          ),
          formatearPrecio(
            movimiento.total,
          ),
          limpiarTextoPDF(
            formatearFecha(
              movimiento.fecha,
            ),
          ),
        ],
      ),
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [29, 106, 229],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 248, 252],
      },
      margin: {
        left: 14,
        right: 14,
      },
    });

    agregarPiePDF(doc);

    doc.save(
      "Reporte_Distribucion_Sucursales.pdf",
    );
  };

  const generarPDF = async (
    tipo: ReporteTipo,
  ) => {
    try {
      setGenerandoPDF(true);
      setError("");

      if (tipo === "inventario") {
        if (inventario.length === 0) {
          const data = await fetchAPI(
            "/productos/inventario",
          );

          setInventario(data || []);

          setTimeout(() => {
            setGenerandoPDF(false);
          }, 100);

          return;
        }

        generarPDFInventario();
      }

      if (tipo === "stock") {
        if (inventario.length === 0) {
          const data = await fetchAPI(
            "/productos/inventario",
          );

          setInventario(data || []);

          setTimeout(() => {
            setGenerandoPDF(false);
          }, 100);

          return;
        }

        generarPDFStockBajo();
      }

      if (tipo === "movimientos") {
        if (movimientos.length === 0) {
          const data = await fetchAPI(
            "/movimientos",
          );

          setMovimientos(data || []);

          setTimeout(() => {
            setGenerandoPDF(false);
          }, 100);

          return;
        }

        generarPDFMovimientos();
      }

      if (tipo === "distribucion") {
        if (
          sucursales.length === 0 ||
          movimientos.length === 0
        ) {
          const [
            sucursalesData,
            movimientosData,
          ] = await Promise.all([
            fetchAPI("/sucursales"),
            fetchAPI("/movimientos"),
          ]);

          setSucursales(
            sucursalesData || [],
          );

          setMovimientos(
            movimientosData || [],
          );

          setTimeout(() => {
            setGenerandoPDF(false);
          }, 100);

          return;
        }

        generarPDFDistribucion();
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo generar el PDF.",
      );
    } finally {
      setGenerandoPDF(false);
    }
  };

  const inventarioFiltrado = useMemo(() => {
    const texto =
      busqueda.toLowerCase().trim();

    if (!texto) {
      return inventario;
    }

    return inventario.filter(
      (item) =>
        item.sku
          .toLowerCase()
          .includes(texto) ||
        item.producto
          .toLowerCase()
          .includes(texto) ||
        item.categoria
          .toLowerCase()
          .includes(texto) ||
        item.ubicacion
          .toLowerCase()
          .includes(texto),
    );
  }, [inventario, busqueda]);

  const stockBajo = useMemo(() => {
    return inventario.filter(
      (item) =>
        item.stock_bajo ||
        item.stock < item.minimo,
    );
  }, [inventario]);

  const stockBajoFiltrado = useMemo(() => {
    const texto =
      busqueda.toLowerCase().trim();

    if (!texto) {
      return stockBajo;
    }

    return stockBajo.filter(
      (item) =>
        item.sku
          .toLowerCase()
          .includes(texto) ||
        item.producto
          .toLowerCase()
          .includes(texto) ||
        item.categoria
          .toLowerCase()
          .includes(texto) ||
        item.ubicacion
          .toLowerCase()
          .includes(texto),
    );
  }, [stockBajo, busqueda]);

  const movimientosFiltrados = useMemo(() => {
    const texto =
      busqueda.toLowerCase().trim();

    if (!texto) {
      return movimientos;
    }

    return movimientos.filter(
      (movimiento) =>
        [
          movimiento.folio,
          movimiento.tipo,
          movimiento.origen || "",
          movimiento.destino || "",
          movimiento.usuario,
          movimiento.observaciones ||
            "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(texto),
    );
  }, [movimientos, busqueda]);

  const inventarioSucursalFiltrado =
    useMemo(() => {
      const texto =
        busqueda.toLowerCase().trim();

      if (!texto) {
        return inventarioSucursal;
      }

      return inventarioSucursal.filter(
        (item) =>
          item.sku
            .toLowerCase()
            .includes(texto) ||
          item.producto
            .toLowerCase()
            .includes(texto) ||
          item.categoria
            .toLowerCase()
            .includes(texto),
      );
    }, [
      inventarioSucursal,
      busqueda,
    ]);

  const movimientosDistribucion =
    useMemo(() => {
      return movimientos.filter(
        (movimiento) =>
          movimiento.tipo ===
          "traslado_sucursal",
      );
    }, [movimientos]);

  const totalUnidadesInventario =
    useMemo(() => {
      return inventario.reduce(
        (total, item) =>
          total +
          Number(item.stock || 0),
        0,
      );
    }, [inventario]);

  const totalValorInventario =
    useMemo(() => {
      return inventario.reduce(
        (total, item) =>
          total +
          Number(item.stock || 0) *
            Number(item.precio || 0),
        0,
      );
    }, [inventario]);

  useEffect(() => {
    if (reporteActivo === "distribucion") {
      const cargarMovimientos =
        async () => {
          try {
            const data =
              await fetchAPI(
                "/movimientos",
              );

            setMovimientos(data || []);
          } catch (err) {
            console.error(err);
          }
        };

      cargarMovimientos();
    }
  }, [reporteActivo]);

  return (
    <div className="reportes-page">
      <div className="page-header">
        <div>
          <span className="page-kicker">
            INFORMACIÓN DEL SISTEMA
          </span>

          <h1>Reportes</h1>

          <p>
            Genera y consulta información
            importante del inventario.
          </p>
        </div>

        <button
          className="report-refresh-button"
          onClick={() => {
            if (reporteActivo) {
              cargarDatos(
                reporteActivo,
              );
            }
          }}
          disabled={
            cargando ||
            generandoPDF ||
            !reporteActivo
          }
        >
          <RefreshCw
            size={17}
            className={
              cargando
                ? "refresh-spinning"
                : ""
            }
          />

          Actualizar
        </button>
      </div>

      <section className="report-overview">
        <div className="report-overview-icon">
          <FileBarChart size={24} />
        </div>

        <div>
          <span>Centro de reportes</span>

          <h2>
            Control y seguimiento del
            inventario
          </h2>

          <p>
            Utiliza los reportes para
            conocer el estado de las
            existencias y los productos
            distribuidos a cada sucursal.
          </p>
        </div>
      </section>

      <section className="reports-grid">
        {reportes.map((reporte) => {
          const Icon = reporte.icono;

          return (
            <article
              className="report-card"
              key={reporte.titulo}
            >
              <div className="report-icon">
                <Icon size={21} />
              </div>

              <h2>{reporte.titulo}</h2>

              <p>
                {reporte.descripcion}
              </p>

              <button
                onClick={() =>
                  cargarDatos(
                    reporte.tipo,
                  )
                }
              >
                Consultar reporte

                <ArrowRight size={15} />
              </button>
            </article>
          );
        })}
      </section>

      {reporteActivo && (
        <div
          className="report-modal-overlay"
          onClick={cerrarReporte}
        >
          <div
            className="report-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="report-modal-header">
              <div>
                <span className="modal-kicker">
                  REPORTE DEL SISTEMA
                </span>

                <h2>
                  {reporteActivo ===
                    "inventario" &&
                    "Inventario general"}

                  {reporteActivo ===
                    "stock" &&
                    "Productos con stock bajo"}

                  {reporteActivo ===
                    "movimientos" &&
                    "Historial de movimientos"}

                  {reporteActivo ===
                    "distribucion" &&
                    "Distribución a sucursales"}
                </h2>
              </div>

              <div className="modal-header-actions">
                <button
                  className="pdf-button"
                  onClick={() =>
                    generarPDF(
                      reporteActivo,
                    )
                  }
                  disabled={generandoPDF}
                >
                  <FileDown
                    size={17}
                    className={
                      generandoPDF
                        ? "refresh-spinning"
                        : ""
                    }
                  />

                  {generandoPDF
                    ? "Generando..."
                    : "Generar PDF"}
                </button>

                <button
                  className="close-modal-button"
                  onClick={cerrarReporte}
                >
                  <X size={21} />
                </button>
              </div>
            </div>

            {error && (
              <div className="report-error">
                <AlertTriangle size={18} />

                <span>{error}</span>
              </div>
            )}

            {cargando ? (
              <div className="report-loading">
                <RefreshCw
                  size={30}
                  className="refresh-spinning"
                />

                <span>
                  Cargando información...
                </span>
              </div>
            ) : (
              <>
                {reporteActivo !==
                  "distribucion" && (
                  <div className="report-search">
                    <Search size={18} />

                    <input
                      type="text"
                      placeholder="Buscar por producto, SKU, categoría..."
                      value={busqueda}
                      onChange={(event) =>
                        setBusqueda(
                          event.target.value,
                        )
                      }
                    />
                  </div>
                )}

                {reporteActivo ===
                  "inventario" && (
                  <>
                    <div className="report-stats">
                      <div className="report-stat">
                        <Package size={20} />

                        <div>
                          <span>
                            Productos
                          </span>

                          <strong>
                            {inventario.length}
                          </strong>
                        </div>
                      </div>

                      <div className="report-stat">
                        <Boxes size={20} />

                        <div>
                          <span>
                            Unidades
                          </span>

                          <strong>
                            {
                              totalUnidadesInventario
                            }
                          </strong>
                        </div>
                      </div>

                      <div className="report-stat warning">
                        <AlertTriangle
                          size={20}
                        />

                        <div>
                          <span>
                            Stock bajo
                          </span>

                          <strong>
                            {stockBajo.length}
                          </strong>
                        </div>
                      </div>

                      <div className="report-stat">
                        <DollarSign
                          size={20}
                        />

                        <div>
                          <span>
                            Valor inventario
                          </span>

                          <strong>
                            {formatearPrecio(
                              totalValorInventario,
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="report-table-wrapper">
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th>SKU</th>
                            <th>
                              Producto
                            </th>
                            <th>
                              Categoría
                            </th>
                            <th>
                              Ubicación
                            </th>
                            <th>Stock</th>
                            <th>
                              Mínimo
                            </th>
                            <th>Precio</th>
                            <th>
                              Estado
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {inventarioFiltrado.map(
                            (item) => (
                              <tr
                                key={`${item.sku}-${item.ubicacion}`}
                              >
                                <td>
                                  <span className="sku">
                                    {item.sku}
                                  </span>
                                </td>

                                <td>
                                  <strong>
                                    {
                                      item.producto
                                    }
                                  </strong>
                                </td>

                                <td>
                                  {
                                    item.categoria
                                  }
                                </td>

                                <td>
                                  <span className="location-badge">
                                    <MapPin
                                      size={
                                        13
                                      }
                                    />

                                    {
                                      item.ubicacion
                                    }
                                  </span>
                                </td>

                                <td>
                                  <strong>
                                    {
                                      item.stock
                                    }
                                  </strong>
                                </td>

                                <td>
                                  {
                                    item.minimo
                                  }
                                </td>

                                <td>
                                  {formatearPrecio(
                                    item.precio,
                                  )}
                                </td>

                                <td>
                                  <span
                                    className={
                                      item.stock_bajo
                                        ? "status-badge danger"
                                        : "status-badge success"
                                    }
                                  >
                                    {item.stock_bajo
                                      ? "Stock bajo"
                                      : "Disponible"}
                                  </span>
                                </td>
                              </tr>
                            ),
                          )}

                          {inventarioFiltrado.length ===
                            0 && (
                            <tr>
                              <td
                                colSpan={8}
                                className="empty-report"
                              >
                                No se encontraron
                                productos.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {reporteActivo ===
                  "stock" && (
                  <>
                    <div className="report-stats stock-stats">
                      <div className="report-stat warning">
                        <AlertTriangle
                          size={20}
                        />

                        <div>
                          <span>
                            Productos en riesgo
                          </span>

                          <strong>
                            {
                              stockBajo.length
                            }
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="report-table-wrapper">
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th>SKU</th>
                            <th>
                              Producto
                            </th>
                            <th>
                              Categoría
                            </th>
                            <th>
                              Ubicación
                            </th>
                            <th>
                              Stock actual
                            </th>
                            <th>
                              Mínimo
                            </th>
                            <th>
                              Faltante
                            </th>
                            <th>Precio</th>
                          </tr>
                        </thead>

                        <tbody>
                          {stockBajoFiltrado.map(
                            (item) => {
                              const faltante =
                                Math.max(
                                  item.minimo -
                                    item.stock,
                                  0,
                                );

                              return (
                                <tr
                                  key={`${item.sku}-${item.ubicacion}`}
                                >
                                  <td>
                                    <span className="sku">
                                      {
                                        item.sku
                                      }
                                    </span>
                                  </td>

                                  <td>
                                    <strong>
                                      {
                                        item.producto
                                      }
                                    </strong>
                                  </td>

                                  <td>
                                    {
                                      item.categoria
                                    }
                                  </td>

                                  <td>
                                    <span className="location-badge">
                                      <MapPin
                                        size={
                                          13
                                        }
                                      />

                                      {
                                        item.ubicacion
                                      }
                                    </span>
                                  </td>

                                  <td>
                                    <strong className="danger-text">
                                      {
                                        item.stock
                                      }
                                    </strong>
                                  </td>

                                  <td>
                                    {
                                      item.minimo
                                    }
                                  </td>

                                  <td>
                                    <strong className="danger-text">
                                      {
                                        faltante
                                      }
                                    </strong>
                                  </td>

                                  <td>
                                    {formatearPrecio(
                                      item.precio,
                                    )}
                                  </td>
                                </tr>
                              );
                            },
                          )}

                          {stockBajoFiltrado.length ===
                            0 && (
                            <tr>
                              <td
                                colSpan={8}
                                className="empty-report"
                              >
                                No hay productos
                                con stock bajo.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {reporteActivo ===
                  "movimientos" && (
                  <>
                    <div className="report-stats">
                      <div className="report-stat">
                        <TrendingUp
                          size={20}
                        />

                        <div>
                          <span>
                            Movimientos
                          </span>

                          <strong>
                            {
                              movimientos.length
                            }
                          </strong>
                        </div>
                      </div>

                      <div className="report-stat">
                        <Package size={20} />

                        <div>
                          <span>
                            Traslados
                          </span>

                          <strong>
                            {
                              movimientos.filter(
                                (item) =>
                                  item.tipo ===
                                  "traslado_sucursal",
                              ).length
                            }
                          </strong>
                        </div>
                      </div>

                      <div className="report-stat">
                        <DollarSign
                          size={20}
                        />

                        <div>
                          <span>
                            Total movimientos
                          </span>

                          <strong>
                            {formatearPrecio(
                              movimientos.reduce(
                                (
                                  total,
                                  item,
                                ) =>
                                  total +
                                  Number(
                                    item.total ||
                                      0,
                                  ),
                                0,
                              ),
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="report-table-wrapper">
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th>Folio</th>
                            <th>Tipo</th>
                            <th>
                              Origen
                            </th>
                            <th>
                              Destino
                            </th>
                            <th>
                              Usuario
                            </th>
                            <th>Total</th>
                            <th>
                              Fecha
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {movimientosFiltrados.map(
                            (movimiento) => (
                              <tr
                                key={
                                  movimiento.id
                                }
                              >
                                <td>
                                  <span className="folio">
                                    {
                                      movimiento.folio
                                    }
                                  </span>
                                </td>

                                <td>
                                  <span className="movement-badge">
                                    {obtenerTipoMovimiento(
                                      movimiento.tipo,
                                    )}
                                  </span>
                                </td>

                                <td>
                                  {
                                    movimiento.origen ||
                                    "Proveedor"
                                  }
                                </td>

                                <td>
                                  {
                                    movimiento.destino ||
                                    "—"
                                  }
                                </td>

                                <td>
                                  {
                                    movimiento.usuario
                                  }
                                </td>

                                <td>
                                  <strong>
                                    {formatearPrecio(
                                      movimiento.total,
                                    )}
                                  </strong>
                                </td>

                                <td>
                                  <span className="date-cell">
                                    <Calendar
                                      size={
                                        14
                                      }
                                    />

                                    {formatearFecha(
                                      movimiento.fecha,
                                    )}
                                  </span>
                                </td>
                              </tr>
                            ),
                          )}

                          {movimientosFiltrados.length ===
                            0 && (
                            <tr>
                              <td
                                colSpan={7}
                                className="empty-report"
                              >
                                No hay movimientos
                                registrados.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {reporteActivo ===
                  "distribucion" && (
                  <>
                    <div className="distribution-summary">
                      <div>
                        <span>
                          Traslados registrados
                        </span>

                        <strong>
                          {
                            movimientosDistribucion.length
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Sucursales disponibles
                        </span>

                        <strong>
                          {sucursales.length}
                        </strong>
                      </div>
                    </div>

                    <div className="branches-report-grid">
                      {sucursales.map(
                        (sucursal) => (
                          <article
                            className="branch-report-card"
                            key={
                              sucursal.id
                            }
                          >
                            <div className="branch-report-icon">
                              <MapPin
                                size={21}
                              />
                            </div>

                            <div className="branch-report-info">
                              <span>
                                UBICACIÓN
                              </span>

                              <h3>
                                {
                                  sucursal.nombre
                                }
                              </h3>

                              <p>
                                {
                                  sucursal.descripcion
                                }
                              </p>

                              <div className="branch-report-stats">
                                <div>
                                  <Package
                                    size={
                                      15
                                    }
                                  />

                                  <span>
                                    {
                                      sucursal.productos
                                    }{" "}
                                    productos
                                  </span>
                                </div>

                                <div>
                                  <Boxes
                                    size={
                                      15
                                    }
                                  />

                                  <span>
                                    {
                                      sucursal.unidades
                                    }{" "}
                                    unidades
                                  </span>
                                </div>

                                <div className="branch-warning">
                                  <AlertTriangle
                                    size={
                                      15
                                    }
                                  />

                                  <span>
                                    {
                                      sucursal.stock_bajo
                                    }{" "}
                                    stock bajo
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() =>
                                  cargarInventarioSucursal(
                                    sucursal.id,
                                  )
                                }
                              >
                                Ver inventario

                                <ArrowRight
                                  size={
                                    15
                                  }
                                />
                              </button>
                            </div>
                          </article>
                        ),
                      )}
                    </div>

                    {sucursalSeleccionada && (
                      <div className="branch-inventory-section">
                        <div className="branch-inventory-header">
                          <div>
                            <span>
                              INVENTARIO DE
                              SUCURSAL
                            </span>

                            <h3>
                              {sucursales.find(
                                (
                                  item,
                                ) =>
                                  item.id ===
                                  sucursalSeleccionada,
                              )?.nombre ||
                                "Sucursal"}
                            </h3>
                          </div>

                          <button
                            onClick={() => {
                              setSucursalSeleccionada(
                                null,
                              );

                              setInventarioSucursal(
                                [],
                              );
                            }}
                          >
                            <X size={17} />

                            Cerrar
                          </button>
                        </div>

                        <div className="report-search">
                          <Search size={18} />

                          <input
                            type="text"
                            placeholder="Buscar producto, SKU o categoría..."
                            value={
                              busqueda
                            }
                            onChange={(
                              event,
                            ) =>
                              setBusqueda(
                                event
                                  .target
                                  .value,
                              )
                            }
                          />
                        </div>

                        <div className="report-table-wrapper">
                          <table className="report-table">
                            <thead>
                              <tr>
                                <th>
                                  SKU
                                </th>
                                <th>
                                  Producto
                                </th>
                                <th>
                                  Categoría
                                </th>
                                <th>
                                  Stock
                                </th>
                                <th>
                                  Mínimo
                                </th>
                                <th>
                                  Precio
                                </th>
                                <th>
                                  Estado
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {inventarioSucursalFiltrado.map(
                                (
                                  item,
                                ) => (
                                  <tr
                                    key={
                                      item.id
                                    }
                                  >
                                    <td>
                                      <span className="sku">
                                        {
                                          item.sku
                                        }
                                      </span>
                                    </td>

                                    <td>
                                      <strong>
                                        {
                                          item.producto
                                        }
                                      </strong>
                                    </td>

                                    <td>
                                      {
                                        item.categoria
                                      }
                                    </td>

                                    <td>
                                      <strong
                                        className={
                                          item.stock_bajo
                                            ? "danger-text"
                                            : ""
                                        }
                                      >
                                        {
                                          item.stock
                                        }
                                      </strong>
                                    </td>

                                    <td>
                                      {
                                        item.minimo
                                      }
                                    </td>

                                    <td>
                                      {formatearPrecio(
                                        item.precio,
                                      )}
                                    </td>

                                    <td>
                                      <span
                                        className={
                                          item.stock_bajo
                                            ? "status-badge danger"
                                            : "status-badge success"
                                        }
                                      >
                                        {item.stock_bajo
                                          ? "Stock bajo"
                                          : "Disponible"}
                                      </span>
                                    </td>
                                  </tr>
                                ),
                              )}

                              {inventarioSucursalFiltrado.length ===
                                0 && (
                                <tr>
                                  <td
                                    colSpan={
                                      7
                                    }
                                    className="empty-report"
                                  >
                                    No se
                                    encontraron
                                    productos.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="distribution-movements">
                      <div className="distribution-movements-header">
                        <div>
                          <span>
                            HISTORIAL DE
                            DISTRIBUCIÓN
                          </span>

                          <h3>
                            Traslados realizados
                            a sucursales
                          </h3>
                        </div>
                      </div>

                      <div className="report-table-wrapper">
                        <table className="report-table">
                          <thead>
                            <tr>
                              <th>
                                Folio
                              </th>
                              <th>
                                Origen
                              </th>
                              <th>
                                Destino
                              </th>
                              <th>
                                Total
                              </th>
                              <th>
                                Fecha
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {movimientosDistribucion.map(
                              (
                                movimiento,
                              ) => (
                                <tr
                                  key={
                                    movimiento.id
                                  }
                                >
                                  <td>
                                    <span className="folio">
                                      {
                                        movimiento.folio
                                      }
                                    </span>
                                  </td>

                                  <td>
                                    {
                                      movimiento.origen
                                    }
                                  </td>

                                  <td>
                                    <span className="location-badge">
                                      <MapPin
                                        size={
                                          13
                                        }
                                      />

                                      {
                                        movimiento.destino
                                      }
                                    </span>
                                  </td>

                                  <td>
                                    {formatearPrecio(
                                      movimiento.total,
                                    )}
                                  </td>

                                  <td>
                                    <span className="date-cell">
                                      <Calendar
                                        size={
                                          14
                                        }
                                      />

                                      {formatearFecha(
                                        movimiento.fecha,
                                      )}
                                    </span>
                                  </td>
                                </tr>
                              ),
                            )}

                            {movimientosDistribucion.length ===
                              0 && (
                              <tr>
                                <td
                                  colSpan={
                                    5
                                  }
                                  className="empty-report"
                                >
                                  No hay
                                  traslados
                                  registrados.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Reportes;