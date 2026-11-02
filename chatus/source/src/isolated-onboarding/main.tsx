import React from "react";
import ReactDOM from "react-dom/client";
import { OnboardingPreview } from "./OnboardingPreview";
import "../styles.css";
import "./onboarding.css";
import "./apple-design-preview.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OnboardingPreview />
  </React.StrictMode>,
);
