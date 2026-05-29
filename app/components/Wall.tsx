'use client'

import { useEffect, useState } from 'react'
import type { Project, Category } from '../../../lib/types'

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'Everything', value: 'all' },
  { label: 'Apps',       value: 'app' },
  { label: 'Tools',      value: 'tool' },
  { label: 'Websites',   value: 'website' },
  { label: 'Design',     value: 'design' },
  { label: 'Games',      value: 'game' },
]

const TOOL_LABEL: Record<string, string> = {
  Claude: 'Claude', Cursor: 'Cursor', 'Bolt.new': 'Bolt.new',
  Lovable: 'Lovable', v0: 'v0', Replit: 'Replit', Windsurf: 'Windsurf', AI: 'AI',
}

const SOURCE_LABEL: Record<string, string> = {
  producthunt: 'Product Hunt',
  dribbble: 'Dribbble',
}

const DEMO: Project[] = [
  'AI invoice SaaS', 'Neon tetris remake', 'Brand identity generator',
  'Habit tracker app', 'Music visualiser', 'Pixel art editor',
  'E-commerce storefront', 'Chess with AI opponent', 'Generative art studio',
  'Budget tracker', 'URL shortener', 'Terminal portfolio',
  'Gradient mesh tool', 'Meeting notes AI', 'Pomodoro + mixer',
  'Space invaders port', 'Type specimen generator', 'Recipe scaler',
  '3D product configurator', 'Kanban board', 'Flashcard app',
  'Weather dashboard', 'Code diff visualiser', 'Interactive CV',
].map((title, i) => ({
  id: `demo-${i}`,
  title,
  description: 'Summoned into existence with AI.',
  imageUrl: `https://picsum.photos/seed/smnd${i}/600/${320 + (i % 7) * 40}`,
  sourceUrl: '#',
  source: (['producthunt', 'dribbble'] as const)[i % 2],
  tool: (['Claude', 'Cursor', 'Bolt.new', 'Lovable', 'v0'] as const)[i % 5],
  category: (['app', 'tool', 'design', 'website', 'game'] as const)[i % 5],
  likes: Math.floor(Math.random() * 900) + 100,
  author: '',
  createdAt: new Date().toISOString(),
}))

function Card({ project, onClick }: { project: Project; onClick: () => void }) {
  const [err, setErr] = useState(false)
  const src = SOURCE_LABEL[project.source] || project.source
  const tool = TOOL_LABEL[project.tool] || project.tool

  return (
    <div onClick={onClick} style={{
      breakInside: 'avoid', marginBottom: 16,
      cursor: 'pointer', background: '#fff',
      borderRadius: 4, overflow: 'hidden',
      border: '1px solid #eceae6',
      transition: 'border-color .2s',
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = '#ccc')}
    onMouseLeave={e => (e.currentTarget.style.borderColor = '#eceae6')}
    >
      <div style={{ overflow: 'hidden' }}>
        {err ? (
          <div style={{ width: '100%', paddingBottom: '65%', background: '#f0eee9', position: 'relative' }}>
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#ccc' }}>
              {project.title.slice(0, 2).toUpperCase()}
            </span>
          </div>
        ) : (
          <img
            src={project.imageUrl}
            alt={project.title}
            loading="lazy"
            onError={() => setErr(true)}
            style={{ width: '100%', height: 'auto', display: 'block', transition: 'transform .5s cubic-bezier(.25,.46,.45,.94)' }}
            onMouseEnter={e => ((e.target as HTMLImageElement).style.transform = 'scale(1.04)')}
            onMouseLeave={e => ((e.target as HTMLImageElement).style.transform = 'scale(1)')}
          />
        )}
      </div>
      <div style={{
        padding: '11px 13px 13px',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        borderTop: '1px solid #f0eee9',
      }}>
        <span style={{ fontSize: 11, color: '#1a1a1a', fontWeight: 400 }}>{project.title}</span>
        <span style={{ fontSize: 10, color: '#ccc', fontWeight: 300, marginLeft: 8, flexShrink: 0 }}>{tool} · {src}</span>
      </div>
    </div>
  )
}

function Lightbox({ project, onClose }: { project: Project; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  const src = SOURCE_LABEL[project.source] || project.source
  const tool = TOOL_LABEL[project.tool] || project.tool

  return (
    <div onClick={e => { if (e.currentTarget === e.target) onClose() }} style={{
      position: 'fixed', inset: 0, background: 'rgba(246,245,242,0.97)',
      zIndex: 200, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20,
    }}>
      <div style={{ maxWidth: 900, width: '100%', position: 'relative', borderRadius: 4, overflow: 'hidden', border: '1px solid #e8e6e1' }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: -40, right: 0,
          background: 'none', border: '1px solid #ddd', color: '#aaa',
          width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 11,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
        <img src={project.imageUrl} alt={project.title} style={{ width: '100%', maxHeight: '62vh', objectFit: 'contain', display: 'block', background: '#f0eee9' }} />
      </div>
      <div style={{ maxWidth: 900, width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, fontStyle: 'italic', color: '#1a1a1a', letterSpacing: '-0.02em' }}>{project.title}</div>
          {project.description && <div style={{ fontSize: 11, color: '#aaa', fontWeight: 300, marginTop: 4, lineHeight: 1.6, maxWidth: 400 }}>{project.description}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
            <span style={{ fontSize: 10, color: '#bbb', fontWeight: 300, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{src}</span>
            <span style={{ fontSize: 10, color: '#bbb', fontWeight: 300, letterSpacing: '0.04em' }}>{tool}</span>
            {project.likes > 0 && <span style={{ fontSize: 10, color: '#ccc', fontWeight: 300 }}>♥ {project.likes.toLocaleString()}</span>}
          </div>
        </div>
        {project.sourceUrl !== '#' && (
          <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer" style={{
            background: '#1a1a1a', color: '#f6f5f2',
            fontSize: 10, fontFamily: 'inherit', fontWeight: 500,
            padding: '10px 22px', border: 'none', cursor: 'pointer',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            borderRadius: 2, textDecoration: 'none', flexShrink: 0,
            display: 'inline-block',
          }}>
            View project →
          </a>
        )}
      </div>
    </div>
  )
}

function SetupNote({ missing }: { missing: Record<string, boolean> }) {
  const names = Object.entries(missing).filter(([, v]) => v).map(([k]) => SOURCE_LABEL[k] || k)
  if (!names.length) return null
  return (
    <div style={{ margin: '0 28px 0', padding: '10px 14px', background: '#fff', border: '1px solid #e8e6e1', borderRadius: 4, fontSize: 11, color: '#bbb', fontWeight: 300 }}>
      <strong style={{ color: '#999', fontWeight: 500 }}>Add API keys</strong> to see live data from {names.join(' + ')}. See README.md — takes 10 minutes, costs nothing.
    </div>
  )
}

export default function Wall() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]   = useState(true)
  const [category, setCategory] = useState<Category>('all')
  const [lightbox, setLightbox] = useState<Project | null>(null)
  const [missing, setMissing]   = useState<Record<string, boolean>>({})

  useEffect(() => {
    setLoading(true)
    fetch(`/api/feed?category=${category}`)
      .then(r => r.json())
      .then(data => {
        if (!data.projects?.length) {
          setProjects(DEMO.filter(p => category === 'all' || p.category === category))
          setMissing(data.missing || { producthunt: true, dribbble: true })
        } else {
          setProjects(data.projects)
          setMissing(data.missing || {})
        }
      })
      .catch(() => setProjects(DEMO))
      .finally(() => setLoading(false))
  }, [category])

  return (
    <>
      {/* Nav */}
      <header style={{
        background: '#f6f5f2', borderBottom: '1px solid #e8e6e1',
        padding: '14px 28px', display: 'flex', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 10, flexWrap: 'wrap', gap: 8,
      }}>
        <span style={{ fontStyle: 'italic', fontWeight: 600, fontSize: 18, color: '#1a1a1a', letterSpacing: '-0.03em', marginRight: 32, flexShrink: 0 }}>
          Summond
        </span>
        <nav style={{ display: 'flex', flex: 1, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCategory(c.value)} style={{
              background: 'transparent', border: 'none',
              color: category === c.value ? '#1a1a1a' : '#bbb',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 400,
              padding: '5px 14px', cursor: 'pointer', letterSpacing: '0.01em',
              transition: 'color .15s',
            }}>
              {c.label}
            </button>
          ))}
        </nav>
        <span style={{ fontSize: 11, color: '#ccc', fontWeight: 300 }}>
          {loading ? '...' : `${projects.length} projects`}
        </span>
      </header>

      {/* Hero */}
      <section style={{ padding: '72px 28px 64px', borderBottom: '1px solid #e8e6e1' }}>
        <div style={{ fontSize: 11, color: '#bbb', fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
          Updated daily
        </div>
        <h1 style={{ fontSize: 42, fontStyle: 'italic', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.12, letterSpacing: '-0.03em', maxWidth: 620, marginBottom: 20 }}>
          Everything being built<br />with AI. <span style={{ color: '#bbb', fontStyle: 'normal' }}>Right now.</span>
        </h1>
        <p style={{ fontSize: 14, color: '#999', fontWeight: 300, lineHeight: 1.75, maxWidth: 460, marginBottom: 28 }}>
          An endless feed of apps, tools, games and interfaces conjured into existence with Claude, Cursor, Bolt and Lovable. Pulled automatically from the places designers and builders share their work.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {[['Product Hunt', '& Dribbble'], ['Sorted by', 'most popular'], ['Zero curation.', 'All signal.']].map(([a, b], i) => (
            <>
              {i > 0 && <span key={`div-${i}`} style={{ width: 1, height: 12, background: '#ddd' }} />}
              <span key={`stat-${i}`} style={{ fontSize: 11, color: '#bbb', fontWeight: 300 }}>
                {a} <strong style={{ color: '#1a1a1a', fontWeight: 500 }}>{b}</strong>
              </span>
            </>
          ))}
        </div>
      </section>

      {/* Setup note */}
      {Object.values(missing).some(Boolean) && <div style={{ marginTop: 20 }}><SetupNote missing={missing} /></div>}

      {/* Grid */}
      <main style={{ padding: 28 }}>
        <div style={{ fontSize: 11, color: '#bbb', fontWeight: 300, fontStyle: 'italic', marginBottom: 20 }}>
          {loading ? 'Loading...' : `${projects.length} selected projects`}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#ccc', fontSize: 11, letterSpacing: '0.06em' }}>Loading projects...</div>
        ) : (
          <div style={{ columns: '3 220px', columnGap: 16 }}>
            {projects.map(p => <Card key={p.id} project={p} onClick={() => setLightbox(p)} />)}
          </div>
        )}
      </main>

      {lightbox && <Lightbox project={lightbox} onClose={() => setLightbox(null)} />}
    </>
  )
}
