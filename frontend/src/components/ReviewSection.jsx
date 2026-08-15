import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, BadgeCheck } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function StarRating({ value, onChange, readonly = false }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange && onChange(star)}
          className={`star-rating__star ${star <= value ? 'star-rating__star--active' : ''}`}
          aria-label={`${star} star`}
        >
          <Star size={18} fill={star <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ productId, productName }) {
  const { isAuthenticated, isConsumer, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await api.get('/reviews/', { product: productId });
      setReviews(Array.isArray(data) ? data : data.results || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetchReviews();
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/reviews/', { product: productId, rating, comment });
      setComment('');
      setRating(5);
      setSuccess('Thank you for your review!');
      await fetchReviews();
    } catch (err) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const hasUserReviewed = reviews.some((r) => r.consumer_username === user?.username);

  return (
    <section className="review-section">
      <div className="review-section__header">
        <MessageSquare size={22} color="var(--primary)" />
        <h2 className="title-md">Customer Reviews</h2>
        <span className="badge badge-category">{reviews.length} reviews</span>
      </div>

      {isAuthenticated && isConsumer && !hasUserReviewed && (
        <form onSubmit={handleSubmit} className="review-form card">
          <h3 className="title-sm">Share your experience with {productName}</h3>
          <div className="form-group">
            <label className="form-label">Your Rating</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="review-comment">Comment</label>
            <textarea
              id="review-comment"
              className="form-textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How fresh was the produce? Would you order again?"
              required
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">{success}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-muted text-sm">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-muted text-sm">No reviews yet. Be the first to share your experience!</p>
      ) : (
        <div className="review-list">
          {reviews.map((review) => (
            <article key={review.id} className="review-card card">
              <div className="review-card__header">
                <div>
                  <strong>{review.consumer_username}</strong>
                  {review.is_verified_purchase && (
                    <span className="review-verified">
                      <BadgeCheck size={14} /> Verified Purchase
                    </span>
                  )}
                </div>
                <StarRating value={review.rating} readonly />
              </div>
              {review.comment && <p className="review-card__comment">{review.comment}</p>}
              <time className="text-xs text-muted">
                {new Date(review.created_at).toLocaleDateString()}
              </time>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
