import { LayoutDashboard, Wrench, Calendar, Briefcase, DollarSign, Star, User } from 'lucide-react';
import { WorkspaceLayout } from './WorkspaceLayout';

export function ProviderLayout() {
  const navItems = [
    { label: 'Overview', path: '/provider', icon: LayoutDashboard },
    { label: 'Availability', path: '/provider/availability', icon: Calendar },
    { label: 'My Services', path: '/provider/services', icon: Wrench },
    { label: 'Job Inbox', path: '/provider/jobs', icon: Briefcase },
    { label: 'Earnings Summary', path: '/provider/earnings', icon: DollarSign },
    { label: 'Customer Reviews', path: '/provider/reviews', icon: Star },
    { label: 'Profile', path: '/provider/profile', icon: User },
  ];
  return <WorkspaceLayout role="provider" title="Provider Workspace" label="Provider Workspace" accent="success" navItems={navItems} />;
}
