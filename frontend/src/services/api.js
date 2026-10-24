const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || `Request failed with status ${response.status}`);
    error.code = payload.code;
    error.status = response.status;
    error.conflict = payload.conflict;
    error.suggestions = payload.suggestions || [];
    throw error;
  }
  return payload;
}

export const api = {
  health: () => request('/health'),
  me: () => request('/auth/me'),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  registerAdmin: (payload) => request('/auth/register/admin', { method: 'POST', body: JSON.stringify(payload) }),
  institutions: (query = '') => request(`/institutions${query ? `?q=${encodeURIComponent(query)}` : ''}`),
  institution: (slug) => request(`/institutions/${slug}`),
  resources: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value));
    return request(`/resources${query.toString() ? `?${query}` : ''}`);
  },
  resource: (resourceId) => request(`/resources/${resourceId}`),
  availability: (resourceId, params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value));
    return request(`/resources/${resourceId}/availability?${query}`);
  },
  dashboardSummary: () => request('/dashboard/summary'),
  bookings: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value));
    return request(`/bookings${query.toString() ? `?${query}` : ''}`);
  },
  booking: (bookingId) => request(`/bookings/${bookingId}`),
  createBooking: (payload) => request('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  cancelBooking: (id) => request(`/bookings/${id}/cancel`, { method: 'PATCH' }),
  users: (role = '') => request(`/users${role ? `?role=${encodeURIComponent(role)}` : ''}`),
  createResource: (payload) => request('/resources', { method: 'POST', body: JSON.stringify(payload) }),
  updateResource: (id, payload) => request(`/resources/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  updateBookingStatus: (id, status, rejectionReason = '') => request(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, rejectionReason }) })
};
