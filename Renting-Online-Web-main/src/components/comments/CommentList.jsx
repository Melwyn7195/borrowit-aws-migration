// import React, { useState, useMemo } from 'react';
// import CommentCard from './CommentCard';

// const CommentList = ({ comments = [], totalReviews = 0 }) => {
//   const [sortBy, setSortBy] = useState('latest');
//   const [showAll, setShowAll] = useState(false);
//   const [selectedRating, setSelectedRating] = useState(null);

//   // Calculate rating distribution
//   const ratingDistribution = useMemo(() => {
//     const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
//     comments.forEach(comment => {
//       const rating = Math.floor(comment.rating);
//       if (distribution[rating] !== undefined) {
//         distribution[rating]++;
//       }
//     });
//     return distribution;
//   }, [comments]);

//   const totalComments = comments.length;
//   const averageRating = useMemo(() => {
//     if (totalComments === 0) return 0;
//     const sum = comments.reduce((acc, comment) => acc + comment.rating, 0);
//     return (sum / totalComments).toFixed(1);
//   }, [comments, totalComments]);

//   // Filter comments by selected rating
//   const filteredComments = useMemo(() => {
//     if (selectedRating === null) return comments;
//     return comments.filter(comment => Math.floor(comment.rating) === selectedRating);
//   }, [comments, selectedRating]);

//   // Sort comments
//   const sortedComments = useMemo(() => {
//     const sorted = [...filteredComments];
//     switch (sortBy) {
//       case 'oldest':
//         return sorted.reverse();
//       case 'highest':
//         return sorted.sort((a, b) => b.rating - a.rating);
//       case 'lowest':
//         return sorted.sort((a, b) => a.rating - b.rating);
//       default: // 'latest'
//         return sorted;
//     }
//   }, [filteredComments, sortBy]);

//   // Show only 2 comments initially
//   const displayedComments = showAll ? sortedComments : sortedComments.slice(0, 2);
//   const hasMoreComments = sortedComments.length > 2;

//   return (
//     <div className="max-w-7xl mx-auto">
//       <div className="flex flex-col lg:flex-row gap-6">
//         {/* Rating Distribution Sidebar */}
//         <div className="lg:w-80 flex-shrink-0">
//           <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
//             <h3 className="text-xl font-bold text-gray-900 mb-4">Rating Overview</h3>
            
//             {/* Average Rating */}
//             <div className="text-center mb-6 pb-6 border-b">
//               <div className="text-5xl font-bold text-gray-900 mb-2">{averageRating}</div>
//               <div className="flex justify-center mb-2">
//                 {[...Array(5)].map((_, i) => (
//                   <svg 
//                     key={i} 
//                     className={`w-6 h-6 ${i < Math.floor(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`} 
//                     fill="currentColor" 
//                     viewBox="0 0 20 20"
//                   >
//                     <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//                   </svg>
//                 ))}
//               </div>
//               <p className="text-gray-600 text-sm">{totalComments} reviews</p>
//             </div>

//             {/* Rating Breakdown */}
//             <div className="space-y-3">
//               {[5, 4, 3, 2, 1].map(rating => {
//                 const count = ratingDistribution[rating];
//                 const percentage = totalComments > 0 ? (count / totalComments) * 100 : 0;
//                 const isSelected = selectedRating === rating;
                
//                 return (
//                   <button
//                     key={rating}
//                     onClick={() => setSelectedRating(isSelected ? null : rating)}
//                     className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
//                       isSelected ? 'bg-yellow-50 border border-yellow-300' : 'hover:bg-gray-50'
//                     }`}
//                   >
//                     <div className="flex items-center gap-1 w-12">
//                       <span className="font-semibold text-gray-700">{rating}</span>
//                       <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
//                         <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//                       </svg>
//                     </div>
//                     <div className="flex-1">
//                       <div className="w-full bg-gray-200 rounded-full h-2">
//                         <div 
//                           className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
//                           style={{ width: `${percentage}%` }}
//                         />
//                       </div>
//                     </div>
//                     <span className="text-sm font-semibold text-gray-700 w-8 text-right">{count}</span>
//                   </button>
//                 );
//               })}
//             </div>

//             {/* Clear Filter Button */}
//             {selectedRating !== null && (
//               <button
//                 onClick={() => setSelectedRating(null)}
//                 className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
//               >
//                 Clear Filter
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Reviews List */}
//         <div className="flex-1">
//           {/* Header */}
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center gap-2">
//               <h3 className="text-xl font-bold text-gray-900">
//                 {selectedRating ? `${selectedRating} Star Reviews` : 'All Reviews'}
//               </h3>
//               <span className="text-gray-500">({filteredComments.length})</span>
//             </div>

//             <div className="flex items-center gap-3">
//               {/* Sort Dropdown */}
//               <div className="relative">
//                 <select
//                   value={sortBy}
//                   onChange={(e) => setSortBy(e.target.value)}
//                   className="appearance-none px-4 py-2 pr-10 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
//                 >
//                   <option value="latest">Latest</option>
//                   <option value="oldest">Oldest</option>
//                   <option value="highest">Highest Rating</option>
//                   <option value="lowest">Lowest Rating</option>
//                 </select>
//                 <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//                 </svg>
//               </div>
//             </div>
//           </div>

//           {/* Reviews Grid */}
//           {displayedComments.length > 0 ? (
//             <>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
//                 {displayedComments.map((comment, index) => (
//                   <CommentCard
//                     key={index}
//                     rating={comment.rating}
//                     name={comment.name}
//                     verified={comment.verified}
//                     comment={comment.comment}
//                     date={comment.date}
//                   />
//                 ))}
//               </div>

//               {/* Load More Button */}
//               {hasMoreComments && !showAll && (
//                 <div className="flex justify-center">
//                   <button 
//                     onClick={() => setShowAll(true)}
//                     className="px-12 py-3 border-2 border-gray-200 rounded-full hover:bg-gray-50 transition-colors font-medium"
//                   >
//                     Load More Reviews
//                   </button>
//                 </div>
//               )}
//             </>
//           ) : (
//             <div className="text-center py-12 text-gray-500">
//               No reviews found for this rating.
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CommentList;



// CommentList.jsx

import React, { useState, useMemo } from 'react';
import CommentCard from './CommentCard';

const mapSatisfactionToScore = (satisfaction) => {
    if (!satisfaction) return null;
    const mapping = {
        'loved-it': 5,
        'liked-it': 4,
        'it-was-okay': 3,
        'not-great': 2,
        terrible: 1,
    };
    return mapping[satisfaction] ?? null;
};

// 1. Accept 'reviews' (instead of comments) and 'stats'
// We rename 'comments' to 'reviews' to match the state in ProductDetails
const CommentList = ({ reviews = [], stats = null }) => {
    const [sortBy, setSortBy] = useState('latest');
    const [showAll, setShowAll] = useState(false);
    const [selectedRating, setSelectedRating] = useState(null);

    // 2. REMOVE ALL useMemo calculations for stats.
    // We will get them from the 'stats' prop instead.
    
    // Fallback if stats are not provided
    const safeStats = stats || {
        averageScore: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
    
    // Filter comments by selected rating
    const filteredComments = useMemo(() => {
        if (selectedRating === null) return reviews;
        // Use 'satisfaction_score' from your database model
        return reviews.filter(comment => comment.satisfaction_score === selectedRating);
    }, [reviews, selectedRating]);

    // Sort comments
    const sortedComments = useMemo(() => {
        const sorted = [...filteredComments];
        switch (sortBy) {
            case 'oldest':
                // Use 'submitted_at' from your database model
                return sorted.sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
            case 'highest':
                return sorted.sort((a, b) => b.satisfaction_score - a.satisfaction_score);
            case 'lowest':
                return sorted.sort((a, b) => a.satisfaction_score - b.satisfaction_score);
            default: // 'latest'
                 return sorted.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
        }
    }, [filteredComments, sortBy]);

    // Show only 2 comments initially (this logic is fine)
    const displayedComments = showAll ? sortedComments : sortedComments.slice(0, 2);
    const hasMoreComments = sortedComments.length > 2;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Rating Distribution Sidebar */}
                <div className="lg:w-80 flex-shrink-0">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Rating Overview</h3>
                        
                        {/* 3. Use the 'safeStats' prop for all stats */}
                        <div className="text-center mb-6 pb-6 border-b">
                            <div className="text-5xl font-bold text-gray-900 mb-2">{safeStats.averageScore}</div>
                            <div className="flex justify-center mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <svg 
                                        key={i} 
                                        className={`w-6 h-6 ${i < Math.floor(safeStats.averageScore) ? 'text-yellow-400' : 'text-gray-300'}`} 
                                        fill="currentColor" 
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-gray-600 text-sm">{safeStats.totalReviews} reviews</p>
                        </div>

                        {/* Rating Breakdown */}
                        <div className="space-y-3">
                            {[5, 4, 3, 2, 1].map(rating => {
                                // 4. Use the 'safeStats' prop here
                                const count = safeStats.distribution[rating] || 0;
                                const percentage = safeStats.totalReviews > 0 ? (count / safeStats.totalReviews) * 100 : 0;
                                const isSelected = selectedRating === rating;
                                
                                return (
                                    <button
                                        key={rating}
                                        onClick={() => setSelectedRating(isSelected ? null : rating)}
                                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                                            isSelected ? 'bg-yellow-50 border border-yellow-300' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        {/* ... (rest of the button UI is fine) ... */}
                                        <div className="flex items-center gap-1 w-12">
                                          <span className="font-semibold text-gray-700">{rating}</span>
                                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                        </div>
                                        <div className="flex-1">
                                          <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                              style={{ width: `${percentage}%` }}
                                            />
                                          </div>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 w-8 text-right">{count}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* ... (rest of the component is fine) ... */}
                        {selectedRating !== null && (
                            <button
                                onClick={() => setSelectedRating(null)}
                                className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>
                </div>

                {/* Reviews List */}
                <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-gray-900">
                                {selectedRating ? `${selectedRating} Star Reviews` : 'All Reviews'}
                            </h3>
                            <span className="text-gray-500">({filteredComments.length})</span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Sort Dropdown */}
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none px-4 py-2 pr-10 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                                >
                                    <option value="latest">Latest</option>
                                    <option value="oldest">Oldest</option>
                                    <option value="highest">Highest Rating</option>
                                    <option value="lowest">Lowest Rating</option>
                                </select>
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Reviews Grid */}
                    {displayedComments.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                                {displayedComments.map((comment) => {
                                    const rawScore =
                                        typeof comment.satisfaction_score === 'number'
                                            ? comment.satisfaction_score
                                            : comment.satisfaction_score
                                            ? parseFloat(comment.satisfaction_score)
                                            : comment.satisfactionScore
                                            ? parseFloat(comment.satisfactionScore)
                                            : null;
                                    const ratingValue =
                                        Number.isFinite(rawScore)
                                            ? rawScore
                                            : mapSatisfactionToScore(comment.satisfaction);
                                    return (
                                        <CommentCard
                                            key={comment.review_id} // Use database ID for key
                                            rating={ratingValue}
                                            satisfaction={comment.satisfaction}
                                            name={comment.username} // Use DB field
                                            verified={true} // You'll need to add this to your DB query
                                            comment={comment.highlights} // Use DB field
                                            date={comment.submitted_at} // Use DB field
                                        />
                                    );
                                })}
                            </div>

                            {/* Load More Button */}
                            {hasMoreComments && !showAll && (
                                <div className="flex justify-center">
                                    <button 
                                        onClick={() => setShowAll(true)}
                                        className="px-12 py-3 border-2 border-gray-200 rounded-full hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Load More Reviews
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            {selectedRating ? "No reviews found for this rating." : "No reviews for this product yet."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentList;
