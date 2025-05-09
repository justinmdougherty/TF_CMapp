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
} from '@tabler/icons-react';

const Menuitems: MenuitemsType[] = [
  {
    navlabel: true,
    subheader: 'Home',
  },
  {
    id: uniqueId(),
    title: 'Projects Dashboard',
    icon: IconLayoutDashboard,
    href: '/dashboard',
  },
  {
    navlabel: true,
    subheader: 'Management',
  },
  {
    id: uniqueId(),
    title: 'Inventory',
    icon: IconClipboardList, // Example icon
    href: '/inventory',
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
];

export default Menuitems;