export const routes = {
  public: ['/', '/services', '/services/srv-1', '/help', '/post-a-job', '/login', '/signup', '/signup?role=provider', '/signup?role=arbitrator'],
  customer: ['/customer', '/customer/services', '/customer/services/srv-1', '/customer/bookings', '/customer/bookings/BK-89600', '/customer/support', '/customer/dispute/new', '/customer/profile'],
  provider: ['/provider', '/provider/services', '/provider/services/new', '/provider/jobs', '/provider/jobs/BK-89600', '/provider/earnings', '/provider/reviews', '/provider/availability', '/provider/profile'],
  admin: ['/admin', '/admin/services', '/admin/accounts', '/admin/revenue', '/admin/arbitrator-applications', '/admin/bookings', '/admin/tickets', '/admin/categories', '/admin/disputes', '/admin/profile', '/admin/providers'],
  arbitrator: ['/arbitrator', '/arbitrator/cases', '/arbitrator/cases/DISP-101', '/arbitrator/hearings', '/arbitrator/rulings', '/arbitrator/profile'],
};
