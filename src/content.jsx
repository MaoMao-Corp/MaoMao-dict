import React from "react";
import { createRoot } from "react-dom/client";
import Popup from "./Popup";

// Crea un contenedor para la extensión en la página actual
const container = document.createElement("div");
container.id = "popup-dictionary-container";
document.body.appendChild(container);

// Usa React 18 para renderizar el componente
const root = createRoot(container);
root.render(<Popup />);
