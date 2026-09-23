
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";

function App() {
  useEffect(() => {
    const mostrarAviso = () => {
      alert(
        "Código fuente protegido.\n\nEsta acción no está disponible en este sistema.",
      );
    };

    const bloquearTeclas = (event: KeyboardEvent) => {
      const tecla = event.key.toLowerCase();

      if (
        event.key === "F12" ||
        (event.ctrlKey && tecla === "u") ||
        (event.ctrlKey &&
          event.shiftKey &&
          (tecla === "i" ||
            tecla === "j" ||
            tecla === "c"))
      ) {
        event.preventDefault();
        event.stopPropagation();
        mostrarAviso();
      }
    };

    const bloquearMenu = (event: MouseEvent) => {
      event.preventDefault();
      mostrarAviso();
    };

    document.addEventListener(
      "keydown",
      bloquearTeclas,
    );

    document.addEventListener(
      "contextmenu",
      bloquearMenu,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        bloquearTeclas,
      );

      document.removeEventListener(
        "contextmenu",
        bloquearMenu,
      );
    };
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;

