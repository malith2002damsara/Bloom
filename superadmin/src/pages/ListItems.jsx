import React, { useState, useEffect } from 'react';
import { Search, Package, Eye, Image } from 'lucide-react';
import { toast } from 'react-toastify';
import { superAdminAPI } from '../utils/api';

const ListItems = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [viewingProduct, setViewingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await superAdminAPI.getAllProducts();
      // accept multiple shapes returned by backend
      const items = res?.data?.products || res?.products || res?.data || [];
      setProducts(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
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
        (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const viewProduct = (product) => setViewingProduct(product);
  const closeView = () => setViewingProduct(null);

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await superAdminAPI.deleteProduct(productId);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Package className="w-8 h-8 text-pink-600" />
          Product Inventory
        </h1>
        <p className="text-gray-600">Manage products visible to admins and sellers</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products by name, flowers, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category & Price</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map(product => (
                  <tr key={product._id || product.id} className="hover:bg-pink-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-20 w-28 relative group">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="h-20 w-28 rounded-lg object-cover border-2 border-pink-200 group-hover:border-pink-400 transition-colors cursor-pointer" onClick={() => viewProduct(product)} />
                          ) : (
                            <div className="h-20 w-28 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Image className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">{product.name}</div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">{product.category}</span>
                        <div className="text-lg font-bold text-gray-900 mb-2">{product.price ? `$${product.price}` : '-'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {product.seller && (
                          <>
                            <div className="text-sm font-medium text-gray-900">{product.seller.name}</div>
                            <div className="text-xs text-gray-600">{product.seller.contact || product.seller.phone}</div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <button onClick={() => viewProduct(product)} className="text-pink-600 hover:text-pink-900 flex items-center gap-1 text-sm"><Eye className="w-4 h-4" />View</button>
                        <button onClick={() => handleDelete(product._id || product.id)} className="text-red-600 hover:text-red-900 flex items-center gap-1 text-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-200 px-6 py-4 z-10 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Eye className="w-6 h-6 text-pink-600" />Product Details</h2>
                <button onClick={closeView} className="text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg p-2 transition-all">Close</button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-xl border border-pink-200">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2"><Image className="w-5 h-5 text-pink-600" />Product Images</h3>
                  {viewingProduct.images && viewingProduct.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {viewingProduct.images.map((image, i) => (
                        <img key={i} src={image} alt={`${viewingProduct.name} ${i+1}`} className="w-full h-40 object-cover rounded-lg border-2 border-pink-200 shadow-sm" />
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 bg-gray-200 rounded-lg flex items-center justify-center"><Image className="w-12 h-12 text-gray-400" /></div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{viewingProduct.name}</h3>
                    <p className="text-3xl font-bold text-pink-600 mb-4">{viewingProduct.price ? `$${viewingProduct.price}` : '-'}</p>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                        <p className="text-gray-600 bg-white p-3 rounded-lg border">{viewingProduct.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Category</h4>
                          <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">{viewingProduct.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListItems;
