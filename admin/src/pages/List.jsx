import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit2, Trash2, X, Package, Eye, Image, User } from 'lucide-react';
import { toast } from 'react-toastify';

const List = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: '',
    description: '',
    occasion: '',
    discount: 0, // Discount percentage (0-100)
    flowerSelections: [],
    artificialFlowerSelections: [],
    freshFlowerSelections: [],
    sizes: [],
    bearDetails: {
      sizes: [],
      colors: []
    },
    dimensions: { height: '', width: '', depth: '' }
  });

  const categories = [
    'fresh',
    'artificial', 
    'bears',
    'mixed'
  ];

  const flowerTypes = [
    'Roses', 'Tulips', 'Lilies', 'Carnations', 'Chrysanthemums', 'Gerberas',
    'Sunflowers', 'Orchids', 'Peonies', 'Hydrangeas', 'Baby\'s Breath',
    'Delphiniums', 'Alstroemeria', 'Freesias', 'Iris', 'Daffodils'
  ];

  const flowerColors = [
    'Red', 'Pink', 'White', 'Yellow', 'Orange', 'Purple', 'Blue',
    'Lavender', 'Peach', 'Coral', 'Burgundy', 'Cream', 'Mixed Colors'
  ];

  const availableSizes = ['Small', 'Medium', 'Large', 'Extra Large'];
  const bearSizes = ['Small', 'Medium', 'Large'];
  const bearColors = [
    'Brown', 'White', 'Pink', 'Blue', 'Purple', 'Yellow', 'Red', 'Black', 
    'Gray', 'Cream', 'Light Brown', 'Dark Brown'
  ];

  const bouquetSizes = ['small', 'medium', 'large'];
  const occasions = [
    'Wedding', 'Birthday', 'Anniversary', 'Valentine\'s Day', 'Mother\'s Day',
    'Graduation', 'Get Well', 'Sympathy', 'Congratulations', 'Just Because'
  ];

  // Helper function to get proper color values
  const getColorValue = (color) => {
    const colorMap = {
      'red': '#ef4444',
      'pink': '#ec4899',
      'white': '#ffffff',
      'yellow': '#eab308',
      'orange': '#f97316',
      'purple': '#a855f7',
      'blue': '#3b82f6',
      'lavender': '#a78bfa',
      'peach': '#fbbf24',
      'coral': '#fb7185',
      'burgundy': '#991b1b',
      'cream': '#fef3c7',
      'brown': '#a3665a',
      'black': '#1f2937',
      'gray': '#6b7280',
      'light brown': '#d2b48c',
      'dark brown': '#654321',
      'mixed colors': 'linear-gradient(45deg, #ef4444, #ec4899, #3b82f6, #eab308)'
    };

    return colorMap[color.toLowerCase()] || '#94a3b8';
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch only admin's products
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/products`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Get admin ID from token
        const token = localStorage.getItem('adminToken');
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const adminId = decoded.userId;
        
        // Filter products by adminId
        const adminProducts = (data.data.products || []).filter(
          product => product.adminId === adminId
        );
        setProducts(adminProducts);
      } else {
        throw new Error(data.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Only show toast if not a server connectivity issue
      if (!error.message.includes('500')) {
        toast.error('Failed to fetch products: ' + error.message);
      } else {
        console.warn('Server error - products may not be available');
        setProducts([]); // Set empty array to avoid crashes
      }
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name || '',
      category: product.category || '',
      description: product.description || '',
      occasion: product.occasion || '',
      discount: product.discount || 0,
      flowerSelections: product.flowerSelections || [],
      artificialFlowerSelections: product.artificialFlowerSelections || [],
      freshFlowerSelections: product.freshFlowerSelections || [],
      sizes: product.sizes || [],
      bearDetails: product.bearDetails || { sizes: [], colors: [] },
      dimensions: product.dimensions || { height: '', width: '', depth: '' }
    });
  };

  const viewProduct = (product) => {
    setViewingProduct(product);
  };

  const closeView = () => {
    setViewingProduct(null);
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditFormData({
      name: '',
      category: '',
      description: '',
      occasion: '',
      discount: 0,
      flowerSelections: [],
      artificialFlowerSelections: [],
      freshFlowerSelections: [],
      sizes: [],
      bearDetails: { sizes: [], colors: [] },
      dimensions: { height: '', width: '', depth: '' }
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare the submit data with automatic price calculation
      const submitData = {
        ...editFormData
      };

      // Calculate price from sizes and ensure proper formatting
      if (submitData.sizes && submitData.sizes.length > 0) {
        submitData.sizes = submitData.sizes.map(size => ({
          ...size,
          price: parseFloat(size.price) || 0,
          flowerCount: parseInt(size.flowerCount) || 0
        }));
        
        // Set main product price to the minimum of all size prices
        const sizePrices = submitData.sizes.map(size => parseFloat(size.price)).filter(price => price > 0);
        if (sizePrices.length > 0) {
          submitData.price = Math.min(...sizePrices);
        } else {
          submitData.price = 0;
        }
      }

      // Calculate price from bear details and ensure proper formatting
      if (submitData.bearDetails && submitData.bearDetails.sizes && submitData.bearDetails.sizes.length > 0) {
        submitData.bearDetails.sizes = submitData.bearDetails.sizes.map(size => ({
          ...size,
          price: parseFloat(size.price) || 0,
        }));
        
        // Set main product price to the minimum of all bear size prices
        const bearPrices = submitData.bearDetails.sizes.map(size => parseFloat(size.price)).filter(price => price > 0);
        if (bearPrices.length > 0) {
          submitData.price = Math.min(...bearPrices);
        } else {
          submitData.price = 0;
        }
      }

      // If no sizes are configured or no prices set, require at least one price
      if ((!submitData.sizes || submitData.sizes.length === 0) && 
          (!submitData.bearDetails?.sizes || submitData.bearDetails.sizes.length === 0)) {
        throw new Error('Please configure at least one size with a price');
      }

      // Ensure we have a valid price
      if (!submitData.price || submitData.price <= 0) {
        throw new Error('Please set a valid price for at least one size');
      }

      console.log('Submitting data:', submitData); // Debug log

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(submitData)
      });

      console.log('Response status:', response.status); // Debug log
      const data = await response.json();
      console.log('Response data:', data); // Debug log

      // Check if response is successful
      if (response.ok) {
        // Most successful responses should have data.success === true, but handle both cases
        if (data.success !== false) {
          toast.success('Product updated successfully');
          setEditingProduct(null);
          cancelEdit(); // Reset form data
          fetchProducts();
          return;
        }
      }

      // If we get here, something went wrong
      throw new Error(data.message || data.error || `Server error while updating product (Status: ${response.status})`);
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error.message || 'Failed to update product');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Product deleted successfully');
        fetchProducts();
      } else {
        throw new Error(data.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    console.log('Category changing to:', newCategory);
    
    setEditFormData(prev => {
      console.log('Previous form data:', prev);
      const updated = {
        ...prev,
        category: newCategory
      };
      console.log('Updated form data:', updated);
      return updated;
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for category changes
    if (name === 'category') {
      console.log('Category changing from:', editFormData.category, 'to:', value);
      setEditFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Size management functions for edit form
  const addSize = (selectedSize) => {
    const sizeExists = editFormData.sizes.some(item => item.size === selectedSize);
    if (sizeExists) {
      toast.error(`${selectedSize} size is already added`);
      return;
    }

    if (editFormData.sizes.length >= 4) {
      toast.error('Maximum 4 sizes allowed');
      return;
    }
    
    setEditFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { 
        size: selectedSize, 
        flowerCount: '',
        price: '', // Add individual price for each size
        dimensions: { height: '', width: '', depth: '' }
      }]
    }));
  };

  const updateSize = (index, field, value) => {
    setEditFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map((item, i) => {
        if (i === index) {
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            return {
              ...item,
              [parent]: {
                ...item[parent],
                [child]: value
              }
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const removeSize = (index) => {
    setEditFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
    }));
  };

  // Fresh flower management functions for edit form
  const addFreshFlowerSelection = (flower) => {
    const flowerExists = editFormData.freshFlowerSelections.some(selection => selection.flower === flower);
    if (flowerExists) {
      toast.error(`${flower} is already added`);
      return;
    }
    
    setEditFormData(prev => ({
      ...prev,
      freshFlowerSelections: [...prev.freshFlowerSelections, { flower, colors: [], count: '' }]
    }));
  };

  const removeFreshFlowerSelection = (index) => {
    setEditFormData(prev => ({
      ...prev,
      freshFlowerSelections: prev.freshFlowerSelections.filter((_, i) => i !== index)
    }));
  };

  const toggleFreshFlowerColor = (flowerIndex, color) => {
    setEditFormData(prev => ({
      ...prev,
      freshFlowerSelections: prev.freshFlowerSelections.map((selection, index) => {
        if (index === flowerIndex) {
          const colors = selection.colors.includes(color)
            ? selection.colors.filter(c => c !== color)
            : [...selection.colors, color];
          return { ...selection, colors };
        }
        return selection;
      })
    }));
  };

  const updateFreshFlowerCount = (index, count) => {
    setEditFormData(prev => ({
      ...prev,
      freshFlowerSelections: prev.freshFlowerSelections.map((selection, i) => {
        if (i === index) {
          return { ...selection, count };
        }
        return selection;
      })
    }));
  };

  // Artificial flower management functions for edit form
  const addArtificialFlowerSelection = (flower) => {
    const flowerExists = editFormData.artificialFlowerSelections.some(selection => selection.flower === flower);
    if (flowerExists) {
      toast.error(`${flower} is already added`);
      return;
    }
    
    setEditFormData(prev => ({
      ...prev,
      artificialFlowerSelections: [...prev.artificialFlowerSelections, { flower, colors: [], count: '' }]
    }));
  };

  const removeArtificialFlowerSelection = (index) => {
    setEditFormData(prev => ({
      ...prev,
      artificialFlowerSelections: prev.artificialFlowerSelections.filter((_, i) => i !== index)
    }));
  };

  const toggleArtificialFlowerColor = (flowerIndex, color) => {
    setEditFormData(prev => ({
      ...prev,
      artificialFlowerSelections: prev.artificialFlowerSelections.map((selection, index) => {
        if (index === flowerIndex) {
          const colors = selection.colors.includes(color)
            ? selection.colors.filter(c => c !== color)
            : [...selection.colors, color];
          return { ...selection, colors };
        }
        return selection;
      })
    }));
  };

  const updateArtificialFlowerCount = (index, count) => {
    setEditFormData(prev => ({
      ...prev,
      artificialFlowerSelections: prev.artificialFlowerSelections.map((selection, i) => {
        if (i === index) {
          return { ...selection, count };
        }
        return selection;
      })
    }));
  };

  // Bear management functions for edit form
  const toggleBearSize = (size) => {
    const sizeExists = editFormData.bearDetails.sizes.some(item => item.size === size);
    
    if (sizeExists) {
      setEditFormData(prev => ({
        ...prev,
        bearDetails: {
          ...prev.bearDetails,
          sizes: prev.bearDetails.sizes.filter(item => item.size !== size)
        }
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        bearDetails: {
          ...prev.bearDetails,
          sizes: [...prev.bearDetails.sizes, {
            size: size,
            price: '',
            dimensions: { height: '', width: '', depth: '' }
          }]
        }
      }));
    }
  };

  const updateBearSize = (index, field, value) => {
    setEditFormData(prev => ({
      ...prev,
      bearDetails: {
        ...prev.bearDetails,
        sizes: prev.bearDetails.sizes.map((item, i) => {
          if (i === index) {
            if (field.includes('.')) {
              const [parent, child] = field.split('.');
              return {
                ...item,
                [parent]: {
                  ...item[parent],
                  [child]: value
                }
              };
            }
            return { ...item, [field]: value };
          }
          return item;
        })
      }
    }));
  };

  const toggleBearColor = (color) => {
    setEditFormData(prev => ({
      ...prev,
      bearDetails: {
        ...prev.bearDetails,
        colors: prev.bearDetails.colors.includes(color)
          ? prev.bearDetails.colors.filter(c => c !== color)
          : [...prev.bearDetails.colors, color]
      }
    }));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Package className="w-8 h-8 text-pink-600" />
          Flower Bouquet Inventory
        </h1>
        <p className="text-gray-600">Manage your beautiful flower bouquet collection</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search bouquets by name, flowers, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((category, idx) => (
                <option key={`category-${idx}-${category}`} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bouquets found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category & Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flower Information
                  </th>
                 
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-pink-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-20 w-28 relative group">
                          {product.images && product.images.length > 0 ? (
                            <>
                              <img
                                className="h-20 w-28 rounded-lg object-cover border-2 border-pink-200 group-hover:border-pink-400 transition-colors cursor-pointer"
                                src={product.images[0]}
                                alt={product.name}
                                onClick={() => viewProduct(product)}
                              />
                              {product.images.length > 1 && (
                                <div className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                                  +{product.images.length - 1}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="h-20 w-28 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Image className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {product.description}
                          </div>
                          {product.occasion && (
                            <div className="text-xs text-purple-600 mt-1">
                              Perfect for: {product.occasion}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          {product.category}
                        </span>
                        {/* <div className="text-lg font-bold text-gray-900 mb-2">
                          From ${product.price?.toFixed(2)}
                        </div> */}
                        
                        {/* Size-specific pricing */}
                        {product.sizes && product.sizes.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-700">Size Pricing:</div>
                            <div className="space-y-1">
                              {product.sizes.slice(0, 3).map((sizeItem, index) => (
                                <div key={index} className="flex justify-between items-center text-xs bg-blue-50 px-2 py-1 rounded">
                                  <span className="font-medium text-blue-800">{sizeItem.size}</span>
                                  <span className="font-bold text-blue-900">${sizeItem.price?.toFixed(2) || '0.00'}</span>
                                </div>
                              ))}
                              {product.sizes.length > 3 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{product.sizes.length - 3} more sizes
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Bear pricing for bears category */}
                        {product.category === 'bears' && product.bearDetails?.sizes && product.bearDetails.sizes.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-700">Bear Pricing:</div>
                            <div className="space-y-1">
                              {product.bearDetails.sizes.slice(0, 3).map((sizeItem, index) => (
                                <div key={index} className="flex justify-between items-center text-xs bg-pink-50 px-2 py-1 rounded">
                                  <span className="font-medium text-pink-800">{sizeItem.size}</span>
                                  <span className="font-bold text-pink-900">${sizeItem.price?.toFixed(2) || '0.00'}</span>
                                </div>
                              ))}
                              {product.bearDetails.sizes.length > 3 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{product.bearDetails.sizes.length - 3} more sizes
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {/* Fresh Flowers */}
                        {product.freshFlowerSelections && product.freshFlowerSelections.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Fresh Flowers:</div>
                            <div className="flex flex-wrap gap-1">
                              {product.freshFlowerSelections.slice(0, 2).map((selection, index) => (
                                <span key={index} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                                  {selection.flower} {selection.count}
                                </span>
                              ))}
                              {product.freshFlowerSelections.length > 2 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                  +{product.freshFlowerSelections.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}                        {/* Artificial Flowers */}
                        {product.artificialFlowerSelections && product.artificialFlowerSelections.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Artificial Flowers:</div>
                            <div className="flex flex-wrap gap-1">
                              {product.artificialFlowerSelections.slice(0, 2).map((selection, index) => (
                                <span key={index} className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                                  {selection.flower} {selection.count}
                                </span>
                              ))}
                              {product.artificialFlowerSelections.length > 2 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                  +{product.artificialFlowerSelections.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Bear Details */}
                        {product.category === 'bears' && product.bearDetails && (
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Bear Details:</div>
                            <div className="space-y-1">
                              {product.bearDetails.sizes && product.bearDetails.sizes.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {product.bearDetails.sizes.map((sizeItem, index) => (
                                    <span key={index} className="px-2 py-1 text-xs bg-pink-100 text-pink-700 rounded-full">
                                      {sizeItem.size}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {product.bearDetails.colors && product.bearDetails.colors.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {product.bearDetails.colors.slice(0, 3).map((color, index) => (
                                    <span key={index} className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                                      {color}
                                    </span>
                                  ))}
                                  {product.bearDetails.colors.length > 3 && (
                                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                      +{product.bearDetails.colors.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                   
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => viewProduct(product)}
                          className="text-pink-600 hover:text-pink-900 flex items-center gap-1 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
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

      {/* Product View Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-200 px-6 py-4 z-10 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-pink-600" />
                  Bouquet Details
                </h2>
                <button
                  onClick={closeView}
                  className="text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg p-2 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Images Section */}
                <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-xl border border-pink-200">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                    <Image className="w-5 h-5 text-pink-600" />
                    Product Images
                  </h3>
                  {viewingProduct.images && viewingProduct.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {viewingProduct.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`${viewingProduct.name} ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg border-2 border-pink-200 group-hover:border-pink-400 transition-colors shadow-sm"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <span className="text-gray-500">No images available</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Basic Info */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{viewingProduct.name}</h3>
                    <p className="text-3xl font-bold text-pink-600 mb-4">${viewingProduct.price?.toFixed(2)}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                        <p className="text-gray-600 bg-white p-3 rounded-lg border">{viewingProduct.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Category</h4>
                          <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                            {viewingProduct.category}
                          </span>
                        </div>
                        {viewingProduct.occasion && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Perfect For</h4>
                            <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                              {viewingProduct.occasion}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                
                  
                </div>
              </div>

              {/* Detailed Product Information */}
              <div className="mt-8 space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-600" />
                  Detailed Information
                </h3>
                
                {/* Available Sizes with Flower Counts */}
                {viewingProduct.sizes && viewingProduct.sizes.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-900 mb-4">Available Sizes & Pricing</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {viewingProduct.sizes.map((sizeItem, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border border-blue-300 shadow-sm">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-blue-900 text-lg">{sizeItem.size}</span>
                            <span className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                              {sizeItem.flowerCount} flowers
                            </span>
                          </div>
                          
                          {/* Pricing Section */}
                          <div className="mb-3 space-y-2">
                            {sizeItem.oldPrice && parseFloat(sizeItem.oldPrice) > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Old Price:</span>
                                <span className="text-sm text-gray-500 line-through">Rs. {parseFloat(sizeItem.oldPrice).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-700">Price:</span>
                              <span className="text-lg font-bold text-green-600">Rs. {parseFloat(sizeItem.price || 0).toFixed(2)}</span>
                            </div>
                            
                            {/* Display Discount if applicable */}
                            {sizeItem.oldPrice && parseFloat(sizeItem.oldPrice) > 0 && parseFloat(sizeItem.price) < parseFloat(sizeItem.oldPrice) && (
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-2 py-1 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-green-800">
                                    {Math.round(((parseFloat(sizeItem.oldPrice) - parseFloat(sizeItem.price)) / parseFloat(sizeItem.oldPrice)) * 100 * 100) / 100}% OFF
                                  </span>
                                  <span className="text-xs font-semibold text-green-700">
                                    Save Rs. {(parseFloat(sizeItem.oldPrice) - parseFloat(sizeItem.price)).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {sizeItem.dimensions && (sizeItem.dimensions.height || sizeItem.dimensions.width || sizeItem.dimensions.depth) && (
                            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              <strong>Dimensions:</strong> {sizeItem.dimensions.height}"H × {sizeItem.dimensions.width}"W × {sizeItem.dimensions.depth}"D
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fresh Flowers */}
                {viewingProduct.freshFlowerSelections && viewingProduct.freshFlowerSelections.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      Fresh Flowers
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingProduct.freshFlowerSelections.map((selection, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border border-green-300 shadow-sm">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-green-900 text-lg">{selection.flower}</span>
                            <span className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded-full">
                              Qty: {selection.count}
                            </span>
                          </div>
                          {selection.colors && selection.colors.length > 0 && (
                            <div>
                              <span className="text-xs font-medium text-gray-700 mb-2 block">Available Colors:</span>
                              <div className="flex flex-wrap gap-1">
                                {selection.colors.map((color, colorIndex) => (
                                  <div key={colorIndex} className="flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-green-300 shadow-sm">
                                    <div
                                      className="w-3 h-3 rounded-full border border-gray-300 shadow-sm"
                                      style={{ 
                                        backgroundColor: getColorValue(color)
                                      }}
                                    />
                                    <span className="text-xs text-gray-700 font-medium">{color}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Artificial Flowers */}
                {viewingProduct.artificialFlowerSelections && viewingProduct.artificialFlowerSelections.length > 0 && (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-200">
                    <h4 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                      Artificial Flowers
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingProduct.artificialFlowerSelections.map((selection, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border border-yellow-300 shadow-sm">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-yellow-900 text-lg">{selection.flower}</span>
                            <span className="text-sm text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                              Qty: {selection.count}
                            </span>
                          </div>
                          {selection.colors && selection.colors.length > 0 && (
                            <div>
                              <span className="text-xs font-medium text-gray-700 mb-2 block">Available Colors:</span>
                              <div className="flex flex-wrap gap-1">
                                {selection.colors.map((color, colorIndex) => (
                                  <div key={colorIndex} className="flex items-center gap-1 bg-white px-2 py-1 rounded-full border border-yellow-300 shadow-sm">
                                    <div
                                      className="w-3 h-3 rounded-full border border-gray-300 shadow-sm"
                                      style={{ 
                                        backgroundColor: getColorValue(color)
                                      }}
                                    />
                                    <span className="text-xs text-gray-700 font-medium">{color}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bear Details */}
                {viewingProduct.category === 'bears' && viewingProduct.bearDetails && (
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-6 rounded-xl border border-pink-200">
                    <h4 className="text-lg font-semibold text-pink-900 mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 bg-pink-500 rounded-full"></span>
                      Bear Details
                    </h4>
                    
                    {viewingProduct.bearDetails.sizes && viewingProduct.bearDetails.sizes.length > 0 && (
                      <div className="mb-6">
                        <h5 className="text-md font-medium text-gray-700 mb-3">Available Sizes:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {viewingProduct.bearDetails.sizes.map((sizeItem, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-pink-300 shadow-sm">
                              <div className="font-bold text-pink-900 text-lg mb-2">{sizeItem.size}</div>
                              {sizeItem.dimensions && (sizeItem.dimensions.height || sizeItem.dimensions.width || sizeItem.dimensions.depth) && (
                                <div className="text-xs text-gray-600 bg-pink-50 p-2 rounded">
                                  <strong>Dimensions:</strong> {sizeItem.dimensions.height}"H × {sizeItem.dimensions.width}"W × {sizeItem.dimensions.depth}"D
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {viewingProduct.bearDetails.colors && viewingProduct.bearDetails.colors.length > 0 && (
                      <div>
                        <h5 className="text-md font-medium text-gray-700 mb-3">Available Colors:</h5>
                        <div className="flex flex-wrap gap-2">
                          {viewingProduct.bearDetails.colors.map((color, index) => (
                            <div key={index} className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-pink-300 shadow-sm">
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                                style={{ backgroundColor: getColorValue(color) }}
                              />
                              <span className="text-sm text-gray-700 font-medium">{color}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Mixed Category Information */}
                {viewingProduct.category === 'mixed' && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-800 mb-2">Mixed Bouquet</div>
                      <p className="text-purple-600">This beautiful bouquet contains both fresh and artificial flowers</p>
                    </div>
                  </div>
                )}

                {/* Care Instructions */}
                {viewingProduct.care_instructions && (
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-200">
                    <h4 className="font-semibold text-cyan-900 mb-3">Care Instructions</h4>
                    <p className="text-cyan-800">{viewingProduct.care_instructions}</p>
                  </div>
                )}

                {/* Additional Information */}
                <div className="flex flex-wrap gap-3">
                  {viewingProduct.featured && (
                    <span className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full text-sm font-medium shadow-lg">
                      ⭐ Featured Product
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Edit2 className="w-6 h-6 text-blue-600" />
                  Edit Product
                </h2>
                <button
                  onClick={cancelEdit}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-8">
              {/* Basic Product Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Product Information
                </h3>
                
                <div className="grid grid-cols-1 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Beautiful Rose Bouquet"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditInputChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Describe your beautiful bouquet..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Occasion
                    </label>
                    <select
                      name="occasion"
                      value={editFormData.occasion}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select Occasion</option>
                      {occasions.map(occasion => (
                        <option key={occasion} value={occasion}>
                          {occasion}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Flowers & Product Details Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  Flowers & Product Details
                </h3>

                {/* Size Configuration - Only for non-bears */}
                {editFormData.category !== 'bears' && editFormData.category && (
                  <div className="mb-8">
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Available Sizes (Click to add)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {availableSizes.map(size => {
                          const isSelected = editFormData.sizes.some(item => item.size === size);
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => addSize(size)}
                              disabled={isSelected}
                              className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 cursor-pointer shadow-sm hover:shadow-md'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {editFormData.sizes.length > 0 && (
                      <div className="space-y-4 mb-8">
                        <h4 className="text-lg font-medium text-gray-900">Selected Sizes</h4>
                        {editFormData.sizes.map((item, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                              <h5 className="font-medium text-gray-900 flex items-center gap-2">
                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                {item.size}
                              </h5>
                              <button
                                type="button"
                                onClick={() => removeSize(index)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Flower Count *</label>
                                <input
                                  type="number"
                                  value={item.flowerCount}
                                  onChange={(e) => updateSize(index, 'flowerCount', e.target.value)}
                                  placeholder="Number of flowers"
                                  min="1"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Old Price (Rs.) - Optional</label>
                                <input
                                  type="number"
                                  value={item.oldPrice || ''}
                                  onChange={(e) => updateSize(index, 'oldPrice', e.target.value)}
                                  placeholder="Original price"
                                  min="0"
                                  step="0.01"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">New Price (Rs.) *</label>
                                <input
                                  type="number"
                                  value={item.price || ''}
                                  onChange={(e) => updateSize(index, 'price', e.target.value)}
                                  placeholder="Current price"
                                  min="0"
                                  step="0.01"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Height (inches)</label>
                                <input
                                  type="number"
                                  value={item.dimensions?.height || ''}
                                  onChange={(e) => updateSize(index, 'dimensions.height', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                  step="0.1"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Width (inches)</label>
                                <input
                                  type="number"
                                  value={item.dimensions?.width || ''}
                                  onChange={(e) => updateSize(index, 'dimensions.width', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                  step="0.1"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Depth (inches)</label>
                                <input
                                  type="number"
                                  value={item.dimensions?.depth || ''}
                                  onChange={(e) => updateSize(index, 'dimensions.depth', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                  step="0.1"
                                  min="0"
                                />
                              </div>
                            </div>
                            
                            {/* Display calculated discount */}
                            {item.oldPrice > 0 && item.price > 0 && parseFloat(item.price) < parseFloat(item.oldPrice) && (
                              <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-green-800">
                                    💰 Discount: {Math.round(((parseFloat(item.oldPrice) - parseFloat(item.price)) / parseFloat(item.oldPrice)) * 100 * 100) / 100}% OFF
                                  </span>
                                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                    Save Rs. {(parseFloat(item.oldPrice) - parseFloat(item.price)).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Fresh Flowers Section */}
                {(editFormData.category === 'fresh' || editFormData.category === 'mixed') && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      Fresh Flowers
                    </h4>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Available Fresh Flowers (Click to add)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {flowerTypes.map(flower => {
                          const isSelected = editFormData.freshFlowerSelections.some(selection => selection.flower === flower);
                          return (
                            <button
                              key={flower}
                              type="button"
                              onClick={() => {
                                if (!isSelected) {
                                  addFreshFlowerSelection(flower);
                                }
                              }}
                              disabled={isSelected}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 cursor-pointer shadow-sm hover:shadow-md'
                              }`}
                            >
                              {flower}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {editFormData.freshFlowerSelections.length > 0 && (
                      <div className="space-y-4">
                        <h5 className="text-md font-medium text-gray-900">Selected Fresh Flowers</h5>
                        {editFormData.freshFlowerSelections.map((selection, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <h6 className="font-medium text-gray-900 flex items-center gap-2">
                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                {selection.flower}
                              </h6>
                              <button
                                type="button"
                                onClick={() => removeFreshFlowerSelection(index)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="mb-4">
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                Available Colors for {selection.flower} ({selection.colors.length} selected)
                              </label>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                {flowerColors.map(color => (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => toggleFreshFlowerColor(index, color)}
                                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                                      selection.colors.includes(color)
                                        ? 'bg-green-500 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                                    }`}
                                  >
                                    {color}
                                  </button>
                                ))}
                              </div>
                            </div>

                            
                            
                            {selection.colors.length === 0 && (
                              <p className="text-xs text-red-500 mt-2">
                                Please select at least one color
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Artificial Flowers Section */}
                {(editFormData.category === 'artificial' || editFormData.category === 'mixed') && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      Artificial Flowers
                    </h4>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Available Artificial Flowers (Click to add)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {flowerTypes.map(flower => {
                          const isSelected = editFormData.artificialFlowerSelections.some(selection => selection.flower === flower);
                          return (
                            <button
                              key={flower}
                              type="button"
                              onClick={() => {
                                if (!isSelected) {
                                  addArtificialFlowerSelection(flower);
                                }
                              }}
                              disabled={isSelected}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 cursor-pointer shadow-sm hover:shadow-md'
                              }`}
                            >
                              {flower}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {editFormData.artificialFlowerSelections.length > 0 && (
                      <div className="space-y-4">
                        <h5 className="text-md font-medium text-gray-900">Selected Artificial Flowers</h5>
                        {editFormData.artificialFlowerSelections.map((selection, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <h6 className="font-medium text-gray-900 flex items-center gap-2">
                                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                {selection.flower}
                              </h6>
                              <button
                                type="button"
                                onClick={() => removeArtificialFlowerSelection(index)}
                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="mb-4">
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                Available Colors for {selection.flower} ({selection.colors.length} selected)
                              </label>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                {flowerColors.map(color => (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => toggleArtificialFlowerColor(index, color)}
                                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                                      selection.colors.includes(color)
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
                                    }`}
                                  >
                                    {color}
                                  </button>
                                ))}
                              </div>
                            </div>

                            
                            
                            {selection.colors.length === 0 && (
                              <p className="text-xs text-red-500 mt-2">
                                Please select at least one color
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bear Details Section */}
                {editFormData.category === 'bears' && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-amber-700 mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                      Bear Details
                    </h4>

                    {/* Bear Sizes */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Available Bear Sizes (Click to add/remove)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {bearSizes.map(size => {
                          const isSelected = editFormData.bearDetails.sizes.some(item => item.size === size);
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => toggleBearSize(size)}
                              className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-amber-500 text-white shadow-md'
                                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-sm hover:shadow-md'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {editFormData.bearDetails.sizes.length > 0 && (
                      <div className="space-y-4 mb-6">
                        <h5 className="text-md font-medium text-gray-900">Selected Bear Sizes</h5>
                        {editFormData.bearDetails.sizes.map((item, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <h6 className="font-medium text-gray-900 flex items-center gap-2">
                                <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                                {item.size} Bear
                              </h6>
                            </div>
                            
                            {/* Pricing section with old and new price */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Old Price (Rs.) - Optional</label>
                                <input
                                  type="number"
                                  value={item.oldPrice || ''}
                                  onChange={(e) => updateBearSize(index, 'oldPrice', e.target.value)}
                                  step="0.01"
                                  min="0"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                  placeholder="Original price"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">New Price (Rs.) *</label>
                                <input
                                  type="number"
                                  value={item.price || ''}
                                  onChange={(e) => updateBearSize(index, 'price', e.target.value)}
                                  step="0.01"
                                  min="0"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                  placeholder="Current price"
                                />
                              </div>
                            </div>
                            
                            {/* Display calculated discount */}
                            {item.oldPrice > 0 && item.price > 0 && parseFloat(item.price) < parseFloat(item.oldPrice) && (
                              <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-green-800">
                                    💰 Discount: {Math.round(((parseFloat(item.oldPrice) - parseFloat(item.price)) / parseFloat(item.oldPrice)) * 100 * 100) / 100}% OFF
                                  </span>
                                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                    Save Rs. {(parseFloat(item.oldPrice) - parseFloat(item.price)).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Dimensions section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Height (inches)</label>
                                <input
                                  type="number"
                                  value={item.dimensions?.height || ''}
                                  onChange={(e) => updateBearSize(index, 'dimensions.height', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                  step="0.1"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Width (inches)</label>
                                <input
                                  type="number"
                                  value={item.dimensions?.width || ''}
                                  onChange={(e) => updateBearSize(index, 'dimensions.width', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                  step="0.1"
                                  min="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Depth (inches)</label>
                                <input
                                  type="number"
                                  value={item.dimensions?.depth || ''}
                                  onChange={(e) => updateBearSize(index, 'dimensions.depth', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                  step="0.1"
                                  min="0"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bear Colors */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Available Bear Colors (Click to add/remove) - {editFormData.bearDetails.colors.length} selected
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {bearColors.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => toggleBearColor(color)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                              editFormData.bearDetails.colors.includes(color)
                                ? 'bg-amber-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Show message when no category is selected */}
                {!editFormData.category && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Please select a category first to configure product details.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all font-medium shadow-lg hover:shadow-xl"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default List;