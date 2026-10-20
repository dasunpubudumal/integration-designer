export const STEP_TYPE_COLORS = {
  Validate: '#8b5cf6',
  Enrich: '#ec4899',
  Transform: '#f59e0b',
  Route: '#3b82f6',
  Operate: '#10b981'
}

export const STEP_TYPES = Object.keys(STEP_TYPE_COLORS)

export function stepTypeColor(type) {
  return STEP_TYPE_COLORS[type] || '#94a3b8'
}
