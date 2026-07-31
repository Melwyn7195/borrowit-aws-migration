const orderModel = require('../models/Order');
const emailService = require('../services/EmailService');
const sql = require('../db');

const buildSuccessResponse = (data, extra = {}) => ({
  success: true,
  data,
  ...extra,
});

const buildErrorResponse = (message, extra = {}) => ({
  success: false,
  message,
  ...extra,
});

const getOrders = async (req, res) => {
  try {
    const orders = await orderModel.listOrdersForUser(req.user);
    return res.status(200).json(
      buildSuccessResponse(orders, {
        count: orders.length,
      })
    );
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json(
      buildErrorResponse('Unable to load orders right now.', {
        error: error.message,
      })
    );
  }
};

const getOrderByNumber = async (req, res) => {
  const { orderNumber } = req.params;

  if (!orderNumber) {
    return res.status(400).json(
      buildErrorResponse('orderNumber is required.')
    );
  }

  try {
    const order = await orderModel.getOrderByNumber(orderNumber, req.user);

    if (!order) {
      return res.status(404).json(
        buildErrorResponse(`Order ${orderNumber} not found or inaccessible.`)
      );
    }

    return res.status(200).json(buildSuccessResponse(order));
  } catch (error) {
    console.error('Get order detail error:', error);
    return res.status(500).json(
      buildErrorResponse('Unable to load order details right now.', {
        error: error.message,
      })
    );
  }
};

const createOrder = async (req, res) => {
  try {
    const order = await orderModel.createOrder(req.user, req.body || {});

    // Fire-and-forget: try sending order email (do not block response)
    try {
      const userEmail = req.user?.email;
      if (userEmail) {
        emailService
          .sendOrderEmail(userEmail, order)
          .catch((err) => console.error('Order email send failure:', err));
      } else {
        console.warn('Order email skipped: user email not available');
      }
    } catch (mailErr) {
      console.error('Order email unexpected error:', mailErr);
    }

    return res.status(201).json(buildSuccessResponse(order));
  } catch (error) {
    console.error('Create order error:', error);
    const status = error.status && Number.isInteger(error.status) ? error.status : 500;
    const message =
      status === 400 || status === 401
        ? error.message
        : 'Unable to create order right now.';
    return res.status(status).json(
      buildErrorResponse(message, {
        error: error.message,
      })
    );
  }
};

const getSellerOrders = async (req, res) => {
  try {
    const orders = await orderModel.listOrdersForSeller(req.user);
    return res.status(200).json(
      buildSuccessResponse(orders, {
        count: orders.length,
      })
    );
  } catch (error) {
    console.error('Get seller orders error:', error);
    return res.status(500).json(
      buildErrorResponse('Unable to load seller orders right now.', {
        error: error.message,
      })
    );
  }
};

const getSellerOrderByNumber = async (req, res) => {
  const { orderNumber } = req.params;

  if (!orderNumber) {
    return res.status(400).json(
      buildErrorResponse('orderNumber is required.')
    );
  }

  try {
    const order = await orderModel.getOrderByNumber(orderNumber, req.user);

    if (!order || Number(order.sellerId) !== Number(req.user.user_id)) {
      return res.status(404).json(
        buildErrorResponse(`Order ${orderNumber} not found or inaccessible.`)
      );
    }

    return res.status(200).json(buildSuccessResponse(order));
  } catch (error) {
    console.error('Get seller order detail error:', error);
    return res.status(500).json(
      buildErrorResponse('Unable to load seller order details right now.', {
        error: error.message,
      })
    );
  }
};

const updateOrderStatus = async (req, res) => {
  const { orderNumber } = req.params;

  if (!orderNumber) {
    return res.status(400).json(buildErrorResponse('orderNumber is required.'));
  }

  try {
    console.log('Update order status request:', { orderNumber, body: req.body }); // Debug log
    const order = await orderModel.updateOrderStatus(req.user, orderNumber, req.body || {});

    if (!order) {
      return res.status(404).json(
        buildErrorResponse('Order not found or you do not have permission to update it.')
      );
    }

    return res.status(200).json(buildSuccessResponse(order));
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json(
      buildErrorResponse('Unable to update order status right now.', {
        error: error.message,
      })
    );
  }
};

const getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user.user_id;

    // Get total products count
    const [productStats] = await sql`
      SELECT COUNT(*) as total_products
      FROM "Product"
      WHERE seller_id = ${sellerId}
    `;

    // Get total orders and active orders count
    const [orderStats] = await sql`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status IN ('ordered', 'shipping', 'using', 'return', 'checking')) as active_orders,
        SUM(total_amount) FILTER (WHERE status = 'completed') as total_revenue
      FROM "Order"
      WHERE seller_id = ${sellerId}
    `;

    // Get recent orders (last 5)
    const recentOrders = await sql`
      SELECT
        o.order_id,
        o.order_number,
        o.status,
        o.total_amount,
        o.placed_at,
        o.created_at
      FROM "Order" o
      WHERE o.seller_id = ${sellerId}
      ORDER BY o.placed_at DESC NULLS LAST, o.created_at DESC
      LIMIT 5
    `;

    const stats = {
      totalProducts: parseInt(productStats.total_products) || 0,
      totalOrders: parseInt(orderStats.total_orders) || 0,
      activeOrders: parseInt(orderStats.active_orders) || 0,
      totalRevenue: parseFloat(orderStats.total_revenue) || 0,
      recentOrders: recentOrders.map(order => ({
        id: order.order_number || order.order_id,
        orderNumber: order.order_number,
        status: order.status,
        totalAmount: parseFloat(order.total_amount) || 0,
        placedDate: order.placed_at ? new Date(order.placed_at).toISOString() : null,
      }))
    };

    return res.status(200).json(buildSuccessResponse(stats));
  } catch (error) {
    console.error('Get seller stats error:', error);
    return res.status(500).json(
      buildErrorResponse('Unable to load seller statistics right now.', {
        error: error.message,
      })
    );
  }
};

const updateScheduleInfo = async (req, res) => {
  const { orderNumber } = req.params;

  if (!orderNumber) {
    return res.status(400).json(buildErrorResponse('orderNumber is required.'));
  }

  try {
    const order = await orderModel.updateScheduleInfo(req.user, orderNumber, req.body || {});

    if (!order) {
      return res.status(404).json(
        buildErrorResponse('Order not found or you do not have permission to update it.')
      );
    }

    return res.status(200).json(buildSuccessResponse(order));
  } catch (error) {
    console.error('Update schedule info error:', error);
    return res.status(500).json(
      buildErrorResponse('Unable to update schedule information right now.', {
        error: error.message,
      })
    );
  }
};

module.exports = {
  getOrders,
  getOrderByNumber,
  createOrder,
  getSellerOrders,
  getSellerOrderByNumber,
  updateOrderStatus,
  getSellerStats,
  updateScheduleInfo,
};
