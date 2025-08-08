import React, { useState } from 'react';
import { Star, Camera, CheckCircle, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import reviewsData from '../data/reviews.json';
import bookingsData from '../data/bookings.json';

interface Review {
  id: string;
  propertyId: string;
  customerId: string;
  bookingId: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
  customerName: string;
  verified: boolean;
}

interface ReviewSystemProps {
  propertyId: string;
  showAddReview?: boolean;
}

const ReviewSystem: React.FC<ReviewSystemProps> = ({ propertyId, showAddReview = false }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useLocalStorage('reviews', reviewsData.reviews);
  const [bookings] = useLocalStorage('bookings', bookingsData.bookings);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: '',
    images: ['']
  });

  const propertyReviews = reviews.filter((r: Review) => r.propertyId === propertyId);
  const filteredReviews = propertyReviews.filter((review: Review) => {
    if (ratingFilter === 'all') return true;
    return review.rating === parseInt(ratingFilter);
  });

  // Check if current user can review this property
  const canReview = () => {
    if (!user || user.role !== 'customer') return false;
    
    const userBookings = bookings.filter((b: any) => 
      b.customerId === user.id && 
      b.propertyId === propertyId && 
      b.status === 'completed' &&
      new Date(b.checkOut) < new Date()
    );
    
    const existingReview = reviews.find((r: Review) => 
      r.customerId === user.id && r.propertyId === propertyId
    );
    
    return userBookings.length > 0 && !existingReview;
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const userBooking = bookings.find((b: any) => 
      b.customerId === user.id && 
      b.propertyId === propertyId && 
      b.status === 'completed'
    );

    if (!userBooking) return;

    const review: Review = {
      id: `review-${Date.now()}`,
      propertyId,
      customerId: user.id,
      bookingId: userBooking.id,
      rating: newReview.rating,
      comment: newReview.comment,
      images: newReview.images.filter(img => img.trim() !== ''),
      createdAt: new Date().toISOString(),
      customerName: user.name,
      verified: true
    };

    setReviews([...reviews, review]);
    setShowReviewForm(false);
    setNewReview({ rating: 5, comment: '', images: [''] });
  };

  const addImageField = () => {
    setNewReview(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const updateImage = (index: number, value: string) => {
    setNewReview(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? value : img)
    }));
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive && onRate ? () => onRate(star) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : ''} transition-transform`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const averageRating = propertyReviews.length > 0 
    ? propertyReviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / propertyReviews.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Guest Reviews</h3>
          {showAddReview && canReview() && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Write Review
            </button>
          )}
        </div>

        {propertyReviews.length > 0 ? (
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              {renderStars(Math.round(averageRating))}
              <span className="text-2xl font-bold text-gray-900">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-gray-600">
              ({propertyReviews.length} review{propertyReviews.length !== 1 ? 's' : ''})
            </span>
          </div>
        ) : (
          <p className="text-gray-500 mb-4">No reviews yet. Be the first to review!</p>
        )}

        {/* Rating Filter */}
        {propertyReviews.length > 0 && (
          <div className="flex items-center space-x-4 mb-6">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review: Review) => (
          <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">
                    {review.customerName.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{review.customerName}</span>
                    {review.verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {renderStars(review.rating)}
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{review.comment}</p>

            {review.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {review.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Review image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Review Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Write a Review</h3>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  {renderStars(newReview.rating, true, (rating) => 
                    setNewReview(prev => ({ ...prev, rating }))
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review
                  </label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                    placeholder="Share your experience..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Camera className="w-4 h-4 inline mr-1" />
                    Photos (optional)
                  </label>
                  <div className="space-y-2">
                    {newReview.images.map((image, index) => (
                      <input
                        key={index}
                        type="url"
                        value={image}
                        onChange={(e) => updateImage(index, e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ))}
                    <button
                      type="button"
                      onClick={addImageField}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      + Add another photo
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSystem;