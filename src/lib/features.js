export const BUSINESS_FEATURE_IDS = ['company', 'team', 'clients', 'approvals', 'vendors', 'shops', 'analytics']

export function isFeatureOn(enabled, id) {
  return Array.isArray(enabled) && enabled.includes(id)
}

export function normalizeFeatures(enabled) {
  if (!Array.isArray(enabled)) return []
  return enabled.filter((id) => BUSINESS_FEATURE_IDS.includes(id))
}

export function setFeatureOn(enabled, id, on) {
  const current = normalizeFeatures(enabled)
  if (!BUSINESS_FEATURE_IDS.includes(id)) return current
  if (on) return current.includes(id) ? current : [...current, id]
  return current.filter((item) => item !== id)
}

export function areAllFeaturesOn(enabled) {
  const current = normalizeFeatures(enabled)
  return BUSINESS_FEATURE_IDS.length > 0 && BUSINESS_FEATURE_IDS.every((id) => current.includes(id))
}
