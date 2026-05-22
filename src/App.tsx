import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { MCPServerPlayground } from "./lib/components/MCPServerPlayground";
import "./lib/styles.css";
import "./index.css";

// Base path for GitHub Pages - must match vite.config.ts base
const basename = import.meta.env.BASE_URL;

function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route
          path="/"
          element={
            <MCPServerPlayground
              showValidation={true}
              showFunctions={true}
              showRawHttp={true}
              showSettings={true}
              className="h-dvh"
            />
          }
        />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
