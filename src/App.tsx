import React from "react";
import Authenticated, { authenticated } from "./utilities/Authenticated";
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
            <Authenticated unauthPath="/">
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

// export default function App() {
//   // const { signInStatus, tokensParsed, tokens } = usePasswordless();
//   return (
//     <>
//       <BrowserRouter>
//         <NavigationBar />
//         <Routes>
//           <Route path="/" element={<UpcomingEvents />} />
//           <Route path="/tbd" element={<TbdGallery />} />
//           <Route
//             path="/players"
//             // element={
//             //   ["REFRESHING_SIGN_IN", "SIGNING_IN", "CHECKING"].includes(signInStatus) ? (
//             //     <></>
//             //   ) : authenticated({
//             //       signInStatus,
//             //       tokensParsed,
//             //       group: ["admin"],
//             //     }) ? (
//             //     <Players />
//             //   ) : (
//             //     <Navigate replace to="/" />
//             //   )
//             // }
//             // re-read: https://blog.logrocket.com/authentication-react-router-v6/
//             // element={<Players />}
//             // element={authenticated({ group: ["admin"] }) ? <Players /> : <Navigate replace to="/" />}
//             element={
//               <Authenticated unauthPath="/">
//                 <Players />
//               </Authenticated>
//             }
//           />
//         </Routes>
//       </BrowserRouter>
//     </>
//   );
// }
