import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { FiSearch } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Collection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    adminCode: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    sortBy: 'newest'
  });

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'fresh', label: 'Fresh' },
    { value: 'artificial', label: 'Artificial' },
    { value: 'mixed', label: 'Fresh & Artificial' },
    { value: 'bears', label: 'Graduation Bears' }
  ];

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, filters.adminCode]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/products?limit=1000`;
      
      if (activeCategory !== 'all') {
        url += `&category=${activeCategory}`;
      }
      
      if (filters.adminCode && filters.adminCode.length === 3) {
        url += `&adminCode=${filters.adminCode}`;
      }

      console.log('Fetching from URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('API Response:', data);
      console.log('Products:', data.data?.products);
      
      if (data.success && data.data && data.data.products) {
        setProducts(data.data.products);
        console.log('Products set:', data.data.products.length);
      } else {
        console.error('API returned error or no products:', data);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Client-side filtering for search, price range, and rating
  const filteredProducts = products.filter(product => {
    // Search filter
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Price filter
    const minPrice = parseFloat(filters.minPrice);
    const maxPrice = parseFloat(filters.maxPrice);
    const productPrice = parseFloat(product.price);

    if (!isNaN(minPrice) && productPrice < minPrice) {
      return false;
    }
    if (!isNaN(maxPrice) && productPrice > maxPrice) {
      return false;
    }

    // Rating filter
    if (filters.rating && parseFloat(product.ratingsAverage || 0) < parseFloat(filters.rating)) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    // Sort products based on sortBy filter
    switch(filters.sortBy) {
      case 'price-high':
        return parseFloat(b.price) - parseFloat(a.price);
      case 'price-low':
        return parseFloat(a.price) - parseFloat(b.price);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'newest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-25 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
           <motion.h1
                              className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-center bg-clip-text text-pink-500 mb-6 drop-shadow-sm"
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                            >
                              Our Collection
                            </motion.h1>
          <p className="text-gray-600">
            Discover beautiful arrangements for every occasion
          </p>
        </div>

        {/* Search Bar and Category Dropdown Row */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
          {/* Search Bar - Left */}
          <div className="relative flex-1 w-full">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Category Dropdown - Right */}
          <div className="w-full md:w-64">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-gray-700 font-medium"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content: Sidebar + Products */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-full lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Filters</h2>
              
              {/* Admin Code Filter */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Admin Code
                </label>
                <input
                  type="text"
                  placeholder="3-digit code"
                  maxLength={3}
                  value={filters.adminCode}
                  onChange={(e) => handleFilterChange('adminCode', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {/* Min Price Filter */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Min Price (Rs.)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {/* Max Price Filter */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Max Price (Rs.)
                </label>
                <input
                  type="number"
                  placeholder="10000"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {/* Minimum Rating Filter */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Minimum Rating
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">All Ratings</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>

              {/* Sort By Filter */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="newest">New to Old</option>
                  <option value="oldest">Old to New</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Content - Products */}
          <div className="flex-1">
            {/* Results Counter */}
            <div className="mb-4">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredProducts.length}</span> products
              </p>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
              >
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collection;
