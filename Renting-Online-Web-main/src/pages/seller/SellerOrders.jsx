import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar_Seller from '../../components/sidebar/Sidebar_Seller';
import { Bell } from 'lucide-react';
import OrderList from '../../components/orders/OrderList';
import ReportUserForm from '../../pages/ReportUserForm';
import MessagePopup from '../../components/common/MessagePopup';
import { getSellerOrders, updateSellerOrderStatus } from '../../api/orders';


const SellerOrders = () => {
  const navigate = useNavigate();
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [completionDetails, setCompletionDetails] = useState({
    finalPrice: '',
    condition: '',
  });

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState(null);
  const [statusUpdatingOrder, setStatusUpdatingOrder] = useState(null);

  const resolveOrderKey = (order) =>
    order?.orderNumber || order?.orderId || order?.id || null;

  const applyOrderUpdate = (updatedOrder) => {
    if (!updatedOrder) {
      return;
    }
    const targetKey = resolveOrderKey(updatedOrder);
    setOrders((prev) =>
      prev.map((order) =>
        resolveOrderKey(order) === targetKey ? updatedOrder : order
      )
    );
  };

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const fetched = await getSellerOrders();
        if (!isMounted) {
          return;
        }
        if (Array.isArray(fetched)) {
          setOrders(fetched); // Set orders even if empty array
        } else {
          setOrders([]); // Don't show dummy data
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load seller orders:', error);
        setLoadError(error?.message || 'Unable to load seller orders right now.');
        setOrders([]); // Don't show dummy data on error
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleReportUser = (order) => {
    const normalized = {
      ...order,
      buyerId: order.buyerId || order.buyer?.id || order.customer_id || null,
      buyerUsername: order.buyerUsername || order.buyer?.username || order.buyerName || 'Unknown Buyer'
    };
    console.log('Reporting user for order:', normalized);
    if (!normalized.buyerId) {
      console.warn('Unable to determine buyer for report.', normalized);
      return;
    }

    setSelectedOrder({
      userId: normalized.buyerId,
      userName: normalized.buyerUsername
    });
    setShowReportForm(true);
  };

  const handleConfirmPayment = (order) => {
    setSelectedOrder(order);
    setConfirmAction('payment');
    setShowConfirmModal(true);
  };

  const handleConfirmShipping = (order) => {
    setSelectedOrder(order);
    setConfirmAction('shipping');
    setShowConfirmModal(true);
  };

  const handleConfirmReturn = (order) => {
    setSelectedOrder(order);
    setConfirmAction('return');
    setShowConfirmModal(true);
  };

  const handleCompleteOrder = (order) => {
    setSelectedOrder(order);
    setConfirmAction('complete');
    // Use product's price_per_day, not order totalAmount
    const productPricePerDay = order?.product?.pricePerDay ?? order?.unitPrice ?? '';
    const productCondition = order?.product?.condition ?? '';
    setCompletionDetails({
      finalPrice: typeof productPricePerDay === 'number' ? productPricePerDay : '',
      condition: productCondition,
    });
    setShowConfirmModal(true);
  };

  const handleTrackOrder = (order) => {
    const targetKey = resolveOrderKey(order);
    if (!targetKey) {
      return;
    }
    navigate(`/seller/orders/${encodeURIComponent(targetKey)}`, {
      state: { order },
    });
  };

  const handleConfirm = async () => {
    if (!selectedOrder || !confirmAction || isUpdatingStatus) {
      return;
    }

    const targetNumber =
      selectedOrder.orderNumber || selectedOrder.orderId || selectedOrder.id;

    if (!targetNumber) {
      return;
    }

    const currentStatus = (selectedOrder.status || '').toLowerCase();
    let nextStatus = null;

    switch (confirmAction) {
      case 'payment':
        nextStatus = 'shipping';
        break;
      case 'shipping':
        nextStatus = 'using';
        break;
      case 'return':
        nextStatus = 'return';
        break;
      case 'complete':
        nextStatus = currentStatus === 'checking' ? 'completed' : 'checking';
        break;
      default:
        nextStatus = null;
    }

    if (!nextStatus) {
      return;
    }

    try {
      setStatusUpdateError(null);
      setIsUpdatingStatus(true);
      setStatusUpdatingOrder(resolveOrderKey(selectedOrder));
      const payload = { status: nextStatus };
      
      // Add price and condition when completing from checking status
      if (confirmAction === 'complete' && currentStatus === 'checking' && completionDetails) {
        console.log('Completion details:', completionDetails); // Debug
        if (completionDetails.finalPrice !== '' && completionDetails.finalPrice !== null && completionDetails.finalPrice !== undefined) {
          payload.pricePerDay = Number(completionDetails.finalPrice);
        }
        if (completionDetails.condition && completionDetails.condition.trim() !== '') {
          payload.productCondition = completionDetails.condition;
        }
      }
      
      console.log('Sending payload to backend:', payload, 'for order:', targetNumber); // Debug log
      const updatedOrder = await updateSellerOrderStatus(targetNumber, payload);
      applyOrderUpdate(updatedOrder);
      setShowConfirmModal(false);
      setSelectedOrder(null);
      setConfirmAction(null);
      setCompletionDetails({ finalPrice: '', condition: '' });
    } catch (error) {
      console.error('Unable to update order status:', error);
      setStatusUpdateError(error?.message || 'Unable to update order status.');
    } finally {
      setIsUpdatingStatus(false);
      setStatusUpdatingOrder(null);
    }
  };

  const getConfirmMessage = () => {
    const reference = selectedOrder?.orderNumber || selectedOrder?.id || 'order';
    if (confirmAction === 'payment') {
      return {
        title: 'Confirm Payment',
        message: `Are you sure you want to confirm payment for order #${reference}? This will move the order to Shipping status.`
      };
    } else if (confirmAction === 'shipping') {
      return {
        title: 'Confirm Shipping',
        message: `Have you shipped order #${reference}? Confirming will move the order to Using status.`
      };
    } else if (confirmAction === 'return') {
      return {
        title: 'Confirm Return',
        message: `Has the customer returned order #${reference}? Confirming updates the order to Return status.`
      };
    } else if (confirmAction === 'complete') {
      const currentStatus = (selectedOrder?.status || '').toLowerCase();
      if (currentStatus === 'checking') {
        return {
          title: 'Complete Order',
          message: `Finalize order #${reference}? This will mark the inspection as finished and close the order.`
        };
      }
      return {
        title: 'Start Checking',
        message: `Begin the inspection process for order #${reference}? This will move the order into Checking status.`
      };
    }
    return { title: '', message: '' };
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar_Seller active="Orders" />
      
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
          {loadError && (
            <div className="mx-8 mt-6">
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-6 py-3 text-sm text-yellow-800">
                {loadError}
              </div>
            </div>
          )}
          {statusUpdateError && (
            <div className="mx-8 mt-4">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
                {statusUpdateError}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="p-8">
              <div className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center text-gray-600">
                Loading seller orders...
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8">
              <div className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">No orders yet</h3>
                <p className="mt-1 text-sm text-gray-500">Orders from customers will appear here.</p>
              </div>
            </div>
          ) : (
            <OrderList 
              orders={orders} 
              isSeller={true}
              onTrackOrder={handleTrackOrder}
              onReportUser={handleReportUser}
              onConfirmPayment={handleConfirmPayment}
              onConfirmShipping={handleConfirmShipping}
              onConfirmReturn={handleConfirmReturn}
              onCompleteOrder={handleCompleteOrder}
              statusUpdateOrderKey={statusUpdatingOrder}
            />
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedOrder && (
        <MessagePopup
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setSelectedOrder(null);
            setConfirmAction(null);
            setCompletionDetails({ finalPrice: '', condition: '' });
          }}
          title={getConfirmMessage().title}
          message={getConfirmMessage().message}
          icon="info"
          primaryButton={{
            label: isUpdatingStatus ? 'Updating...' : 'Confirm',
            onClick: isUpdatingStatus ? undefined : handleConfirm
          }}
          secondaryButton={{
            label: 'Cancel',
            onClick: () => {
              setShowConfirmModal(false);
              setSelectedOrder(null);
              setConfirmAction(null);
              setCompletionDetails({ finalPrice: '', condition: '' });
            }
          }}
        >
          {confirmAction === 'complete' && (selectedOrder?.status || '').toLowerCase() === 'checking' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per day (after inspection)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={completionDetails.finalPrice}
                  onChange={(e) =>
                    setCompletionDetails((prev) => ({
                      ...prev,
                      finalPrice: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter adjusted price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item condition after return
                </label>
                <textarea
                  value={completionDetails.condition}
                  onChange={(e) =>
                    setCompletionDetails((prev) => ({
                      ...prev,
                      condition: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  placeholder="e.g., Like new, minor wear, damaged zipper"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add notes about any wear, damage, or cleaning needs before closing the order.
                </p>
              </div>
            </div>
          )}
        </MessagePopup>
      )}

      {/* Report User Form */}
      {showReportForm && selectedOrder && (
        <ReportUserForm 
          userName={selectedOrder.userName}
          userId={selectedOrder.userId}
          onClose={() => {
            setShowReportForm(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default SellerOrders;
