import React, { useState } from 'react';
import { Upload, X, Plus, Loader, Store, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAdminAuth } from '../context/AdminAuthContext';

const Add = () => {
  const { admin } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStartTime, setUploadStartTime] = useState(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null);
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    occasion: '',
    flowerSelections: [], // Array of {flower: string, colors: string[]}
    artificialFlowerSelections: [], // Array of {flower: string, colors: string[], count: ''}
    freshFlowerSelections: [], // Array of {flower: string, colors: string[], count: ''}
    sizes: [], // Array of {size: string, flowerCount: string, price: '', dimensions: {height: '', width: '', depth: ''}}
    bearDetails: {
      sizes: [], // Array of {size: string, price: '', dimensions: {height: '', width: '', depth: ''}}
      colors: [], // Array of bear colors
    },
    dimensions: {
      height: '',
      width: '',
      depth: ''
    }
  });

  const [selectedSize, setSelectedSize] = useState('small');

  const availableSizes = ['Small', 'Medium', 'Large', 'Extra Large'];
  const bearSizes = ['Small', 'Medium', 'Large'];
  const bearColors = [
    'Brown', 'White', 'Pink', 'Blue', 'Purple', 'Yellow', 'Red', 'Black', 
    'Gray', 'Cream', 'Light Brown', 'Dark Brown'
  ];

  const productCategories = [
    { label: 'Fresh', value: 'fresh' },
    { label: 'Artificial', value: 'artificial' }, 
    { label: 'Fresh and Artificial', value: 'mixed' },
    { label: 'Bears', value: 'bears' }
  ];

  const categories = [
    'Wedding Bouquets',
    'Birthday Bouquets',
    'Anniversary Bouquets',
    'Sympathy Bouquets',
    'Valentine Bouquets',
    'Mother\'s Day Bouquets',
    'Mixed Bouquets',
    'Single Flower Bouquets',
    'Exotic Bouquets',
    'Seasonal Bouquets'
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

  const occasions = [
    'Wedding', 'Birthday', 'Anniversary', 'Valentine\'s Day', 'Mother\'s Day',
    'Graduation', 'Get Well', 'Sympathy', 'Congratulations', 'Just Because',
    'Housewarming', 'Thank You', 'Apology', 'New Baby'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDimensionChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [name]: value
      }
    }));
  };

  const addSize = (selectedSize) => {
    // Check if size already exists
    const sizeExists = formData.sizes.some(item => item.size === selectedSize);
    if (sizeExists) {
      toast.error(`${selectedSize} size is already added`);
      return;
    }

    if (formData.sizes.length >= 4) {
      toast.error('Maximum 4 sizes allowed');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { 
        size: selectedSize, 
        flowerCount: '',
        price: '',
        dimensions: { height: '', width: '', depth: '' }
      }]
    }));
  };

  const updateSize = (index, field, value) => {
    setFormData(prev => ({
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
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
    }));
  };

  const addArtificialFlowerSelection = (flower) => {
    setFormData(prev => ({
      ...prev,
      artificialFlowerSelections: [...prev.artificialFlowerSelections, { flower, colors: [], count: '' }]
    }));
  };

  const removeArtificialFlowerSelection = (index) => {
    setFormData(prev => ({
      ...prev,
      artificialFlowerSelections: prev.artificialFlowerSelections.filter((_, i) => i !== index)
    }));
  };

  const toggleArtificialFlowerColor = (flowerIndex, color) => {
    setFormData(prev => ({
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
    setFormData(prev => ({
      ...prev,
      artificialFlowerSelections: prev.artificialFlowerSelections.map((selection, i) => {
        if (i === index) {
          return { ...selection, count };
        }
        return selection;
      })
    }));
  };

  const addFreshFlowerSelection = (flower) => {
    setFormData(prev => ({
      ...prev,
      freshFlowerSelections: [...prev.freshFlowerSelections, { flower, colors: [], count: '' }]
    }));
  };

  const removeFreshFlowerSelection = (index) => {
    setFormData(prev => ({
      ...prev,
      freshFlowerSelections: prev.freshFlowerSelections.filter((_, i) => i !== index)
    }));
  };

  const toggleFreshFlowerColor = (flowerIndex, color) => {
    setFormData(prev => ({
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
    setFormData(prev => ({
      ...prev,
      freshFlowerSelections: prev.freshFlowerSelections.map((selection, i) => {
        if (i === index) {
          return { ...selection, count };
        }
        return selection;
      })
    }));
  };

  const toggleBearSize = (size) => {
    // Check if size already exists
    const sizeExists = formData.bearDetails.sizes.some(item => item.size === size);
    
    if (sizeExists) {
      // Remove the size
      setFormData(prev => ({
        ...prev,
        bearDetails: {
          ...prev.bearDetails,
          sizes: prev.bearDetails.sizes.filter(item => item.size !== size)
        }
      }));
    } else {
      // Add the size with dimensions
      setFormData(prev => ({
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
    setFormData(prev => ({
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
    setFormData(prev => ({
      ...prev,
      bearDetails: {
        ...prev.bearDetails,
        colors: prev.bearDetails.colors.includes(color)
          ? prev.bearDetails.colors.filter(c => c !== color)
          : [...prev.bearDetails.colors, color]
      }
    }));
  };

  const toggleArrayItem = (array, item, field) => {
    const newArray = array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
    
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 4) {
      toast.error('Maximum 4 files allowed');
      return;
    }

    files.forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isGLB = file.name.toLowerCase().endsWith('.glb') || file.type === 'model/gltf-binary';
      
      if (!isImage && !isGLB) {
        toast.error('Only image files (PNG, JPG, GIF) and GLB files are allowed');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // Increased to 10MB for GLB files
        toast.error('File size should be less than 10MB');
        return;
      }

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImages(prev => [...prev, {
            id: Date.now() + Math.random(),
            file: file,
            preview: e.target.result,
            name: file.name,
            type: 'image'
          }]);
        };
        reader.readAsDataURL(file);
      } else if (isGLB) {
        // For GLB files, we don't need a preview
        setImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          file: file,
          preview: null,
          name: file.name,
          type: '3d'
        }]);
      }
    });
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name) {
      toast.error('Please fill in product name');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a product category');
      return;
    }

    // Validation for bears category
    if (formData.category === 'bears') {
      if (formData.bearDetails.sizes.length === 0) {
        toast.error('Please select at least one bear size');
        return;
      }

      if (formData.bearDetails.colors.length === 0) {
        toast.error('Please select at least one bear color');
        return;
      }

      // Check if all bear sizes have prices
      const hasInvalidBearSize = formData.bearDetails.sizes.some(item => !item.price);
      if (hasInvalidBearSize) {
        toast.error('Please add prices for all bear sizes');
        return;
      }
    } else {
      // Validation for flower bouquets
      if (formData.sizes.length === 0) {
        toast.error('Please add at least one size with flower count');
        return;
      }

      // Check if all sizes have both size, flower count, and price
      const hasInvalidSize = formData.sizes.some(item => !item.size || !item.flowerCount || !item.price);
      if (hasInvalidSize) {
        toast.error('Please fill in all size, flower count, and price fields');
        return;
      }

      // Validation based on category type
      if (formData.category === 'fresh') {
        if (formData.freshFlowerSelections.length === 0) {
          toast.error('Please select at least one fresh flower type');
          return;
        }

        const hasInvalidFreshFlower = formData.freshFlowerSelections.some(selection => 
          selection.colors.length === 0
        );
        if (hasInvalidFreshFlower) {
          toast.error('Please select colors for all fresh flowers');
          return;
        }
      } else if (formData.category === 'artificial') {
        if (formData.artificialFlowerSelections.length === 0) {
          toast.error('Please select at least one artificial flower type');
          return;
        }

        const hasInvalidArtificialFlower = formData.artificialFlowerSelections.some(selection => 
          selection.colors.length === 0
        );
        if (hasInvalidArtificialFlower) {
          toast.error('Please select colors for all artificial flowers');
          return;
        }
      } else if (formData.category === 'mixed') {
        if (formData.freshFlowerSelections.length === 0 && formData.artificialFlowerSelections.length === 0) {
          toast.error('Please select at least one fresh or artificial flower type');
          return;
        }

        const hasInvalidFreshFlower = formData.freshFlowerSelections.some(selection => 
          selection.colors.length === 0
        );
        const hasInvalidArtificialFlower = formData.artificialFlowerSelections.some(selection => 
          selection.colors.length === 0
        );
        
        if (hasInvalidFreshFlower || hasInvalidArtificialFlower) {
          toast.error('Please select colors for all selected flowers');
          return;
        }
      }
    }

    if (!images.length) {
      toast.error('Please add at least one product file (image or 3D model)');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setUploadStartTime(Date.now());
    setEstimatedTimeRemaining(null);
    
    // Create a toast for upload progress
    const uploadToastId = toast.loading(
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span>Uploading product...</span>
          <span className="font-bold">0%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300" style={{width: '0%'}}></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">Preparing upload...</div>
      </div>,
      {
        position: "top-right",
        autoClose: false,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: false,
      }
    );
    
    try {
      const submitData = new FormData();
      
      // Append basic product data
      submitData.append('name', formData.name);
      submitData.append('description', formData.description || '');
      submitData.append('category', formData.category);
      submitData.append('occasion', formData.occasion);

      if (formData.category === 'bears') {
        // Handle bear product data
        submitData.append('bearDetails', JSON.stringify(formData.bearDetails));
        // Use general dimensions if no specific bear dimensions
        submitData.append('dimensions', JSON.stringify(formData.dimensions));
      } else {
        // Handle flower bouquet data
        const totalFlowers = formData.sizes.reduce((total, size) => total + parseInt(size.flowerCount || 0), 0);
        submitData.append('numberOfFlowers', totalFlowers.toString());
        
        // Append appropriate flower selections based on category
        if (formData.category === 'fresh') {
          submitData.append('freshFlowerSelections', JSON.stringify(formData.freshFlowerSelections));
        } else if (formData.category === 'artificial') {
          submitData.append('artificialFlowerSelections', JSON.stringify(formData.artificialFlowerSelections));
        } else if (formData.category === 'mixed') {
          submitData.append('freshFlowerSelections', JSON.stringify(formData.freshFlowerSelections));
          submitData.append('artificialFlowerSelections', JSON.stringify(formData.artificialFlowerSelections));
        }
        
        // Send the complete sizes array with flower counts and dimensions
        submitData.append('sizes', JSON.stringify(formData.sizes));
        submitData.append('dimensions', JSON.stringify(formData.dimensions));
      }

      // Append seller data with correct structure (from logged-in admin)
      const sellerDataFormatted = {
        name: admin?.name || 'Unknown',
        contact: admin?.phone || 'No contact'
      };
      submitData.append('seller', JSON.stringify(sellerDataFormatted));

      // Append images and 3D models
      images.forEach((item) => {
        if (item.type === 'image') {
          submitData.append('images', item.file);
        } else if (item.type === '3d') {
          submitData.append('models3d', item.file);
        }
      });

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
          
          // Calculate estimated time remaining
          const currentTime = Date.now();
          const elapsedTime = (currentTime - uploadStartTime) / 1000; // in seconds
          const uploadSpeed = event.loaded / elapsedTime; // bytes per second
          const remainingBytes = event.total - event.loaded;
          const estimatedSeconds = remainingBytes / uploadSpeed;
          
          let timeRemainingText = 'Calculating...';
          if (estimatedSeconds > 0 && isFinite(estimatedSeconds)) {
            if (estimatedSeconds < 60) {
              timeRemainingText = `${Math.round(estimatedSeconds)}s remaining`;
            } else {
              const minutes = Math.floor(estimatedSeconds / 60);
              const seconds = Math.round(estimatedSeconds % 60);
              timeRemainingText = `${minutes}m ${seconds}s remaining`;
            }
          }
          
          setEstimatedTimeRemaining(timeRemainingText);
          
          // Update the toast with progress
          toast.update(uploadToastId, {
            render: (
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span>Uploading product...</span>
                  <span className="font-bold text-pink-600">{percentComplete}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-300" 
                    style={{width: `${percentComplete}%`}}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {percentComplete < 100 ? timeRemainingText : 'Processing...'}
                </div>
              </div>
            ),
          });
        }
      });

      // Handle upload completion
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error occurred'));
        xhr.ontimeout = () => reject(new Error('Upload timeout'));
        
        // Configure request
        xhr.open('POST', `${import.meta.env.VITE_BACKEND_URL}/api/products`);
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('adminToken')}`);
        xhr.timeout = 300000; // 5 minutes timeout
        
        // Send the request
        xhr.send(submitData);
      });

      const data = await uploadPromise;
      
      // Log the response for debugging
      console.log('Response data:', data);

      // Dismiss the upload progress toast
      toast.dismiss(uploadToastId);

      if (data.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Product added successfully! 🎉</span>
          </div>,
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
        // Reset forms
        setFormData({
          name: '',
          description: '',
          category: '',
          occasion: '',
          flowerSelections: [],
          artificialFlowerSelections: [],
          freshFlowerSelections: [],
          sizes: [],
          bearDetails: {
            sizes: [],
            colors: []
          },
          dimensions: {
            height: '',
            width: '',
            depth: ''
          }
        });
        setImages([]);
        
        // Reset upload progress states
        setUploadProgress(0);
        setUploadStartTime(null);
        setEstimatedTimeRemaining(null);
      } else {
        throw new Error(data.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      
      // Dismiss the upload progress toast
      toast.dismiss(uploadToastId);
      
      // Show error toast
      toast.error(
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>{error.message || 'Failed to add product. Please try again.'}</span>
        </div>,
        {
          position: "top-right",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setUploadStartTime(null);
      setEstimatedTimeRemaining(null);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Store className="w-8 h-8 text-pink-600" />
            Add New Flower Bouquet
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Product Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Files * (Up to 4 files, at least 1 required)
              </label>
              <div className="border-2 border-dashed border-pink-300 rounded-lg p-6 bg-pink-50">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-pink-400 cursor-pointer" onClick={() => document.getElementById('imageUpload').click()} />
                  <div className="mt-4">
                    <label className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Click to upload product images or 3D models
                      </span>
                      <input
                        id="imageUpload"
                        type="file"
                        multiple
                        accept="image/*,.glb"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB each, GLB files for 3D products (Maximum 4 files)
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      {image.type === 'image' ? (
                        <img
                          src={image.preview}
                          alt={image.name}
                          className="w-full h-24 object-cover rounded-lg border-2 border-pink-200 group-hover:border-pink-400 transition-colors"
                        />
                      ) : (
                        <div className="w-full h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg border-2 border-pink-200 group-hover:border-pink-400 transition-colors flex flex-col items-center justify-center">
                          <Package className="w-8 h-8 text-purple-600 mb-1" />
                          <span className="text-xs text-purple-700 font-medium">3D Model</span>
                          <span className="text-xs text-gray-500 truncate w-full text-center px-1">
                            {image.name}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Basic Product Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter bouquet name (e.g., 'Romantic Red Rose Bouquet')"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {productCategories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Perfect Occasion
              </label>
              <select
                name="occasion"
                value={formData.occasion}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">Select an occasion</option>
                {occasions.map(occasion => (
                  <option key={occasion} value={occasion}>
                    {occasion}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Describe the bouquet (optional)"
              />
            </div>

            {/* Available Sizes and Flower Counts - Only for non-bears */}
            {formData.category !== 'bears' && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Available Sizes, Flower Counts & Dimensions</h2>
                </div>
                
                {/* Available Sizes to Select */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Available Sizes (Click to add)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {availableSizes.map(size => {
                      const isSelected = formData.sizes.some(item => item.size === size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => addSize(size)}
                          disabled={isSelected}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800 cursor-pointer'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.sizes.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No sizes selected yet. Click on sizes above to add them.</p>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Selected Sizes</h3>
                    {formData.sizes.map((item, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium text-gray-900 flex items-center gap-2">
                            <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                            {item.size}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeSize(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Flower Count</label>
                            <input
                              type="number"
                              value={item.flowerCount}
                              onChange={(e) => updateSize(index, 'flowerCount', e.target.value)}
                              placeholder="Number of flowers"
                              min="1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Price (LKR)</label>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateSize(index, 'price', e.target.value)}
                              placeholder="Price for this size"
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        
                        {/* Dimensions for this size */}
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Dimensions for {item.size}</h5>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Height (cm)</label>
                              <input
                                type="number"
                                value={item.dimensions?.height || ''}
                                onChange={(e) => updateSize(index, 'dimensions.height', e.target.value)}
                                step="0.1"
                                min="0"
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Width (cm)</label>
                              <input
                                type="number"
                                value={item.dimensions?.width || ''}
                                onChange={(e) => updateSize(index, 'dimensions.width', e.target.value)}
                                step="0.1"
                                min="0"
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Depth (cm)</label>
                              <input
                                type="number"
                                value={item.dimensions?.depth || ''}
                                onChange={(e) => updateSize(index, 'dimensions.depth', e.target.value)}
                                step="0.1"
                                min="0"
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dynamic Flower Selection - Only for non-bears */}
            {formData.category !== 'bears' && formData.category && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Flower Selection & Colors</h2>
                  <p className="text-sm text-gray-600">Select flowers, colors, and counts based on category</p>
                </div>

                {/* Fresh Flowers Section - Show for fresh and mixed categories */}
                {(formData.category === 'fresh' || formData.category === 'mixed') && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      Fresh Flowers
                    </h3>

                    {/* Available Fresh Flowers to Select */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Available Fresh Flowers (Click to add)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {flowerTypes.map(flower => {
                          const isSelected = formData.freshFlowerSelections.some(selection => selection.flower === flower);
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
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 cursor-pointer'
                              }`}
                            >
                              {flower}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selected Fresh Flowers with Colors and Counts */}
                    {formData.freshFlowerSelections.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-md font-medium text-gray-900">Selected Fresh Flowers</h4>
                        {formData.freshFlowerSelections.map((selection, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-gray-900 flex items-center gap-2">
                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                {selection.flower}
                              </h5>
                              <button
                                type="button"
                                onClick={() => removeFreshFlowerSelection(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="mb-2">
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                Available Colors for {selection.flower} ({selection.colors.length} selected)
                              </label>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
                                {flowerColors.map(color => (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => toggleFreshFlowerColor(index, color)}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                      selection.colors.includes(color)
                                        ? 'bg-green-500 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                                    }`}
                                  >
                                    {color}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {selection.colors.length === 0 && (
                              <p className="text-xs text-red-500 mt-1">
                                Please select at least one color
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {formData.freshFlowerSelections.length === 0 && (
                      <div className="text-center py-4 text-gray-500 bg-green-50 rounded-lg">
                        <p>No fresh flowers selected yet. Click on flowers above to add them.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Artificial Flowers Section - Show for artificial and mixed categories */}
                {(formData.category === 'artificial' || formData.category === 'mixed') && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      Artificial Flowers
                    </h3>

                    {/* Available Artificial Flowers to Select */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Available Artificial Flowers (Click to add)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {flowerTypes.map(flower => {
                          const isSelected = formData.artificialFlowerSelections.some(selection => selection.flower === flower);
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
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 cursor-pointer'
                              }`}
                            >
                              {flower}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selected Artificial Flowers with Colors and Counts */}
                    {formData.artificialFlowerSelections.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-md font-medium text-gray-900">Selected Artificial Flowers</h4>
                        {formData.artificialFlowerSelections.map((selection, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-gray-900 flex items-center gap-2">
                                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                {selection.flower}
                              </h5>
                              <button
                                type="button"
                                onClick={() => removeArtificialFlowerSelection(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="mb-2">
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                Available Colors for {selection.flower} ({selection.colors.length} selected)
                              </label>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
                                {flowerColors.map(color => (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => toggleArtificialFlowerColor(index, color)}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                      selection.colors.includes(color)
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
                                    }`}
                                  >
                                    {color}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {selection.colors.length === 0 && (
                              <p className="text-xs text-red-500 mt-1">
                                Please select at least one color
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {formData.artificialFlowerSelections.length === 0 && (
                      <div className="text-center py-4 text-gray-500 bg-blue-50 rounded-lg">
                        <p>No artificial flowers selected yet. Click on flowers above to add them.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Show message when no category is selected */}
                {!formData.category && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Please select a category first to choose flowers.</p>
                  </div>
                )}
              </div>
            )}

            {/* Bear Details - Only for bears category */}
            {formData.category === 'bears' && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg border border-amber-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  Bear Details
                </h2>

                {/* Bear Sizes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Available Bear Sizes (Click to add)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {bearSizes.map(size => {
                      const isSelected = formData.bearDetails.sizes.some(item => item.size === size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleBearSize(size)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Bear Sizes with Dimensions */}
                {formData.bearDetails.sizes.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Bear Sizes & Dimensions</h3>
                    <div className="space-y-4">
                      {formData.bearDetails.sizes.map((item, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border border-amber-200">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                              <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                              {item.size} Bear
                            </h4>
                            <button
                              type="button"
                              onClick={() => toggleBearSize(item.size)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* Price for this bear size */}
                          <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Price ($)</label>
                            <input
                              type="number"
                              value={item.price || ''}
                              onChange={(e) => updateBearSize(index, 'price', e.target.value)}
                              step="0.01"
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              placeholder="Price for this size"
                            />
                          </div>
                          
                          {/* Dimensions for this bear size */}
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Dimensions for {item.size} Bear</h5>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Height (cm)</label>
                                <input
                                  type="number"
                                  value={item.dimensions?.height || ''}
                                  onChange={(e) => updateBearSize(index, 'dimensions.height', e.target.value)}
                                  step="0.1"
                                  min="0"
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  placeholder="0.0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Width (cm)</label>
                                <input
                                  type="number"
                                  value={item.dimensions?.width || ''}
                                  onChange={(e) => updateBearSize(index, 'dimensions.width', e.target.value)}
                                  step="0.1"
                                  min="0"
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  placeholder="0.0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Depth (cm)</label>
                                <input
                                  type="number"
                                  value={item.dimensions?.depth || ''}
                                  onChange={(e) => updateBearSize(index, 'dimensions.depth', e.target.value)}
                                  step="0.1"
                                  min="0"
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  placeholder="0.0"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bear Colors */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Available Bear Colors (Select multiple)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {bearColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleBearColor(color)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.bearDetails.colors.includes(color)
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:from-pink-400 disabled:to-purple-400 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {uploadProgress > 0 ? `Uploading ${uploadProgress}%...` : 'Preparing Upload...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Product
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Add;
