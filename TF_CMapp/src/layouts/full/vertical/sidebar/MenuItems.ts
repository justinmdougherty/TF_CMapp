import { uniqueId } from 'lodash';

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
} from '@tabler/icons-react';

const Menuitems: MenuitemsType[] = [
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
    title: 'Inventory',
    icon: IconClipboardList, // Example icon
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
  },
  {
    id: uniqueId(),
    title: 'Site Administration',
    icon: IconUserCog,
    href: '/admin',
  },
];

export default Menuitems;