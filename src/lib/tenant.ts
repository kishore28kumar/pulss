import { supabase, isSupabaseConfigured } from './supabase'

export const getCurrentTenant = () => {
  const host = window.location.host
  const subdomain = host.split('.')[0]
  
  if (host.includes('localhost') || !host.includes('.')) {
    return localStorage.getItem('selected_tenant_id')
  }
  
  return subdomain
}

export const getTenantBySubdomain = async (subdomain: string) => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', subdomain)
      .single()

    if (error) return null
    return data
  } catch {
    return null
  }
}

export const getTenantById = async (id: string) => {
  if (!isSupabaseConfigured()) return null

  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  } catch {
    return null
  }
}

export const setSelectedTenant = (tenantId: string) => {
  localStorage.setItem('selected_tenant_id', tenantId)
}