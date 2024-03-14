import React from "react";
import ReactDOM from "react-dom/client";
import { router } from "./App";
// import "./assets/startbootstrap-grayscale-gh-pages/css/styles.css";
// import "./assets/colormind-material-dashboard.css";
import "bootstrap/dist/css/bootstrap.css";
import "./App.scss";

import "amazon-cognito-passwordless-auth/passwordless.css";
import "./App.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { Passwordless } from "amazon-cognito-passwordless-auth";
import { PasswordlessContextProvider, Fido2Toast } from "amazon-cognito-passwordless-auth/react";
// } from "./components/DemoContext";
import ThemeProvider from "react-bootstrap/ThemeProvider";
import { RouterProvider } from "react-router-dom";

Passwordless.configure({
  clientId: "15bcvkbaclouojbupbsqa9ttfd",
  cognitoIdpEndpoint: "us-east-1",
  debug: console.trace,
  fido2: {
    baseUrl: "https://ewq7x06vu1.execute-api.us-east-1.amazonaws.com/v1/",
    authenticatorSelection: {
      userVerification: "required",
    },
  },
});

// const queryClient = new QueryClient();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5min
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <PasswordlessContextProvider enableLocalUserCache={true}>
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>
    <Fido2Toast />
  </PasswordlessContextProvider>
);
