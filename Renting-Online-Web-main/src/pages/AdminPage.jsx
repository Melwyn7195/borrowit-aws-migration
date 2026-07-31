import React, { useState, useEffect } from 'react';
import Sidebar_Admin from '../components/sidebar/Sidebar_Admin';
import { Search, MoreHorizontal, Edit, Trash, Eye, Users, CheckCircle, XCircle, Clock, AlertTriangle, Shield, Ban, Unlock } from 'lucide-react';
import { API_BASE } from '../api/config';

const AdminPage = () => {
  const [activeFilter, setActiveFilter] = useState('All Users');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchStats = async () => {
    try {
      // Fetch all users to get accurate counts
      const response = await fetch(`${API_BASE}/api/users?page=1&limit=1000`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const allUsers = data.data.users || [];
        const totalUsers = data.data.pagination?.total || allUsers.length;
        const activeUsers = allUsers.filter(user => user.status === 'active').length;
        const suspendedUsers = allUsers.filter(user => user.status === 'suspended').length;
        const pendingUsers = allUsers.filter(user => user.status === 'pending').length;
        
        setStats([
          { label: 'Total Users', value: totalUsers.toString(), color: 'bg-blue-500' },
          { label: 'Active Users', value: activeUsers.toString(), color: 'bg-green-500' },
          { label: 'Suspended', value: suspendedUsers.toString(), color: 'bg-red-500' },
          { label: 'Pending', value: pendingUsers.toString(), color: 'bg-yellow-500' }
        ]);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchUsers = async (page = 1, status = '', search = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', 10);
      
      if (status && status !== 'All Users') {
        queryParams.append('status', status.toLowerCase());
      }
      
      if (search && search.trim()) {
        queryParams.append('search', search.trim());
      }

      const response = await fetch(`${API_BASE}/api/users?${queryParams.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users || []);
        setPagination(data.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      setActionLoading(true);
      setError(null);
      
      // Validate input data
      if (!userId || !updates || typeof updates !== 'object') {
        setError('Invalid data provided for update');
        return;
      }
      
      // Filter out undefined values
      const cleanUpdates = {};
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && updates[key] !== null && updates[key] !== '') {
          cleanUpdates[key] = updates[key];
        }
      });
      
      if (Object.keys(cleanUpdates).length === 0) {
        setError('No valid data to update');
        return;
      }
      
      // Check current user before making request
      const currentUserResponse = await fetch(`${API_BASE}/api/users/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        }
      });
      
      const currentUserData = await currentUserResponse.json();
      console.log('Current user:', currentUserData);
      
      if (!currentUserData.success || currentUserData.data?.role !== 'admin') {
        setError('Admin access required to update users');
        return;
      }
      
      console.log('Sending update request:', { userId, updates: cleanUpdates });
      console.log('Request URL:', `/api/users/${userId}`);
      console.log('Request body:', JSON.stringify(cleanUpdates));
      
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(cleanUpdates)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        setError(`Server error: ${response.status} - ${responseText}`);
        return;
      }
      
      console.log('Update response:', data);
      
      if (response.ok && data.success) {
        await fetchUsers(pagination.page, activeFilter, searchTerm);
        await fetchStats(); // Refresh stats after user update
        setShowEditModal(false);
        setSelectedUser(null);
      } else {
        // Handle different error status codes
        if (response.status === 403) {
          setError('Access denied. Admin privileges required.');
        } else if (response.status === 404) {
          setError('User not found.');
        } else if (response.status === 500) {
          setError(`Server error: ${data?.message || 'Internal server error'}`);
        } else {
          setError(data?.message || `Error: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setActionLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchUsers(pagination.page, activeFilter, searchTerm);
        setShowDeleteModal(false);
        setSelectedUser(null);
      } else {
        if (data.message?.includes('foreign key') || data.message?.includes('constraint')) {
          setError('Cannot delete user with existing orders/products. Try suspending instead.');
        } else {
          setError(data.message || 'Failed to delete user');
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user. User may have existing data.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickStatusChange = async (userId, newStatus) => {
    try {
      setActionLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      console.log("keke =",response)

      const data = await response.json();
      
      if (data.success) {
        await fetchUsers(pagination.page, activeFilter, searchTerm);
      } else {
        setError(data.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats(); // Fetch stats on initial load
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1, activeFilter, searchTerm);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [activeFilter, searchTerm]);

  const statsWithIcons = stats.map((stat, index) => {
    const icons = [Users, CheckCircle, XCircle, Clock];
    return {
      ...stat,
      icon: icons[index] || Users
    };
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar_Admin active="User Management" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar_Admin active="User Management" />
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all platform users</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsWithIcons.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                {['All Users', 'Active', 'Suspended', 'Pending'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      activeFilter === filter
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{user.user_id}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{user.username || 'N/A'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{user.role}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                          {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setSelectedUser(user);
                              setShowViewModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditModal(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-800 p-1 rounded hover:bg-yellow-50"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user.status === 'active' ? (
                            <button 
                              onClick={() => handleQuickStatusChange(user.user_id, 'suspended')}
                              className="text-orange-600 hover:text-orange-800 p-1 rounded hover:bg-orange-50"
                              title="Suspend User"
                              disabled={actionLoading}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleQuickStatusChange(user.user_id, 'active')}
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                              title="Activate User"
                              disabled={actionLoading}
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Delete User"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchUsers(pagination.page - 1, activeFilter, searchTerm)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchUsers(pagination.page + 1, activeFilter, searchTerm)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit User</h3>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const status = formData.get('status');
                const role = formData.get('role');
                
                // Validate that we have valid data
                if (!status || !role || !selectedUser?.user_id) {
                  setError('Missing required data for update');
                  return;
                }
                
                const updates = {
                  status: status,
                  role: role
                };
                console.log('Updating user:', selectedUser.user_id, 'with:', updates);
                handleUpdateUser(selectedUser.user_id, updates);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      name="status"
                      defaultValue={selectedUser?.status || 'active'}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      name="role"
                      defaultValue={selectedUser?.role || 'customer'}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="customer">Customer</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating...' : 'Update User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showViewModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">User Details</h3>
                <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User ID</label>
                    <p className="mt-1 text-sm text-gray-900">#{selectedUser.user_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.username || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedUser.role}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status?.charAt(0).toUpperCase() + selectedUser.status?.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedUser.updated_at ? new Date(selectedUser.updated_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {selectedUser.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.address}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setShowEditModal(true);
                  }}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                >
                  Edit User
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600">Delete User</h3>
                <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-700">
                  Are you sure you want to delete user <strong>{selectedUser.username || selectedUser.email}</strong>?
                </p>
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> If this user has existing orders or products, deletion may fail. 
                    Consider suspending the user instead.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteUser(selectedUser.user_id)}
                  disabled={actionLoading}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 disabled:opacity-50"
                >
                  {actionLoading ? 'Deleting...' : 'Delete User'}
                </button>
                <button
                  onClick={() => handleQuickStatusChange(selectedUser.user_id, 'suspended')}
                  disabled={actionLoading}
                  className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50"
                >
                  Suspend Instead
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
