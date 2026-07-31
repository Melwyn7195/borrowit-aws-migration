import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';
import OrderDetail from '../components/orders/OrderDetail';
import OrderScheduleModal from '../components/orders/OrderScheduleModal';
import ordersData from '../data/ordersData';
import { getOrderByNumber, updateOrderScheduleInfo } from '../api/orders';

const resolveOrderId = (order, fallback = null) => {
  if (!order) return fallback;
  return (
    order.orderId ||
    order.order_id ||
    order.id ||
    fallback
  );
};

const normalizeOrderIdentity = (order, fallback) => {
  if (!order) return null;
  const resolvedId = resolveOrderId(order, fallback);
  const productId = order.productId ?? null;
  const unitPrice = typeof order.unitPrice === 'number' ? order.unitPrice : Number(order.subtotal ?? 0);

  return {
    ...order,
    orderId: resolvedId,
    orderNumber: order.orderNumber || order.order_number || '',
    productId,
    productName: order.productName ?? '',
    productImage: order.productImage ?? null,
    productSize: order.productSize ?? null,
    productColor: order.productColor ?? null,
    rentalPeriod: order.rentalPeriod ?? null,
    quantity: order.quantity ?? 1,
    unitPrice,
  };
};

const OrderDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();

  const locationOrderRaw = location.state?.order;
  const locationOrder = useMemo(
    () => normalizeOrderIdentity(locationOrderRaw, orderId),
    [locationOrderRaw, orderId]
  );
  const locationSchedules = location.state?.schedules;

  const [order, setOrder] = useState(locationOrder || null);
  const [isLoading, setIsLoading] = useState(!locationOrder);
  const [loadError, setLoadError] = useState(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleModalType, setScheduleModalType] = useState(null);
  const [schedules, setSchedules] = useState({
    receive: locationSchedules?.receive || null,
    return: locationSchedules?.return || null,
  });

  // Update schedules when order loads with receivingInfo/returnInfo
  useEffect(() => {
    if (order) {
      setSchedules((prev) => ({
        receive: prev.receive || order.receivingInfo || null,
        return: prev.return || order.returnInfo || null,
      }));
    }
  }, [order]);

  useEffect(() => {
    let isMounted = true;

    const ensureOrder = async () => {
      if (!orderId) {
        setLoadError('Order number is required to load details.');
        setIsLoading(false);
        return;
      }

      if (locationOrder && locationOrder.orderId === orderId) {
        setOrder(locationOrder);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      try {
        const fetched = await getOrderByNumber(orderId);
        if (!isMounted) {
          return;
        }
        setOrder(normalizeOrderIdentity(fetched, orderId));
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load order detail:', error);
        setLoadError(error?.message || 'Unable to load order details right now.');
        const fallbackSource =
          ordersData.find((item) => resolveOrderId(item) === orderId) || null;
        setOrder(normalizeOrderIdentity(fallbackSource, orderId));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    ensureOrder();
    return () => {
      isMounted = false;
    };
  }, [orderId, locationOrder]);

  const handleBackToOrders = () => {
    navigate('/orders');
  };

  const handleOpenScheduleModal = (type) => {
    setScheduleModalType(type);
    setScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setScheduleModalOpen(false);
    setScheduleModalType(null);
  };

  const handleSaveSchedule = async (scheduleData) => {
    if (!scheduleModalType) {
      return;
    }
    
    // Determine which field to update based on modal type
    const updateData = {};
    if (scheduleModalType === 'receive') {
      updateData.receivingInfo = {
        date: scheduleData.date || null,
        time: scheduleData.time || null,
        location: scheduleData.location || null,
        notes: scheduleData.notes || null,
      };
    } else if (scheduleModalType === 'return') {
      updateData.returnInfo = {
        date: scheduleData.date || null,
        time: scheduleData.time || null,
        location: scheduleData.location || null,
        notes: scheduleData.notes || null,
      };
    }

    try {
      const orderNumber = order?.orderNumber || order?.order_number || orderId;
      const result = await updateOrderScheduleInfo(orderNumber, updateData);
      
      // Update local state with the response
      setSchedules((prev) => ({
        ...prev,
        [scheduleModalType]: scheduleData,
      }));
      
      // Update order state if response contains updated order
      if (result) {
        setOrder((prev) => ({
          ...prev,
          receivingInfo: result.receivingInfo ?? prev.receivingInfo,
          returnInfo: result.returnInfo ?? prev.returnInfo,
        }));
      }
      
      handleCloseScheduleModal();
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('Failed to save schedule. Please try again.');
    }
  };

  const hasStoredReview = (targetOrderId) => {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      const stored = window.localStorage.getItem('postRentalReview');
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      if (!parsed) return false;
      if (!targetOrderId) return false;
      return (
        parsed.orderId === targetOrderId ||
        parsed.orderNumber === targetOrderId
      );
    } catch (error) {
      console.warn('Unable to read stored review:', error);
      return false;
    }
  };

  const handleReviewNavigation = () => {
    if (!order) return;
    const normalized = normalizeOrderIdentity(order, orderId);
    if (!normalized) {
      return;
    }
    const primaryItem = normalized?.items?.[0] || null;
    const fallbackProduct = primaryItem || {
      productId: normalized.productId ?? normalized.product_id ?? null,
      id: normalized.productId ?? normalized.product_id ?? null,
      name: normalized.productName ?? null,
      image: normalized.productImage ?? null,
      size: normalized.productSize ?? null,
      color: normalized.productColor ?? null,
    };
    const targetProductId =
      fallbackProduct?.productId ||
      fallbackProduct?.id ||
      null;
    if (!targetProductId) {
      console.warn('Unable to determine product for review navigation.', normalized);
      return;
    }
    const navigationState = {
      orderId: normalized?.orderId,
      orderNumber: normalized?.orderNumber || null,
      productId: fallbackProduct.productId || fallbackProduct.id || null,
      productName: fallbackProduct.name || normalized.productName || null,
      product: fallbackProduct,
    };
    navigate(`/review/${targetProductId}`, { state: navigationState });
  };

  const completedStates = ['completed', 'complete'];
  const isCompletedOrder =
    typeof order?.canReview === 'boolean'
      ? order.canReview
      : completedStates.includes(order?.status?.toLowerCase?.() ?? '');


  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center text-gray-700">
          <p className="text-lg">Loading order details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Order not found</h1>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t locate details for order {orderId ? `#${orderId}` : ''}. Please return to your
            orders list and try again.
          </p>
          <button
            type="button"
            onClick={handleBackToOrders}
            className="px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Back to Orders
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const orderIdentity = resolveOrderId(order, orderId);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      {loadError && (
        <div className="max-w-5xl mx-auto px-4 mt-6">
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-6 py-4 text-sm text-yellow-700">
            {loadError}
          </div>
        </div>
      )}
      <OrderDetail
        order={order}
        onBack={handleBackToOrders}
        onOpenReceiveSchedule={() => handleOpenScheduleModal('receive')}
        onOpenReturnSchedule={() => handleOpenScheduleModal('return')}
        receiveDetails={schedules.receive}
        returnDetails={schedules.return}
        canEditReturn={true}
      />
      {isCompletedOrder && (
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm p-6 mb-10">
            <h2 className="text-xl font-semibold text-gray-800">
              {hasStoredReview(orderIdentity) ? 'Your Review' : 'Share Your Review'}
            </h2>
            <p className="text-gray-600 mt-2">
              {hasStoredReview(orderIdentity)
                ? `You already shared feedback for order #${orderIdentity}. View or update it anytime.`
                : `Share your experience for order #${orderIdentity} to help fellow renters.`}
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleReviewNavigation}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                {hasStoredReview(orderIdentity) ? 'View Review' : 'Write Review'}
              </button>
            </div>
          </div>
        </div>
      )}
      <OrderScheduleModal
        open={scheduleModalOpen}
        onClose={handleCloseScheduleModal}
        onSave={handleSaveSchedule}
        initialSchedule={scheduleModalType ? schedules[scheduleModalType] : null}
        type={scheduleModalType}
      />
      <Footer />
    </div>
  );
};

export default OrderDetailPage;
