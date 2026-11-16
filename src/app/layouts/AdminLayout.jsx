import { BarChart2, Users, CheckSquare, Eye, Headphones, Layers, Gavel, User, DollarSign } from 'lucide-react';
import { WorkspaceLayout } from './WorkspaceLayout';

export function AdminLayout() {
  const navItems = [
    { label: 'Ops Dashboard', path: '/admin', icon: BarChart2 },
    { label: 'Platform Services', path: '/admin/services', icon: Layers },
    { label: 'Provider Verification', path: '/admin/providers', icon: Users },
    { label: 'User Accounts', path: '/admin/accounts', icon: Users },
    { label: 'Revenue & Ledger', path: '/admin/revenue', icon: DollarSign },
    { label: 'Arbitrator Applications', path: '/admin/arbitrator-applications', icon: CheckSquare },
    { label: 'Dispute Assignment', path: '/admin/disputes', icon: Gavel },
    { label: 'Booking Inspector', path: '/admin/bookings', icon: Eye },
    { label: 'Ticket Triage', path: '/admin/tickets', icon: Headphones },
    { label: 'Category Manager', path: '/admin/categories', icon: Layers },
    { label: 'Profile', path: '/admin/profile', icon: User },
  ];
  return <WorkspaceLayout role="admin" title="Marketplace Operations Control" label="Admin" accent="warning" navItems={navItems} />;
}
