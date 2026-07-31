import React, { useEffect, useState } from 'react';
import Sidebar_Seller from '../../components/sidebar/Sidebar_Seller';
import { Bell } from 'lucide-react';

const SellerDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    activeOrders: 0,
    totalRevenue: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/orders/seller/stats', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        
        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.message || 'Failed to fetch statistics');
        }
      } catch (err) {
        console.error('Error fetching seller stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    switch (statusLower) {
      case 'using':
        return 'bg-green-100 text-green-600';
      case 'completed':
        return 'bg-blue-100 text-blue-600';
      case 'ordered':
        return 'bg-yellow-100 text-yellow-600';
      case 'shipping':
        return 'bg-purple-100 text-purple-600';
      case 'return':
        return 'bg-orange-100 text-orange-600';
      case 'checking':
        return 'bg-indigo-100 text-indigo-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatStatus = (status) => {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar_Seller active="Dashboard" />
      
      <div className="flex-1">
        {/* Top Header */}
        {/* <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex justify-end items-center">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="h-6 w-6 text-gray-600" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <span className="text-sm font-medium text-gray-700">Seller account</span>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </header> */}

        {/* Main Content */}
        <main className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              <span className="ml-3 text-gray-600">Loading statistics...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-gray-500 text-sm font-medium mb-2">Total Products</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-gray-500 text-sm font-medium mb-2">Total Orders</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-gray-500 text-sm font-medium mb-2">Active Orders</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeOrders}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-gray-500 text-sm font-medium mb-2">Total Revenue</h3>
                  <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
                {stats.recentOrders.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No orders yet</p>
                ) : (
                  stats.recentOrders.map((order) => (
                    <div key={order.id} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">Order #{order.orderNumber || order.id}</h3>
                          <p className="text-sm text-gray-500">{formatDate(order.placedDate)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                          {formatStatus(order.status)}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default SellerDashboard;
