import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { FiX, FiStar, FiSend, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import apiService from '../services/api';

const FeedbackModal = ({ isOpen, onClose, order, productId }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [eligibilityMessage, setEligibilityMessage] = useState('');
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  // Find the specific product from the order items
  // Order items have: productId, name, price, quantity, image
  const product = order?.items?.find(item => item.productId === productId);

  // Check feedback eligibility when modal opens
  useEffect(() => {
    const checkEligibility = async () => {
      // Return early if modal is not open
      if (!isOpen) {
        return;
      }

      // If order data is not available yet, keep checking state true
      if (!order) {
        setCheckingEligibility(true);
        setIsEligible(false);
        return;
      }

      const orderId = order?.id || order?._id;
      
      console.log('🔍 FeedbackModal Debug:', {
        isOpen,
        hasOrder: !!order,
        orderId,
        orderStatus: order?.orderStatus,
        productId,
        fullOrder: order
      });
      
      if (!orderId) {
        console.log('❌ Eligibility check failed: Missing order ID');
        setCheckingEligibility(false);
        setIsEligible(false);
        setEligibilityMessage('Order information is incomplete.');
        return;
      }

      try {
        setCheckingEligibility(true);
        
        console.log('✅ Order status:', order?.orderStatus);
        
        // Simple check: if order is delivered, allow feedback
        if (order?.orderStatus?.toLowerCase() === 'delivered') {
          console.log('✅ Order is delivered - allowing feedback');
          setIsEligible(true);
          setEligibilityMessage('');
          setCheckingEligibility(false);
          return;
        }
        
        console.log('⚠️ Order not delivered, checking via API...');
        // If not delivered, check via API for detailed status
        const response = await apiService.checkFeedbackEligibility(orderId);
        
        // Backend returns response.data.canSubmit
        if (response.data?.canSubmit || response.success) {
          setIsEligible(true);
          setEligibilityMessage('');
        } else {
          setIsEligible(false);
          // Provide more specific error message based on order status
          const data = response.data || {};
          let message = 'You are not eligible to submit feedback for this order.';
          
          if (data.orderStatus !== 'delivered') {
            message = `Feedback can only be submitted for delivered orders. Current status: ${data.orderStatus || 'pending'}`;
          } else if (data.feedbackSubmitted) {
            message = 'You have already submitted feedback for this order.';
          }
          
          setEligibilityMessage(message);
        }
      } catch (error) {
        console.error('Error checking eligibility:', error);
        // For delivered orders, allow submission even if check fails
        if (order?.orderStatus?.toLowerCase() === 'delivered') {
          setIsEligible(true);
          setEligibilityMessage('');
        } else {
          setIsEligible(false);
          setEligibilityMessage(error.response?.data?.message || 'Feedback can only be submitted for delivered orders.');
        }
      } finally {
        setCheckingEligibility(false);
      }
    };

    checkEligibility();
  }, [isOpen, order, productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating) {
      toast.error('Please select a rating', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a review', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (comment.trim().length < 10) {
      toast.error('Review must be at least 10 characters long', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // Validate order and product data
    const orderId = order?.id || order?._id;
    if (!orderId) {
      toast.error('Order information is missing. Please try again.', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (!productId) {
      toast.error('Product information is missing. Please try again.', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      console.log('Submitting feedback with data:', {
        orderId: orderId,
        productId: productId,
        rating: rating,
        comment: comment.trim()
      });
      
      await apiService.submitFeedback({
        orderId: orderId,
        productId: productId,
        rating: rating,
        comment: comment.trim()
      });

      toast.success('Thank you for your feedback!', {
        position: "top-right",
        autoClose: 3000,
        icon: <FiCheck className="text-green-500" />
      });

      // Reset form and close modal
      setRating(0);
      setComment('');
      onClose();
      
      // Optionally refresh the page or update order status
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error.response?.data?.message || 'Failed to submit feedback. Please try again.', {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  // Don't render if modal is not open or order is null
  if (!isOpen || !order) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
          >
            <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <FiStar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Write a Review</h2>
                    <p className="text-purple-100 text-sm">Share your experience</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {checkingEligibility ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking eligibility...</p>
                  </div>
                ) : !isEligible ? (
                  <div className="text-center py-8">
                    <FiAlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium mb-2">Cannot Submit Feedback</p>
                    <p className="text-gray-600 text-sm">{eligibilityMessage}</p>
                    <button
                      onClick={handleClose}
                      className="mt-4 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Product Info */}
                    {product && (
                      <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
                        <img
                          src={product.image || '/assets/images/placeholder.jpg'}
                          alt={product.name || 'Product'}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 line-clamp-2">
                            {product.name || 'Product'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Order #{order.orderNumber}
                          </p>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit}>
                      {/* Rating */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Rate this product *
                        </label>
                        <div className="flex items-center space-x-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onMouseEnter={() => setHoveredRating(star)}
                              onMouseLeave={() => setHoveredRating(0)}
                              onClick={() => setRating(star)}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <FiStar
                                className={`w-8 h-8 ${
                                  star <= (hoveredRating || rating)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                          {rating > 0 && (
                            <span className="ml-3 text-sm font-medium text-gray-700">
                              {rating === 1 && 'Poor'}
                              {rating === 2 && 'Fair'}
                              {rating === 3 && 'Good'}
                              {rating === 4 && 'Very Good'}
                              {rating === 5 && 'Excellent'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Comment */}
                      <div className="mb-6">
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                          Your Review *
                        </label>
                        <textarea
                          id="comment"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={4}
                          placeholder="Tell us about your experience with this product..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          maxLength={500}
                        />
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-gray-500">Minimum 10 characters</p>
                          <p className="text-xs text-gray-500">{comment.length}/500</p>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={handleClose}
                          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <FiSend className="w-4 h-4" />
                              <span>Submit Review</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal;
