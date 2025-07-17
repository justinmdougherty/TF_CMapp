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
const ProjectManagementDashboard = Loadable(
  lazy(() => import('../views/project-management/ProjectManagementDashboard')),
);
const ProjectDetailPage = Loadable(lazy(() => import('../views/project-detail/ProjectDetailPage')));
const Error = Loadable(lazy(() => import('../views/authentication/Error')));

// Import new placeholder pages
const InventoryPage = Loadable(lazy(() => import('../views/inventory/InventoryPage')));
// const NotesPage = Loadable(lazy(() => import('../views/apps/notes/Notes')));
// const CalendarPage = Loadable(lazy(() => import('../views/apps/calendar/BigCalendarWithProjects')));
// const TicketsPage = Loadable(lazy(() => import('../views/apps/tickets/Tickets')));
const HealthDashboard = Loadable(lazy(() => import('../views/system/HealthDashboard')));
const SearchResultsPage = Loadable(lazy(() => import('../views/search/SearchResultsPage')));
const SearchSystemDemo = Loadable(lazy(() => import('../components/shared/SearchSystemDemo')));
const PendingOrdersPage = Loadable(lazy(() => import('../views/orders/PendingOrdersPage')));
const NotificationTestComponent = Loadable(
  lazy(() => import('../components/shared/NotificationTestComponent')),
);
const SiteAdminDashboard = Loadable(lazy(() => import('../views/admin/SiteAdminDashboard')));
const AnalyticsDashboard = Loadable(lazy(() => import('../views/analytics/AnalyticsDashboard')));
const MyTasksPage = Loadable(lazy(() => import('../views/tasks/MyTasksPage')));
const ProcurementManagementDashboard = Loadable(
  lazy(() => import('../views/procurement/ProcurementManagementDashboard')),
);

const Router = [
  {
    path: '/',
    element: <FullLayout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" /> },
      { path: '/dashboard', exact: true, element: <ProjectsDashboardPage /> },
      { path: '/project-management', element: <ProjectManagementDashboard /> },
      { path: '/project/:projectId', element: <ProjectDetailPage /> },
      // Add new routes
      { path: '/inventory', element: <InventoryPage /> },
      { path: '/orders/pending', element: <PendingOrdersPage /> },
      { path: '/procurement', element: <ProcurementManagementDashboard /> },
      { path: '/analytics', element: <AnalyticsDashboard /> },
      // { path: '/apps/notes', element: <NotesPage /> },
      // { path: '/apps/calendar', element: <CalendarPage /> },
      // { path: '/apps/tickets', element: <TicketsPage /> },
      { path: '/my-tasks', element: <MyTasksPage /> }, // My Tasks route
      { path: '/system/health', element: <HealthDashboard /> },
      { path: '/search', element: <SearchResultsPage /> },
      { path: '/search/demo', element: <SearchSystemDemo /> },
      { path: '/notifications/test', element: <NotificationTestComponent /> },
      { path: '/admin', element: <SiteAdminDashboard /> }, // Admin route

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
