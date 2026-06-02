import { LayoutDashboard } from "lucide-react";

export const adminRoutes = [
  {
    group: "Dashboard",
    items: [
      {
        name: "Dashboard",
        path: "dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
        element: <div />, 
      }
    ]
  }
];
