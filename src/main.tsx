import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AppProvider } from "./store/AppStore";
import { ToastProvider } from "./store/ToastContext";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { runMigrations, takeDailySnapshot } from "./toolkit/engine/dataCare";
import "./index.css";

// Upgrade any old stored data, then take the once-a-day safety snapshot.
runMigrations();
takeDailySnapshot();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>,
);
