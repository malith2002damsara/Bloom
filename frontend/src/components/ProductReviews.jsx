import React, { useState, useEffect } from 'react';
import { FiStar, FiUser, FiMessageCircle } from 'react-icons/fi';
import apiService from '../services/api';

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [topComments, setTopComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'top'
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    fetchReviews();
    fetchTopComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true);
      const response = await apiService.getProductFeedback(productId, {
        page,
        limit: 5
      });

      setReviews(response.data?.feedbacks || []);
      setPagination({
        page: response.data?.pagination?.page || 1,
        limit: response.data?.pagination?.limit || 5,
        totalPages: response.data?.pagination?.pages || 1,
        total: response.data?.pagination?.total || 0
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopComments = async () => {
    try {
      const response = await apiService.getTopComments();
      setTopComments(response.data?.comments || []);
    } catch (error) {
      console.error('Error fetching top comments:', error);
      setTopComments([]);
    }
  };

  const handlePageChange = (newPage) => {
    fetchReviews(newPage);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const ReviewCard = ({ review }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <FiUser className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {review.userId?.name || 'Anonymous User'}
            </p>
            <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
            {review.isVerifiedPurchase && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                ✓ Verified Purchase
              </span>
            )}
          </div>
        </div>
        {renderStars(review.rating)}
      </div>
      
      <p className="text-gray-700 leading-relaxed">{review.comment}</p>
    </div>
  );

  if (loading && reviews.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <FiMessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Customer Reviews</h2>
              <p className="text-sm text-gray-600">{pagination.total} reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex px-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'all'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            All Reviews ({pagination.total})
          </button>
          <button
            onClick={() => setActiveTab('top')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'top'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Top Comments ({topComments.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'all' ? (
          <>
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <FiMessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">No reviews yet</p>
                <p className="text-gray-500 text-sm">Be the first to review this product!</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {reviews.map((review) => (
                    <ReviewCard key={review._id} review={review} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {[...Array(pagination.totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        // Show first, last, current, and adjacent pages
                        if (
                          pageNum === 1 ||
                          pageNum === pagination.totalPages ||
                          (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                pageNum === pagination.page
                                  ? 'bg-purple-600 text-white'
                                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          pageNum === pagination.page - 2 ||
                          pageNum === pagination.page + 2
                        ) {
                          return (
                            <span key={pageNum} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {topComments.length === 0 ? (
              <div className="text-center py-12">
                <FiStar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">No top-rated reviews yet</p>
                <p className="text-gray-500 text-sm">Top comments will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topComments.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
