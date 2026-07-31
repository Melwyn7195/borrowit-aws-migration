import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';
import OrderList from '../components/orders/OrderList';
import ordersData from '../data/ordersData';
import ReportUserForm from './ReportUserForm';
import { getOrders } from '../api/orders';

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

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const fetched = await getOrders();
        if (!isMounted) {
          return;
        }
        const normalized = Array.isArray(fetched)
          ? fetched
              .map((order) => normalizeOrderIdentity(order))
              .filter(Boolean)
          : [];
        setOrders(normalized);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load orders:', error);
        setLoadError(error?.message || 'Unable to load your orders right now.');
        const fallback = JSON.parse(JSON.stringify(ordersData));
        const normalizedFallback = fallback
          .map((order) => normalizeOrderIdentity(order))
          .filter(Boolean);
        setOrders(normalizedFallback);
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

  const handleViewDetails = (order) => {
    const normalized = normalizeOrderIdentity(order);
    if (!normalized?.orderId) {
      return;
    }
    navigate(`/orders/${normalized.orderId}`, { state: { order: normalized } });
  };

  const handleLeaveReview = (order) => {
    const normalized = normalizeOrderIdentity(order);
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
      orderNumber: normalized?.orderNumber || normalized?.orderId || null,
      productId: fallbackProduct.productId || fallbackProduct.id || null,
      productName: fallbackProduct.name || normalized.productName || null,
      product: fallbackProduct,
    };

    navigate(`/review/${targetProductId}`, { state: navigationState });
  };

  const handleReportUser = (order) => {
    const normalized = normalizeOrderIdentity(order);
    if (!normalized) {
      return;
    }

    // Extract seller information from the order
    const sellerId = normalized.sellerId || normalized.seller.id || null;
    const sellerUsername = normalized.sellerUsername || normalized.seller.username || 'Unknown Seller';

    if (!sellerId) {
      console.warn('Unable to determine seller for report.', normalized);
      return;
    }

    setReportTarget({
      userId: sellerId,
      userName: sellerUsername
    });
    setShowReportForm(true);
  };

  const handleCloseReportForm = () => {
    setShowReportForm(false);
    setReportTarget(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      {loadError && (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
            {loadError}
          </div>
        </div>
      )}
      {isLoading ? (
        <div className="max-w-6xl mx-auto px-4 mt-10">
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center text-gray-600">
            Loading your orders...
          </div>
        </div>
      ) : (
        <OrderList
          orders={orders}
          onViewDetails={handleViewDetails}
          onLeaveReview={handleLeaveReview}
          onReportUser={handleReportUser}
        />
      )}
      
      {showReportForm && reportTarget && (
        <ReportUserForm
          userName={reportTarget.userName}
          userId={reportTarget.userId}
          onClose={handleCloseReportForm}
        />
      )}
      <Footer />
    </div>
  );
};

export default OrdersPage;