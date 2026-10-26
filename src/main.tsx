import React from "react"
import ReactDOM from "react-dom/client"
import App from "./app/App"
import "./styles/base.css"
import "./styles/game.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("./sw.js").catch((error: unknown) => {
      console.error("Service worker registration failed:", error)
    })
  })
}
