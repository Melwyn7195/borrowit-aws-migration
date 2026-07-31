import React, { useState, useEffect } from 'react';
import Sidebar_Admin from '../../components/sidebar/Sidebar_Admin';
import { Bell } from 'lucide-react';
import { API_BASE } from '../../api/config';

const AdminDashboard = () => {
  const [stats, setStats] = useState([
    { label: 'Total Users', value: 'Loading...' },
    { label: 'Total Products', value: 'Loading...' },
  ]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    roleStats: {},
    userStatusStats: {},
    categoryStats: {},
    productStatusStats: {}
  });

  // Fetch users data from API (get all users for accurate statistics)
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users?limit=1000`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.data.users || []);
          return data.data.pagination?.total || data.data.users?.length || 0;
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    return 0;
  };

  // Fetch products data from API (get all products for accurate statistics)
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/products?limit=1000`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProducts(data.data.products || []);
          return data.data.pagination?.total || data.data.products?.length || 0;
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
    return 0;
  };

  // Fetch orders data from API (when available)
  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.count || data.data?.length || 0;
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    return 0;
  };

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [totalUsers, totalProducts, totalOrders] = await Promise.all([
        fetchUsers(),
        fetchProducts(),
        fetchOrders()
      ]);

      setStats([
        { label: 'Total Users', value: totalUsers },
        { label: 'Total Products', value: totalProducts }
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update statistics when users or products change
  useEffect(() => {
    if (users.length > 0 || products.length > 0) {
      // Calculate role statistics
      const roleStats = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      // Calculate user status statistics
      const userStatusStats = users.reduce((acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1;
        return acc;
      }, {});

      // Calculate category statistics
      const categoryStats = products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {});

      // Calculate product status statistics
      const productStatusStats = products.reduce((acc, product) => {
        acc[product.status] = (acc[product.status] || 0) + 1;
        return acc;
      }, {});

      setStatistics({
        roleStats,
        userStatusStats,
        categoryStats,
        productStatusStats
      });


    }
  }, [users, products]);

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar_Admin active="Dashboard" />
      
      <div className="flex-1">
        <main className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-gray-500 text-sm font-medium mb-2">{stat.label}</h3>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Users</h2>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-gray-500">Loading users...</div>
                ) : users.length > 0 ? (
                  users.slice(0, 4).map((user) => (
                    <div key={user.user_id} className="pb-4 border-b border-gray-200 last:border-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'seller' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">
                            {user.status === 'active' ? 'Active' : user.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No users found</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Products</h2>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-gray-500">Loading products...</div>
                ) : products.length > 0 ? (
                  products.slice(0, 4).map((product) => (
                    <div key={product.product_id} className="pb-4 border-b border-gray-200 last:border-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            ${product.price_per_day}/day
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            product.status === 'available' ? 'bg-green-100 text-green-800' :
                            product.status === 'rented' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {product.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No products found</div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Statistics</h2>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-gray-500">Loading statistics...</div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Users by Role</h3>
                      {Object.keys(statistics.roleStats).length > 0 ? (
                        Object.entries(statistics.roleStats).map(([role, count]) => (
                          <div key={role} className="flex justify-between items-center mb-1">
                            <span className="text-gray-600 capitalize">{role}</span>
                            <span className="font-semibold text-gray-900">{count}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm">No user data available</div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">User Status</h3>
                      {Object.keys(statistics.userStatusStats).length > 0 ? (
                        Object.entries(statistics.userStatusStats).map(([status, count]) => (
                          <div key={status} className="flex justify-between items-center mb-1">
                            <span className="text-gray-600 capitalize">{status}</span>
                            <span className={`font-semibold ${
                              status === 'active' ? 'text-green-600' :
                              status === 'suspended' ? 'text-red-600' :
                              'text-gray-900'
                            }`}>
                              {count}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm">No user status data available</div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Products by Category</h3>
                      {Object.keys(statistics.categoryStats).length > 0 ? (
                        Object.entries(statistics.categoryStats).slice(0, 5).map(([category, count]) => (
                          <div key={category} className="flex justify-between items-center mb-1">
                            <span className="text-gray-600 capitalize">{category}</span>
                            <span className="font-semibold text-gray-900">{count}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm">No category data available</div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Product Status</h3>
                      {Object.keys(statistics.productStatusStats).length > 0 ? (
                        Object.entries(statistics.productStatusStats).map(([status, count]) => (
                          <div key={status} className="flex justify-between items-center mb-1">
                            <span className="text-gray-600 capitalize">{status}</span>
                            <span className={`font-semibold ${
                              status === 'available' ? 'text-green-600' :
                              status === 'rented' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {count}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm">No product status data available</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
