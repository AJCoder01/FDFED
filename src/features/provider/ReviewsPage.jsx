import React, { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { useApp } from '../../app/context/AppContext';
import { Button } from '../../design-system/primitives/Button';
import { TextField } from '../../design-system/primitives/TextField';

export function ReviewsPage() {
  const { showToast } = useApp();

  const [reviews, setReviews] = useState([
    {
      id: 'rev-1',
      customerName: 'Aarav Sharma',
      rating: 5,
      comment: 'Excellent work by Rajesh! Very professional and checked earthing thoroughly.',
      date: '2026-08-14',
      reply: 'Thank you Aarav! Glad we could fix the earthing issue safely.'
    },
    {
      id: 'rev-2',
      customerName: 'Meera Patel',
      rating: 4,
      comment: 'AC foam cleaning was very good. Cooling improved significantly.',
      date: '2026-08-05',
      reply: null
    }
  ]);

  const [replyInput, setReplyInput] = useState('');
  const [activeReplyId, setActiveReplyId] = useState(null);

  const handleSendReply = (revId) => {
    if (!replyInput) return;
    setReviews(reviews.map(r => r.id === revId ? { ...r, reply: replyInput } : r));
    setActiveReplyId(null);
    setReplyInput('');
    showToast('Public reply posted successfully!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 className="page-title">Customer Reviews & Ratings</h1>
        <p className="page-subtitle">View customer feedback and post public provider replies</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reviews.map((rev) => (
          <div key={rev.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '15px', color: 'var(--color-ink)' }}>{rev.customerName}</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>{rev.date}</span>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--color-ink)' }}>"{rev.comment}"</p>

            {/* Existing Reply */}
            {rev.reply ? (
              <div style={{ backgroundColor: 'var(--color-primary-light)', padding: '12px', borderRadius: 'var(--radius-control)', marginTop: '8px', fontSize: '13px' }}>
                <strong style={{ color: 'var(--color-primary)' }}>Your Reply:</strong> {rev.reply}
              </div>
            ) : (
              <div>
                {activeReplyId === rev.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    <TextField
                      placeholder="Write your professional response..."
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button variant="primary" size="sm" onClick={() => handleSendReply(rev.id)}>Post Reply</Button>
                      <Button variant="secondary" size="sm" onClick={() => setActiveReplyId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" icon={MessageSquare} onClick={() => setActiveReplyId(rev.id)}>
                    Reply to Review
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
