// import { useState, useEffect } from "react";

import UpcomingEvents from "./components/Events";
import NavigationBar from "./components/NavigationBar";
import TbdGallery from "./components/TbdGallery";
import Players from "./components/Players";
import Authenticated, { authenticated } from "./components/Authenticated";
import { usePasswordless } from "amazon-cognito-passwordless-auth/react";
// import { usePasswordless } from "./components/DemoContext";
// import NavigationBar from "./components/DemoNavigationBar";

import { Route, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<NavigationBar />}>
        <Route path="/" element={<UpcomingEvents />} />
        <Route path="/tbd" element={<TbdGallery />} />
        <Route
          path="/players"
          element={
            <Authenticated unauthPath="/">
              <Players />
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
