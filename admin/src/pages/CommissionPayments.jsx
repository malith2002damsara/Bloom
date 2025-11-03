import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiCalendar, FiCheck, FiClock, FiX, FiRefreshCw, FiFileText } from 'react-icons/fi';
import axios from 'axios';

const CommissionPayments = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending_verification, paid, verified, rejected
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [page, filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const params = new URLSearchParams({
        page,
        limit: 10
      });

      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/commission/history?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setPayments(response.data.data.payments);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/commission/stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending_verification': {
        icon: <FiClock className="w-4 h-4" />,
        text: 'Pending',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      'paid': {
        icon: <FiCheck className="w-4 h-4" />,
        text: 'Paid',
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      'verified': {
        icon: <FiCheck className="w-4 h-4" />,
        text: 'Verified',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      'rejected': {
        icon: <FiX className="w-4 h-4" />,
        text: 'Rejected',
        className: 'bg-red-100 text-red-800 border-red-200'
      }
    };

    const badge = badges[status] || badges['pending_verification'];

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold border ${badge.className}`}>
        {badge.icon}
        <span>{badge.text}</span>
      </span>
    );
  };

  const getPaymentMethodBadge = (method) => {
    const badges = {
      'cash': {
        text: 'Cash',
        className: 'bg-green-100 text-green-800'
      },
      'stripe': {
        text: 'Credit Card',
        className: 'bg-blue-100 text-blue-800'
      },
      'mastercard': {
        text: 'Mastercard',
        className: 'bg-orange-100 text-orange-800'
      },
      'visa': {
        text: 'Visa',
        className: 'bg-indigo-100 text-indigo-800'
      }
    };

    const badge = badges[method] || { text: method, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            Commission Payment History
          </h1>
          <p className="text-gray-600">Track all your commission payments and their status</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Paid</h3>
                <FiDollarSign className="text-green-500" size={24} />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                Rs. {stats.totalPaid.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{stats.paymentCount} payments</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Pending Verification</h3>
                <FiClock className="text-yellow-500" size={24} />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                Rs. {stats.pendingVerification.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Verified</h3>
                <FiCheck className="text-blue-500" size={24} />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                Rs. {stats.verified.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Average Payment</h3>
                <FiFileText className="text-purple-500" size={24} />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                Rs. {stats.averagePayment.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Payments</option>
              <option value="pending_verification">Pending</option>
              <option value="paid">Paid</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <button
            onClick={() => {
              fetchPayments();
              fetchStats();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FiRefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center">
              <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payments Found</h3>
              <p className="text-gray-600">You haven't made any commission payments yet.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2 text-sm text-gray-900">
                            <FiCalendar className="text-gray-400" size={16} />
                            <span>{formatDate(payment.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            Rs. {payment.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPaymentMethodBadge(payment.paymentMethod)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.stripeTransactionId ? (
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {payment.stripeTransactionId.substring(0, 20)}...
                            </code>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                  <div className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                    <span className="font-medium">{pagination.pages}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.pages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommissionPayments;
