import { useState, useEffect } from "react";

import UpcomingEvents from "./components/Events";
import NavigationBar from "./components/NavigationBar";
import TbdGallery from "./components/TbdGallery";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";
// import { usePasswordless } from "./components/DemoContext";
// import NavigationBar from "./components/DemoNavigationBar";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

export default function App() {
  const { signInStatus, tokensParsed, tokens } = usePasswordless();

  return (
    <>
      <NavigationBar />
      <Router>
        <Routes>
          <Route path="/" element={<UpcomingEvents />} />
          <Route path="/tbd" element={<TbdGallery />} />
        </Routes>
      </Router>
      {/* <UpcomingEvents /> */}
    </>
  );
}
