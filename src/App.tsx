// import { useState, useEffect } from "react";

import UpcomingEvents from "./components/Events";
import NavigationBar from "./components/NavigationBar";
import TbdGallery from "./components/TbdGallery";
import Players, { PlayersAuth } from "./components/Players";
import { authenticated } from "./components/Authenticated";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";
// import { usePasswordless } from "./components/DemoContext";
// import NavigationBar from "./components/DemoNavigationBar";

import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";

export default function App() {
  const { signInStatus, tokensParsed, tokens } = usePasswordless();
  return (
    <>
      <Router>
        <NavigationBar />
        <Routes>
          <Route path="/" element={<UpcomingEvents />} />
          <Route path="/tbd" element={<TbdGallery />} />
          <Route
            path="/players"
            element={
              ["REFRESHING_SIGN_IN", "SIGNING_IN", "CHECKING"].includes(signInStatus) ? (
                <PlayersAuth />
              ) : authenticated({ group: ["admin"] }) ? (
                <Players />
              ) : (
                <Navigate replace to="/" />
              )
            }
            // re-read: https://blog.logrocket.com/authentication-react-router-v6/
            // element={<Players />}
            // element={authenticated({ group: ["admin"] }) ? <Players /> : <Navigate replace to="/" />}
            // element={authenticated({ group: ["admin"] }) ? <Players /> : <Navigate replace to="/" />}
          />
        </Routes>
      </Router>
      {/* <UpcomingEvents /> */}
    </>
  );
}
