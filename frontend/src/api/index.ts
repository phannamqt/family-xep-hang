import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export default api;

// ===== Config APIs =====
export const configApi = {
  getCategories: () => api.get('/config/categories').then(r => r.data),
  createCategory: (data: any) => api.post('/config/categories', data).then(r => r.data),
  updateCategory: (id: string, data: any) => api.patch(`/config/categories/${id}`, data).then(r => r.data),
  deleteCategory: (id: string) => api.delete(`/config/categories/${id}`).then(r => r.data),
  getScoreConfig: () => api.get('/config/score-settings').then(r => r.data),
  updateScoreConfig: (data: any) => api.patch('/config/score-settings', data).then(r => r.data),
};

// ===== Rooms APIs =====
export const roomsApi = {
  getAll: () => api.get('/rooms').then(r => r.data),
  getOne: (id: string) => api.get(`/rooms/${id}`).then(r => r.data),
  create: (data: any) => api.post('/rooms', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/rooms/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/rooms/${id}`).then(r => r.data),
  getAvailableSlots: (id: string) => api.get(`/rooms/${id}/slots/available`).then(r => r.data),
  upsertSlots: (id: string, count: number) => api.post(`/rooms/${id}/slots`, { count }).then(r => r.data),
  updateSlot: (roomId: string, slotId: string, data: any) =>
    api.patch(`/rooms/${roomId}/slots/${slotId}`, data).then(r => r.data),
};

// ===== Patients APIs =====
export const patientsApi = {
  getAll: (search?: string) => api.get('/patients', { params: { search } }).then(r => r.data),
  getOne: (id: string) => api.get(`/patients/${id}`).then(r => r.data),
  create: (data: any) => api.post('/patients', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/patients/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/patients/${id}`).then(r => r.data),
};

// ===== Visits APIs =====
export const visitsApi = {
  getAll: (date?: string) => api.get('/visits', { params: { date } }).then(r => r.data),
  getOne: (id: string) => api.get(`/visits/${id}`).then(r => r.data),
  create: (data: any) => api.post('/visits', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/visits/${id}`, data).then(r => r.data),
  updateCategories: (id: string, categoryIds: string[]) =>
    api.patch(`/visits/${id}/categories`, { categoryIds }).then(r => r.data),
  checkIn: (visitCode: string, type: 'new' | 'result', roomId: string) =>
    api.post('/visits/checkin', { visitCode, type, roomId }).then(r => r.data),
};

// ===== Queue APIs =====
export const queueApi = {
  getQueue: (roomId: string, date?: string) =>
    api.get('/queue', { params: { roomId, date } }).then(r => r.data),
  invite: (queueEntryId: string, slotId: string) =>
    api.post('/queue/invite', { queueEntryId, slotId }).then(r => r.data),
  markDone: (entryId: string) => api.post(`/queue/${entryId}/done`).then(r => r.data),
  skip: (entryId: string) => api.post(`/queue/${entryId}/skip`).then(r => r.data),
  updateFairness: (queueEntryId: string, scoreF: number) =>
    api.patch('/queue/fairness', { queueEntryId, scoreF }).then(r => r.data),
  updateQueuedAt: (queueEntryId: string, queuedAt: string) =>
    api.patch('/queue/queued-at', { queueEntryId, queuedAt }).then(r => r.data),
};
