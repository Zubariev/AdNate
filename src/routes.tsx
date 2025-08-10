import { RouteObject } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { DesignsList } from "./components/DesignsList";
import { DesignEditor } from "./components/DesignEditor";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RootLayout } from "./components/layout/RootLayout";
import { BlogIndex } from "./pages/blog/Index";
import { PostDetail } from "./pages/blog/PostDetail";
import { NotFound } from "./pages/blog/NotFound";
import { Auth } from "./pages/blog/Auth";

// Route constants for centralized path management
export const ROUTE_PATHS = {
  HOME: "/",
  DESIGNS: "/designs",
  EDITOR: "/editor",
  BLOG: "/blog",
  BLOG_POST: "/blog/:id",
  AUTH: "/auth",
  NOT_FOUND: "*"
} as const;

export const routes: RouteObject[] = [
  {
    path: ROUTE_PATHS.HOME,
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: ROUTE_PATHS.DESIGNS.slice(1), // Remove leading slash for nested route
        element: (
          <ProtectedRoute>
            <DesignsList />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_PATHS.EDITOR.slice(1), // Remove leading slash for nested route
        element: (
          <ProtectedRoute>
            <DesignEditor />
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTE_PATHS.BLOG.slice(1), // Remove leading slash for nested route
        element: <BlogIndex />,
      },
      {
        path: ROUTE_PATHS.BLOG_POST.slice(1), // Remove leading slash for nested route
        element: <PostDetail />,
      },
      {
        path: ROUTE_PATHS.AUTH.slice(1), // Remove leading slash for nested route
        element: <Auth />,
      },
      {
        path: ROUTE_PATHS.NOT_FOUND,
        element: <NotFound />,
      },
    ],
  },
];