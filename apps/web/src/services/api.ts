const API_BASE = '/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  public getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const responseText = await response.text();
    let json: any = null;

    if (responseText && responseText.trim().length > 0) {
      try {
        json = JSON.parse(responseText);
      } catch (parseErr) {
        console.warn(`[API] Non-JSON response for ${endpoint}:`, responseText.slice(0, 200));
        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}: ${responseText.slice(0, 150)}`);
        }
        return responseText as unknown as T;
      }
    }

    if (!response.ok || (json && json.success === false)) {
      const errorMsg = json?.error?.message || json?.message || `API request failed with HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    return (json?.data !== undefined ? json.data : json) as T;
  }

  // Auth
  async register(data: { email: string; password: string; name: string }) {
    const res = await this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.token);
    return res;
  }

  async login(data: { email: string; password: string }) {
    const res = await this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.token);
    return res;
  }

  async me() {
    return this.request<any>('/auth/me');
  }

  // Documents
  async listDocuments() {
    return this.request<any[]>('/documents');
  }

  async getDocument(documentId: string) {
    return this.request<any>(`/documents/${documentId}`);
  }

  async uploadDocument(file: File, title?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    return this.request<{ document: any; jobId: string }>('/documents', {
      method: 'POST',
      body: formData,
    });
  }

  async deleteDocument(documentId: string) {
    return this.request<{ deleted: boolean }>(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  async reconstructDocument(documentId: string, format = 'docx') {
    return this.request<{ jobId: string }>(`/documents/${documentId}/reconstruct`, {
      method: 'POST',
      body: JSON.stringify({ format }),
    });
  }

  // Pages
  async getPagesForDocument(documentId: string) {
    return this.request<{
      documentId: string;
      totalPages: number;
      approvedPages: number;
      remainingPages: number;
      pages: any[];
    }>(`/documents/${documentId}/pages`);
  }

  async getPageById(pageId: string) {
    return this.request<any>(`/pages/${pageId}`);
  }

  async startHumanization(pageId: string, options?: any) {
    return this.request<{ jobId: string; status: string; pageId: string }>(
      `/pages/${pageId}/humanize`,
      {
        method: 'POST',
        body: JSON.stringify(options || {}),
      }
    );
  }

  async retryHumanization(pageId: string, options?: any) {
    return this.request<{ jobId: string }>(`/pages/${pageId}/retry`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  async getReview(pageId: string) {
    return this.request<any>(`/pages/${pageId}/review`);
  }

  async approvePage(pageId: string, notes?: string) {
    return this.request<any>(`/pages/${pageId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async editPage(pageId: string, text: string, editSummary?: string) {
    return this.request<any>(`/pages/${pageId}/edit`, {
      method: 'POST',
      body: JSON.stringify({ text, editSummary }),
    });
  }

  async getVersions(pageId: string) {
    return this.request<any[]>(`/pages/${pageId}/versions`);
  }

  async getCandidates(pageId: string) {
    return this.request<any[]>(`/pages/${pageId}/candidates`);
  }

  // Jobs
  async getJobStatus(jobId: string) {
    return this.request<any>(`/jobs/${jobId}`);
  }

  async pollJobUntilComplete(jobId: string, onProgress?: (job: any) => void): Promise<any> {
    const maxAttempts = 300; // Allow up to 4 minutes for deep multi-expert AI refinement
    for (let i = 0; i < maxAttempts; i++) {
      const job = await this.getJobStatus(jobId);
      if (onProgress) onProgress(job);

      if (job.status === 'COMPLETED') {
        return job;
      }
      if (job.status === 'FAILED') {
        throw new Error(job.errorPayload?.message || 'Processing job failed');
      }

      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    throw new Error('Job processing timed out');
  }
}

export const api = new ApiService();
