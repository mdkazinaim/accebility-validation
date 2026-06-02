import { lazy } from "react";
import Loadable from "@/utils/Loadable";
import { PublicSkeleton } from "@/common/Skeleton/Public/PublicSkeleton";

const About = Loadable(
  lazy(() => import("../pages/Public/About/About")),
  PublicSkeleton
);
const Contact = Loadable(
  lazy(() => import("../pages/Public/Contact/Contact")),
  PublicSkeleton
);
const Services = Loadable(
  lazy(() => import("@/pages/Public/Services/Services")),
  PublicSkeleton
);
const Home = Loadable(
  lazy(() => import("@/pages/Public/Home/Home")),
  PublicSkeleton
);
const TableDemo = Loadable(
  lazy(() => import("@/pages/TableDemo")),
  PublicSkeleton
);
const FormDemo = Loadable(
  lazy(() => import("@/pages/FormDemo")),
  PublicSkeleton
);


export const publicRoutes = [
  {
    label: "Home",
    index: true,
    path: "/",
    element: <Home />,
  },
  {
    label: "About",
    path: "/about",
    element: <About />,
    children: [
      {
        label: "About 2",
        path: "about2",
        element: <About />,
      },
      {
        label: "About 3",
        path: "about3",
        element: <About />,
      },
    ],
  },
  {
    label: "Contact",
    path: "/contact",
    element: <Contact />,
  },
  {
    label: "Services",
    path: "/services",
    element: <Services />,
  },
  {
    label: "Table Demo",
    path: "/table-demo",
    element: <TableDemo />,
  },
  {
    label: "Form Demo",
    path: "/form-demo",
    element: <FormDemo />,
  },

];
