import React, { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, Calendar, CheckCircle, Clock, AlertCircle, 
  TrendingUp, Receipt, ChevronRight, Loader, Info, ExternalLink,
  Wallet, Building2, XCircle, Eye, FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import adminApi from '../utils/api';

// Custom Payment Method Icons
const PaymentMethodIcon = ({ type, className }) => {
  switch (type) {
    case 'visa':
      return (
        <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="32" rx="4" fill="#1A1F71"/>
          <path d="M20.5 11h-3.2l-2 10h3.2l2-10zm9.3 6.5l1.7-4.7 1 4.7h-2.7zm3.6 3.5h2.9l-2.5-10h-2.7c-.6 0-1.1.4-1.3.9l-4.6 9.1h3.4l.7-1.9h4.2l.4 1.9zm-8.9-3.3c0-2.6-3.6-2.8-3.6-4 0-.4.4-.8 1.2-.9.4 0 1.6-.1 2.9.5l.5-2.4c-.7-.3-1.7-.5-2.8-.5-3 0-5.1 1.6-5.1 3.8 0 1.7 1.5 2.6 2.6 3.1 1.2.6 1.6.9 1.6 1.4 0 .8-.9 1.1-1.8 1.1-1.5 0-2.3-.2-3.5-.8l-.5 2.5c.8.4 2.3.7 3.8.7 3.2.1 5.3-1.5 5.3-3.9z" fill="white"/>
        </svg>
      );
    case 'mastercard':
      return (
        <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="32" rx="4" fill="#000000"/>
          <circle cx="18" cy="16" r="8" fill="#EB001B"/>
          <circle cx="30" cy="16" r="8" fill="#F79E1B"/>
          <path d="M24 9.6c1.3 1.2 2.1 2.9 2.1 4.8 0 1.9-.8 3.6-2.1 4.8-1.3-1.2-2.1-2.9-2.1-4.8 0-1.9.8-3.6 2.1-4.8z" fill="#FF5F00"/>
          <path d="M24 19.2c-1.3 1.2-2.1 2.9-2.1 4.8H18c0-2.4 1-4.5 2.6-6 1.6 1.5 2.6 3.6 2.6 6h-3.9c0-1.9-.8-3.6-2.1-4.8z" fill="#FF5F00" opacity="0"/>
        </svg>
      );
    case 'stripe':
      return (
        <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="32" rx="4" fill="#635BFF"/>
          <path d="M15 16c0-.9.7-1.3 1.8-1.3 1.6 0 3.6.5 5.2 1.4v-5c-1.8-.7-3.5-1-5.2-1-4.2 0-7 2.2-7 5.9 0 5.8 8 4.9 8 7.4 0 1-.8 1.3-2 1.3-1.7 0-3.9-.7-5.6-1.7v5.1c2 .9 4 1.3 5.6 1.3 4.3 0 7.3-2.1 7.3-5.9 0-6.3-8.1-5.1-8.1-7.5z" fill="white"/>
        </svg>
      );
    case 'paypal':
      return (
        <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="32" rx="4" fill="#003087"/>
          <path d="M18.5 9h-4.8c-.3 0-.6.3-.7.6l-2 12.8c0 .2.1.4.4.4h2.4c.3 0 .6-.3.7-.6l.5-3.4c.1-.4.4-.6.7-.6h1.7c3.4 0 5.4-1.7 5.9-5 .2-1.4 0-2.6-.7-3.4-.8-.9-2.2-1.4-4.1-1.4zm.6 4.9c-.3 1.8-1.6 1.8-2.9 1.8h-.7l.5-3.2c0-.2.2-.4.4-.4h.3c.9 0 1.7 0 2.1.5.3.3.4.8.3 1.3z" fill="#009CDE"/>
          <path d="M30.5 13.8h-2.4c-.2 0-.4.2-.4.4l-.1.6-.2-.3c-.5-.7-1.7-1-2.8-1-2.7 0-5 2-5.4 4.9-.2 1.4.1 2.8 1 3.7.8.8 1.9 1.2 3.2 1.2 2.2 0 3.5-1.4 3.5-1.4l-.1.6c0 .2.1.4.4.4h2.2c.3 0 .6-.3.7-.6l1.2-7.9c0-.2-.1-.4-.4-.4zm-3.4 4.9c-.2 1.4-1.3 2.3-2.7 2.3-.7 0-1.3-.2-1.6-.6-.4-.4-.5-1-.4-1.6.2-1.4 1.3-2.4 2.7-2.4.7 0 1.2.2 1.6.6.4.5.5 1.1.4 1.7z" fill="#009CDE"/>
        </svg>
      );
    case 'cash':
      return (
        <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="32" rx="4" fill="#10B981"/>
          <circle cx="24" cy="16" r="8" stroke="white" strokeWidth="2" fill="none"/>
          <path d="M24 12v8M20 16h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    default:
      return <CreditCard className={className} />;
  }
};


// Initialize Stripe - Make sure the key is loaded correctly
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Validate and load Stripe
const isValidStripeKey = stripePublishableKey && 
                         stripePublishableKey.startsWith('pk_') && 
                         stripePublishableKey.length > 50 &&
                         !stripePublishableKey.includes('your_stripe_publishable_key_here');

// Load Stripe - Only if we have a valid key
const stripePromise = isValidStripeKey ? loadStripe(stripePublishableKey) : null;

// Only log warnings in development
if (import.meta.env.DEV && !isValidStripeKey) {
  console.warn('⚠️ Stripe not configured properly. Add your Stripe key to .env.local file');
}

const PaymentForm = ({ amount, onSuccess, onCancel, paymentMethod }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [country, setCountry] = useState('US');
  
  // Convert amount to number to ensure it's valid
  const paymentAmount = Number(amount || 0);

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'IN', name: 'India' },
    { code: 'SG', name: 'Singapore' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'LK', name: 'Sri Lanka' },
  ];

  const handleStripePayment = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast.error('Stripe is not loaded. Please refresh the page or restart the server.');
      console.error('Stripe not initialized. Check if VITE_STRIPE_PUBLISHABLE_KEY is set correctly.');
      return;
    }

    if (!cardholderName.trim()) {
      toast.error('Please enter cardholder name');
      return;
    }

    try {
      setProcessing(true);

      // Create payment intent
      const response = await adminApi.post('/admin/commission-payments/create-intent', {
        amount: paymentAmount,
        paymentMethod: paymentMethod
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create payment intent');
      }

      const { clientSecret } = response.data;

      // Confirm card payment with billing details
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: cardholderName,
            address: {
              country: country
            }
          }
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Submit payment record
        await adminApi.post('/admin/commission-payments', {
          amount: paymentAmount,
          paymentMethod: paymentMethod,
          stripePaymentIntentId: paymentIntent.id,
          stripeTransactionId: paymentIntent.id
        });

        toast.success('Payment successful!');
        onSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleCashPayment = async (e) => {
    e.preventDefault();
    
    try {
      setProcessing(true);

      await adminApi.post('/admin/commission-payments', {
        amount: paymentAmount,
        paymentMethod: 'cash',
        notes: 'Cash payment - awaiting verification'
      });

      toast.success('Cash payment recorded! Awaiting super admin verification.');
      onSuccess();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayPalPayment = async (e) => {
    e.preventDefault();
    
    if (!paypalEmail || !paypalEmail.includes('@')) {
      toast.error('Please enter a valid PayPal email');
      return;
    }

    try {
      setProcessing(true);

      // In production, integrate with PayPal SDK
      // For now, record as pending verification
      await adminApi.post('/admin/commission-payments', {
        amount: paymentAmount,
        paymentMethod: 'paypal',
        notes: `PayPal payment from ${paypalEmail} - awaiting verification`
      });

      toast.success('PayPal payment recorded! Awaiting verification.');
      onSuccess();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setProcessing(false);
    }
  };

  if (paymentMethod === 'cash') {
    return (
      <form onSubmit={handleCashPayment} className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">Cash Payment Instructions</h4>
              <p className="text-sm text-yellow-700">
                Please visit the super admin office to make your cash payment. After recording this payment,
                it will be marked as "Pending Verification" until the super admin confirms receipt.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Payment Amount:</span>
            <span className="text-2xl font-bold text-gray-900">${paymentAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={processing}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                Record Cash Payment
              </>
            )}
          </button>
        </div>
      </form>
    );
  }

  if (paymentMethod === 'paypal') {
    return (
      <form onSubmit={handlePayPalPayment} className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Wallet className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">PayPal Payment</h4>
              <p className="text-sm text-blue-700">
                Enter your PayPal email address. You'll be redirected to PayPal to complete the payment.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PayPal Email Address
          </label>
          <input
            type="email"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
            placeholder="your-email@example.com"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Payment Amount:</span>
            <span className="text-2xl font-bold text-gray-900">${paymentAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={processing}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                Pay with PayPal
              </>
            )}
          </button>
        </div>
      </form>
    );
  }

  // Stripe payment (Visa/Mastercard/Credit Card)
  return (
    <form onSubmit={handleStripePayment} className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full border-2 border-gray-400"></div>
          <CreditCard className="w-5 h-5 text-gray-700" />
          <span className="font-medium text-gray-700">Card</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Card information
        </label>
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1f2937',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  '::placeholder': {
                    color: '#9ca3af',
                  },
                  padding: '12px',
                },
                invalid: {
                  color: '#ef4444',
                },
              },
            }}
            className="p-3"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Cardholder name
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Full name on card"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Country or region
        </label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Payment Amount:</span>
          <span className="text-xl font-bold text-gray-900">${paymentAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {processing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Pay ${paymentAmount.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const Payments = () => {
  const [commissionData, setCommissionData] = useState({
    totalDue: 0,
    nextDueDate: null,
    lifetimeSales: 0,
    commissionRate: 10
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const paymentMethods = [
    {
      id: 'visa',
      name: 'Visa',
      description: 'Pay securely with Visa card',
      color: 'blue',
      instant: true
    },
    {
      id: 'mastercard',
      name: 'Mastercard',
      description: 'Pay securely with Mastercard',
      color: 'orange',
      instant: true
    },
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      description: 'Pay with any card via Stripe',
      color: 'purple',
      instant: true
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      color: 'blue',
      instant: false
    },
    {
      id: 'cash',
      name: 'Cash Payment',
      description: 'Pay in cash at office',
      color: 'green',
      instant: false
    }
  ];

  useEffect(() => {
    fetchCommissionData();
    fetchPaymentHistory();
  }, []);

  const fetchCommissionData = async () => {
    try {
      const response = await adminApi.get('/admin/commission-status');
      if (response.success) {
        setCommissionData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch commission data:', error);
      toast.error('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const response = await adminApi.get('/admin/commission-payments/history');
      if (response.success) {
        setPaymentHistory(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
    }
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedPaymentMethod(null);
    fetchCommissionData();
    fetchPaymentHistory();
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      verified: 'bg-green-100 text-green-800',
      paid: 'bg-blue-100 text-blue-800',
      pending_verification: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending_verification;
  };

  const getStatusIcon = (status) => {
    const icons = {
      verified: <CheckCircle className="w-4 h-4" />,
      paid: <CheckCircle className="w-4 h-4" />,
      pending_verification: <Clock className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />
    };
    return icons[status] || icons.pending_verification;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commission Payments</h1>
          <p className="text-gray-600 mt-2">Manage your commission payments to BloomGrad</p>
        </div>

        {/* Commission Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Amount Due</p>
                <p className="text-4xl font-bold mt-2">${Number(commissionData.totalDue || 0).toFixed(2)}</p>
                {commissionData.nextDueDate && (
                  <div className="flex items-center gap-1 mt-3 text-red-100 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {new Date(commissionData.nextDueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <AlertCircle className="w-12 h-12 text-red-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Lifetime Sales</p>
                <p className="text-4xl font-bold mt-2">${Number(commissionData.lifetimeSales || 0).toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-3 text-blue-100 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>Total revenue generated</span>
                </div>
              </div>
              <DollarSign className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Commission Rate</p>
                <p className="text-4xl font-bold mt-2">{commissionData.commissionRate || 10}%</p>
                <div className="flex items-center gap-1 mt-3 text-purple-100 text-sm">
                  <Receipt className="w-4 h-4" />
                  <span>Per order completed</span>
                </div>
              </div>
              <Building2 className="w-12 h-12 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        {Number(commissionData.totalDue || 0) > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Make a Payment</h2>
              <p className="text-gray-600">Choose your preferred payment method</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handlePaymentMethodSelect(method.id)}
                  className="relative p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group text-left bg-white"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-11 mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <PaymentMethodIcon type={method.id} className="w-full h-full" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{method.name}</h3>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{method.description}</p>
                    {method.instant && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Instant
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
            <p className="text-gray-600 mt-1">View all your commission payments</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentHistory.length > 0 ? (
                  paymentHistory.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(payment.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">${parseFloat(payment.amount).toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 capitalize">{payment.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 font-mono">
                          {payment.stripeTransactionId || payment.stripePaymentIntentId || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          {payment.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <FileText className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-lg font-medium">No payment history</p>
                        <p className="text-sm mt-2">Your payments will appear here</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPaymentMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Complete Payment</h3>
            {!stripePromise ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-800 mb-1">Stripe Not Configured</h4>
                    <p className="text-sm text-red-700 mb-3">
                      The Stripe payment gateway is not properly configured. Please restart the dev server.
                    </p>
                    <button
                      onClick={() => {
                        setShowPaymentModal(false);
                        setSelectedPaymentMethod(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  amount={commissionData.totalDue}
                  paymentMethod={selectedPaymentMethod}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => {
                    setShowPaymentModal(false);
                    setSelectedPaymentMethod(null);
                  }}
                />
              </Elements>
            )}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-gray-900">Payment Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment ID</label>
                  <p className="text-sm font-mono text-gray-900">{selectedPayment.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedPayment.status)}`}>
                      {getStatusIcon(selectedPayment.status)}
                      {selectedPayment.status.replace('_', ' ')}
                    </span>
                  </p>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Amount</label>
                    <p className="text-2xl font-bold text-blue-600">${parseFloat(selectedPayment.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Payment Method</label>
                    <p className="font-medium capitalize">{selectedPayment.paymentMethod}</p>
                  </div>
                  {selectedPayment.stripeTransactionId && (
                    <div className="col-span-2">
                      <label className="text-sm text-gray-500">Transaction ID</label>
                      <p className="font-mono text-sm text-gray-900">{selectedPayment.stripeTransactionId}</p>
                    </div>
                  )}
                  {selectedPayment.receiptUrl && (
                    <div className="col-span-2">
                      <label className="text-sm text-gray-500">Receipt</label>
                      <a href={selectedPayment.receiptUrl} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" />
                        View Receipt
                      </a>
                    </div>
                  )}
                </div>
              </div>
              {selectedPayment.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedPayment.notes}</p>
                </div>
              )}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-500">Created At</label>
                    <p className="font-medium">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                  </div>
                  {selectedPayment.verifiedAt && (
                    <div>
                      <label className="text-gray-500">Verified At</label>
                      <p className="font-medium">{new Date(selectedPayment.verifiedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
