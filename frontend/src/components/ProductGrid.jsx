import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import apiService from '../services/api';
import { FiRefreshCw, FiAlertCircle } from 'react-icons/fi';

const ProductGrid = ({ isCollectionPage = false, maxProducts = null }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch products from database
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getProducts();
      
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
  };
  
  // Filter products based on category and limit for home page
  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(product => product.category === activeCategory);
    
  // Limit products for home page display
  const displayProducts = maxProducts 
    ? filteredProducts.slice(0, maxProducts)
    : filteredProducts;
  
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
        <motion.h1
            className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-center bg-clip-text text-pink-500 mb-6 drop-shadow-sm"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  >
          
         {isCollectionPage ? 'Our Collection' : 'Featured Products'}
       </motion.h1>
        
        {/* Category Filters */}
        <motion.div 
          className="flex flex-wrap justify-center gap-2 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          {['all', 'fresh','artificial','mixed','bears'].map((category) => (
            <motion.button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm capitalize ${
                activeCategory === category 
                  ? category === 'all' ? 'bg-gray-800 text-white' 
                    : category === 'fresh' ? 'bg-pink-500 text-white' 
                    : category === 'artificial' ? 'bg-blue-500 text-white' 
                    : category === 'mixed' ? 'bg-purple-500 text-white' 
                    : category === 'bears' ? 'bg-green-500 text-white' 
                    : 'bg-purple-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              viewport={{ once: true }}
            >
              {category === 'bears' ? 'Graduation Bears' : 
               category === 'all' ? 'All' : 
               category === 'fresh & artificial' ? 'Fresh & Artificial' :
               category === 'mixed' ? 'Fresh & Artificial' :
               `${category.charAt(0).toUpperCase() + category.slice(1)}`}
            </motion.button>
          ))}
        </motion.div>
        
        {/* Product Count Display */}
        {displayProducts.length > 0 && (
          <motion.div 
            className="text-center mb-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-600 text-sm">
              Showing {displayProducts.length} of {products.length} products
              {activeCategory !== 'all' && ` in ${activeCategory} category`}
            </p>
          </motion.div>
        )}
        
        {/* Product Grid */}
        {displayProducts.length > 0 ? (
          <motion.div 
            className={`grid gap-3 sm:gap-4 ${
              isCollectionPage 
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' 
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5'
            }`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {displayProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-600 text-lg mb-4">
              No products found in the {activeCategory === 'all' ? 'selected' : activeCategory} category
            </p>
            {activeCategory !== 'all' && (
              <button
                onClick={() => setActiveCategory('all')}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Show All Products
              </button>
            )}
          </motion.div>
        )}
        
        {/* Navigation Button - Only show on home page */}
        {!isCollectionPage && displayProducts.length > 0 && (
          <motion.div 
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.button 
              className="px-6 py-3 border-2 border-pink-500 text-pink-500 hover:bg-pink-50 rounded-lg font-medium text-sm sm:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNavigateToCollection}
            >
              View Full Collection
            </motion.button>
          </motion.div>
        )}

        {/* Collection Page Additional Features */}
        {isCollectionPage && displayProducts.length > 0 && (
          <motion.div 
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-600 text-sm">
              🌸 All products are handcrafted with love for your special graduation moment 🎓
            </p>
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default ProductGrid;