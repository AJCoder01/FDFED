import { useApp } from '../../app/context/AppContext';
import { TextField } from '../../design-system/primitives/TextField';
import { StatusBadge } from '../../design-system/primitives/StatusBadge';
import { Button } from '../../design-system/primitives/Button';

export function ProviderOnboardingPage() {
  const { currentUser } = useApp();

  return (
    <div className="provider-page provider-narrow">
      <div className="page-header">
        <h1 className="page-title">Provider Verification & Profile</h1>
        <p className="page-subtitle">Your business credentials, trade skills, and verification status</p>
      </div>
      <div className="card provider-stack">
        <div className="provider-record provider-row provider-between">
          <strong>Current Verification Status</strong>
          <StatusBadge status={currentUser.verificationStatus || 'info'} label={currentUser.verificationStatus ? undefined : 'Unavailable'} />
        </div>
        <TextField name="business-name" label="Business / Trading Name" value={currentUser.businessName || ''} disabled />
        <TextField name="service-area" label="Service Coverage Area" value={currentUser.serviceArea || ''} disabled multiline />
        <TextField name="provider-skills" label="Trade Skills" value={currentUser.skills?.join(', ') || ''} disabled />
        <TextField name="provider-email" label="Email" value={currentUser.email} disabled />
        <TextField name="provider-phone" label="Phone" value={currentUser.phone} disabled />
        <p className="provider-hint">Profile updates and verification submissions are currently unavailable. Your existing profile is shown above; no changes can be saved from this page.</p>
        <Button disabled>Update Verification Profile</Button>
      </div>
    </div>
  );
}
