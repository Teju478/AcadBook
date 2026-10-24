import { LayoutDashboard, LibraryBig, CalendarDays, UserRound, ClipboardList, Boxes, UsersRound } from 'lucide-react';

export const roleMeta = {
  user: { label: 'User workspace', eyebrow: 'Academic access', initials: 'US' },
  admin: { label: 'Admin workspace', eyebrow: 'Institution operations', initials: 'AD' }
};

export const roleNavigation = {
  user: [
    { label: 'Dashboard', to: '/user/dashboard', icon: LayoutDashboard },
    { label: 'Browse resources', to: '/user/resources', icon: LibraryBig },
    { label: 'My bookings', to: '/user/bookings', icon: CalendarDays },
    { label: 'My profile', to: '/user/profile', icon: UserRound }
  ],
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Booking requests', to: '/admin/requests', icon: ClipboardList },
    { label: 'All bookings', to: '/admin/bookings', icon: CalendarDays },
    { label: 'Resource management', to: '/admin/resources', icon: Boxes },
    { label: 'Users directory', to: '/admin/users', icon: UsersRound },
    { label: 'My profile', to: '/admin/profile', icon: UserRound }
  ]
};

export const publicLinks = [
  { label: 'Directory', to: '/' },
  { label: 'User access', to: '/login/user' },
  { label: 'Admin access', to: '/login/admin' }
];
