import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';
import { getReviewByOrder } from '../api/reviews';

const satisfactionDetails = {
  'loved-it': { label: 'Loved it', emoji: '\u{1F60D}' },
  'liked-it': { label: 'Liked it', emoji: '\u{1F642}' },
  'it-was-okay': { label: 'It was okay', emoji: '\u{1F610}' },
  'not-great': { label: 'Not great', emoji: '\u{1F641}' },
  terrible: { label: 'Terrible', emoji: '\u{1F62D}' },
};

const defaultExperienceState = {
  fit: false,
  quality: false,
  easeOfUse: false,
  style: false,
  worthThePrice: false,
};

const experienceHighlightLabels = {
  fit: 'Fit and sizing were just right',
  quality: 'Quality matched the listing',
  easeOfUse: 'Easy to use and care for',
  style: 'Felt confident wearing/using it',
  worthThePrice: 'Worth the rental price',
};

const ReviewSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const orderId =
    location.state?.orderId ||
    queryParams.get('orderId') ||
    null;
  const orderNumber =
    location.state?.orderNumber ||
    queryParams.get('orderNumber') ||
    null;
  const productIdFromState =
    location.state?.productId ||
    location.state?.product?.productId ||
    null;

  const [review, setReview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!orderId && !orderNumber) {
      setErrorMessage('Order reference missing. Return to your orders and open the review again.');
      setReview(null);
      return;
    }

    let isCancelled = false;
    const fetchReview = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const lookupKey = orderId || orderNumber;
        const data = await getReviewByOrder(lookupKey);
        if (isCancelled) {
          return;
        }
        setReview({
          ...data,
          experience: {
            ...defaultExperienceState,
            ...(data.experience || {}),
          },
        });
      } catch (error) {
        if (isCancelled) {
          return;
        }
        if (error?.name === 'ApiError' && error.status === 404) {
          setReview(null);
        } else {
          setErrorMessage(error?.message || 'Unable to load your review right now.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchReview();
    return () => {
      isCancelled = true;
    };
  }, [orderId, orderNumber]);

  const selectedHighlights = review
    ? Object.entries(review.experience || {})
        .filter(([, value]) => value)
        .map(([key]) => experienceHighlightLabels[key])
        .filter(Boolean)
    : [];

  const satisfactionDetail = review ? satisfactionDetails[review.satisfaction] : null;
  const submittedDate = review?.submittedAt
    ? new Date(review.submittedAt).toLocaleString()
    : null;
  const photosCount =
    typeof review?.photosCount === 'number'
      ? review.photosCount
      : review?.photos?.length || 0;
  const productId = review?.productId || productIdFromState || null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            &larr; Back
          </button>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-8 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-3">My Review</h1>
              <p className="text-gray-600">
                Review your recent feedback. You can jump back into edit mode at any time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!productId) return;
                navigate(`/review/${productId}`, {
                  state: {
                    allowEdit: true,
                    orderNumber,
                    productId,
                    productName: review?.productName,
                  },
                });
              }}
              className="px-5 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
              disabled={!(orderId || orderNumber) || !productId}
            >
              {review ? 'Edit Review' : 'Write Review'}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {isLoading && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Loading your review...
          </div>
        )}

        {review ? (
          <div className="space-y-6">
            <section className="bg-white shadow-sm rounded-lg p-8">
              <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Post-Rental Feedback Summary
                  </h2>
                  <div className="text-sm text-gray-500 mt-1 space-y-1">
                    {(orderId || orderNumber) && (
                      <p>Order #{orderId || orderNumber}</p>
                    )}
                    {review.productName && <p>Product: {review.productName}</p>}
                    {submittedDate && <p>Submitted on {submittedDate}</p>}
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="border border-gray-100 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Overall Satisfaction
                  </h3>
                  {satisfactionDetail ? (
                    <div className="flex items-center gap-3">
                      <span className="text-3xl leading-none" role="img" aria-label={satisfactionDetail.label}>
                        {satisfactionDetail.emoji}
                      </span>
                      <span className="text-lg text-gray-900">{satisfactionDetail.label}</span>
                    </div>
                  ) : (
                    <p className="text-lg text-gray-900">No rating selected</p>
                  )}
                </div>

                <div className="border border-gray-100 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Highlights
                  </h3>
                  {selectedHighlights.length > 0 ? (
                    <ul className="list-disc list-inside text-gray-800 space-y-1">
                      {selectedHighlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">No specific highlights were selected.</p>
                  )}
                </div>

                <div className="border border-gray-100 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    What You Loved
                  </h3>
                  <p className="text-gray-800 whitespace-pre-line">
                    {review.highlights || 'No highlights shared.'}
                  </p>
                </div>

                <div className="border border-gray-100 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Improvements Suggested
                  </h3>
                  <p className="text-gray-800 whitespace-pre-line">
                    {review.improvements || 'No improvements suggested.'}
                  </p>
                </div>

                <div className="border border-gray-100 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Photos Shared
                  </h3>
                  <p className="text-gray-800">
                    {photosCount > 0
                      ? `You uploaded ${photosCount} photo${photosCount > 1 ? 's' : ''}.`
                      : 'No photos were uploaded with this review.'}
                  </p>
                </div>
              </div>
            </section>
          </div>
        ) : (
          !isLoading && (
            <div className="bg-white shadow-sm rounded-lg p-10 text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                No review found{(orderId || orderNumber) ? ` for Order #${orderId || orderNumber}` : ''}
              </h2>
              <p className="text-gray-600 mb-6">
                Once you submit feedback{(orderId || orderNumber) ? ` for this order` : ''}, we'll save it here so you can review or update it later.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!productId) return;
                  navigate(`/review/${productId}`, {
                    state: {
                      orderId: orderId || undefined,
                      orderNumber: orderNumber || undefined,
                      productId,
                    },
                  });
                }}
                className="px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
                disabled={!(orderNumber || orderId) || !productId}
              >
                Write a Review
              </button>
            </div>
          )
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ReviewSummary;
