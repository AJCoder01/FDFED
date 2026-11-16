import { Scale, FileText, Calendar, Award, User } from 'lucide-react';
import { WorkspaceLayout } from './WorkspaceLayout';

export function ArbitratorLayout() {
  const navItems = [
    { label: 'Arbitration Dashboard', path: '/arbitrator', icon: Scale },
    { label: 'Active Dispute Cases', path: '/arbitrator/cases', icon: FileText },
    { label: 'Hearing Schedule', path: '/arbitrator/hearings', icon: Calendar },
    { label: 'Rulings & Awards', path: '/arbitrator/rulings', icon: Award },
    { label: 'Profile', path: '/arbitrator/profile', icon: User },
  ];
  return <WorkspaceLayout role="arbitrator" title="Independent Arbitrator Desk" label="Arbitrator Desk" accent="conflict" navItems={navItems} />;
}
