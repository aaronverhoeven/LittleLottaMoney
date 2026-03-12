const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

async function patch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`)
  return res.json() as Promise<T>
}

// ── API surface ───────────────────────────────────────────────────────────────
export const api = {
  summary:  () => get<any>('/summary'),

  profile: {
    get:           () => get<any>('/profile'),
    update:        (data: any) => put<any>('/profile', data),
    updateAI:      (data: any) => put<any>('/profile/ai-settings', data),
  },

  accounts: {
    list:          () => get<any>('/accounts'),
    create:        (data: any) => post<any>('/accounts', data),
    update:        (id: number, data: any) => put<any>(`/accounts/${id}`, data),
    remove:        (id: number) => del<any>(`/accounts/${id}`),
    netWorth:      () => get<any>('/accounts/net-worth'),
    assets:        () => get<any>('/accounts/assets'),
    createAsset:   (data: any) => post<any>('/accounts/assets', data),
    updateAsset:   (id: number, data: any) => put<any>(`/accounts/assets/${id}`, data),
    removeAsset:   (id: number) => del<any>(`/accounts/assets/${id}`),
  },

  transactions: {
    list:          (params?: Record<string, string | number>) => {
      const qs = params ? '?' + new URLSearchParams(params as any).toString() : ''
      return get<any>(`/transactions${qs}`)
    },
    create:        (data: any) => post<any>('/transactions', data),
    update:        (id: number, data: any) => patch<any>(`/transactions/${id}`, data),
    remove:        (id: number) => del<any>(`/transactions/${id}`),
    categories:    () => get<any>('/transactions/categories'),
    monthly:       (year?: number, month?: number) => {
      const qs = year ? `?year=${year}&month=${month}` : ''
      return get<any>(`/transactions/summary/monthly${qs}`)
    },
  },

  budget: {
    get:           (year?: number, month?: number) => {
      const qs = year ? `?year=${year}&month=${month}` : ''
      return get<any>(`/budget${qs}`)
    },
    createBucket:  (data: any) => post<any>('/budget/buckets', data),
    updateBucket:  (id: number, data: any) => put<any>(`/budget/buckets/${id}`, data),
    removeBucket:  (id: number) => del<any>(`/budget/buckets/${id}`),
    updatePeriod:  (bucketId: number, data: any) => put<any>(`/budget/periods/${bucketId}`, data),
  },

  goals: {
    list:          () => get<any>('/goals'),
    create:        (data: any) => post<any>('/goals', data),
    update:        (id: number, data: any) => put<any>(`/goals/${id}`, data),
    allocate:      (id: number, amount: number) => post<any>(`/goals/${id}/allocate`, { amount }),
    remove:        (id: number) => del<any>(`/goals/${id}`),
  },

  income: {
    get:           () => get<any>('/income'),
    create:        (data: any) => post<any>('/income', data),
    update:        (id: number, data: any) => patch<any>(`/income/${id}`, data),
    toggleOutlier: (id: number) => post<any>(`/income/${id}/toggle-outlier`),
    netWorthHistory: () => get<any>('/income/net-worth-history'),
  },

  filters: {
    list:          () => get<any>('/filters'),
    create:        (data: any) => post<any>('/filters', data),
    update:        (id: number, data: any) => put<any>(`/filters/${id}`, data),
    toggle:        (id: number) => patch<any>(`/filters/${id}/toggle`),
    remove:        (id: number) => del<any>(`/filters/${id}`),
    test:          (data: any) => post<any>('/filters/test', data),
    apply:         () => post<any>('/filters/apply'),
    suggestions:   () => get<any>('/filters/suggestions'),
  },
}
