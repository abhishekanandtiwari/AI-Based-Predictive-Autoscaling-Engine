const BASE_URL = 'https://ai-based-predictive-autoscaling-engine.onrender.com/api';

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async register(name, email, password, role = 'user') {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    return handleResponse(res);
  },

  async logout() {
    const res = await fetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
    return handleResponse(res);
  },

  async getCurrentUser() {
    const res = await fetch(`${BASE_URL}/auth/me`);
    return handleResponse(res);
  },

  async demoLogin(role = 'admin') {
    const res = await fetch(`${BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    return handleResponse(res);
  },

  // Telemetry & Data
  async getSummary() {
    const res = await fetch(`${BASE_URL}/reports/summary`);
    return handleResponse(res);
  },

  async getHistory(page = 1, perPage = 50) {
    const res = await fetch(`${BASE_URL}/data/history?page=${page}&per_page=${perPage}`);
    return handleResponse(res);
  },

  async generateData(days = 60, seed = 42) {
    const res = await fetch(`${BASE_URL}/data/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days, seed }),
    });
    return handleResponse(res);
  },

  async uploadDataCSV(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/data/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  // Machine Learning Forecasting
  async trainModel(params = {}) {
    const res = await fetch(`${BASE_URL}/forecast/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async getForecast(horizon = 24) {
    const res = await fetch(`${BASE_URL}/forecast/predict?horizon=${horizon}`);
    return handleResponse(res);
  },

  async getModelMetrics() {
    const res = await fetch(`${BASE_URL}/forecast/metrics`);
    return handleResponse(res);
  },

  // Autoscaling & Comparison
  async getRecommendation(params) {
    const res = await fetch(`${BASE_URL}/autoscaling/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async runComparison(params = {}) {
    const res = await fetch(`${BASE_URL}/autoscaling/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async getScalingEvents() {
   const res = await fetch(`${BASE_URL}/autoscaling/events`);
    return handleResponse(res);
  },

  // Live Interactive Simulator
  async startSimulation(params = {}) {
    const res = await fetch(`${BASE_URL}/simulation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async pauseSimulation() {
    const res = await fetch(`${BASE_URL}/simulation/pause`, { method: 'POST' });
    return handleResponse(res);
  },

  async resumeSimulation() {
    const res = await fetch(`${BASE_URL}/simulation/resume`, { method: 'POST' });
    return handleResponse(res);
  },

  async stepSimulation(steps = 1) {
    const res = await fetch(`${BASE_URL}/simulation/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steps }),
    });
    return handleResponse(res);
  },

  async resetSimulation(seed = 42) {
    const res = await fetch(`${BASE_URL}/simulation/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed }),
    });
    return handleResponse(res);
  },

  async injectSpike(factor = 2.5, duration = 4) {
    const res = await fetch(`${BASE_URL}/simulation/inject-spike`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factor, duration }),
    });
    return handleResponse(res);
  },

  async getSimulationStatus() {
    const res = await fetch(`${BASE_URL}/simulation/status`);
    return handleResponse(res);
  },

  async getSimulationHistory(limit = 100) {
    const res = await fetch(`${BASE_URL}/simulation/history?limit=${limit}`);
    return handleResponse(res);
  },

  // Cost Optimization
  async calculateCost(params) {
    const res = await fetch(`${BASE_URL}/cost/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async compareCost(params = {}) {
    const res = await fetch(`${BASE_URL}/cost/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  // Reports
  async getReportSummary() {
    const res = await fetch(`${BASE_URL}/reports/summary`);
    return handleResponse(res);
  },
};
