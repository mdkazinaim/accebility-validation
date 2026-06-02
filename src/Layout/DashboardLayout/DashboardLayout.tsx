import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Breadcrumbs from "./Breadcrumbs";
import { adminRoutes } from "@/routes/AdminRoutes";

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 1. Fixed Sidebar */}
      <Sidebar />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="p-6 overflow-y-auto">
          {/* Breadcrumbs (Optional) */}
          <div className="mb-6">
            <div className="flex items-center gap-2 space-y-2">
              <Breadcrumbs config={adminRoutes} basePath="/admin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Overview</h1>
            <p className="text-sm text-gray-500">
              Welcome back to your reseller dashboard.
            </p>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
