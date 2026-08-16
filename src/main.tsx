import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles.css";

if (import.meta.env.DEV && import.meta.env.VITE_DISABLE_REACT_DEVTOOLS !== "1") {
  void import("react-grab").catch(() => undefined);
  void import("react-scan").then(({ scan }) => scan({ enabled: true })).catch(() => undefined);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
