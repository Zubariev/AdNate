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
    path: "*",
    element: <NotFound />,
  }
];