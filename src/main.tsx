import React from "react";
import ReactDOM from "react-dom/client";
import { router } from "./App";
// import "./assets/startbootstrap-grayscale-gh-pages/css/styles.css";
// import "./assets/colormind-material-dashboard.css";
// import "bootstrap/dist/css/bootstrap.css";
import "./App.scss";

// import "amazon-cognito-passwordless-auth/passwordless.css";
import "./passwordless.css";
import "./App.css";

import { LoggingContextProvider } from "./components/LoggingContext";
import Fido2Toast from "./components/Fido2Toast";
import QueryClientProvider from "./components/Queries";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { Passwordless } from "amazon-cognito-passwordless-auth";
import { PasswordlessContextProvider /*Fido2Toast*/ } from "amazon-cognito-passwordless-auth/react";
// import ThemeProvider from "react-bootstrap/ThemeProvider";
import { RouterProvider } from "react-router-dom";

Passwordless.configure({
  clientId: "15bcvkbaclouojbupbsqa9ttfd",
  cognitoIdpEndpoint: "us-east-1",
  debug: console.trace,
  fido2: {
    baseUrl: "https://events.cubesandcardboard.net/auth/",
    authenticatorSelection: {
      userVerification: "required",
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <PasswordlessContextProvider enableLocalUserCache={true}>
    <React.StrictMode>
      <LoggingContextProvider>
        <QueryClientProvider>
          <ReactQueryDevtools />
          <RouterProvider router={router} />
        </QueryClientProvider>
      </LoggingContextProvider>
    </React.StrictMode>
    <Fido2Toast />
  </PasswordlessContextProvider>
);
