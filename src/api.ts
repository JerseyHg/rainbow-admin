// ============================================================
// API 请求层 (TypeScript)
// ============================================================

import type {
  ApiResponse,
  LoginResponse,
  DashboardStats,
  PendingListData,
  ProfileDetail,
  PostPreview,
  GenerateCodesData,
} from './types'

// 开发时通过 Vite proxy 转发 /api -> localhost:8000
// 生产部署时可以改为实际域名
const API_BASE = '/api/v1'

class ApiClient {
  private token: string | null = null

  setToken(t: string | null) {
    this.token = t
  }

  getToken(): string | null {
    return this.token
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const res = await fetch(`${API_BASE}${url}`, { ...options, headers })

    if (res.status === 401) {
      this.token = null
      throw new Error('AUTH_EXPIRED')
    }

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.detail || data.message || '请求失败')
    }

    return data as T
  }

  // ========== 管理员认证 ==========

  async login(username: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  }

  // ========== 资料管理 ==========

  async getPendingProfiles(page = 1, limit = 20): Promise<ApiResponse<PendingListData>> {
    return this.request(`/admin/profiles/pending?page=${page}&limit=${limit}`)
  }

  async getProfileDetail(id: number): Promise<ApiResponse<ProfileDetail>> {
    return this.request(`/admin/profile/${id}/detail`)
  }

  async previewPost(id: number): Promise<ApiResponse<PostPreview>> {
    return this.request(`/admin/profile/${id}/preview-post`)
  }

  async approveProfile(id: number, notes?: string): Promise<ApiResponse> {
    return this.request(`/admin/profile/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes || '' }),
    })
  }

  async rejectProfile(id: number, reason: string): Promise<ApiResponse> {
    return this.request(`/admin/profile/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  // ========== 邀请码管理 ==========

  async generateCodes(count: number, notes?: string): Promise<ApiResponse<GenerateCodesData>> {
    const params = new URLSearchParams({
      count: String(count),
      notes: notes || '管理员生成',
    })
    return this.request(`/admin/invitation/generate?${params}`, {
      method: 'POST',
    })
  }

  // ========== 仪表盘 ==========

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request('/admin/dashboard/stats')
  }

  // ========== 邀请码列表 ==========

  async getInvitationList(page = 1, limit = 50): Promise<ApiResponse> {
    return this.request(`/admin/invitation/list?page=${page}&limit=${limit}`)
  }

  async getProfilesByStatus(status: string, page = 1, limit = 20): Promise<ApiResponse<PendingListData>> {
    return this.request(`/admin/profiles/list?status=${status}&page=${page}&limit=${limit}`)
  }

  // ========== 邀请关系网络 ==========

  async getNetworkTree(): Promise<ApiResponse> {
    return this.request('/admin/network/tree')
  }

  async getNetworkUserDetail(userId: number): Promise<ApiResponse> {
    return this.request(`/admin/network/user/${userId}`)
  }
}

// 导出单例
export const api = new ApiClient()
