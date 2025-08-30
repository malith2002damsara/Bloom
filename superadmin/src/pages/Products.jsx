import React, { useState, useEffect } from 'react';
import { superAdminAPI } from '../utils/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await superAdminAPI.getAllProducts();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (productId, newStatus) => {
    try {
      const response = await superAdminAPI.updateProductStatus(productId, newStatus);
      if (response.success) {
        setProducts(products.map(p => 
          p._id === productId 
            ? { ...p, status: newStatus }
            : p
        ));
      }
    } catch (error) {
      alert('Failed to update product status: ' + error.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        const response = await superAdminAPI.deleteProduct(productId);
        if (response.success) {
          setProducts(products.filter(p => p._id !== productId));
          alert('Product deleted successfully!');
        }
      } catch (error) {
        alert('Failed to delete product: ' + error.message);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'out-of-stock': return 'bg-yellow-100 text-yellow-800';
      case 'discontinued': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories for filter
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
        <button
          onClick={fetchProducts}
          className="px-4 py-2 bg-primary-yellow text-gray-900 rounded-lg hover:bg-primary-orange hover:text-white transition-all duration-300"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search products by name, description, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-yellow"
            />
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-yellow"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-yellow"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-primary-green">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Products</h3>
          <p className="text-2xl font-bold text-primary-green">{products.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-primary-yellow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active</h3>
          <p className="text-2xl font-bold text-primary-yellow">
            {products.filter(p => p.status === 'active').length}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-primary-pink">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Out of Stock</h3>
          <p className="text-2xl font-bold text-primary-pink">
            {products.filter(p => p.status === 'out-of-stock').length}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-primary-orange">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Categories</h3>
          <p className="text-2xl font-bold text-primary-orange">{categories.length}</p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(product.status)}`}>
                    {product.status || 'active'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {product.description || 'No description available'}
                </p>
                
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xl font-bold text-primary-green">
                    ${product.price?.toFixed(2) || '0.00'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Stock: {product.stock || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-gray-500">
                    SKU: {product.sku || 'N/A'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {product.category || 'Uncategorized'}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  {product.status !== 'active' ? (
                    <button
                      onClick={() => handleStatusUpdate(product._id, 'active')}
                      className="flex-1 px-3 py-2 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200"
                    >
                      Activate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusUpdate(product._id, 'inactive')}
                      className="flex-1 px-3 py-2 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
                    >
                      Deactivate
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    className="px-3 py-2 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            {products.length === 0 ? (
              <div>
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-500">No products found</p>
              </div>
            ) : (
              <p className="text-gray-500">No products match your current filters</p>
            )}
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {filteredProducts.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Bulk Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-primary-green text-white rounded-lg hover:bg-primary-orange transition-colors duration-300">
              Export Products
            </button>
            <button className="px-6 py-3 bg-primary-yellow text-gray-900 rounded-lg hover:bg-primary-pink hover:text-white transition-colors duration-300">
              Bulk Price Update
            </button>
            <button className="px-6 py-3 bg-primary-beige text-gray-900 rounded-lg hover:bg-primary-orange hover:text-white transition-colors duration-300">
              Inventory Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
