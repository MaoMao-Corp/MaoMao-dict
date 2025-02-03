import React from "react";
import { createRoot } from "react-dom/client";
import Popup from "./Popup";
import "./Popup.css"

// Verifica si ya existe un contenedor para el popup y si no, créalo
let container = document.getElementById("popup-container");
if (!container) {
  container = document.createElement("div");
  container.id = "popup-container";
  document.body.appendChild(container);
}

// Usa createRoot para renderizar React en el contenedor
const root = createRoot(container);
root.render(<Popup />);
