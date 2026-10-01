import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { WalletProvider } from "./features/wallet/walletProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <App />
          <Toaster richColors position="top-center" />
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);