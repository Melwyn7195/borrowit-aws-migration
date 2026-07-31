import React, { useState } from 'react';
import Sidebar_Seller from '../components/sidebar/Sidebar_Seller';
import { Search, Plus, ChevronDown, Bell } from 'lucide-react';

const SellerDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Most Popular');

  // Sample product data
  const products = [
    {
      id: 1,
      name: "Gradient Graphic T-shirt",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
      rating: 3.5,
      reviews: 5,
      price: 145,
      originalPrice: null,
      discount: null
    },
    {
      id: 2,
      name: "Polo with Tipping Details",
      image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop",
      rating: 4.5,
      reviews: 5,
      price: 180,
      originalPrice: null,
      discount: null
    },
    {
      id: 3,
      name: "Black Striped T-shirt",
      image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop",
      rating: 5.0,
      reviews: 5,
      price: 120,
      originalPrice: 150,
      discount: 30
    },
    {
      id: 4,
      name: "Skinny Fit Jeans",
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
      rating: 3.5,
      reviews: 5,
      price: 240,
      originalPrice: 260,
      discount: 20
    },
    {
      id: 5,
      name: "Checkered Shirt",
      image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop",
      rating: 4.5,
      reviews: 5,
      price: 180,
      originalPrice: null,
      discount: null
    },
    {
      id: 6,
      name: "Sleeve Striped T-shirt",
      image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop",
      rating: 4.5,
      reviews: 5,
      price: 130,
      originalPrice: 160,
      discount: 30
    }
  ];

  // Sample order data
  const orders = [
    {
      id: "ORD-2025-0324",
      placedDate: "September 15, 2025",
      status: "Active",
      items: [
        {
          name: "Checkered Shirt",
          size: "Medium",
          color: "Red",
          rentalPeriod: "7 days",
          price: 180,
          image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop"
        },
        {
          name: "Skinny Fit Jeans",
          size: "Large",
          color: "Blue",
          rentalPeriod: "7 days",
          price: 240,
          image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop"
        }
      ],
      totalAmount: 467
    },
    {
      id: "ORD-2025-0298",
      placedDate: "September 8, 2025",
      status: "Completed",
      items: [
        {
          name: "Gradient Graphic T-shirt",
          size: "Large",
          color: "Multi",
          rentalPeriod: "3 days",
          price: 145,
          image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop"
        }
      ],
      totalAmount: 145
    },
    {
      id: "ORD-2025-0267",
      placedDate: "August 28, 2025",
      status: "Completed",
      items: [
        {
          name: "Black Striped T-shirt",
          size: "Medium",
          color: "Black",
          rentalPeriod: "5 days",
          price: 120,
          image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop"
        }
      ],
      totalAmount: 120
    }
  ];

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => {
          if (index < fullStars) {
            return <span key={index} className="text-yellow-400">★</span>;
          } else if (index === fullStars && hasHalfStar) {
            return <span key={index} className="text-yellow-400">⯨</span>;
          } else {
            return <span key={index} className="text-gray-300">★</span>;
          }
        })}
        <span className="text-sm text-gray-600 ml-1">{rating}/5</span>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Products</h3>
          <p className="text-3xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Active Orders</h3>
          <p className="text-3xl font-bold text-gray-900">
            {orders.filter(o => o.status === 'Active').length}
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
        {orders.slice(0, 3).map((order) => (
          <div key={order.id} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                <p className="text-sm text-gray-500">{order.placedDate}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                order.status === 'Active' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {order.status}
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900">${order.totalAmount}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
        <button className="bg-black text-white px-6 py-2.5 rounded-full font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add product
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 pl-12 pr-4 py-3 rounded-full text-sm placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-black/10"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
          Sort by: {sortBy} <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square bg-gray-200 overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
              <div className="mb-2">
                {renderStars(product.rating)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-lg text-gray-400 line-through">${product.originalPrice}</span>
                    <span className="bg-red-100 text-red-600 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                      -{product.discount}%
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Orders</h1>
      
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {['All Orders', 'Active', 'Completed', 'Returned'].map((tab) => (
          <button
            key={tab}
            className={`pb-3 px-4 font-medium transition-colors ${
              tab === 'All Orders'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Order #{order.id}</h3>
                <p className="text-sm text-gray-500">Placed on {order.placedDate}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                order.status === 'Active'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {order.status}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-4 pb-3 border-b border-gray-100 last:border-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500">
                      Size: {item.size} | Color: {item.color}
                    </p>
                    <p className="text-sm text-gray-600">Rental Period: {item.rentalPeriod}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${item.price}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-500">Total Amount:</p>
                <p className="text-2xl font-bold text-gray-900">${order.totalAmount}</p>
              </div>
              <div className="flex gap-3">
                {order.status === 'Active' && (
                  <button className="px-6 py-2.5 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition-colors">
                    Track Order
                  </button>
                )}
                {order.status === 'Completed' && (
                  <>
                    <button className="px-6 py-2.5 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
                      Rent Again
                    </button>
                    <button className="px-6 py-2.5 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition-colors">
                      View Details
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar_Seller active={activeTab} />
      
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
        <main>
          <div className="border-b border-gray-200 bg-white px-8">
            <nav className="flex gap-1">
              {['Dashboard', 'Products', 'Orders'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-medium transition-colors relative ${
                    activeTab === tab
                      ? 'text-black'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'Dashboard' && renderDashboard()}
          {activeTab === 'Products' && renderProducts()}
          {activeTab === 'Orders' && renderOrders()}
        </main>
      </div>
    </div>
  );
};

export default SellerDashboardPage;
