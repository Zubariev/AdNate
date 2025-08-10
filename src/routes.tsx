import { RouteObject } from "react-router-dom";
import LandingPage from './pages/LandingPage';
import BlogIndex from './pages/blog/Index';
import PostDetail from './pages/blog/PostDetail';
import NotFound from './pages/blog/NotFound';
import DesignEditor from './components/DesignEditor';
import DesignsList from './components/DesignsList';
import ProtectedRoute from './components/auth/ProtectedRoute';

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/blog",
    element: <BlogIndex />,
  },
  {
    path: "/blog/:id",
    element: <PostDetail />,
  },
  {
    path: "/designs",
    element: <ProtectedRoute><DesignsList /></ProtectedRoute>,
  },
  {
    path: "/editor",
    element: <ProtectedRoute><DesignEditor /></ProtectedRoute>,
  },
  {
    path: "*",
    element: <NotFound />,
  }
]; 