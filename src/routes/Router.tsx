// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import React, { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import Loadable from '../layouts/full/shared/loadable/Loadable';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

/* ****Pages***** */
const ProjectsDashboardPage = Loadable(
  lazy(() => import('../views/dashboard/ProjectsDashboardPage')),
);
const ProjectDetailPage = Loadable(lazy(() => import('../views/project-detail/ProjectDetailPage')));
const Error = Loadable(lazy(() => import('../views/authentication/Error')));

// Import new placeholder pages
const InventoryPage = Loadable(lazy(() => import('../views/inventory/InventoryPage')));
const NotesPage = Loadable(lazy(() => import('../views/apps/notes/Notes')));
const CalendarPage = Loadable(lazy(() => import('../views/apps/calendar/BigCalendar')));
const TicketsPage = Loadable(lazy(() => import('../views/apps/tickets/Tickets')));

const Router = [
  {
    path: '/',
    element: <FullLayout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" /> },
      { path: '/dashboard', exact: true, element: <ProjectsDashboardPage /> },
      { path: '/project/:projectId', element: <ProjectDetailPage /> },
      // Add new routes
      { path: '/inventory', element: <InventoryPage /> },
      { path: '/apps/notes', element: <NotesPage /> },
      { path: '/apps/calendar', element: <CalendarPage /> },
      { path: '/apps/tickets', element: <TicketsPage /> },

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
