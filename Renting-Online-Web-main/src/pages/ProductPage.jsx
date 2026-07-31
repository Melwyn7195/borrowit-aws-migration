import React from 'react';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';
import CommentList from '../components/comments/CommentList';
import Filter from '../components/products/Filter';
import ProductList from '../components/product_list/ProductList';

import { useState, useEffect } from 'react';

const ProductPage = () => {
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    category: '',
    condition: '',
    priceMin: '',
    priceMax: '',
    rating: '',
  });

  const fetchProducts = async (currentFilters = filters, page = 1) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        status: 'available', // Only show available products
      });

      // Add filters to query params
      if (currentFilters.category) queryParams.append('category', currentFilters.category);
      if (currentFilters.condition) queryParams.append('condition', currentFilters.condition);
      if (currentFilters.priceMin) queryParams.append('minPrice', currentFilters.priceMin);
      if (currentFilters.priceMax) queryParams.append('maxPrice', currentFilters.priceMax);
      if (currentFilters.rating) queryParams.append('rating', currentFilters.rating);

      const response = await fetch(`/api/products?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('PRODUCT DATA LIST:', data);
        setProductList(data.data.products);
        setPagination(data.data.pagination);
      } else {
        console.error('Failed to fetch products. Status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleFilterChange = (newFilters) => {
    console.log('Filters changed:', newFilters);
    setFilters(newFilters);
    fetchProducts(newFilters, 1); // Reset to page 1 when filters change
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* <h1 className="text-3xl font-bold text-gray-900 mb-8">BorrowIt Demo</h1> */}
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filter Sidebar */}
            <div className="lg:col-span-1">
              <Filter 
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">Products</h2>
                  <span className="text-gray-600">
                    {loading ? 'Loading...' : `${pagination.total} products found`}
                  </span>
                </div>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    <ProductList View="vertical" Products={productList} />
                    {pagination.totalPages > 1 && (
                      <div className="mt-8 flex justify-center items-center gap-2">
                        <button
                          onClick={() => fetchProducts(filters, pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        <span className="px-4 py-2">
                          Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                          onClick={() => fetchProducts(filters, pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPages}
                          className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProductPage;
