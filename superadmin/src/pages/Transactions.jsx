import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Calendar, User, RefreshCw, CheckCircle, Clock, XCircle, AlertCircle, Eye, CreditCard, FileText, Filter
} from 'lucide-react';
import { toast } from 'react-toastify';
import { superAdminAPI } from '../utils/api';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalCommission: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    type: 'commission',
    paymentStatus: '',
    status: '',
    adminId: '',
    month: '',
    year: new Date().getFullYear().toString()
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentStatus: 'paid',
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    notes: ''
  });
  const [generateForm, setGenerateForm] = useState({
    month: new Date().getMonth().toString(),
    year: new Date().getFullYear().toString()
  });
  const [admins, setAdmins] = useState([]);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchTransactions();
    fetchAdmins();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });
      const response = await superAdminAPI.getTransactions(params);
      if (response.success) {
        setTransactions(response.data || []);
        setSummary(response.summary || { totalCommission: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transactions');
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
    fetchTransactions();
  };

  const handleGenerateCommissions = async () => {
    try {
      const response = await superAdminAPI.generateMonthlyCommissions(
        parseInt(generateForm.month) + 1,
        parseInt(generateForm.year)
      );
      if (response.success) {
        toast.success(response.message);
        setShowGenerateModal(false);
        fetchTransactions();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate commissions');
    }
  };

  const handleUpdatePayment = async () => {
    try {
      if (!selectedTransaction) return;
      const response = await superAdminAPI.updateTransactionPayment(
        selectedTransaction._id,
        paymentForm
      );
      if (response.success) {
        toast.success('Payment updated successfully');
        setShowPaymentModal(false);
        setSelectedTransaction(null);
        fetchTransactions();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update payment');
    }
  };

  const handleViewDetails = async (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const openPaymentModal = (transaction) => {
    setSelectedTransaction(transaction);
    setPaymentForm({
      paymentStatus: transaction.paymentStatus,
      paymentMethod: transaction.paymentMethod || 'bank_transfer',
      paymentReference: transaction.paymentReference || '',
      notes: transaction.notes || ''
    });
    setShowPaymentModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-yellow-100 text-yellow-800',
      partially_paid: 'bg-blue-100 text-blue-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.unpaid;
  };

  const getPaymentStatusIcon = (status) => {
    const icons = {
      paid: <CheckCircle className="w-4 h-4" />,
      unpaid: <Clock className="w-4 h-4" />,
      partially_paid: <AlertCircle className="w-4 h-4" />,
      overdue: <XCircle className="w-4 h-4" />
    };
    return icons[status] || icons.unpaid;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Commission Transactions</h1>
            <p className="text-gray-600 mt-2">Monthly 10% commission from admin revenues</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleRefresh} disabled={refreshing}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Generate Monthly
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Commission</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">${summary.totalCommission?.toFixed(2) || '0.00'}</p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Paid</h3>
                <p className="text-2xl font-bold text-green-600 mt-2">${summary.totalPaid?.toFixed(2) || '0.00'}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Pending</h3>
                <p className="text-2xl font-bold text-yellow-600 mt-2">${summary.totalPending?.toFixed(2) || '0.00'}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Overdue</h3>
                <p className="text-2xl font-bold text-red-600 mt-2">${summary.totalOverdue?.toFixed(2) || '0.00'}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select value={filters.adminId} onChange={(e) => setFilters({ ...filters, adminId: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">All Admins</option>
              {admins.map(admin => <option key={admin.id} value={admin.id}>{admin.name}</option>)}
            </select>
            <select value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">All Months</option>
              {months.map((month, idx) => <option key={idx} value={idx + 1}>{month}</option>)}
            </select>
            <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
              {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <select value={filters.paymentStatus} onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">All Payment Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission (10%)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                  </td></tr>
                ) : transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{transaction.invoiceNumber || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{transaction.adminId?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{transaction.adminId?.email || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{months[transaction.period?.month - 1]} {transaction.period?.year}</div>
                        <div className="text-xs text-gray-500">{transaction.orderStats?.completedOrders || 0} orders</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">${transaction.adminRevenue?.toFixed(2) || '0.00'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-purple-600">${transaction.commissionAmount?.toFixed(2) || '0.00'}</div>
                        <div className="text-xs text-gray-500">{transaction.commissionRate}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(transaction.paymentStatus)}`}>
                            {getPaymentStatusIcon(transaction.paymentStatus)}
                            {transaction.paymentStatus?.replace('_', ' ')}
                          </span>
                        </div>
                        {transaction.paidAt && (
                          <div className="text-xs text-gray-500 mt-1">Paid: {new Date(transaction.paidAt).toLocaleDateString()}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button onClick={() => handleViewDetails(transaction)}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 flex items-center gap-1" title="View Details">
                            <Eye className="w-3 h-3" />View
                          </button>
                          {transaction.paymentStatus !== 'paid' && (
                            <button onClick={() => openPaymentModal(transaction)}
                              className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 flex items-center gap-1" title="Update Payment">
                              <CreditCard className="w-3 h-3" />Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <FileText className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No transactions found</p>
                      <p className="text-sm mt-2">Generate monthly commissions to get started</p>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Generate Monthly Commissions</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <select value={generateForm.month} onChange={(e) => setGenerateForm({ ...generateForm, month: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {months.map((month, idx) => <option key={idx} value={idx}>{month}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select value={generateForm.year} onChange={(e) => setGenerateForm({ ...generateForm, year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">This will generate 10% commission transactions for all active admins based on their completed orders in the selected month.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowGenerateModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
              <button onClick={handleGenerateCommissions} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Generate</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Update Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                <select value={paymentForm.paymentStatus} onChange={(e) => setPaymentForm({ ...paymentForm, paymentStatus: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="digital_wallet">Digital Wallet</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Reference</label>
                <input type="text" value={paymentForm.paymentReference} onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })}
                  placeholder="Transaction ID, Check Number, etc." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} rows="3" placeholder="Additional notes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
              <button onClick={handleUpdatePayment} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Update Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-gray-900">Transaction Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-500">Invoice Number</label><p className="text-lg font-semibold text-gray-900">{selectedTransaction.invoiceNumber || 'N/A'}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Period</label><p className="text-lg font-semibold text-gray-900">{months[selectedTransaction.period?.month - 1]} {selectedTransaction.period?.year}</p></div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Admin Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm text-gray-500">Name</label><p className="font-medium">{selectedTransaction.adminId?.name}</p></div>
                  <div><label className="text-sm text-gray-500">Email</label><p className="font-medium">{selectedTransaction.adminId?.email}</p></div>
                  <div><label className="text-sm text-gray-500">Phone</label><p className="font-medium">{selectedTransaction.adminId?.phone || 'N/A'}</p></div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Financial Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm text-gray-500">Admin Revenue</label><p className="text-lg font-bold text-gray-900">${selectedTransaction.adminRevenue?.toFixed(2)}</p></div>
                  <div><label className="text-sm text-gray-500">Commission Rate</label><p className="text-lg font-bold text-purple-600">{selectedTransaction.commissionRate}%</p></div>
                  <div><label className="text-sm text-gray-500">Commission Amount</label><p className="text-lg font-bold text-green-600">${selectedTransaction.commissionAmount?.toFixed(2)}</p></div>
                  <div><label className="text-sm text-gray-500">Total Amount</label><p className="text-lg font-bold text-gray-900">${selectedTransaction.totalAmount?.toFixed(2)}</p></div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Order Statistics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-sm text-gray-500">Total Orders</label><p className="text-2xl font-bold text-blue-600">{selectedTransaction.orderStats?.totalOrders || 0}</p></div>
                  <div><label className="text-sm text-gray-500">Completed</label><p className="text-2xl font-bold text-green-600">{selectedTransaction.orderStats?.completedOrders || 0}</p></div>
                  <div><label className="text-sm text-gray-500">Cancelled</label><p className="text-2xl font-bold text-red-600">{selectedTransaction.orderStats?.cancelledOrders || 0}</p></div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm text-gray-500">Payment Status</label><p><span className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full ${getPaymentStatusColor(selectedTransaction.paymentStatus)}`}>{getPaymentStatusIcon(selectedTransaction.paymentStatus)}{selectedTransaction.paymentStatus?.replace('_', ' ')}</span></p></div>
                  <div><label className="text-sm text-gray-500">Payment Method</label><p className="font-medium capitalize">{selectedTransaction.paymentMethod?.replace('_', ' ') || 'N/A'}</p></div>
                  <div><label className="text-sm text-gray-500">Payment Reference</label><p className="font-medium">{selectedTransaction.paymentReference || 'N/A'}</p></div>
                  <div><label className="text-sm text-gray-500">Due Date</label><p className="font-medium">{selectedTransaction.dueDate ? new Date(selectedTransaction.dueDate).toLocaleDateString() : 'N/A'}</p></div>
                  {selectedTransaction.paidAt && <div><label className="text-sm text-gray-500">Paid At</label><p className="font-medium">{new Date(selectedTransaction.paidAt).toLocaleString()}</p></div>}
                </div>
              </div>
              {selectedTransaction.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedTransaction.notes}</p>
                </div>
              )}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Transaction Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><label className="text-gray-500">Created At</label><p className="font-medium">{new Date(selectedTransaction.createdAt).toLocaleString()}</p></div>
                  <div><label className="text-gray-500">Status</label><p><span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTransaction.status)}`}>{selectedTransaction.status}</span></p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
