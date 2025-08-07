import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { FiX, FiShoppingCart, FiHeart, FiStar, FiInfo, FiPackage, FiTruck, FiShield, FiMaximize, FiEye, FiRotateCw, FiMove } from 'react-icons/fi';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [is3DMode, setIs3DMode] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Get available sizes from product data
  const getAvailableSizes = () => {
    if (product.category === 'bears' && product.bearDetails?.sizes) {
      return product.bearDetails.sizes.map(size => ({
        id: size.size,
        name: size.size,
        price: parseFloat(size.price) || 0,
        dimensions: size.dimensions
      }));
    } else if (product.sizes && product.sizes.length > 0) {
      return product.sizes.map(size => ({
        id: size.size,
        name: size.size,
        price: parseFloat(size.price) || 0,
        flowerCount: size.flowerCount,
        dimensions: size.dimensions
      }));
    }
    return [];
  };

  // Get flower selections based on category
  const getFlowerSelections = () => {
    if (product.category === 'fresh' && product.freshFlowerSelections) {
      return product.freshFlowerSelections;
    } else if (product.category === 'artificial' && product.artificialFlowerSelections) {
      return product.artificialFlowerSelections;
    } else if (product.flowerSelections) {
      return product.flowerSelections;
    }
    return [];
  };

  // Get bear colors if it's a bear product
  const getBearColors = () => {
    if (product.category === 'bears' && product.bearDetails?.colors) {
      return product.bearDetails.colors;
    }
    return [];
  };

  const availableSizes = getAvailableSizes();
  const flowerSelections = getFlowerSelections();
  const bearColors = getBearColors();
  
  // Set default selected size
  React.useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0].id);
    }
  }, [availableSizes, selectedSize]);

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  // 3D interaction handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setRotationY(prev => prev + deltaX * 0.5);
    setRotationX(prev => prev - deltaY * 0.5);
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetRotation = () => {
    setRotationX(0);
    setRotationY(0);
  };

  const toggle3DMode = () => {
    setIs3DMode(!is3DMode);
    if (is3DMode) {
      resetRotation();
    }
  };

  const getTotalPrice = () => {
    if (availableSizes.length === 0) {
      return (product.price || 0) * quantity;
    }
    const selectedSizeData = availableSizes.find(size => size.id === selectedSize);
    const sizePrice = selectedSizeData?.price || 0;
    return sizePrice * quantity;
  };

  const getCurrentPrice = () => {
    if (availableSizes.length === 0) {
      return product.price || 0;
    }
    const selectedSizeData = availableSizes.find(size => size.id === selectedSize);
    return selectedSizeData?.price || 0;
  };

  const handleAddToCart = () => {
    const selectedSizeData = availableSizes.find(size => size.id === selectedSize);
    const productWithOptions = {
      ...product,
      id: product._id || product.id,
      selectedSize: selectedSizeData || { id: 'default', name: 'Default', price: product.price },
      quantity,
      totalPrice: getTotalPrice(),
      price: getCurrentPrice()
    };
    addToCart(productWithOptions);
    toast.success(`${product.name} added to cart!`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    setShowQuickView(false);
    // Reset options
    setSelectedSize(availableSizes.length > 0 ? availableSizes[0].id : '');
    setQuantity(1);
  };

  const handleQuickAddToCart = () => {
    const selectedSizeData = availableSizes.length > 0 ? availableSizes[0] : { id: 'default', name: 'Default', price: product.price };
    const productWithOptions = {
      ...product,
      id: product._id || product.id,
      selectedSize: selectedSizeData,
      quantity: 1,
      totalPrice: selectedSizeData.price || product.price,
      price: selectedSizeData.price || product.price
    };
    addToCart(productWithOptions);
    toast.success(`${product.name} added to cart!`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const handleCloseModal = () => {
    setShowQuickView(false);
    // Reset options when closing
    setSelectedSize(availableSizes.length > 0 ? availableSizes[0].id : '');
    setQuantity(1);
    // Reset 3D state
    setRotationX(0);
    setRotationY(0);
    setIs3DMode(true);
    setIsDragging(false);
  };

  return (
    <>
      <motion.div 
        className={`bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ${
          showQuickView ? 'pointer-events-none filter blur-sm' : ''
        }`}
        whileHover={{ y: -2 }}
      >
        <div className="relative pb-[75%] overflow-hidden">
          <img 
            src={product.images && product.images.length > 0 ? product.images[0] : '/assets/images/placeholder.jpg'} 
            alt={product.name} 
            className="absolute h-full w-full object-cover"
          />
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm mb-1 line-clamp-2 leading-tight">{product.name}</h3>
          <p className="text-purple-600 font-semibold text-sm mb-2">
            {availableSizes.length > 0 ? (
              `Rs. ${Math.min(...availableSizes.map(s => s.price)).toFixed(2)}`
            ) : (
              `Rs. ${(product.price || 0).toFixed(2)}`
            )}
          </p>
          <div className="flex space-x-1">
            <button
              onClick={handleQuickAddToCart}
              className="flex-1 py-1.5 px-2  bg-pink-500 to-purple-600 text-white  transition-colors flex items-center justify-center space-x-1"
            >
              <FiShoppingCart className="h-3 w-3" />
              <span>Add</span>
            </button>
            <button
              onClick={() => setShowQuickView(true)}
              className="flex-1 py-1.5 px-2 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors border border-gray-200 flex items-center justify-center space-x-1"
            >
              <FiInfo className="h-3 w-3" />
              <span>View</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {showQuickView && (
          <>
            {/* Blur everything behind the modal */}
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
            />

            {/* Modal Content */}
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 px-2 sm:px-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="bg-white rounded-xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-gray-100">
                {/* Navigation Bar */}
                <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white px-4 py-3 flex items-center justify-between rounded-t-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <FiEye className="w-4 h-4" />
                    </div>
                    <div>
                      <h1 className="font-semibold text-lg truncate max-w-xs sm:max-w-md">
                        {product.name}
                      </h1>
                      <p className="text-purple-100 text-xs">Product Details</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Wishlist Button
                    <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all">
                      <FiHeart size={16} />
                    </button> */}
                    {/* Close Button */}
                    <button 
                      onClick={handleCloseModal} 
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(95vh-60px)]">
                  {/* 3D Product Viewer Section */}
                  <div className="relative h-64 sm:h-72 md:h-80 bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden">
                    {/* 3D Viewer Controls */}
                    <div className="absolute top-4 right-4 z-10 flex space-x-2">
                      <button
                        onClick={toggle3DMode}
                        className={`p-2 rounded-lg backdrop-blur-sm border transition-all ${
                          is3DMode 
                            ? 'bg-purple-600 text-white border-purple-600 shadow-lg' 
                            : 'bg-white/80 text-gray-700 border-gray-200 hover:bg-white'
                        }`}
                        title={is3DMode ? "Switch to 2D view" : "Switch to 3D view"}
                      >
                        <FiMaximize size={16} />
                      </button>
                      {is3DMode && (
                        <button
                          onClick={resetRotation}
                          className="p-2 bg-white/80 text-gray-700 rounded-lg backdrop-blur-sm border border-gray-200 hover:bg-white transition-all"
                          title="Reset rotation"
                        >
                          <FiRotateCw size={16} />
                        </button>
                      )}
                    </div>

                    {/* 3D Instructions */}
                    {is3DMode && (
                      <div className="absolute bottom-4 left-4 z-10">
                        <div className="bg-black/60 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
                          <div className="flex items-center text-xs">
                            <FiMove className="mr-1" />
                            <span>Drag to rotate • Click reset to center</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Size Dimensions Display in 3D View */}
                    {is3DMode && selectedSize && availableSizes.length > 0 && (
                      <div className="absolute top-4 left-4 z-10">
                        {(() => {
                          const currentSize = availableSizes.find(size => size.id === selectedSize);
                          if (currentSize?.dimensions) {
                            return (
                              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                                <h4 className="text-xs font-semibold text-gray-800 mb-2">Dimensions ({currentSize.name})</h4>
                                <div className="space-y-1 text-xs text-gray-700">
                                  {currentSize.dimensions.height > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span>Height:</span>
                                      <span className="font-medium">{currentSize.dimensions.height} cm</span>
                                    </div>
                                  )}
                                  {currentSize.dimensions.width > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span>Width:</span>
                                      <span className="font-medium">{currentSize.dimensions.width} cm</span>
                                    </div>
                                  )}
                                  {currentSize.dimensions.length > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span>Length:</span>
                                      <span className="font-medium">{currentSize.dimensions.length} cm</span>
                                    </div>
                                  )}
                                  {currentSize.dimensions.depth > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span>Depth:</span>
                                      <span className="font-medium">{currentSize.dimensions.depth} cm</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}

                    {/* Product Image with 3D Transform */}
                    <div 
                      className={`w-full h-full flex items-center justify-center cursor-${is3DMode ? 'grab' : 'default'} ${
                        isDragging ? 'cursor-grabbing' : ''
                      }`}
                      onMouseDown={is3DMode ? handleMouseDown : undefined}
                      onMouseMove={is3DMode ? handleMouseMove : undefined}
                      onMouseUp={is3DMode ? handleMouseUp : undefined}
                      onMouseLeave={is3DMode ? handleMouseUp : undefined}
                      style={{
                        perspective: is3DMode ? '1000px' : 'none'
                      }}
                    >
                      <div
                        className="relative transition-transform duration-200 ease-out"
                        style={{
                          transform: is3DMode 
                            ? `rotateX(${rotationX}deg) rotateY(${rotationY}deg) translateZ(50px)`
                            : 'none',
                          transformStyle: 'preserve-3d'
                        }}
                      >
                        {/* Main Product Image */}
                        <img 
                          src={product.images && product.images.length > 0 ? product.images[0] : '/assets/images/placeholder.jpg'} 
                          alt={product.name} 
                          className={`max-w-full max-h-full object-contain ${
                            is3DMode ? 'drop-shadow-2xl' : ''
                          }`}
                          style={{
                            maxWidth: is3DMode ? '300px' : '100%',
                            maxHeight: is3DMode ? '300px' : '100%',
                            filter: is3DMode ? 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.3))' : 'none'
                          }}
                          draggable={false}
                        />
                        
                        {/* 3D Shadow/Base */}
                        {is3DMode && (
                          <div 
                            className="absolute inset-x-0 -bottom-4 h-8 bg-gradient-to-r from-transparent via-black/20 to-transparent rounded-full blur-sm"
                            style={{
                              transform: 'rotateX(90deg) translateZ(-20px)',
                              transformOrigin: 'center bottom'
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Ambient Lighting Effects for 3D */}
                    {is3DMode && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 to-pink-100/30 pointer-events-none" />
                        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-purple-200/40 to-transparent rounded-full blur-3xl pointer-events-none" />
                      </>
                    )}

                    {/* Traditional overlay for 2D mode */}
                    {!is3DMode && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    )}
                  </div>

                  {/* Product Details Section */}
                  <div className="px-3 sm:px-4 md:px-6 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                      {/* Left Column - Product Info & Details */}
                      <div className="space-y-4">
                        {/* Category Badge & Basic Info */}
                        <div className="space-y-3">
                          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                            product.category === 'fresh' ? 'bg-green-100 text-green-800' :
                            product.category === 'artificial' ? 'bg-blue-100 text-blue-800' :
                            product.category === 'bears' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {product.category === 'fresh' ? 'Fresh Flowers' :
                             product.category === 'artificial' ? 'Artificial Flowers' :
                             product.category === 'bears' ? 'Graduation Bears' :
                             product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                          </span>
                          
                          {/* Rating */}
                          <div className="flex items-center">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FiStar 
                                  key={star} 
                                  className={`h-3 w-3 ${star <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-xs text-gray-600">(4.0) • 127 reviews</span>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                            <FiInfo className="mr-1 h-4 w-4" />
                            Description
                          </h3>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {product.description || 'A beautiful graduation gift perfect for celebrating this special milestone. Carefully crafted with attention to detail and designed to bring joy to your special graduate.'}
                          </p>
                        </div>

                        {/* Compact Detailed Information */}
                        <div className="space-y-4">
                          {/* Flower Selections - Compact Version */}
                          {flowerSelections.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                Flower Types & Colors
                              </h4>
                              <div className="space-y-2">
                                {flowerSelections.map((selection, index) => (
                                  <div key={index} className="bg-gradient-to-r from-green-50 to-pink-50 rounded-lg p-3 border border-green-100">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-gray-800 capitalize">
                                        {selection.flower}
                                      </span>
                                      {selection.count && (
                                        <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-full">
                                          {selection.count}
                                        </span>
                                      )}
                                    </div>
                                    {selection.colors && selection.colors.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {selection.colors.map((color, colorIndex) => (
                                          <span 
                                            key={colorIndex}
                                            className="inline-block px-2 py-1 bg-white text-xs text-gray-700 rounded-full border border-gray-200 capitalize"
                                          >
                                            {color}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bear Colors - Compact Version */}
                          {bearColors.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                                Available Colors
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {bearColors.map((color, index) => (
                                  <span 
                                    key={index}
                                    className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full capitalize font-medium"
                                  >
                                    {color}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Product Specifications - Enhanced with Dimensions */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                              Product Specifications
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Category:</span>
                                <span className="font-medium text-gray-800 capitalize text-xs">
                                  {product.category === 'fresh' ? 'Fresh Flowers' :
                                   product.category === 'artificial' ? 'Artificial Flowers' :
                                   product.category === 'bears' ? 'Graduation Bears' :
                                   product.category}
                                </span>
                              </div>
                              {product.occasion && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">Occasion:</span>
                                  <span className="font-medium text-gray-800 capitalize text-xs">{product.occasion}</span>
                                </div>
                              )}
                              {product.numberOfFlowers > 0 && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">Total Flowers:</span>
                                  <span className="font-medium text-gray-800 text-xs">{product.numberOfFlowers}</span>
                                </div>
                              )}
                              {product.material && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">Material:</span>
                                  <span className="font-medium text-gray-800 capitalize text-xs">{product.material}</span>
                                </div>
                              )}
                              
                              {/* Current Selected Size Dimensions */}
                              {selectedSize && availableSizes.length > 0 && (() => {
                                const currentSize = availableSizes.find(size => size.id === selectedSize);
                                if (currentSize?.dimensions) {
                                  return (
                                    <>
                                      <hr className="border-gray-200" />
                                      <div className="pt-1">
                                        <div className="text-xs font-medium text-gray-700 mb-2">
                                          Selected Size: {currentSize.name}
                                        </div>
                                        {currentSize.dimensions.height > 0 && (
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600">Height:</span>
                                            <span className="font-medium text-blue-600 text-xs">{currentSize.dimensions.height} cm</span>
                                          </div>
                                        )}
                                        {currentSize.dimensions.width > 0 && (
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600">Width:</span>
                                            <span className="font-medium text-blue-600 text-xs">{currentSize.dimensions.width} cm</span>
                                          </div>
                                        )}
                                        {currentSize.dimensions.length > 0 && (
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600">Length:</span>
                                            <span className="font-medium text-blue-600 text-xs">{currentSize.dimensions.length} cm</span>
                                          </div>
                                        )}
                                        {currentSize.dimensions.depth > 0 && (
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600">Depth:</span>
                                            <span className="font-medium text-blue-600 text-xs">{currentSize.dimensions.depth} cm</span>
                                          </div>
                                        )}
                                        {currentSize.flowerCount && (
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-600">Flowers in this size:</span>
                                            <span className="font-medium text-green-600 text-xs">{currentSize.flowerCount}</span>
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Options & Actions */}
                      <div className="space-y-4">
                        {/* Price Section */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-2xl font-bold text-purple-600">Rs. {getTotalPrice().toFixed(2)}</span>
                            <span className="text-sm text-gray-500 line-through">Rs. {(getTotalPrice() * 1.2).toFixed(2)}</span>
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                              Save 20%
                            </span>
                          </div>
                          {quantity > 1 && (
                            <p className="text-xs text-gray-600">
                              Rs. {getCurrentPrice().toFixed(2)} each
                            </p>
                          )}
                        </div>

                        {/* Size Options - Enhanced with Full Dimensions */}
                        {availableSizes.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                              <FiPackage className="mr-1 h-4 w-4" />
                              Sizes
                            </h3>
                            <div className="space-y-3">
                              {availableSizes.map((size) => (
                                <button
                                  key={size.id}
                                  onClick={() => setSelectedSize(size.id)}
                                  className={`w-full border rounded-lg p-3 text-left transition-all ${
                                    selectedSize === size.id
                                      ? 'border-purple-500 bg-purple-50 text-purple-600 shadow-md'
                                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {/* Size Header */}
                                  <div className="flex justify-between items-center mb-2">
                                    <div className="font-medium text-sm">{size.name}</div>
                                    <div className="font-semibold text-purple-600 text-sm">Rs. {size.price.toFixed(2)}</div>
                                  </div>
                                  
                                  {/* Enhanced Dimensions Display */}
                                  
                                  
                                  {/* Additional Details */}
                                  <div className="flex items-center justify-between text-xs text-gray-600">
                                    {size.flowerCount && (
                                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                        {size.flowerCount} flowers
                                      </span>
                                    )}
                                    {!size.dimensions && size.dimensions && (
                                      <span className="text-right font-medium">
                                        {size.dimensions.height > 0 && `${size.dimensions.height}cm `}
                                        {size.dimensions.width > 0 && `× ${size.dimensions.width}cm`}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quantity & Add to Cart - Combined */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-900">Quantity</h3>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => handleQuantityChange(-1)}
                                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                              >
                                -
                              </button>
                              <span className="w-12 h-8 rounded-lg border border-gray-300 flex items-center justify-center font-medium text-sm">
                                {quantity}
                              </span>
                              <button 
                                onClick={() => handleQuantityChange(1)}
                                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          {/* Add to Cart Button */}
                          <button
                            onClick={handleAddToCart}
                            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                          >
                            <FiShoppingCart className="h-4 w-4" />
                            <span>Add to Cart - Rs. {getTotalPrice().toFixed(2)}</span>
                          </button>
                        </div>

                        {/* Service Info - Compact */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-center text-xs text-gray-700">
                              <FiTruck className="h-3 w-3 mr-2 text-green-600 flex-shrink-0" />
                              <span>Free delivery over Rs. 300</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-700">
                              <FiShield className="h-3 w-3 mr-2 text-blue-600 flex-shrink-0" />
                              <span>100% Quality guarantee</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-700">
                              <FiHeart className="h-3 w-3 mr-2 text-red-600 flex-shrink-0" />
                              <span>Handcrafted with love</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductCard;