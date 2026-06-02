import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { routesGenerator } from "@/utils/Generator/RoutesGenerator";





import { publicRoutes } from "./PublicRoutes";

// CORE COMPONENTS (Always included)
const App = lazy(() => import("../App"));
const Login = lazy(() => import("@/pages/Auth/Login"));
const Signup = lazy(() => import("@/pages/Auth/Signup"));
const Form = lazy(() => import("@/pages/Form"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const routes = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <App />
      </Suspense>
    ),
    children: [
            ...routesGenerator(publicRoutes),
            {
        path: "/form",
        element: <Form />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/signup",
        element: <Signup />,
      },
    ],
  },

  

  

  {
    path: "*",
    element: <NotFound />,
  },
]);

export default routes;
