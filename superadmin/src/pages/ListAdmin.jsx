import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  CheckCircle, 
  XCircle, 
  Edit2, 
  Trash2,
  Power,
  PowerOff,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { toast } from 'react-toastify';
import { superAdminAPI } from '../utils/api';

const ListAdmin = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await superAdminAPI.getAllAdmins();
      
      if (response.success) {
        setAdmins(response.data.admins || []);
      } else {
        toast.error('Failed to fetch admin accounts');
      }
    } catch (error) {
      console.error('Fetch admins error:', error);
      toast.error(error.message || 'Failed to fetch admin accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (adminId) => {
    try {
      const response = await superAdminAPI.activateAdmin(adminId);
      
      if (response.success) {
        toast.success('Admin account activated successfully');
        fetchAdmins(); // Refresh the list
      } else {
        toast.error(response.message || 'Failed to activate admin account');
      }
    } catch (error) {
      console.error('Activate admin error:', error);
      toast.error(error.message || 'Failed to activate admin account');
    }
  };

  const handleDeactivate = async (adminId) => {
    if (!window.confirm('Are you sure you want to deactivate this admin account?')) {
      return;
    }

    try {
      const response = await superAdminAPI.deactivateAdmin(adminId);
      
      if (response.success) {
        toast.success('Admin account deactivated successfully');
        fetchAdmins(); // Refresh the list
      } else {
        toast.error(response.message || 'Failed to deactivate admin account');
      }
    } catch (error) {
      console.error('Deactivate admin error:', error);
      toast.error(error.message || 'Failed to deactivate admin account');
    }
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to permanently delete this admin account? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await superAdminAPI.deleteAdmin(adminId);
      
      if (response.success) {
        toast.success('Admin account deleted successfully');
        fetchAdmins(); // Refresh the list
      } else {
        toast.error(response.message || 'Failed to delete admin account');
      }
    } catch (error) {
      console.error('Delete admin error:', error);
      toast.error(error.message || 'Failed to delete admin account');
    }
  };

  // Filter admins based on search and status
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && admin.isActive) ||
                         (filterStatus === 'inactive' && !admin.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const StatusBadge = ({ isActive }) => (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {isActive ? (
        <>
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </>
      ) : (
        <>
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </>
      )}
    </span>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="w-8 h-8 mr-3 text-purple-600" />
            Admin Accounts
          </h1>
          <p className="text-gray-600 mt-2">Manage all admin accounts and their access</p>
        </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Admins</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600">
              Active: <span className="font-semibold text-gray-900">{admins.filter(a => a.isActive).length}</span>
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-600">
              Inactive: <span className="font-semibold text-gray-900">{admins.filter(a => !a.isActive).length}</span>
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600">
              Total: <span className="font-semibold text-gray-900">{admins.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading admins...</span>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No admin accounts found</p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter' 
                : 'Start by creating your first admin account'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {admin.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                          <div className="text-sm text-gray-500">{admin.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          {admin.email}
                        </div>
                        {admin.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {admin.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge isActive={admin.isActive} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {admin.isActive ? (
                          <button
                            onClick={() => handleDeactivate(admin._id)}
                            className="text-orange-600 hover:text-orange-700 p-2 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Deactivate"
                          >
                            <PowerOff className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(admin._id)}
                            className="text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded-lg transition-colors"
                            title="Activate"
                          >
                            <Power className="w-5 h-5" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(admin._id)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default ListAdmin;
