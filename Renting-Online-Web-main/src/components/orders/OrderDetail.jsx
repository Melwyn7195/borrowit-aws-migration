import React from 'react';

const formatStatusLabel = (value) => {
  if (!value) return 'Ordered';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const OrderDetail = ({
  order,
  onBack,
  onOpenReceiveSchedule,
  onOpenReturnSchedule,
  receiveDetails,
  returnDetails,
  canEditReturn,
  isSellerView = false,
}) => {
  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Order not found</p>
      </div>
    );
  }

  const getStatusStyles = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'ordered':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'shipping':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'using':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'return':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'completed':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'cancelled':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const resolvedItems =
    Array.isArray(order.items) && order.items.length > 0
      ? order.items
      : [
          {
            productId: order.productId,
            name: order.productName,
            size: order.productSize,
            color: order.productColor,
            rentalPeriod: order.rentalPeriod,
            quantity: order.quantity,
            price: order.unitPrice,
            imageUrl: order.productImage,
          },
        ];
  const buyerName =
    order.buyerName ||
    order.customerName ||
    order.customer?.fullName ||
    order.user?.fullName ||
    order.shippingAddress?.name ||
    'Customer not provided';
  const sellerName =
    order.sellerName ||
    order.seller?.name ||
    order.seller?.fullName ||
    order.storeName ||
    (isSellerView ? 'You' : 'Seller not provided');
  const sellerContact = [
    order.sellerPhone ? `Phone: ${order.sellerPhone}` : null,
    order.sellerEmail ? `Email: ${order.sellerEmail}` : null,
    order.sellerAddress ? `Address: ${order.sellerAddress}` : null,
  ].filter(Boolean);

  const statusLabel = formatStatusLabel(order.status);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Orders
      </button>

      {/* Order Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order #{order.orderId}</h1>
            <p className="text-gray-600">Placed on {order.placedDate}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusStyles(order.status)}`}>
            {statusLabel}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 mb-2">
          <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50">
            <p className="text-xs uppercase tracking-wide text-gray-500">Seller</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">{sellerName}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50">
            <p className="text-xs uppercase tracking-wide text-gray-500">Customer</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">{buyerName}</p>
          </div>
        </div>
        {!isSellerView && sellerContact.length > 0 && (
          <div className="rounded-2xl border border-gray-100 p-4 bg-white shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Seller Contact</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {sellerContact.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Order Timeline */}
        {order.timeline && (
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Timeline</h3>
            <div className="space-y-4">
              {order.timeline.map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${event.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    {index < order.timeline.length - 1 && (
                      <div className={`w-0.5 h-12 ${event.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className={`font-semibold ${event.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                      {event.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{event.date}</p>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Items</h2>
        <div className="space-y-6">
          {resolvedItems.map((item, index) => (
            <div key={item.productId || index} className="flex items-center gap-6 pb-6 border-b border-gray-100 last:border-0">
              <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                <img 
                  src={item.imageUrl || item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>';
                  }}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  {/* <p>Size: {item.size}</p> */}
                  {item.color && <p>Color: {item.color}</p>}
                  <p>Rental Period: {item.rentalPeriod}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">${item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
        <div className="space-y-4">
          {/* <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span className="font-semibold">${order.subtotal || order.totalAmount}</span>
          </div> */}
          {/* {order.discount && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span className="font-semibold">-${order.discount}</span>
            </div>
          )}
          {order.tax && (
            <div className="flex justify-between text-gray-700">
              <span>Tax</span>
              <span className="font-semibold">${order.tax}</span>
            </div>
          )} */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between text-xl">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">${order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {/* {order.shippingAddress && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3">Shipping Address</h3>
            <p className="text-gray-600 leading-relaxed">
              {order.shippingAddress.name}<br />
              {order.shippingAddress.address}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
              {order.shippingAddress.phone}
            </p>
          </div>
        )} */}
      </div>
      {!isSellerView ? (
        <div className="grid gap-6 mt-6 md:grid-cols-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Receiving</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Set when and where you want to receive this order.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenReceiveSchedule}
                className="rounded-full border border-indigo-200 px-4 py-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 hover:border-indigo-300"
              >
                {receiveDetails ? 'Edit' : 'Add'}
              </button>
            </div>
            <div className="mt-4 rounded-xl bg-indigo-50/60 p-4 text-sm text-gray-700">
              <p>
                <span className="font-semibold text-gray-900">Date:</span>{' '}
                {receiveDetails?.date || 'Not set'}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-gray-900">Location:</span>{' '}
                {receiveDetails?.location || 'Not set'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Return</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Let us know the return plan so the seller can prepare.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenReturnSchedule}
                disabled={!canEditReturn}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  canEditReturn
                    ? 'border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {returnDetails ? 'Edit' : 'Add'}
              </button>
            </div>
            <div className="mt-4 rounded-xl bg-indigo-50/60 p-4 text-sm text-gray-700">
              <p>
                <span className="font-semibold text-gray-900">Date:</span>{' '}
                {returnDetails?.date || 'Not set'}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-gray-900">Location:</span>{' '}
                {returnDetails?.location || 'Not set'}
              </p>
              {!canEditReturn && (
                <p className="mt-3 text-xs text-gray-500">
                  Return scheduling unlocks after the order is marked as received.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 mt-6 md:grid-cols-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Receiving Information</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Set when and where to meet customer for receiving.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenReceiveSchedule}
                className="rounded-full border border-indigo-200 px-4 py-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 hover:border-indigo-300"
              >
                {receiveDetails ? 'Edit' : 'Add'}
              </button>
            </div>
            <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
              <p>
                <span className="font-semibold text-gray-900">Date:</span>{' '}
                {receiveDetails?.date || 'Not set'}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-gray-900">Location:</span>{' '}
                {receiveDetails?.location || 'Not set'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Return Information</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Set when and where to meet customer for return.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenReturnSchedule}
                className="rounded-full border border-indigo-200 px-4 py-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 hover:border-indigo-300"
              >
                {returnDetails ? 'Edit' : 'Add'}
              </button>
            </div>
            <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
              <p>
                <span className="font-semibold text-gray-900">Date:</span>{' '}
                {returnDetails?.date || 'Not set'}
              </p>
              <p className="mt-2">
                <span className="font-semibold text-gray-900">Location:</span>{' '}
                {returnDetails?.location || 'Not set'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
