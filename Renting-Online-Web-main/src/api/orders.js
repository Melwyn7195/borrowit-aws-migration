import { request } from './client';
import { API_BASE } from './config';

const normalizeTimelineEvent = (event = {}, index = 0) => ({
  title: event.title ?? event.status ?? `Step ${index + 1}`,
  date: event.date ?? event.timestamp ?? null,
  completed: Boolean(event.completed ?? event.is_completed ?? false),
  description: event.description ?? event.details ?? '',
});

const normalizeProduct = (order = {}) => {
  const productSource = order.product || order.productSummary || {};
  const unitPrice =
    typeof productSource.unitPrice === 'number'
      ? productSource.unitPrice
      : typeof order.unitPrice === 'number'
      ? order.unitPrice
      : Number(order.subtotal ?? 0);

  const images =
    Array.isArray(productSource.images)
      ? productSource.images
      : Array.isArray(order.productImages)
      ? order.productImages
      : Array.isArray(order.product_images)
      ? order.product_images
      : [];

  return {
    productId:
      productSource.id ??
      productSource.productId ??
      order.productId ??
      order.product_id ??
      null,
    productName:
      productSource.name ?? order.productName ?? order.product_name ?? '',
    productImage:
      productSource.image ??
      order.productImage ??
      order.product_image ??
      images[0] ??
      null,
    productImages: images,
    productSize: productSource.size ?? order.productSize ?? order.product_size ?? null,
    productColor: productSource.color ?? order.productColor ?? order.product_color ?? null,
    rentalPeriod:
      productSource.rentalPeriod ??
      order.rentalPeriod ??
      order.rental_period ??
      null,
    quantity: order.quantity ?? productSource.quantity ?? 1,
    unitPrice,
    category: productSource.category ?? order.productCategory ?? null,
    location: productSource.location ?? order.productLocation ?? null,
  };
};

const resolveSeller = (order = {}) => {
  const sellerSource = order.seller || order.sellerSummary || {};
  return {
    id:
      sellerSource.id ??
      order.sellerId ??
      order.seller_id ??
      null,
    name:
      sellerSource.name ??
      sellerSource.fullName ??
      order.sellerName ??
      order.seller_name ??
      '',
    username: sellerSource.username ?? order.sellerUsername ?? null,
    avatar: sellerSource.avatar ?? order.sellerAvatar ?? null,
    phone: sellerSource.phone ?? order.sellerPhone ?? null,
    email: sellerSource.email ?? order.sellerEmail ?? null,
    address: sellerSource.address ?? order.sellerAddress ?? null,
  };
};

const normalizeOrder = (order = {}) => {
  const timeline = Array.isArray(order.timeline)
    ? order.timeline.map((event, index) => normalizeTimelineEvent(event, index))
    : [];
  const product = normalizeProduct(order);
  const seller = resolveSeller(order);
  const totalAmount =
    typeof order.totalAmount === 'number'
      ? order.totalAmount
      : Number(order.total_amount ?? order.subtotal ?? 0);
  const subtotal =
    typeof order.subtotal === 'number'
      ? order.subtotal
      : Number(order.sub_total ?? order.subtotal ?? totalAmount ?? 0);

  const statusValueRaw = order.status ?? order.Status ?? 'ordered';
  const statusValue =
    typeof statusValueRaw === 'string' && statusValueRaw.trim()
      ? statusValueRaw.trim().toLowerCase()
      : 'ordered';
  const canReview =
    typeof order.canReview === 'boolean'
      ? order.canReview
      : (statusValue || '').toLowerCase() === 'completed';

  return {
    id: order.id ?? order.order_id ?? null,
    orderId: order.orderId ?? order.order_id ?? order.id ?? null,
    orderNumber: order.orderNumber ?? order.order_number ?? '',
    placedDate:
      order.placedDate ??
      order.placed_date ??
      order.createdAt ??
      order.created_at ??
      '',
    status: statusValue,
    buyerName: order.buyerName ?? order.buyer_name ?? '',
    sellerName: seller.name,
    sellerUsername: seller.username,
    sellerAvatar: seller.avatar,
    sellerPhone: seller.phone,
    sellerEmail: seller.email,
    sellerAddress: seller.address,
    sellerId: seller.id,
    productId: product.productId,
    productName: product.productName,
    productImage: product.productImage,
    productImages: product.productImages,
    productSize: product.productSize,
    productColor: product.productColor,
    rentalPeriod: product.rentalPeriod,
    quantity: product.quantity,
    unitPrice: product.unitPrice,
    totalAmount,
    subtotal,
    tax:
      typeof order.tax === 'number'
        ? order.tax
        : Number(order.tax_amount ?? 0),
    shippingAddress: order.shippingAddress ?? order.shipping_address ?? null,
    timeline,
    receivingInfo:
      order.receivingInfo ??
      order.receiveDetails ??
      order.receive_details ??
      order.receiving_details ??
      null,
    returnInfo:
      order.returnInfo ??
      order.returnDetails ??
      order.return_details ??
      null,
    createdAt: order.createdAt ?? order.created_at ?? null,
    updatedAt: order.updatedAt ?? order.updated_at ?? null,
    canReview,
    seller,
    product,
  };
};

const unwrapList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.orders)) return payload.orders;
  return [];
};

export const getOrders = async () => {
  const raw = await request('/orders');
  const collection = unwrapList(raw);
  return collection.map(normalizeOrder);
};

export const getSellerOrders = async () => {
  const raw = await request('/orders/seller');
  const collection = unwrapList(raw);
  return collection.map(normalizeOrder);
};

export const getOrderByNumber = async (orderId) => {
  if (!orderId) {
    throw new Error('orderId is required');
  }
  const raw = await request(`/orders/${encodeURIComponent(orderId)}`);
  const payload = raw?.data ?? raw?.order ?? raw;
  return normalizeOrder(payload);
};

export const getSellerOrderByNumber = async (orderId) => {
  if (!orderId) {
    throw new Error('orderId is required');
  }
  const raw = await request(`/orders/seller/${encodeURIComponent(orderId)}`);
  const payload = raw?.data ?? raw?.order ?? raw;
  return normalizeOrder(payload);
};

export const createOrder = async (payload = {}) => {
  const productId =
    payload.productId ??
    payload.product_id ??
    payload.product?.productId ??
    payload.product?.id;

  if (!productId) {
    throw new Error('productId is required to create an order');
  }

  const response = await request('/orders', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      productId,
    }),
  });

  const body = response?.data ?? response?.order ?? response;
  return normalizeOrder(body);
};

export const updateSellerOrderStatus = async (orderNumber, payload = {}) => {
  if (!orderNumber) {
    throw new Error('orderNumber is required');
  }
  const response = await request(
    `/orders/${encodeURIComponent(orderNumber)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
  const body = response?.data ?? response?.order ?? response;
  return normalizeOrder(body);
};

const API_BASE_URL = API_BASE;

export const updateOrderScheduleInfo = async (orderNumber, payload = {}) => {
  if (!orderNumber) {
    throw new Error('orderNumber is required');
  }
  
  const response = await fetch(
    `${API_BASE_URL}/api/orders/${encodeURIComponent(orderNumber)}/schedule`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  
  const data = await response.json();
  const body = data?.data ?? data?.order ?? data;
  return normalizeOrder(body);
};

export { normalizeOrder };
