import React, { useState, useEffect } from 'react';
import Sidebar_Admin from '../../components/sidebar/Sidebar_Admin';
import { Bell, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { API_BASE } from '../../api/config';

const AdminReports = () => {
  const [reports, setReports] = useState([
    { title: 'Sales Report', period: 'Monthly', value: 'Loading...', change: 'Loading...', trend: 'up' },
    { title: 'User Growth', period: 'Weekly', value: 'Loading...', change: 'Loading...', trend: 'up' },
    { title: 'Orders', period: 'Daily', value: 'Loading...', change: 'Loading...', trend: 'down' },
    { title: 'Revenue', period: 'Yearly', value: 'Loading...', change: 'Loading...', trend: 'up' },
  ]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  const fetchReportsData = async () => {
    setLoading(true);
    try {
      // Fetch users data for user growth stats
      const usersResponse = await fetch(`${API_BASE}/api/users`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      
      // Fetch products data  
      const productsResponse = await fetch(`${API_BASE}/api/products`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      // Fetch orders data (if available in future API)
      // const ordersResponse = await fetch('/api/orders', {...});

      let totalUsers = 0;
      let totalProducts = 0;
      let totalRevenue = 0;
      let products = [];

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        if (usersData.success) {
          totalUsers = usersData.data.pagination?.total || usersData.data.users?.length || 0;
        }
      }

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        if (productsData.success) {
          totalProducts = productsData.data.pagination?.total || productsData.data.products?.length || 0;
          products = productsData.data.products || [];
          
          // Calculate total revenue based on products and their rentals
          totalRevenue = products.reduce((sum, product) => {
            const rentals = product.total_rentals || 0;
            const pricePerDay = product.price_per_day || 0;
            const avgRentalDays = 3; // Assume average rental period of 3 days
            return sum + (rentals * pricePerDay * avgRentalDays);
          }, 0);
        }
      }

      setReports([
        { title: 'Sales Report', period: 'Monthly', value: `$${totalRevenue.toLocaleString()}`, change: '+12%', trend: 'up' },
        { title: 'User Growth', period: 'Weekly', value: totalUsers.toString(), change: '+8%', trend: 'up' },
        { title: 'Products', period: 'Total', value: totalProducts.toString(), change: '+5%', trend: 'up' },
        { title: 'Revenue', period: 'Yearly', value: `$${(totalRevenue * 12).toLocaleString()}`, change: '+25%', trend: 'up' },
      ]);

      // Set top products based on rentals
      const sortedProducts = products
        .sort((a, b) => (b.total_rentals || 0) - (a.total_rentals || 0))
        .slice(0, 5);
      
      setTopProducts(sortedProducts);

      // Generate mock recent transactions based on products data
      const mockTransactions = Array.from({ length: 5 }, (_, index) => {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        return {
          id: 1000 + index + 1,
          time: `${2 + index} hours ago`,
          amount: randomProduct?.price_per_day ? (randomProduct.price_per_day * 3).toFixed(2) : (Math.random() * 500 + 50).toFixed(2)
        };
      });
      
      setRecentTransactions(mockTransactions);

    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar_Admin active="Reports" />
      
      <div className="flex-1">
        {/* Top Header */}
        {/* <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex justify-end items-center">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="h-6 w-6 text-gray-600" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <span className="text-sm font-medium text-gray-700">Admin account</span>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </header> */}

        {/* Main Content */}
        <main className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <button className="bg-black text-white px-6 py-2.5 rounded-full font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Reports
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {reports.map((report, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium mb-1">{report.title}</h3>
                    <p className="text-xs text-gray-400">{report.period}</p>
                  </div>
                  {report.trend === 'up' ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">{report.value}</p>
                <p className={`text-sm font-semibold ${
                  report.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {report.change} from last period
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-gray-500">Loading transactions...</div>
                ) : recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center pb-4 border-b border-gray-200 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Transaction #{transaction.id}</p>
                        <p className="text-xs text-gray-400 mt-1">{transaction.time}</p>
                      </div>
                      <span className="text-lg font-bold text-gray-900">${transaction.amount}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No recent transactions</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Top Products</h2>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-gray-500">Loading products...</div>
                ) : topProducts.length > 0 ? (
                  topProducts.map((product) => (
                    <div key={product.product_id} className="flex justify-between items-center pb-4 border-b border-gray-200 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-300"></div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{product.total_rentals || 0} rentals</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No products found</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminReports;
