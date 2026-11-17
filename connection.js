// Inspect only declared provider connection metadata; never expose raw provider configs or secrets.
export function discoverConnections(ctx) {
  const editor = ctx.get('configEditor')
  const found = []
  for (const entry of editor?.entries() || []) {
    if (entry.options.name !== '@deepseek-ai/dsh-llm-pi-ai') continue
    const providers = entry.options.config?.providers || {}
    for (const [id, p] of Object.entries(providers)) {
      const baseUrl = p?.baseURL
      if (typeof baseUrl !== 'string') continue
      let url
      try { url = new URL(baseUrl) } catch { continue }
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) continue
      const official = url.hostname === 'api.aitransx.com' || url.hostname === 'aitransx.com'
      found.push({ id, name: typeof p.displayName === 'string' ? p.displayName : id, baseUrl, apiKeyEnv: typeof p.apiKeyEnv === 'string' ? p.apiKeyEnv : '', official })
    }
  }
  return found
}
export function resolveConnection(ctx, config) {
  const all = discoverConnections(ctx)
  let selected
  if (config.providerId) {
    selected = all.find(p => p.id === config.providerId)
    if (!selected) return { id: config.providerId, source: 'unavailable', baseUrl: config.baseUrl, apiKeyEnv: '', error: '关联服务商已不存在或地址不合法；请查看 ATX 模型并重新关联。' }
  } else {
    const candidates = all.filter(p => p.official)
    // Never guess between two credential domains or silently select a third-party gateway.
    if (candidates.length === 1) selected = candidates[0]
  }
  return selected ? { ...selected, source: 'existing-provider' } : {
    id: null, name: 'ATX standalone', baseUrl: config.baseUrl, apiKeyEnv: config.apiKeyEnv, source: 'plugin-config',
  }
}
