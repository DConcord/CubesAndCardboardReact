import React from "react";
import ReactDOM from "react-dom/client";
import { router } from "./App";
// import "./assets/startbootstrap-grayscale-gh-pages/css/styles.css";
// import "./assets/colormind-material-dashboard.css";
import "bootstrap/dist/css/bootstrap.css";
import "./App.scss";

import "amazon-cognito-passwordless-auth/passwordless.css";
import "./App.css";

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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <PasswordlessContextProvider enableLocalUserCache={true}>
    <React.StrictMode>
      {/* <ThemeProvider
      // breakpoints={["xxxl", "1400px", "1200px", "992px", "768px", "576px", "xs", "xxs"]}
      // minBreakpoint="xl"
      > */}
      <RouterProvider router={router} />
      {/* <App data-bs-theme="dark" /> */}
      {/* </ThemeProvider> */}
    </React.StrictMode>
    <Fido2Toast />
  </PasswordlessContextProvider>
);
