import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import { RouteObject } from "react-router-dom";
import LandingPage from './pages/LandingPage';
import BlogIndex from './pages/blog/Index';
import PostDetail from './pages/blog/PostDetail';
import NotFound from './pages/blog/NotFound';
import DesignEditor from './components/DesignEditor';
import DesignsList from './components/DesignsList';
import Home from './pages/brief/Home';

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
    path: "/brief",
    element: <Home />,
  },
  {
    path: "*",
    element: <NotFound />,
  }
];

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes; 