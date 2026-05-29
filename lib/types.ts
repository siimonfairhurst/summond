export type Source = 'producthunt' | 'dribbble'
export type Category = 'all' | 'app' | 'game' | 'tool' | 'website' | 'design'

export interface Project {
  id: string
  title: string
  description: string
  imageUrl: string        // the actual product screenshot/thumbnail
  sourceUrl: string       // link back to original
  source: Source
  tool: string            // Claude, Cursor, Bolt, Lovable, etc.
  category: Category
  likes: number
  author: string
  authorAvatar?: string
  createdAt: string
}

// Keywords used to identify vibe-coded projects
export const VIBE_KEYWORDS = [
  'vibe cod', 'vibecod',
  'claude', 'cursor ai', 'bolt.new', 'lovable', 'replit',
  'v0.dev', 'built with ai', 'ai built', 'made with ai',
  'no code ai', 'ai generated', 'shipped with ai',
  'ai app', 'ai tool', 'ai product',
]

export function isVibeCoded(text: string) {
  const t = text.toLowerCase()
  return VIBE_KEYWORDS.some(k => t.includes(k))
}

export function detectTool(text: string) {
  const t = text.toLowerCase()
  if (t.includes('claude')) return 'Claude'
  if (t.includes('cursor')) return 'Cursor'
  if (t.includes('bolt')) return 'Bolt.new'
  if (t.includes('lovable')) return 'Lovable'
  if (t.includes('v0') || t.includes('vercel')) return 'v0'
  if (t.includes('replit')) return 'Replit'
  if (t.includes('windsurf')) return 'Windsurf'
  return 'AI'
}

export function detectCategory(text: string): Category {
  const t = text.toLowerCase()
  if (/game|gaming|arcade|puzzle/.test(t)) return 'game'
  if (/tool|util|productivity|dashboard|analytics|developer/.test(t)) return 'tool'
  if (/design|ui|ux|figma|brand|motion|typography/.test(t)) return 'design'
  if (/app|mobile|ios|android|saas/.test(t)) return 'app'
  if (/site|landing|portfolio|web|agency/.test(t)) return 'website'
  return 'app'
}
