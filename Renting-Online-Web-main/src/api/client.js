import { API_BASE } from './config';

// Leaves a fully qualified URL alone, otherwise normalises the path onto /api
// and prefixes API_BASE - empty in both dev and production, so requests stay on
// the current origin and carry the session cookie.
const ensureApiPath = (path = '/api') => {
  if (!path) {
    return '/api';
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (path.startsWith('/api')) {
    return `${API_BASE}${path}`;
  }
  return path.startsWith('/')
    ? `${API_BASE}/api${path}`
    : `${API_BASE}/api/${path}`;
};

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const request = async (path, { method = 'GET', body, headers, ...rest } = {}) => {
  const response = await fetch(ensureApiPath(path), {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body,
    ...rest,
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data;
};

// Admin API Services
export const adminApi = {
  // User management
  getUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/users${queryString ? `?${queryString}` : ''}`);
  },

  getUserById: async (id) => {
    return request(`/users/${id}`);
  },

  updateUser: async (id, updates) => {
    return request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  deleteUser: async (id) => {
    return request(`/users/${id}`, {
      method: 'DELETE'
    });
  },

  // Product management
  getProducts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/products${queryString ? `?${queryString}` : ''}`);
  },

  getProductById: async (id) => {
    return request(`/products/${id}`);
  },

  updateProduct: async (id, updates) => {
    return request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  deleteProduct: async (id) => {
    return request(`/products/${id}`, {
      method: 'DELETE'
    });
  },

  // Report management
  getReports: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/reports${queryString ? `?${queryString}` : ''}`);
  },

  getReportsByStatus: async (status, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/reports/status/${status}${queryString ? `?${queryString}` : ''}`);
  },

  getReportById: async (id) => {
    return request(`/reports/${id}`);
  },

  updateReport: async (id, updates) => {
    return request(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  deleteReport: async (id) => {
    return request(`/reports/${id}`, {
      method: 'DELETE'
    });
  },

  // Order management (when available)
  getOrders: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/orders${queryString ? `?${queryString}` : ''}`);
  },

  // Reviews management
  getReviews: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/reviews${queryString ? `?${queryString}` : ''}`);
  },

  getProductReviews: async (productId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return request(`/reviews/product/${productId}${queryString ? `?${queryString}` : ''}`);
  }
};

export { ApiError, request };
