import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from './ProductCard';
import apiService from '../services/api';
import { FiRefreshCw, FiAlertCircle, FiX } from 'react-icons/fi';

const ProductGrid = ({ isCollectionPage = false, maxProducts = null }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sellerCode, setSellerCode] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize seller code from URL on collection page
  useEffect(() => {
    if (isCollectionPage) {
      const codeFromUrl = searchParams.get('seller_code');
      if (codeFromUrl) {
        setSellerCode(codeFromUrl);
        setAppliedCode(codeFromUrl);
      }
    }
  }, [isCollectionPage, searchParams]);

  // Memoize fetchProducts to prevent unnecessary re-renders
  const fetchProducts = useCallback(async (codeFilter = '') => {
    try {
      setLoading(true);
      setError('');
      
      // Use home endpoint for home page (10 products from different admins)
      // Use regular products endpoint for collection page
      const response = isCollectionPage 
        ? await apiService.getProducts({ 
            adminCode: codeFilter, 
            category: activeCategory,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            sortBy: sortBy === 'default' ? undefined : sortBy
          })
        : await apiService.getHomeProducts();
      
      if (response.success) {
        setProducts(response.data.products || []);
      } else {
        setError('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [isCollectionPage, activeCategory, minPrice, maxPrice, sortBy]);

  // Fetch products on component mount and when applied code changes
  useEffect(() => {
    fetchProducts(appliedCode);
  }, [fetchProducts, appliedCode]);
  
  // Filter products based on category and limit for home page
  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(product => product.category === activeCategory);
    
  // Limit products for home page display
  const displayProducts = maxProducts 
    ? filteredProducts.slice(0, maxProducts)
    : filteredProducts;

  // Handle seller code application
  const handleApplyCode = () => {
    if (sellerCode.trim()) {
      // Validate that it's a 3-digit number
      const codeRegex = /^\d{3}$/;
      if (!codeRegex.test(sellerCode.trim())) {
        setError('Please enter a valid 3-digit seller code');
        return;
      }
      setAppliedCode(sellerCode.trim());
      // Update URL with seller code
      setSearchParams({ seller_code: sellerCode.trim() });
      setError('');
    }
  };

  // Handle clearing seller code filter
  const handleClearCode = () => {
    setSellerCode('');
    setAppliedCode('');
    setSearchParams({});
    setError('');
  };

  // Handle input change with validation
  const handleCodeInputChange = (e) => {
    const value = e.target.value;
    // Only allow numeric input and max 3 digits
    if (value === '' || (/^\d{0,3}$/.test(value))) {
      setSellerCode(value);
      if (error) setError(''); // Clear error when user types
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleApplyCode();
    }
  };
  
  // Function to handle navigation to collection page with scroll to top
  const handleNavigateToCollection = () => {
    navigate('/collection');
    // Add a small delay to ensure navigation completes before scrolling
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  // Loading state
  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-blue-50 to-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <FiRefreshCw className="animate-spin text-4xl text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Products...</h2>
            <p className="text-gray-600">Please wait while we fetch the latest products</p>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="py-16 bg-gradient-to-b from-blue-50 to-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <FiAlertCircle className="text-4xl text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Products</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchProducts}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="py-10 bg-gradient-to-b from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-13">
        <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-center bg-clip-text text-pink-500 mb-6 drop-shadow-sm">
          {isCollectionPage ? 'Our Collection' : 'Featured Products'}
        </h1>

        {/* Seller Code Filter - Only on Collection Page */}
        {isCollectionPage && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Seller Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sellerCode}
                  onChange={handleCodeInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter 3-digit code (e.g., 123)"
                  maxLength="3"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
                <button
                  onClick={handleApplyCode}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Apply Filter
                </button>
              </div>
              {appliedCode && (
                <div className="mt-3 flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-purple-800">
                    <span className="font-semibold">Showing products from Seller: {appliedCode}</span>
                  </p>
                  <button
                    onClick={handleClearCode}
                    className="flex items-center gap-1 text-purple-700 hover:text-purple-900 font-medium text-sm"
                  >
                    <FiX size={18} />
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {['all', 'fresh','artificial','mixed','bears'].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm capitalize transition-all ${
                activeCategory === category 
                  ? category === 'all' ? 'bg-gray-800 text-white' 
                    : category === 'fresh' ? 'bg-pink-500 text-white' 
                    : category === 'artificial' ? 'bg-blue-500 text-white' 
                    : category === 'mixed' ? 'bg-purple-500 text-white' 
                    : category === 'bears' ? 'bg-green-500 text-white' 
                    : 'bg-purple-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category === 'bears' ? 'Graduation Bears' : 
               category === 'all' ? 'All' : 
               category === 'fresh & artificial' ? 'Fresh & Artificial' :
               category === 'mixed' ? 'Fresh & Artificial' :
               `${category.charAt(0).toUpperCase() + category.slice(1)}`}
            </button>
          ))}
        </div>

        {isCollectionPage && (
          <div className="max-w-3xl mx-auto mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input
              type="number"
              min="0"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
            <input
              type="number"
              min="0"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="col-span-2 sm:col-span-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="default">Sort By</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
              <option value="rating">Rating</option>
              <option value="discount">Discount</option>
            </select>
            <button
              onClick={() => fetchProducts(appliedCode)}
              className="col-span-2 sm:col-span-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Apply Filters
            </button>
          </div>
        )}
        
        {/* Product Count Display */}
        {displayProducts.length > 0 && (
          <div className="text-center mb-6">
            <p className="text-gray-600 text-sm">
              Showing {displayProducts.length} of {products.length} products
              {activeCategory !== 'all' && ` in ${activeCategory} category`}
              {appliedCode && ` from seller ${appliedCode}`}
            </p>
          </div>
        )}
        
        {/* Product Grid */}
        {displayProducts.length > 0 ? (
          <div 
            className={`grid gap-3 sm:gap-4 ${
              isCollectionPage 
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' 
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6'
            }`}
          >
            {displayProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">
              {appliedCode 
                ? `No products found from seller ${appliedCode}` 
                : `No products found in the ${activeCategory === 'all' ? 'selected' : activeCategory} category`}
            </p>
            {(activeCategory !== 'all' || appliedCode) && (
              <button
                onClick={() => {
                  setActiveCategory('all');
                  if (appliedCode) handleClearCode();
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Show All Products
              </button>
            )}
          </div>
        )}
        
        {/* Navigation Button - Only show on home page */}
        {!isCollectionPage && displayProducts.length > 0 && (
          <div className="text-center mt-8">
            <button 
              className="px-6 py-3 border-2 border-pink-500 text-pink-500 hover:bg-pink-50 rounded-lg font-medium text-sm sm:text-base transition-all hover:scale-105"
              onClick={handleNavigateToCollection}
            >
              View Full Collection
            </button>
          </div>
        )}

        {/* Collection Page Additional Features */}
        {isCollectionPage && displayProducts.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-gray-600 text-sm">
              🌸 All products are handcrafted with love for your special graduation moment 🎓
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default ProductGrid;