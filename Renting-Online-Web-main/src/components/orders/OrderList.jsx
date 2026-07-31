import React, { useState } from 'react';
import OrderCard from './OrderCard';

const OrderList = ({
  orders = [],
  onViewDetails,
  onTrackOrder,
  onReportUser,
  isSeller = false,
  onConfirmPayment,
  onConfirmShipping,
  onConfirmReturn,
  onCompleteOrder,
  onLeaveReview,
  statusUpdateOrderKey = null,
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const heading = isSeller ? 'Seller Orders' : 'My Orders';
  const subheading = isSeller
    ? 'Monitor and progress rentals for your listings'
    : 'Track and manage your rental orders';

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'ordered', label: 'Ordered' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'using', label: 'Using' },
    { id: 'return', label: 'Return' },
    { id: 'checking', label: 'Checking' },
    { id: 'completed', label: 'Completed' },
  ];

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    return (order.status || '').toLowerCase() === activeTab;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{heading}</h1>
        <p className="text-gray-600">{subheading}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-4 font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-black'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
            )}
          </button>
        ))}
      </div>

      {/* Orders */}
      {filteredOrders.length > 0 ? (
        filteredOrders.map((order) => (
          <OrderCard 
            key={order.orderId || order.id} 
            order={order} 
            onViewDetails={onViewDetails}
            onTrackOrder={onTrackOrder}
            onReportUser={onReportUser}
            isSeller={isSeller}
            onConfirmPayment={onConfirmPayment}
            onConfirmShipping={onConfirmShipping}
            onConfirmReturn={onConfirmReturn}
            onCompleteOrder={onCompleteOrder}
            onLeaveReview={onLeaveReview}
            statusUpdating={Boolean(
              statusUpdateOrderKey &&
              (order.orderId || order.id || order.orderNumber) === statusUpdateOrderKey
            )}
          />
        ))
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No orders found</p>
        </div>
      )}

    </div>
  );
};

export default OrderList;
