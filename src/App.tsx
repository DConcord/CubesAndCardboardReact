import { useState, useEffect } from "react";

import UpcomingEvents from "./components/Events";
import NavigationBar from "./components/NavigationBar";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";
// import { usePasswordless } from "./components/DemoContext";
// import NavigationBar from "./components/DemoNavigationBar";

export default function App() {
  const { signInStatus, tokensParsed, tokens } = usePasswordless();

  return (
    <>
      <NavigationBar />
      <UpcomingEvents />
    </>
  );
}
