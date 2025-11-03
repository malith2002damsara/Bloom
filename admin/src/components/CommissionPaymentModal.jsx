import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Check, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

// Only initialize Stripe if the key is available
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey && stripePublishableKey !== 'pk_test_your_stripe_publishable_key_here' 
  ? loadStripe(stripePublishableKey) 
  : null;

const PaymentForm = ({ amount, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      
      // Create payment intent
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/commission/create-payment-intent`,
        { amount },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const { clientSecret, paymentIntentId } = data;

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setError(result.error.message);
        setProcessing(false);
      } else {
        // Payment successful, confirm with backend
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/admin/commission/confirm-stripe-payment`,
          {
            paymentIntentId,
            amount
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="border border-gray-300 rounded-lg p-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CreditCard size={20} />
              <span>Pay Rs. {amount.toFixed(2)}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const CommissionPaymentModal = ({ isOpen, onClose, pendingAmount, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState(null); // null, 'cash', 'card'
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setPaymentMethod(null);
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const handleCashPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/commission/pay-with-cash`,
        {
          amount: pendingAmount,
          notes: 'Cash payment submitted for verification'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onPaymentSuccess();
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Cash payment error:', err);
      setError(err.response?.data?.message || 'Failed to submit cash payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPaymentSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      onPaymentSuccess();
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Pay Commission</h2>
              <p className="text-purple-100 text-sm">Choose payment method</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Payment Submitted!
              </h3>
              <p className="text-gray-600">
                {paymentMethod === 'cash' 
                  ? 'Your cash payment is pending verification by the super admin.'
                  : 'Your payment was successful!'}
              </p>
            </div>
          ) : (
            <>
              {/* Amount Display */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6 border border-purple-100">
                <p className="text-sm text-gray-600 mb-1">Amount Due</p>
                <p className="text-3xl font-bold text-purple-600">
                  Rs. {pendingAmount.toFixed(2)}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start space-x-2">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {!paymentMethod ? (
                <>
                  <p className="text-gray-700 mb-4">
                    Select your preferred payment method:
                  </p>

                  <div className="space-y-3">
                    {/* Cash Payment Button */}
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      disabled={loading}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                            <DollarSign className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Cash Payment</h4>
                            <p className="text-sm text-gray-600">Pending verification</p>
                          </div>
                        </div>
                        <div className="text-gray-400 group-hover:text-purple-600 transition-colors">
                          →
                        </div>
                      </div>
                    </button>

                    {/* Card Payment Button */}
                    <button
                      onClick={() => setPaymentMethod('card')}
                      disabled={loading}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <CreditCard className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Credit/Debit Card</h4>
                            <p className="text-sm text-gray-600">Instant payment via Stripe</p>
                          </div>
                        </div>
                        <div className="text-gray-400 group-hover:text-purple-600 transition-colors">
                          →
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              ) : paymentMethod === 'cash' ? (
                <div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Cash payments require manual verification by the super admin. Your account will remain active pending verification.
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod(null)}
                      disabled={loading}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCashPayment}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Check size={20} />
                          <span>Confirm Cash Payment</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                stripePromise ? (
                  <Elements stripe={stripePromise}>
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod(null)}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        ← Back to payment methods
                      </button>
                    </div>
                    <PaymentForm
                      amount={pendingAmount}
                      onSuccess={handleCardPaymentSuccess}
                      onCancel={() => setPaymentMethod(null)}
                    />
                  </Elements>
                ) : (
                  <div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                          <p className="text-sm font-medium text-red-800 mb-1">Stripe Not Configured</p>
                          <p className="text-sm text-red-700">
                            Card payments are currently unavailable. Please contact the administrator or use cash payment.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod(null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      ← Back to payment methods
                    </button>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommissionPaymentModal;
