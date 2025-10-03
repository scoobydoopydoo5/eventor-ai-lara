import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";
import MouseParticles from "react-mouse-particles";
import { Mouse } from "lucide-react";
import { dark } from "@clerk/themes";

const PUBLISHABLE_KEY =
  "pk_test_c3RlYWR5LWplbm5ldC0zOC5jbGVyay5hY2NvdW50cy5kZXYk";

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
      }}
    >
      <MouseParticles
        g={1}
        color="random"
        cull="MuiSvgIcon-root,MuiButton-root"
        level={6}
      />{" "}
      <App />
    </ClerkProvider>
  </StrictMode>
);
