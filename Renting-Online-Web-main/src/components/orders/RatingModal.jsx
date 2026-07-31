import React, { useState, useEffect } from 'react';

const RatingModal = ({ isOpen, onClose, onSubmit, orderNumber, existingRating = null }) => {
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingRating?.comment || '');

  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setComment(existingRating.comment);
    } else {
      setRating(0);
      setComment('');
    }
  }, [existingRating]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    onSubmit({ rating, comment });
    onClose();
  };

  const handleStarClick = (value) => {
    setRating(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-8 transform transition-all">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {existingRating ? 'Edit Your Rating' : 'Rate This Order'}
          </h2>
          <p className="text-gray-600 mt-2">Order #{orderNumber}</p>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-all cursor-pointer hover:scale-110"
            >
              <svg
                className={`w-12 h-12 ${
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                } transition-colors`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  fill={star <= (hoveredRating || rating) ? 'currentColor' : 'none'}
                />
              </svg>
            </button>
          ))}
        </div>

        {/* Rating Text */}
        {/* {rating > 0 && (
          <p className="text-center text-lg font-semibold text-gray-700 mb-4">
            {rating === 1 && '⭐ Poor'}
            {rating === 2 && '⭐⭐ Fair'}
            {rating === 3 && '⭐⭐⭐ Good'}
            {rating === 4 && '⭐⭐⭐⭐ Very Good'}
            {rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
          </p>
        )} */}

        {/* Comment Section */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Add a Review (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this rental..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-full text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 rounded-full font-semibold transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {existingRating ? 'Update Rating' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
