import React, { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, User, RefreshCw, CheckCircle, Clock, XCircle, 
  AlertCircle, Eye, Receipt, Filter, Calendar, TrendingUp, Search
} from 'lucide-react';
import { toast } from 'react-toastify';
import { superAdminAPI } from '../utils/api';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ 
    totalPayments: 0, 
    totalPaid: 0, 
    totalPending: 0, 
    totalRejected: 0 
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    adminId: '',
    status: '',
    paymentMethod: '',
    startDate: '',
    endDate: ''
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [verifyForm, setVerifyForm] = useState({
    status: 'verified',
    notes: ''
  });
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchAdmins();
  }, [filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });
      
      const response = await superAdminAPI.makeRequest('/superadmin/commission-payments', {
        method: 'GET'
      });
      
      if (response.success) {
        let filteredPayments = response.data || [];
        
        // Apply client-side filters
        if (filters.adminId) {
          filteredPayments = filteredPayments.filter(p => p.adminId === filters.adminId);
        }
        if (filters.status) {
          filteredPayments = filteredPayments.filter(p => p.status === filters.status);
        }
        if (filters.paymentMethod) {
          filteredPayments = filteredPayments.filter(p => p.paymentMethod === filters.paymentMethod);
        }
        if (filters.startDate) {
          filteredPayments = filteredPayments.filter(p => 
            new Date(p.createdAt) >= new Date(filters.startDate)
          );
        }
        if (filters.endDate) {
          filteredPayments = filteredPayments.filter(p => 
            new Date(p.createdAt) <= new Date(filters.endDate)
          );
        }
        
        setPayments(filteredPayments);
        
        // Calculate summary
        const totalPayments = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const totalPaid = filteredPayments.filter(p => p.status === 'verified' || p.status === 'paid')
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const totalPending = filteredPayments.filter(p => p.status === 'pending_verification')
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const totalRejected = filteredPayments.filter(p => p.status === 'rejected')
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        
        setSummary({ totalPayments, totalPaid, totalPending, totalRejected });
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await superAdminAPI.getAllAdmins();
      if (response.success) setAdmins(response.data.admins || []);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const handleVerifyPayment = async () => {
    try {
      if (!selectedPayment) return;
      
      const response = await superAdminAPI.makeRequest(
        `/superadmin/commission-payments/${selectedPayment.id}/verify`,
        {
          method: 'PUT',
          body: JSON.stringify(verifyForm)
        }
      );
      
      if (response.success) {
        toast.success('Payment status updated successfully');
        setShowVerifyModal(false);
        setSelectedPayment(null);
        fetchPayments();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update payment status');
    }
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const openVerifyModal = (payment) => {
    setSelectedPayment(payment);
    setVerifyForm({
      status: payment.status === 'pending_verification' ? 'verified' : payment.status,
      notes: payment.notes || ''
    });
    setShowVerifyModal(true);
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

  const getPaymentMethodIcon = (method) => {
    const icons = {
      cash: <DollarSign className="w-4 h-4" />,
      mastercard: <CreditCard className="w-4 h-4" />,
      visa: <CreditCard className="w-4 h-4" />,
      stripe: <CreditCard className="w-4 h-4" />
    };
    return icons[method] || <CreditCard className="w-4 h-4" />;
  };

  const filteredPaymentsBySearch = payments.filter(payment => {
    if (!searchTerm) return true;
    const admin = admins.find(a => a.id === payment.adminId);
    const adminName = admin?.name || '';
    const adminEmail = admin?.email || '';
    return (
      adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.stripeTransactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.stripePaymentIntentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Commission Payments</h1>
            <p className="text-gray-600 mt-2">Track and verify admin commission payments</p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Payments</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">${summary.totalPayments.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{payments.length} transactions</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Verified/Paid</h3>
                <p className="text-2xl font-bold text-green-600 mt-2">${summary.totalPaid.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {payments.filter(p => p.status === 'verified' || p.status === 'paid').length} payments
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Pending</h3>
                <p className="text-2xl font-bold text-yellow-600 mt-2">${summary.totalPending.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {payments.filter(p => p.status === 'pending_verification').length} pending
                </p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Rejected</h3>
                <p className="text-2xl font-bold text-red-600 mt-2">${summary.totalRejected.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {payments.filter(p => p.status === 'rejected').length} rejected
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by admin name, email, or transaction ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <select 
              value={filters.adminId} 
              onChange={(e) => setFilters({ ...filters, adminId: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">All Admins</option>
              {admins.map(admin => 
                <option key={admin.id} value={admin.id}>{admin.name}</option>
              )}
            </select>
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">All Status</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="verified">Verified</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
            <select 
              value={filters.paymentMethod} 
              onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="mastercard">Mastercard</option>
              <option value="visa">Visa</option>
              <option value="stripe">Stripe</option>
            </select>
            <div className="flex gap-2 md:col-span-3 lg:col-span-6">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                placeholder="Start Date"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                placeholder="End Date"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {(filters.startDate || filters.endDate || filters.adminId || filters.status || filters.paymentMethod) && (
                <button
                  onClick={() => setFilters({ adminId: '', status: '', paymentMethod: '', startDate: '', endDate: '' })}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredPaymentsBySearch.length > 0 ? (
                  filteredPaymentsBySearch.map((payment) => {
                    const admin = admins.find(a => a.id === payment.adminId);
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{admin?.name || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{admin?.email || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-purple-600">${parseFloat(payment.amount).toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(payment.paymentMethod)}
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(payment.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleViewDetails(payment)}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 flex items-center gap-1" 
                              title="View Details">
                              <Eye className="w-3 h-3" />
                              View
                            </button>
                            {payment.status === 'pending_verification' && (
                              <button 
                                onClick={() => openVerifyModal(payment)}
                                className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 flex items-center gap-1" 
                                title="Verify Payment">
                                <CheckCircle className="w-3 h-3" />
                                Verify
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Receipt className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-lg font-medium">No payments found</p>
                        <p className="text-sm mt-2">Payments from admins will appear here</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Verify Modal */}
      {showVerifyModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Verify Payment</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Amount:</div>
                  <div className="font-bold text-purple-600">${parseFloat(selectedPayment.amount).toFixed(2)}</div>
                  <div className="text-gray-600">Method:</div>
                  <div className="font-medium capitalize">{selectedPayment.paymentMethod}</div>
                  <div className="text-gray-600">Admin:</div>
                  <div className="font-medium">{admins.find(a => a.id === selectedPayment.adminId)?.name}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select 
                  value={verifyForm.status} 
                  onChange={(e) => setVerifyForm({ ...verifyForm, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="verified">Verified</option>
                  <option value="paid">Paid</option>
                  <option value="rejected">Rejected</option>
                  <option value="pending_verification">Pending Verification</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea 
                  value={verifyForm.notes} 
                  onChange={(e) => setVerifyForm({ ...verifyForm, notes: e.target.value })} 
                  rows="3" 
                  placeholder="Add verification notes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowVerifyModal(false)} 
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                Cancel
              </button>
              <button 
                onClick={handleVerifyPayment} 
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Update Status
              </button>
            </div>
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
            <div className="space-y-6">
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
                <h4 className="font-semibold text-gray-900 mb-3">Admin Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const admin = admins.find(a => a.id === selectedPayment.adminId);
                    return (
                      <>
                        <div><label className="text-sm text-gray-500">Name</label><p className="font-medium">{admin?.name || 'N/A'}</p></div>
                        <div><label className="text-sm text-gray-500">Email</label><p className="font-medium">{admin?.email || 'N/A'}</p></div>
                        <div><label className="text-sm text-gray-500">Phone</label><p className="font-medium">{admin?.phone || 'N/A'}</p></div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Amount</label>
                    <p className="text-2xl font-bold text-purple-600">${parseFloat(selectedPayment.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Payment Method</label>
                    <p className="font-medium capitalize flex items-center gap-2">
                      {getPaymentMethodIcon(selectedPayment.paymentMethod)}
                      {selectedPayment.paymentMethod}
                    </p>
                  </div>
                  {selectedPayment.stripeTransactionId && (
                    <div className="col-span-2">
                      <label className="text-sm text-gray-500">Stripe Transaction ID</label>
                      <p className="font-mono text-sm text-gray-900">{selectedPayment.stripeTransactionId}</p>
                    </div>
                  )}
                  {selectedPayment.stripePaymentIntentId && (
                    <div className="col-span-2">
                      <label className="text-sm text-gray-500">Stripe Payment Intent ID</label>
                      <p className="font-mono text-sm text-gray-900">{selectedPayment.stripePaymentIntentId}</p>
                    </div>
                  )}
                  {selectedPayment.receiptUrl && (
                    <div className="col-span-2">
                      <label className="text-sm text-gray-500">Receipt</label>
                      <a href={selectedPayment.receiptUrl} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <Receipt className="w-4 h-4" />
                        View Receipt
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedPayment.verifiedBy && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Verification Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Verified By</label>
                      <p className="font-medium">{selectedPayment.verifiedBy}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Verified At</label>
                      <p className="font-medium">
                        {selectedPayment.verifiedAt ? new Date(selectedPayment.verifiedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedPayment.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedPayment.notes}</p>
                </div>
              )}
              
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Timestamps</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-500">Created At</label>
                    <p className="font-medium">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-gray-500">Updated At</label>
                    <p className="font-medium">{new Date(selectedPayment.updatedAt).toLocaleString()}</p>
                  </div>
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
