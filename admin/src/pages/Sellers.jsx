import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Mail, Phone, MapPin, Star, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import adminApi from '../utils/api';

const Sellers = () => {
  const [sellers, setSellers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getSellers();
      
      if (response.success) {
        setSellers(response.data.sellers || []);
      }
    } catch (error) {
      console.error('Sellers fetch error:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('Invalid token') || error.message.includes('401')) {
        toast.error('Please login to access sellers data');
      } else {
        // Fallback to demo data
        const demoSellers = [
          {
            id: 1,
            name: 'Flower Shop A',
            email: 'contact@flowershopa.com',
            phone: '+1 (555) 123-4567',
            address: '123 Bloom Street, Garden City, NY',
            rating: 4.8,
            totalProducts: 15,
            totalSales: 2340.50,
            joinDate: '2025-01-15',
            status: 'active'
          },
          {
            id: 2,
            name: 'Bloom Gardens',
            email: 'info@bloomgardens.com',
            phone: '+1 (555) 987-6543',
            address: '456 Rose Avenue, Flower Town, CA',
            rating: 4.6,
            totalProducts: 12,
            totalSales: 1890.75,
            joinDate: '2025-02-20',
            status: 'active'
          },
          {
            id: 3,
            name: 'Gift Corner',
            email: 'hello@giftcorner.com',
            phone: '+1 (555) 456-7890',
            address: '789 Present Lane, Gift City, FL',
            rating: 4.9,
            totalProducts: 8,
            totalSales: 1567.25,
            joinDate: '2025-03-10',
            status: 'active'
          },
          {
            id: 4,
            name: 'Custom Creations',
            email: 'orders@customcreations.com',
            phone: '+1 (555) 321-0987',
            address: '321 Craft Street, Artisan City, TX',
            rating: 4.7,
            totalProducts: 20,
            totalSales: 3456.80,
            joinDate: '2025-01-28',
            status: 'active'
          }
        ];
        
        setSellers(demoSellers);
        toast.warning('Using demo data - Please check your connection');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter(seller =>
    seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-200 text-yellow-400" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading sellers...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sellers Management</h1>
            <p className="text-gray-600 mt-2">Manage all registered sellers and their performance</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Seller</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search sellers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Sellers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSellers.map((seller) => (
          <div key={seller.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{seller.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(seller.status)}`}>
                    {seller.status.charAt(0).toUpperCase() + seller.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {renderStars(seller.rating)}
                <span className="text-sm text-gray-600 ml-1">({seller.rating})</span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{seller.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{seller.phone}</span>
              </div>
              <div className="flex items-start space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>{seller.address}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Products</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">{seller.totalProducts}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <span className="text-sm text-gray-600">Total Sales</span>
                </div>
                <div className="text-lg font-semibold text-green-600">${seller.totalSales.toFixed(2)}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Joined: {new Date(seller.joinDate).toLocaleDateString()}</span>
                <button className="text-blue-600 hover:text-blue-700 font-medium">View Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSellers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No sellers found matching your search criteria.</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-2xl font-bold text-gray-900">{sellers.length}</div>
          <div className="text-sm text-gray-500">Total Sellers</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-2xl font-bold text-green-600">
            {sellers.filter(s => s.status === 'active').length}
          </div>
          <div className="text-sm text-gray-500">Active Sellers</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {sellers.reduce((sum, seller) => sum + seller.totalProducts, 0)}
          </div>
          <div className="text-sm text-gray-500">Total Products</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">
            ${sellers.reduce((sum, seller) => sum + seller.totalSales, 0).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">Total Revenue</div>
        </div>
      </div>
    </div>
  );
};

export default Sellers;
