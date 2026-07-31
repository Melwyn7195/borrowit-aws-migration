import React, { useState, useEffect, useCallback } from 'react';
import Sidebar_Admin from '../../components/sidebar/Sidebar_Admin';
import { Search, Edit, Trash2, Mail, Eye, Package, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { API_BASE } from '../../api/config';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Email form state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: '',
    pricePerDay: '',
    status: '',
    condition: ''
  });

  // Stats
  const [stats, setStats] = useState([
    { label: 'Total Products', value: '0', color: 'bg-blue-500', icon: Package },
    { label: 'Available', value: '0', color: 'bg-green-500', icon: CheckCircle },
    { label: 'Rented', value: '0', color: 'bg-yellow-500', icon: AlertCircle },
    { label: 'Unavailable', value: '0', color: 'bg-red-500', icon: XCircle }
  ]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/products/categories/list`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch products
  const fetchProducts = useCallback(async (page = 1, status = '', category = '', search = '') => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', pagination.limit);

      if (status && status !== 'All') {
        queryParams.append('status', status.toLowerCase());
      }
      if (category && category !== 'All') {
        queryParams.append('category', category);
      }
      if (search && search.trim()) {
        queryParams.append('search', search.trim());
      }

      const response = await fetch(`${API_BASE}/api/products?${queryParams.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products || []);
        setPagination(data.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
      } else {
        setError(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/products?limit=1000`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const data = await response.json();

      if (data.success) {
        const allProducts = data.data.products || [];
        const total = data.data.pagination?.total || allProducts.length;
        const available = allProducts.filter(p => p.status === 'available').length;
        const rented = allProducts.filter(p => p.status === 'rented').length;
        const unavailable = allProducts.filter(p => p.status === 'unavailable' || p.status === 'maintenance').length;

        setStats([
          { label: 'Total Products', value: total.toString(), color: 'bg-blue-500', icon: Package },
          { label: 'Available', value: available.toString(), color: 'bg-green-500', icon: CheckCircle },
          { label: 'Rented', value: rented.toString(), color: 'bg-yellow-500', icon: AlertCircle },
          { label: 'Unavailable', value: unavailable.toString(), color: 'bg-red-500', icon: XCircle }
        ]);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchProducts(1, statusFilter, categoryFilter, searchTerm);
  }, [statusFilter, categoryFilter, fetchProducts]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(1, statusFilter, categoryFilter, searchTerm);
  };

  // Handle view product
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  // Handle edit product
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setEditForm({
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      pricePerDay: product.price_per_day || product.pricePerDay || '',
      status: product.status || 'available',
      condition: product.condition || ''
    });
    setShowEditModal(true);
  };

  // Handle delete product
  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  // Handle email seller
  const handleEmailSeller = (product) => {
    setSelectedProduct(product);
    setEmailSubject(`Regarding your product: ${product.name}`);
    setEmailMessage(`Dear Seller,\n\nWe noticed an issue with your product listing "${product.name}".\n\nPlease update the following information:\n\n[Describe the required changes here]\n\nBest regards,\nAdmin Team`);
    setShowEmailModal(true);
  };

  // Submit edit form
  const handleSubmitEdit = async () => {
    if (!selectedProduct) return;

    try {
      setActionLoading(true);

      const response = await fetch(`${API_BASE}/api/products/${selectedProduct.product_id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          category: editForm.category,
          price_per_day: parseFloat(editForm.pricePerDay),
          status: editForm.status,
          condition: editForm.condition
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowEditModal(false);
        setSelectedProduct(null);
        fetchProducts(pagination.page, statusFilter, categoryFilter, searchTerm);
        fetchStats();
        alert('Product updated successfully!');
      } else {
        alert(data.message || 'Failed to update product');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Failed to update product');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      setActionLoading(true);

      const response = await fetch(`${API_BASE}/api/products/${selectedProduct.product_id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setShowDeleteModal(false);
        setSelectedProduct(null);
        fetchProducts(pagination.page, statusFilter, categoryFilter, searchTerm);
        fetchStats();
        alert('Product deleted successfully!');
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    } finally {
      setActionLoading(false);
    }
  };

  // Send email to seller
  const handleSendEmail = async () => {
    if (!selectedProduct || !emailSubject || !emailMessage) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(`${API_BASE}/api/products/admin/notify-seller`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          productId: selectedProduct.product_id,
          subject: emailSubject,
          message: emailMessage
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowEmailModal(false);
        setSelectedProduct(null);
        setEmailSubject('');
        setEmailMessage('');
        alert('Email sent to seller successfully!');
      } else {
        alert(data.message || 'Failed to send email');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Failed to send email. Please check if email service is configured.');
    } finally {
      setActionLoading(false);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusStyles = {
      available: 'bg-green-100 text-green-800',
      rented: 'bg-yellow-100 text-yellow-800',
      unavailable: 'bg-red-100 text-red-800',
      maintenance: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar_Admin active="Product Management" />

      <div className="flex-1">
        <main className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-500 mt-1">Manage all products in the system</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 text-gray-900 pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </form>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 text-gray-900 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Status</option>
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="unavailable">Unavailable</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-50 text-gray-900 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-20 text-red-500">{error}</div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-gray-500">No products found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-gray-600 font-medium px-6 py-4 text-sm">Product</th>
                      <th className="text-left text-gray-600 font-medium px-6 py-4 text-sm">Category</th>
                      <th className="text-left text-gray-600 font-medium px-6 py-4 text-sm">Price/Day</th>
                      <th className="text-left text-gray-600 font-medium px-6 py-4 text-sm">Status</th>
                      <th className="text-left text-gray-600 font-medium px-6 py-4 text-sm">Seller</th>
                      <th className="text-left text-gray-600 font-medium px-6 py-4 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.product_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.images && product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Package size={20} className="text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-gray-900 font-medium">{product.name}</p>
                              <p className="text-gray-500 text-sm truncate max-w-[200px]">{product.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{product.category}</td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          ${product.price_per_day || product.pricePerDay}/day
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={product.status} />
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900">{product.seller_name || 'Unknown'}</p>
                          <p className="text-gray-500 text-sm">{product.seller_email || ''}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewProduct(product)}
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleEmailSeller(product)}
                              className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                              title="Email Seller"
                            >
                              <Mail size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <p className="text-gray-600 text-sm">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchProducts(pagination.page - 1, statusFilter, categoryFilter, searchTerm)}
                    disabled={pagination.page <= 1}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchProducts(pagination.page + 1, statusFilter, categoryFilter, searchTerm)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* View Modal */}
      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
            </div>
            <div className="p-6 space-y-4">
              {selectedProduct.images && selectedProduct.images[0] && (
                <img
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Name</p>
                  <p className="text-gray-900 font-medium">{selectedProduct.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Category</p>
                  <p className="text-gray-900 font-medium">{selectedProduct.category}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Price per Day</p>
                  <p className="text-gray-900 font-medium">${selectedProduct.price_per_day || selectedProduct.pricePerDay}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Status</p>
                  <StatusBadge status={selectedProduct.status} />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Condition</p>
                  <p className="text-gray-900 font-medium">{selectedProduct.condition || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Location</p>
                  <p className="text-gray-900 font-medium">{selectedProduct.location || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-sm">Description</p>
                  <p className="text-gray-900">{selectedProduct.description}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Seller</p>
                  <p className="text-gray-900 font-medium">{selectedProduct.seller_name || 'Unknown'}</p>
                  <p className="text-gray-500 text-sm">{selectedProduct.seller_email || ''}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Rating</p>
                  <p className="text-gray-900 font-medium">{selectedProduct.average_rating || 'No ratings'}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-gray-50 text-gray-900 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-50 text-gray-900 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-gray-50 text-gray-900 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Price per Day ($)</label>
                  <input
                    type="number"
                    value={editForm.pricePerDay}
                    onChange={(e) => setEditForm({ ...editForm, pricePerDay: e.target.value })}
                    className="w-full bg-gray-50 text-gray-900 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-gray-50 text-gray-900 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="available">Available</option>
                    <option value="rented">Rented</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Condition</label>
                  <select
                    value={editForm.condition}
                    onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                    className="w-full bg-gray-50 text-gray-900 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="new">New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEdit}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Delete Product</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600">
                Are you sure you want to delete <span className="text-gray-900 font-medium">"{selectedProduct.name}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Send Email to Seller</h2>
              <p className="text-gray-500 text-sm mt-1">
                Notify seller about product: {selectedProduct.name}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">To</label>
                <input
                  type="text"
                  value={selectedProduct.seller_email || selectedProduct.seller_name || 'Unknown'}
                  disabled
                  className="w-full bg-gray-100 text-gray-500 px-4 py-2.5 rounded-lg border border-gray-200"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Message</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={6}
                  className="w-full bg-gray-50 text-gray-900 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailSubject('');
                  setEmailMessage('');
                }}
                className="px-6 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={actionLoading || !emailSubject || !emailMessage}
                className="px-6 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
