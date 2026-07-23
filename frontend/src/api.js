import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Auth
export const loginUser = (formData) => API.post('/login', formData);
export const registerUser = (formData) => API.post('/register', formData);

// Jobs
export const getJobs = () => API.get('/jobs');
export const getJobById = (id) => API.get(`/jobs/${id}`);
export const createJob = (data) => API.post('/jobs', data);
export const updateJob = (id, data) => API.put(`/jobs/${id}`, data);
export const deleteJob = (id) => API.delete(`/jobs/${id}`);

// Resumes
export const uploadResume = (formData) => API.post('/resumes/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const getMyResumes = () => API.get('/resumes/me');

// Applications
export const applyForJob = (data) => API.post('/applications', data);
export const getMyApplications = () => API.get('/applications/me');
export const getJobApplications = (jobId) => API.get(`/applications/job/${jobId}`);
export const updateApplicationStatus = (id, status) => API.patch(`/applications/${id}/status`, { status });

// Notifications
export const getMyNotifications = () => API.get('/notifications/me');
export const markNotificationRead = (id) => API.patch(`/notifications/${id}/read`);

export default API;
