import ReactDOM from "react-dom/client";
// import App from "./App.tsx";
import "./index.css";
import React, { Suspense } from "react";

const AppComp = React.lazy(() => import("./App.tsx"));

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <Suspense fallback={<div>Loading...</div>}>
    <AppComp />
  </Suspense>
  // </React.StrictMode>,
);
