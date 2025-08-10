import { RouteObject } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Lazy load components for code splitting
const LandingPage = lazy(() => import("./pages/LandingPage").then(module => ({ default: module.LandingPage })));
const DesignsList = lazy(() => import("./components/DesignsList").then(module => ({ default: module.DesignsList })));
const DesignEditor = lazy(() => import("./components/DesignEditor").then(module => ({ default: module.DesignEditor })));
const BlogIndex = lazy(() => import("./pages/blog/Index").then(module => ({ default: module.BlogIndex })));
const PostDetail = lazy(() => import("./pages/blog/PostDetail").then(module => ({ default: module.PostDetail })));
const NotFound = lazy(() => import("./pages/blog/NotFound").then(module => ({ default: module.NotFound })));
const Auth = lazy(() => import("./pages/blog/Auth").then(module => ({ default: module.Auth })));
const BlogManager = lazy(() => import("./pages/admin/BlogManager").then(module => ({ default: module.BlogManager })));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Wrapper for lazy components
const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

// Route constants for centralized path management
export const ROUTE_PATHS = {
  HOME: "/",
  DESIGNS: "/designs",
  EDITOR: "/editor",
  BLOG: "/blog",
  BLOG_POST: "/blog/:id",
  AUTH: "/auth",
  NOT_FOUND: "*",
  ADMIN_BLOG: "/admin/blog"
} as const;

export const routes: RouteObject[] = [
  {
    path: ROUTE_PATHS.HOME,
    element: (
      <LazyWrapper>
        <LandingPage />
      </LazyWrapper>
    ),
    children: [
      {
        index: true,
        element: (
          <LazyWrapper>
            <LandingPage />
          </LazyWrapper>
        ),
      },
      {
        path: ROUTE_PATHS.DESIGNS.slice(1), // Remove leading slash for nested route
        element: (
          <LazyWrapper>
            <ProtectedRoute>
              <DesignsList />
            </ProtectedRoute>
          </LazyWrapper>
        ),
      },
      {
        path: ROUTE_PATHS.EDITOR.slice(1), // Remove leading slash for nested route
        element: (
          <LazyWrapper>
            <ProtectedRoute>
              <DesignEditor />
            </ProtectedRoute>
          </LazyWrapper>
        ),
      },
      {
        path: ROUTE_PATHS.BLOG.slice(1), // Remove leading slash for nested route
        element: (
          <LazyWrapper>
            <BlogIndex />
          </LazyWrapper>
        ),
      },
      {
        path: ROUTE_PATHS.BLOG_POST.slice(1), // Remove leading slash for nested route
        element: (
          <LazyWrapper>
            <PostDetail />
          </LazyWrapper>
        ),
      },
      {
        path: ROUTE_PATHS.AUTH.slice(1), // Remove leading slash for nested route
        element: (
          <LazyWrapper>
            <Auth />
          </LazyWrapper>
        ),
      },
      {
        path: ROUTE_PATHS.ADMIN_BLOG.slice(1), // Remove leading slash for nested route
        element: (
          <LazyWrapper>
            <ProtectedRoute>
              <BlogManager />
            </ProtectedRoute>
          </LazyWrapper>
        ),
      },
      {
        path: ROUTE_PATHS.NOT_FOUND,
        element: (
          <LazyWrapper>
            <NotFound />
          </LazyWrapper>
        ),
      },
    ],
  },
];