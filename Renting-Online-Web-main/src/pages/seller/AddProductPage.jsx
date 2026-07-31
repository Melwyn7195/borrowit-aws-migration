import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar_Seller from '../../components/sidebar/Sidebar_Seller';
import { Bell, ImagePlus, Trash2, ChevronDown } from 'lucide-react';

const AddProductPage = () => {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const editProduct = routeLocation.state?.product; // Get product data if editing
  const isEditMode = !!editProduct;

  const [productName, setProductName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('good');
  const [location, setLocation] = useState('');
  const [sale, setSale] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Populate fields if editing
  useEffect(() => {
    if (editProduct) {
      setProductName(editProduct.name || '');
      setShortDescription(editProduct.short_description || '');
      setFullDescription(editProduct.description || '');
      setPrice(editProduct.price_per_day?.toString() || '');
      setCategory(editProduct.category || '');
      setCondition(editProduct.condition || 'good');
      setLocation(editProduct.location || '');
      setSale(editProduct.sale_percentage?.toString() || '');
      if (editProduct.images && editProduct.images.length > 0) {
        setImages(editProduct.images);
      }
    }
  }, [editProduct]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const uploadedUrls = data.data.files.map(file => file.url);
        setImages([...images, ...uploadedUrls]);
        console.log('Images uploaded successfully:', uploadedUrls);
      } else {
        alert('Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('An error occurred while uploading images');
    } finally {
      setUploading(false);
    }
  };

  const handleDraft = () => {
    console.log('Saving as draft...');
    navigate('/seller/products');
  };

  const handleContinue = async () => {
    console.log("Edit product:", editProduct);
    
    // Validation
    if (!productName || !price || !category || !location) {
      alert('Please fill in all required fields (Name, Price, Category, Location)');
      return;
    }

    if (images.length === 0) {
      alert('Please upload at least one product image');
      return;
    }

    setSaving(true);
    try {
      // Get current user/seller ID
      const userResponse = await fetch('/api/users/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!userResponse.ok) {
        alert('Failed to get user information. Please login again.');
        return;
      }

      const userData = await userResponse.json();
      const sellerId = userData.data.user_id;

      const productData = {
        name: productName,
        description: fullDescription || shortDescription,
        category: category,
        pricePerDay: parseFloat(price),
        salePercentage: sale ? parseFloat(sale) : 0,
        images: images,
        location: location,
        condition: condition,
      };

      let response;
      if (isEditMode) {
        // Update existing product
        response = await fetch(`/api/products/${editProduct.product_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });
      } else {
        // Create new product
        productData.sellerId = sellerId;
        response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });
      }

      if (response.ok) {
        alert(isEditMode ? 'Product updated successfully!' : 'Product created successfully!');
        navigate('/seller/products');
      } else {
        const errorData = await response.json();
        alert(`Failed to ${isEditMode ? 'update' : 'create'} product: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('An error occurred while saving the product.');
    } finally {
      setSaving(false);
    }
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
        <main className="p-8 max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? 'Edit Product' : 'Product Information'}
          </h1>
          {isEditMode && (
            <p className="text-gray-600 mb-4">Update your product information below</p>
          )}
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            {/* Product Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Laptop Macbook ..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black outline-none"
              />
              {!productName && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <span className="text-red-500">⚠</span> Please enter text only
                </p>
              )}
            </div>

            {/* Product Short Description */}
            {/* <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Short Description
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Enter product short description"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black outline-none"
              />
            </div> */}

            {/* Product Images */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={uploading}
                />
                <label htmlFor="image-upload" className={`cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                  <ImagePlus className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium">
                    {uploading ? 'Uploading...' : 'Browse or Desktop'}
                  </p>
                </label>
              </div>
              
              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img 
                        src={img} 
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Description
              </label>
              <textarea
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                placeholder="A detailed description of the product helps customers to learn more about the product."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black outline-none resize-none"
              />
              <p className="text-sm text-gray-400 text-right mt-1">
                {fullDescription.length}/800
              </p>
            </div>

            {/* Category and Condition */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Category *
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black outline-none appearance-none bg-white"
                  >
                    <option value="">Select Category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Clothes">Clothes</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Sports">Sports</option>
                    <option value="Books">Books</option>
                    <option value="Tools">Tools</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <div className="relative">
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black outline-none appearance-none bg-white"
                  >
                    <option value="new">New</option>
                    <option value="like-new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter product location (e.g., Ho Chi Minh City)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black outline-none"
              />
            </div>

            {/* Price Section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Price Per Day ($) *
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black outline-none"
                  min="0"
                />
                {!price && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <span className="text-red-500">⚠</span> Please enter the product price.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sale Discount (%)
                </label>
                <input
                  type="number"
                  value={sale}
                  onChange={(e) => setSale(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black/10 focus:border-black outline-none"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/seller/products')}
              className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-5 w-5" />
              Cancel
            </button>
            
            <div className="flex gap-3">
              {/* <button
                onClick={handleDraft}
                className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Draft
              </button> */}
              <button
                onClick={handleContinue}
                disabled={saving || uploading}
                className="px-6 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : isEditMode ? 'Update Product' : 'Confirm'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddProductPage;
