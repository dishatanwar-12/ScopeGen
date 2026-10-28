const API_BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set Content-Type only if not sending FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred.';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      errorDetail = await response.text() || errorDetail;
    }
    throw new ApiError(response.status, errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),

  // Clients
  getClients: (q?: string) => request<any[]>(`/clients${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getClient: (id: string) => request<any>(`/clients/${id}`),
  createClient: (data: any) => request<any>('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: any) => request<any>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: string) => request<void>(`/clients/${id}`, { method: 'DELETE' }),

  // Projects
  getProjects: (clientId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (clientId) params.append('client_id', clientId);
    if (status) params.append('status', status);
    const qs = params.toString();
    return request<any[]>(`/projects${qs ? `?${qs}` : ''}`);
  },
  getProject: (id: string) => request<any>(`/projects/${id}`),
  createProject: (data: any) => request<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: any) => request<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Discovery
  getNotes: (projectId: string) => request<any[]>(`/projects/${projectId}/notes`),
  addNote: (projectId: string, data: any) => request<any>(`/projects/${projectId}/notes`, { method: 'POST', body: JSON.stringify(data) }),
  deleteNote: (noteId: string) => request<void>(`/projects/notes/${noteId}`, { method: 'DELETE' }),

  getDocuments: (projectId: string) => request<any[]>(`/projects/${projectId}/documents`),
  uploadDocument: (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<any>(`/projects/${projectId}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
  },
  deleteDocument: (docId: string) => request<void>(`/projects/documents/${docId}`, { method: 'DELETE' }),

  // Packages
  getPackages: (status?: string) => request<any[]>(`/packages${status ? `?status=${status}` : ''}`),
  getPackage: (id: string) => request<any>(`/packages/${id}`),
  createPackage: (data: any) => request<any>('/packages', { method: 'POST', body: JSON.stringify(data) }),
  updatePackage: (id: string, data: any) => request<any>(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  approvePackage: (id: string) => request<any>(`/packages/${id}/approve`, { method: 'POST' }),
  archivePackage: (id: string) => request<any>(`/packages/${id}/archive`, { method: 'POST' }),

  // Templates
  getTemplates: () => request<any[]>('/templates'),
  getTemplate: (id: string) => request<any>(`/templates/${id}`),
  createTemplate: (data: any) => request<any>('/templates', { method: 'POST', body: JSON.stringify(data) }),
  updateTemplate: (id: string, data: any) => request<any>(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  approveTemplate: (id: string) => request<any>(`/templates/${id}/approve`, { method: 'POST' }),

  // Fact Review & Proposal Generation
  reviewFacts: (data: any) => request<any>('/proposals/review-facts', { method: 'POST', body: JSON.stringify(data) }),
  generateProposal: (data: any) => request<any>('/proposals/generate', { method: 'POST', body: JSON.stringify(data) }),
  getProposals: (projectId?: string) => request<any[]>(`/proposals${projectId ? `?project_id=${projectId}` : ''}`),
  getProposal: (id: string) => request<any>(`/proposals/${id}`),
  updateSection: (proposalId: string, sectionId: string, data: any) =>
    request<any>(`/proposals/${proposalId}/sections/${sectionId}`, { method: 'PUT', body: JSON.stringify(data) }),
  regenerateSection: (proposalId: string, data: any) =>
    request<any>(`/proposals/${proposalId}/regenerate-section`, { method: 'POST', body: JSON.stringify(data) }),

  createVersion: (proposalId: string, summary?: string) =>
    request<any>(`/proposals/${proposalId}/versions${summary ? `?summary=${encodeURIComponent(summary)}` : ''}`, { method: 'POST' }),
  getVersions: (proposalId: string) => request<any[]>(`/proposals/${proposalId}/versions`),
  restoreVersion: (proposalId: string, versionId: string) =>
    request<any>(`/proposals/${proposalId}/restore/${versionId}`, { method: 'POST' }),

  updateProposalStatus: (proposalId: string, newStatus: string) =>
    request<any>(`/proposals/${proposalId}/status?new_status=${newStatus}`, { method: 'PUT' }),

  // Confirmation Questions
  updateQuestion: (questionId: string, data: any) =>
    request<any>(`/proposals/questions/${questionId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // System & Health
  getHealth: () => request<any>('/system/health'),
  getAiStatus: () => request<any>('/system/ai-status'),
  getDashboardStats: () => request<any>('/system/dashboard-stats'),

  // Document Export Download URLs
  downloadPdf: (proposalId: string, filename: string) => {
    const token = localStorage.getItem('token');
    fetch(`/api/v1/proposals/${proposalId}/export/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to generate PDF');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      });
  },

  downloadDocx: (proposalId: string, filename: string) => {
    const token = localStorage.getItem('token');
    fetch(`/api/v1/proposals/${proposalId}/export/docx`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to generate DOCX');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      });
  },
};

