// Using placeholder image URLs for profile images
const img1 = 'https://via.placeholder.com/40x40?text=U1';
const img2 = 'https://via.placeholder.com/40x40?text=U2';
const img3 = 'https://via.placeholder.com/40x40?text=U3';
const img4 = 'https://via.placeholder.com/40x40?text=U4';

import icon3 from 'src/assets/images/svgs/icon-tasks.svg'

import ddIcon1 from 'src/assets/images/svgs/icon-dd-chat.svg'
import ddIcon2 from 'src/assets/images/svgs/icon-dd-cart.svg'
import ddIcon3 from 'src/assets/images/svgs/icon-dd-invoice.svg'
import ddIcon4 from 'src/assets/images/svgs/icon-dd-date.svg'
import ddIcon6 from 'src/assets/images/svgs/icon-dd-lifebuoy.svg'
import ddIcon7 from 'src/assets/images/svgs/icon-dd-message-box.svg'
import ddIcon8 from 'src/assets/images/svgs/icon-dd-application.svg'

// Notifications dropdown

interface notificationType {
  avatar: string;
  title: string;
  subtitle: string;
}

const notifications: notificationType[] = [
  {
    avatar: img1,
    title: 'Roman Joined the Team!',
    subtitle: 'Congratulate him',
  },
  {
    avatar: img2,
    title: 'New message received',
    subtitle: 'Salma sent you new message',
  },
  {
    avatar: img3,
    title: 'New Payment received',
    subtitle: 'Check your earnings',
  },
  {
    avatar: img4,
    title: 'Jolly completed tasks',
    subtitle: 'Assign her new tasks',
  },
  {
    avatar: img1,
    title: 'Roman Joined the Team!',
    subtitle: 'Congratulate him',
  },
  {
    avatar: img2,
    title: 'New message received',
    subtitle: 'Salma sent you new message',
  },
  {
    avatar: img3,
    title: 'New Payment received',
    subtitle: 'Check your earnings',
  },
  {
    avatar: img4,
    title: 'Jolly completed tasks',
    subtitle: 'Assign her new tasks',
  },
];

//
// Messages dropdown
//
interface messageType {
  avatar: string;
  title: string;
  subtitle: string;
  time: string;
  status: string;
}
const messages: messageType[] = [
  {
    avatar: img1,
    title: 'Roman Joined the Team!',
    subtitle: 'Congratulate him',
    time: '1 hours ago',
    status: 'success',
  },
  {
    avatar: img2,
    title: 'New message received',
    subtitle: 'Salma sent you new message',
    time: '1 day ago',
    status: 'warning',
  },
  {
    avatar: img3,
    title: 'New Payment received',
    subtitle: 'Check your earnings',
    time: '2 days ago',
    status: 'success',
  },
  {
    avatar: img4,
    title: 'Jolly completed tasks',
    subtitle: 'Assign her new tasks',
    time: '1 week ago',
    status: 'danger',
  },
];

//
// Profile dropdown
//
interface ProfileType {
  href: string;
  title: string;
  subtitle: string;
  icon: any;
}
const profile: ProfileType[] = [
  {
    href: '/my-tasks',
    title: 'My Tasks',
    subtitle: 'To-do and Daily Tasks',
    icon: icon3,
  },
];

// apps dropdown

interface appsLinkType {
  href: string;
  title : string;
  subtext: string;
  avatar: string;
}

const appsLink:appsLinkType[] = [
  {
    href: '/',
    title: 'Chat Application',
    subtext: 'New messages arrived',
    avatar: ddIcon1
  },
  {
    href: '/',
    title: 'eCommerce App',
    subtext: 'New stock available',
    avatar: ddIcon2
  },
  {
    href: '/',
    title: 'Notes App',
    subtext: 'To-do and Daily tasks',
    avatar: ddIcon3
  },
  {
    href: '/',
    title: 'Calendar App',
    subtext: 'Get dates',
    avatar: ddIcon4
  },
  {
    href: '/',
    title: 'Tickets App',
    subtext: 'Submit tickets',
    avatar: ddIcon6
  },
  {
    href: '/',
    title: 'Email App',
    subtext: 'Get new emails',
    avatar: ddIcon7
  },
  {
    href: '/',
    title: 'Blog App',
    subtext: 'added new blog',
    avatar: ddIcon8
  },
]


interface LinkType {
  href: string;
  title: string;
}

const pageLinks:LinkType[] = [
  {
    href: '/',
    title: 'Pricing Page'
  },
  {
    href: '/',
    title: 'Authentication Design'
  },
  {
    href: '/',
    title: 'Register Now'
  },
  {
    href: '/',
    title: '404 Error Page'
  },
  {
    href: '/',
    title: 'Login Page'
  },
  {
    href: '/',
    title: 'User Application'
  },
  {
    href: '/',
    title: 'Blog Design'
  },
  {
    href: '/',
    title: 'Shopping Cart'
  },
]

export { notifications, messages, profile, pageLinks, appsLink };
