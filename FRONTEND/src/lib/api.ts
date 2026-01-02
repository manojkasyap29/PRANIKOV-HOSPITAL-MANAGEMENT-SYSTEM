import axios from 'axios';

// Configure your Flask backend URL here
const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (userData: any) => api.post('/register', userData),
  login: (credentials: { email: string; password: string }) => api.post('/login', credentials),
  getProfile: () => api.get('/profile'),
  updateProfile: (profile: any) => api.put('/profile', profile),
  uploadAvatar: (file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/profile/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          const percent = Math.round((evt.loaded * 100) / evt.total);
          onProgress(percent);
        }
      },
    });
  },
};

// Appointments API
export const appointmentsAPI = {
  getAll: () => api.get('/appointments'),
  getById: (id: string) => api.get(`/appointments/${id}`),
  getAvailability: (doctorId: string, date: string) => api.get('/appointments/availability', { params: { doctorId, date } }),
  create: (appointment: any) => api.post('/appointments', appointment),
  update: (id: string, appointment: any) => api.put(`/appointments/${id}`, appointment),
  delete: (id: string) => api.delete(`/appointments/${id}`),
};

// Prescriptions API
export const prescriptionsAPI = {
  getAll: () => api.get('/prescriptions'),
  getById: (id: string) => api.get(`/prescriptions/${id}`),
  create: (prescription: any) => api.post('/prescriptions', prescription),
  update: (id: string, prescription: any) => api.put(`/prescriptions/${id}`, prescription),
  delete: (id: string) => api.delete(`/prescriptions/${id}`),
};

// Health Records API
export const healthRecordsAPI = {
  getAll: () => api.get('/health-records'),
  getById: (id: string) => api.get(`/health-records/${id}`),
  create: (record: any) => api.post('/health-records', record),
  update: (id: string, record: any) => api.put(`/health-records/${id}`, record),
  delete: (id: string) => api.delete(`/health-records/${id}`),
};

// Pharmacy API
export const pharmacyAPI = {
  getProducts: () => api.get('/pharmacy/products'),
  getProductById: (id: string) => api.get(`/pharmacy/products/${id}`),
  createProduct: (product: any) => api.post('/pharmacy/products', product),
  updateProduct: (id: string, data: any) => api.put(`/pharmacy/products/${id}`, data),
  createOrder: (order: any) => api.post('/pharmacy/orders', order),
  getOrders: () => api.get('/pharmacy/orders'),
  getOrderById: (id: string) => api.get(`/pharmacy/orders/${id}`),
  getPaymentInfo: (id: string) => api.get(`/pharmacy/orders/${id}/payment`),
  confirmPayment: (id: string) => api.post(`/pharmacy/orders/${id}/payment/confirm`),
  updateOrderStatus: (id: string, status: string) => api.put(`/pharmacy/orders/${id}`, { status }),
};

// Doctors API
export const doctorsAPI = {
  getAll: () => api.get('/doctors'),
  getById: (id: string) => api.get(`/doctors/${id}`),
};

// Patients API
export const patientsAPI = {
  getAll: () => api.get('/patients'),
  getById: (id: string) => api.get(`/patients/${id}`),
  getByDoctor: (doctorId: string) => api.get(`/patients/doctor/${doctorId}`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateUser: (id: string, userData: any) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
};

// Phone Verification API
export const phoneAPI = {
  status: () => api.get('/phone/status'),
  sendOTP: (phone?: string) => api.post('/phone/send-otp', phone ? { phone } : {}),
  verifyOTP: (otp: string) => api.post('/phone/verify-otp', { otp }),
};


export const conversationsAPI = {
  list: () => api.get('/conversations'),
  assign: (conversationId: number, agentId: string) => api.post(`/conversations/${conversationId}/assign`, { agentId }),
  listMessages: (conversationId: number) => api.get(`/conversations/${conversationId}/messages`),
  reply: (conversationId: number, body: string) => api.post(`/conversations/${conversationId}/reply`, { body }),
};

// Assistants API
export const assistantsAPI = {
  list: () => api.get('/assistants'),
  create: (payload: { name: string; description?: string; skills?: Record<string, boolean> }) => api.post('/assistants', payload),
  run: (
    assistantId: string,
    task:
      | 'appointments_review'
      | 'orders_review'
      | 'waiting_list_confirm'
      | 'appointments_reschedule'
      | 'orders_followup'
      | 'phone_verification_review'
  ) => api.post(`/assistants/${assistantId}/run`, { task }),
};

export default api;
