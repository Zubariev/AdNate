import { Outlet } from "react-router-dom";
import { Toaster } from "../ui/toaster";

export function RootLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="container px-4 py-8 mx-auto">
        <div className="relative z-10">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl rounded-3xl" />
          <div className="relative p-8">
            <Outlet />
          </div>
        </div>
        <Toaster />
      </div>
    </div>
  );
} 