import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar_Seller from '../../components/sidebar/Sidebar_Seller';
import { Search, Plus, ChevronDown, Bell } from 'lucide-react';
import calCulateSalePrice from '../../utils/calculateSalePrice';

const SellerProducts = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Most Popular');
  const [products, setProducts] = useState([]);
  const [filteredList, setFilteredList] = useState([]);

  useEffect(() => {
    const getProducts = async () => {
      const sellerId = await fetch('/api/users/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(res => res.json())
      .then(data => data.data.user_id)
      .catch(err => console.error('Error fetching user ID:', err));

      console.log('Seller ID:', sellerId);
      
      const responseProducts = await fetch(`/api/products/seller/${sellerId}`, {
        method: 'GET',
      })
      .then(res => res.json())
      .then(data => data.data.products)
      .catch(err => console.error('Error fetching products:', err));
      
      const processedProducts = responseProducts.map(product => {
        let newProduct = { ...product };
        if (product.sale_percentage && product.sale_percentage > 0) {
          const finalPrice = calCulateSalePrice(parseFloat(product.price_per_day), product.sale_percentage);
          newProduct.originalPrice = parseFloat(product.price_per_day).toFixed(2);
          newProduct.price_per_day = finalPrice;
        }
        return newProduct;
      })

      setProducts(processedProducts);
      setFilteredList(processedProducts);
    }
    getProducts();
  }, [])

  useEffect(() => {
    const filteredList = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredList(filteredList);
  }, [searchQuery, sortBy]);

  

  console.log('Fetched products:', products);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => {
          if (index < fullStars) {
            return (
              <svg key={index} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            );
          } else if (index === fullStars && hasHalfStar) {
            return (
              <svg key={index} className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
                <defs>
                  <linearGradient id={`half-${index}`}>
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="#D1D5DB" />
                  </linearGradient>
                </defs>
                <path fill={`url(#half-${index})`} d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            );
          } else {
            return (
              <svg key={index} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            );
          }
        })}
        <span className="text-sm text-gray-600 ml-1">{rating}/5</span>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar_Seller active="Products" />
      
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
            <button 
              onClick={() => navigate('/seller/add-product')}
              className="bg-black text-white px-6 py-2.5 rounded-full font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
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
            {/* <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
              Sort by: {sortBy} <ChevronDown className="h-4 w-4" />
            </button> */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map((product) => (
              <div 
                key={product.product_id} 
                onClick={() => navigate('/seller/edit-product', { state: { product } })}
                className="bg-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="aspect-square bg-gray-200 overflow-hidden">
                  <img 
                    src={product.images[0]} 
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
                    <span className="text-2xl font-bold text-gray-900">${product.price_per_day}</span>
                    {product.originalPrice && (
                      <>
                        <span className="text-lg text-gray-400 line-through">${product.originalPrice}</span>
                        <span className="bg-red-100 text-red-600 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                          -{product.sale_percentage}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerProducts;
