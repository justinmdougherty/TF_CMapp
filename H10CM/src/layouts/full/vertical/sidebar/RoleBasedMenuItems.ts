import { uniqueId } from 'lodash';
import { UserRole } from 'src/types/UserPermissions';

interface MenuitemsType {
  [x: string]: any;
  id?: string;
  navlabel?: boolean;
  subheader?: string;
  title?: string;
  icon?: any;
  href?: string;
  children?: MenuitemsType[];
  chip?: string;
  chipColor?: string;
  variant?: string;
  external?: boolean;
  requiredRole?: UserRole; // Add role requirement
  requiredRoles?: UserRole[]; // Allow multiple roles
  adminOnly?: boolean; // Quick flag for admin-only items
}

// Import required icons from Tabler Icons
import {
  IconLayoutDashboard,
  IconClipboardList, // For Inventory
  IconCalendarEvent,  // For Calendar
  IconTicket,         // For Tickets
  IconNotes,          // For Notes
  IconSettings,       // For Project Management
  IconHeartbeat,      // For Health Dashboard
  IconShoppingCart,   // For Pending Orders
  IconUserCog,        // For Admin Dashboard
  IconChartLine,      // For Analytics Dashboard
  IconChecklist,      // For My Tasks
  IconCurrencyDollar, // For Procurement Management
} from '@tabler/icons-react';

const BaseMenuItems: MenuitemsType[] = [
  {
    navlabel: true,
    subheader: 'Home',
  },
  {
    id: uniqueId(),
    title: 'Production Dashboard',
    icon: IconLayoutDashboard,
    href: '/dashboard',
  },
  {
    navlabel: true,
    subheader: 'Management',
  },
  {
    id: uniqueId(),
    title: 'Project Management',
    icon: IconSettings,
    href: '/project-management',
  },
  {
    id: uniqueId(),
    title: 'Procurement Management',
    icon: IconCurrencyDollar,
    href: '/procurement',
    requiredRoles: ['Admin', 'ProjectManager', 'Technician'], // Allow Admin, PM, and Technician access
  },
  {
    id: uniqueId(),
    title: 'My Tasks',
    icon: IconChecklist,
    href: '/my-tasks',
  },
  {
    id: uniqueId(),
    title: 'Inventory',
    icon: IconClipboardList,
    href: '/inventory',
  },
  {
    id: uniqueId(),
    title: 'Pending Orders',
    icon: IconShoppingCart,
    href: '/orders/pending',
  },
  {
    id: uniqueId(),
    title: 'Analytics',
    icon: IconChartLine,
    href: '/analytics',
    requiredRoles: ['Admin', 'ProjectManager'], // Allow Admin and Project Manager access
  },
  {
    navlabel: true,
    subheader: 'Apps',
  },
  {
    id: uniqueId(),
    title: 'Notes',
    icon: IconNotes,
    href: '/apps/notes',
  },
  {
    id: uniqueId(),
    title: 'Calendar',
    icon: IconCalendarEvent,
    href: '/apps/calendar',
  },
  {
    id: uniqueId(),
    title: 'Tickets',
    icon: IconTicket,
    href: '/apps/tickets',
  },
  {
    navlabel: true,
    subheader: 'System',
  },
  {
    id: uniqueId(),
    title: 'Health Dashboard',
    icon: IconHeartbeat,
    href: '/system/health',
    // Health Dashboard is available to everyone - no role restriction
  },
  {
    id: uniqueId(),
    title: 'Site Administration',
    icon: IconUserCog,
    href: '/admin',
    adminOnly: true, // Only show to admins
  },
];

// Function to filter menu items based on user role
export const getMenuItemsForUser = (userRole?: UserRole): MenuitemsType[] => {
  return BaseMenuItems.filter(item => {
    // Always show nav labels and items without role restrictions
    if (item.navlabel || (!item.requiredRole && !item.requiredRoles && !item.adminOnly)) {
      return true;
    }

    // If no user role, only show public items
    if (!userRole) {
      return false;
    }

    // Check admin-only items
    if (item.adminOnly && userRole !== 'Admin') {
      return false;
    }

    // Check specific role requirement
    if (item.requiredRole && userRole !== item.requiredRole) {
      return false;
    }

    // Check multiple role requirements
    if (item.requiredRoles && !item.requiredRoles.includes(userRole)) {
      return false;
    }

    return true;
  });
};

// Default export for backward compatibility
const Menuitems = BaseMenuItems;
export default Menuitems;
