import { api } from './api'

export const isSupabaseConfigured = () => {
  return true
}

export const getStorageUrl = (path: string) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${apiUrl}/uploads/${path}`
}

export const uploadFile = async (file: File, path: string) => {
  const response = await api.uploadFile('/upload', file)
  
  if (response.error) {
    throw new Error(response.error)
  }

  return response.data
}

class QueryBuilder<T> {
  private endpoint: string
  private filters: Record<string, any> = {}
  private selectFields = '*'
  private limitValue?: number
  private orderByField?: string
  private orderDirection: 'asc' | 'desc' = 'asc'
  private singleResult = false

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  select(fields = '*') {
    this.selectFields = fields
    return this
  }

  eq(field: string, value: any) {
    this.filters[field] = value
    return this
  }

  neq(field: string, value: any) {
    this.filters[`${field}_neq`] = value
    return this
  }

  gt(field: string, value: any) {
    this.filters[`${field}_gt`] = value
    return this
  }

  gte(field: string, value: any) {
    this.filters[`${field}_gte`] = value
    return this
  }

  lt(field: string, value: any) {
    this.filters[`${field}_lt`] = value
    return this
  }

  lte(field: string, value: any) {
    this.filters[`${field}_lte`] = value
    return this
  }

  like(field: string, value: string) {
    this.filters[`${field}_like`] = value
    return this
  }

  ilike(field: string, value: string) {
    this.filters[`${field}_ilike`] = value
    return this
  }

  in(field: string, values: any[]) {
    this.filters[`${field}_in`] = values.join(',')
    return this
  }

  order(field: string, { ascending = true }: { ascending?: boolean } = {}) {
    this.orderByField = field
    this.orderDirection = ascending ? 'asc' : 'desc'
    return this
  }

  limit(count: number) {
    this.limitValue = count
    return this
  }

  single() {
    this.singleResult = true
    return this
  }

  async execute() {
    const params = new URLSearchParams()
    
    Object.entries(this.filters).forEach(([key, value]) => {
      params.append(key, String(value))
    })

    if (this.selectFields !== '*') {
      params.append('select', this.selectFields)
    }

    if (this.orderByField) {
      params.append('order_by', this.orderByField)
      params.append('order_dir', this.orderDirection)
    }

    if (this.limitValue) {
      params.append('limit', String(this.limitValue))
    }

    const queryString = params.toString()
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint

    const response = await api.get<T>(url)

    if (response.error) {
      return { data: null, error: new Error(response.error) }
    }

    if (this.singleResult) {
      const data = Array.isArray(response.data) ? response.data[0] : response.data
      return { data, error: null }
    }

    return { data: response.data, error: null }
  }
}

class SupabaseClient {
  from(table: string) {
    return {
      select: (fields = '*') => {
        const builder = new QueryBuilder(`/${table}`)
        return builder.select(fields)
      },
      insert: async (data: any) => {
        const response = await api.post(`/${table}`, data)
        if (response.error) {
          return { data: null, error: new Error(response.error) }
        }
        return { data: response.data, error: null }
      },
      update: async (data: any) => {
        const builder = new QueryBuilder(`/${table}`)
        return {
          eq: (field: string, value: any) => ({
            execute: async () => {
              const response = await api.put(`/${table}/${value}`, data)
              if (response.error) {
                return { data: null, error: new Error(response.error) }
              }
              return { data: response.data, error: null }
            }
          })
        }
      },
      delete: () => ({
        eq: (field: string, value: any) => ({
          execute: async () => {
            const response = await api.delete(`/${table}/${value}`)
            if (response.error) {
              return { data: null, error: new Error(response.error) }
            }
            return { data: response.data, error: null }
          }
        })
      }),
      upsert: async (data: any) => {
        const response = await api.post(`/${table}/upsert`, data)
        if (response.error) {
          return { data: null, error: new Error(response.error) }
        }
        return { data: response.data, error: null }
      }
    }
  }

  storage = {
    from: (bucket: string) => ({
      getPublicUrl: (path: string) => ({
        data: { publicUrl: getStorageUrl(path) }
      }),
      upload: async (path: string, file: File, options?: any) => {
        try {
          const data = await uploadFile(file, path)
          return { data, error: null }
        } catch (error) {
          return { 
            data: null, 
            error: error instanceof Error ? error : new Error('Upload failed') 
          }
        }
      }
    })
  }
}

export const supabase = new SupabaseClient()
