import { Home, Search, Calendar, HelpCircle, User } from 'lucide-react';
import { WorkspaceLayout } from './WorkspaceLayout';

export function CustomerLayout() {
  const navItems = [
    { label: 'Overview', path: '/customer', icon: Home },
    { label: 'Find Services', path: '/customer/services', icon: Search },
    { label: 'My Bookings', path: '/customer/bookings', icon: Calendar },
    { label: 'Profile', path: '/customer/profile', icon: User },
    { label: 'Help & Support', path: '/customer/support', icon: HelpCircle },
  ];
  return <WorkspaceLayout role="customer" title="Customer Dashboard" label="Customer Workspace" accent="primary" navItems={navItems} />;
}
