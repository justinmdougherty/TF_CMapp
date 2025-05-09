// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import React, { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router'; // Ensure 'Navigate' is imported from 'react-router' if you are using react-router v6. If it is react-router-dom, then 'Navigate' is imported from 'react-router-dom'. Given the template likely uses react-router-dom for web, this might need adjustment based on your exact react-router version/package.
import Loadable from '../layouts/full/shared/loadable/Loadable';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

/* ****Pages***** */
/* ****Pages***** */
const ProjectsDashboardPage = Loadable(lazy(() => import('../views/dashboard/ProjectsDashboardPage')));
const ProjectDetailPage = Loadable(lazy(() => import('../views/project-detail/projectDetailPage'))); 
const Error = Loadable(lazy(() => import('../views/authentication/Error')));

const Router = [
  {
    path: '/',
    element: <FullLayout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" /> },
      { path: '/dashboard', exact: true, element: <ProjectsDashboardPage /> },
      { path: '/project/:projectId', element: <ProjectDetailPage /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/auth',
    element: <BlankLayout />,
    children: [
      { path: '404', element: <Error /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
];

const router = createBrowserRouter(Router);
export default router;
