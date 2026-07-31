import React from 'react';
import StarRating from './StarRating';

const satisfactionToScore = {
  'loved-it': 5,
  'liked-it': 4,
  'it-was-okay': 3,
  'not-great': 2,
  terrible: 1,
};

const CommentCard = ({ 
  rating,
  satisfaction,
  name, 
  verified = false,
  comment,
  date
}) => {
  const ratingValue =
    typeof rating === 'number'
      ? rating
      : satisfactionToScore[satisfaction] || 0;
  const formattedDate = date
    ? new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-7 shadow-md hover:shadow-lg transition-shadow max-w-xl">
      {/* Header with stars and menu */}
      <div className="flex items-start justify-between mb-4">
        <StarRating modeRate={false} displayRate={ratingValue} showRatingText />
        <button className="text-gray-300 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="4" r="1.5"/>
            <circle cx="10" cy="10" r="1.5"/>
            <circle cx="10" cy="16" r="1.5"/>
          </svg>
        </button>
      </div>

      {/* Name with verification badge */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xl font-bold text-gray-900">{name}</h3>
        {verified && (
          <div className="bg-green-500 rounded-full p-1 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        )}
      </div>

      {/* Comment text */}
      <p className="text-gray-600 text-base leading-relaxed mb-5">
        "{comment}"
      </p>

      {/* Date posted */}
      <p className="text-gray-500 text-sm font-medium">
        {formattedDate ? `Posted on ${formattedDate}` : 'Posted'}
      </p>
    </div>
  );
};

export default CommentCard;
