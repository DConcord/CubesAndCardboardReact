import React from "react";
import Authenticated from "./utilities/Authenticated";
const UpcomingEvents = React.lazy(() => import("./components/Events"));
const NavigationBar = React.lazy(() => import("./components/NavigationBar"));
const TbdGallery = React.lazy(() => import("./components/TbdGallery"));
const Players = React.lazy(() => import("./components/Players"));
const Logs = React.lazy(() => import("./components/Logs"));

import { Route, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<NavigationBar />}>
        <Route
          path="/"
          element={
            <React.Suspense fallback={<>...</>}>
              <UpcomingEvents />
            </React.Suspense>
          }
        />
        <Route
          path="/tbd"
          element={
            <React.Suspense fallback={<>...</>}>
              <TbdGallery />
            </React.Suspense>
          }
        />
        <Route
          path="/players"
          element={
            <Authenticated unauthPath="/">
              <React.Suspense fallback={<>...</>}>
                <Players />
              </React.Suspense>
            </Authenticated>
          }
        />
        <Route
          path="/logs"
          element={
            <Authenticated unauthPath="/" group={["admin"]}>
              <React.Suspense fallback={<>...</>}>
                <Logs />
              </React.Suspense>
            </Authenticated>
          }
        />
      </Route>
    </>
  )
);
