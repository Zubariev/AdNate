import React from 'react';
import { RouteObject } from "react-router-dom";
import LandingPage from './pages/LandingPage';
import BlogIndex from './pages/blog/Index';
import { PostDetail } from './pages/blog/PostDetail';
import { NotFound } from './pages/blog/NotFound';
import { Auth } from './pages/blog/Auth';
import { DesignEditor } from './components/DesignEditor';
import { DesignsList } from './components/DesignsList';
import Home from './pages/brief/home';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LoadingScreen from './pages/brief/LoadingPage';
import Terms from './pages/Terms';
import Privacy from './pages/Policy';
import Contact from './pages/Contact';

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
    path: "/blog/post/:id",
    element: <PostDetail />,
  },
  {
    path: "/designs",
    element: <DesignsList />,
  },
  {
    path: "/editor",
    element: <DesignEditor />,
  },
  {
    path: "/editor/:id",
    element: <DesignEditor />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/brief",
    element: <ProtectedRoute><Home /></ProtectedRoute>,
  },
  {
    path: "/brief/loading",
    element: <ProtectedRoute><LoadingScreen /></ProtectedRoute>,
  },
  {
    path: "/terms",
    element: <Terms />,
  },
  {
    path: "/privacy",
    element: <Privacy />,
  },
  {
    path: "/contact",
    element: <Contact />,
  },
  {
    path: "*",
    element: <NotFound />,
  }
];