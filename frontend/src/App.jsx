import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { PieChart, Pie, Cell, Label, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

/* ─── Theme hook ──────────────────────────────────────────────────────────── */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('sx-theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sx-theme', theme)
  }, [theme])

  const toggle = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), [])
  return { theme, toggle }
}

/* ─── Inline SVG icons (no external dep) ─────────────────────────────────── */
const IconShield = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)
const IconScan = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <rect x="7" y="7" width="10" height="10" rx="1" />
  </svg>
)
const IconUpload = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
)
const IconCheck = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)
const IconAlertTriangle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconRadar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49" /><path d="M7.76 16.24a6 6 0 0 1 0-8.49" />
    <path d="M20.07 3.93a10 10 0 0 1 0 16.14" /><path d="M3.93 20.07a10 10 0 0 1 0-16.14" />
  </svg>
)
const IconBarChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
  </svg>
)
const IconList = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)
const IconZap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

/* ─── Theme icons ─────────────────────────────────────────────────────────── */
const IconSun = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)
const IconMoon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function getSeverityStyle(level) {
  if (!level) return { borderColor: 'var(--border)', color: 'var(--text-muted)' }
  switch (level.toUpperCase()) {
    case 'CRITICAL': return { borderColor: 'rgba(244,63,94,0.4)',   color: '#fb7185' }
    case 'HIGH':     return { borderColor: 'rgba(245,158,11,0.4)',  color: '#fbbf24' }
    case 'MEDIUM':   return { borderColor: 'rgba(167,139,250,0.4)', color: '#c4b5fd' }
    case 'LOW':      return { borderColor: 'rgba(16,185,129,0.4)',  color: '#34d399' }
    default:         return { borderColor: 'var(--border)', color: 'var(--text-muted)' }
  }
}

function SeverityBadge({ level }) {
  if (!level) return <span className="badge badge-low">—</span>
  const cls = {
    CRITICAL: 'badge-critical', HIGH: 'badge-high',
    MEDIUM: 'badge-medium', LOW: 'badge-low',
  }[level.toUpperCase()] || 'badge-low'
  return <span className={`badge ${cls}`}>{level}</span>
}

const DONUT_COLORS = { CRITICAL: '#f43f5e', HIGH: '#f59e0b', MEDIUM: '#a78bfa', LOW: '#10b981' }

const LEGEND_ITEMS = [
  { label: 'Critical', color: DONUT_COLORS.CRITICAL },
  { label: 'High', color: DONUT_COLORS.HIGH },
  { label: 'Medium', color: DONUT_COLORS.MEDIUM },
  { label: 'Low', color: DONUT_COLORS.LOW },
]

const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']

// Known acronyms that should stay ALL-CAPS
const ACRONYMS = new Set(['QR', 'URL', 'PDF', 'ID', 'IP', 'SQL', 'XSS', 'API', 'AI', 'OTP', 'SMS', 'CEO', 'HR'])

function formatThreatType(raw) {
  if (!raw) return '—'
  return raw
    .replace(/_/g, ' ')           // underscores → spaces
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => {
      const upper = word.toUpperCase()
      return ACRONYMS.has(upper)
        ? upper                   // preserve known acronyms
        : word.charAt(0).toUpperCase() + word.slice(1)  // Title Case
    })
    .join(' ')
}

/* ─── Custom Tooltip for charts ───────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      color: 'var(--text-primary)',
      boxShadow: 'var(--shadow-card)',
    }}>
      {label && <div style={{ color: 'var(--text-muted)', marginBottom: 4, fontSize: 11 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text-primary)' }}>{p.name ?? p.dataKey}: <strong>{p.value}</strong></div>
      ))}
    </div>
  )
}

/* ─── Centralised API base URL ────────────────────────────────────────────── */
// Set VITE_API_URL in .env (or Vercel env vars) to point to your Cloudflare Tunnel URL.
// Falls back to localhost:8000 for local development.
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

/* ─── App ─────────────────────────────────────────────────────────────────── */
function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [uploadFile, setUploadFile] = useState(null)
  const [baitResponse, setBaitResponse] = useState(null)
  const [isGeneratingBait, setIsGeneratingBait] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [donutHovered, setDonutHovered] = useState(false)
  const fileInputRef = useRef(null)

  /* ── File drag & drop ─────────────────────────────────────────────────── */
  const handleFileDrop = useCallback((file) => {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Invalid file type. Only PDF, PNG, or JPG files are allowed.')
      return
    }
    setError(null)
    setUploadFile(file)
  }, [])

  const onDragOver  = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true)  }, [])
  const onDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }, [])
  const onDrop      = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false)
    handleFileDrop(e.dataTransfer.files[0])
  }, [handleFileDrop])
  const onFileInputChange = useCallback((e) => handleFileDrop(e.target.files[0]), [handleFileDrop])

  /* ── API calls ────────────────────────────────────────────────────────── */
  const downloadReport = (id) => window.open(`${API_URL}/api/report/${id}`, '_blank')

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/history`)
      if (response.ok) setHistory(await response.json())
    } catch (err) { console.error('Failed to fetch history:', err) }
  }

  useEffect(() => { fetchHistory() }, [])

  const analyzeFile = async (file) => {
    if (!file) return
    setLoading(true); setError(null); setResult(null); setBaitResponse(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await fetch(`${API_URL}/api/analyze-file`, { method: 'POST', body: formData })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to analyze file threat')
      }
      setResult(await response.json())
      fetchHistory()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleScan = async () => {
    if (!content.trim()) return
    setLoading(true); setError(null); setResult(null); setBaitResponse(null)
    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to analyze threat')
      }
      setResult(await response.json())
      fetchHistory()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const deployCounterMeasure = async () => {
    if (!result) return
    setIsGeneratingBait(true); setBaitResponse(null)
    try {
      const response = await fetch(`${API_URL}/api/generate-bait`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original_threat: content || result.target }),
      })
      if (!response.ok) throw new Error('Failed to generate bait')
      setBaitResponse((await response.json()).bait_response)
    } catch (err) {
      console.error(err)
      setBaitResponse('ERROR: Failed to deploy counter-measure.')
    } finally { setIsGeneratingBait(false) }
  }

  /* ── Data processing ──────────────────────────────────────────────────── */
  const severityData = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
    history.forEach(item => { if (counts[item.threat_level] !== undefined) counts[item.threat_level]++ })
    return [
      { name: 'Critical', value: counts.CRITICAL, color: DONUT_COLORS.CRITICAL },
      { name: 'High',     value: counts.HIGH,     color: DONUT_COLORS.HIGH     },
      { name: 'Medium',   value: counts.MEDIUM,   color: DONUT_COLORS.MEDIUM   },
      { name: 'Low',      value: counts.LOW,       color: DONUT_COLORS.LOW     },
    ].filter(d => d.value > 0)
  }, [history])

  const totalScans = useMemo(() => history.length, [history])

  const timelineData = useMemo(() => {
    const counts = {}
    const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    sorted.forEach(item => {
      if (!item.timestamp) return
      const date = new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      counts[date] = (counts[date] || 0) + 1
    })
    return Object.keys(counts).map(date => ({ date, scans: counts[date] }))
  }, [history])

  const severityStyle = result ? getSeverityStyle(result.threat_level) : {}

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="app-wrapper">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="app-header">

        {/* ── Logo ── */}
        <div className="logo">
          {/* Shield mark */}
          <svg className="logo-mark" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="shieldGrad" x1="0" y1="0" x2="36" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="shieldGradLight" x1="0" y1="0" x2="36" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>
            {/* Outer shield */}
            <path
              d="M18 2L4 8v11c0 9.5 6 18 14 20C26 37 32 28.5 32 19V8L18 2Z"
              fill="url(#shieldGrad)"
              opacity="0.15"
            />
            <path
              d="M18 2L4 8v11c0 9.5 6 18 14 20C26 37 32 28.5 32 19V8L18 2Z"
              stroke="url(#shieldGrad)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Inner X mark */}
            <path
              d="M13 15l10 10M23 15L13 25"
              stroke="url(#shieldGrad)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>

          {/* Wordmark */}
          <div className="logo-text">
            <span className="logo-name">
              <span className="logo-secure">Secure</span><span className="logo-x">X</span>
            </span>
            <span className="logo-tag">AI-Powered Threat Detection</span>
          </div>
        </div>

        {/* ── Right: pills + toggle ── */}
        <div className="status-pills">
          <span className="status-pill"><span className="status-dot" />System Online</span>
          <span className="status-pill"><span className="status-dot" />DB Connected</span>
          <span className="status-pill"><span className="status-dot" />OCR Ready</span>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      <main className="main-grid">

        {/* ── Top row ───────────────────────────────────────────────── */}
        <div className="grid-top">

          {/* Input Terminal */}
          <div className="card">
            <div className="card-header">
              <IconScan className="card-header-icon" />
              <span className="card-title">Input Terminal</span>
            </div>
            <div className="card-body">
              <textarea
                className="sx-textarea"
                placeholder="Paste a suspicious URL, email body, or raw payload here…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              {/* Drop Zone */}
              <div>
                <label className="upload-label">Upload File — PDF, PNG, or JPG</label>
                <div
                  className={`drop-zone${isDragging ? ' drop-zone--active' : ''}${uploadFile ? ' drop-zone--has-file' : ''}`}
                  onDragOver={onDragOver}
                  onDragEnter={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="cyber-file-hidden"
                    accept="application/pdf,image/png,image/jpeg"
                    onChange={onFileInputChange}
                  />
                  {uploadFile ? (
                    <>
                      <IconCheck className="dz-upload-icon" />
                      <span className="dz-filename">{uploadFile.name}</span>
                      <button
                        className="dz-clear-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setUploadFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                      >
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <IconUpload className="dz-upload-icon" />
                      <span className="dz-primary-text">
                        {isDragging ? 'Drop the file here' : 'Drag & drop a PDF, PNG, or JPG here'}
                      </span>
                      <span className="dz-secondary-text">or click to browse</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="action-row">
                <button
                  className="btn btn-primary disabled:bg-zinc-900/90 disabled:border disabled:border-zinc-700/70 disabled:text-zinc-400 disabled:cursor-not-allowed"
                  onClick={handleScan}
                  disabled={loading || !content.trim()}
                >
                  <IconZap />
                  {loading && !uploadFile ? 'Processing…' : 'Run Text Scan'}
                </button>
                <button
                  className="btn btn-secondary disabled:bg-zinc-900/90 disabled:border disabled:border-zinc-700/70 disabled:text-zinc-400 disabled:cursor-not-allowed"
                  onClick={() => analyzeFile(uploadFile)}
                  disabled={loading || !uploadFile}
                >
                  <IconUpload className="btn-icon" />
                  {loading && uploadFile ? 'Processing…' : 'Run File Scan'}
                </button>
              </div>

              {error && (
                <div className="error-banner">
                  <IconAlertTriangle />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Threat Analysis */}
          <div className="card">
            <div className="card-header">
              <IconShield className="card-header-icon" />
              <span className="card-title">Active Threat Analysis</span>
            </div>
            <div className="card-body">

              {/* Idle */}
              {!result && !loading && (
                <div className="empty-state">
                  <div className="empty-icon-wrap">
                    <IconRadar />
                  </div>
                  <p className="empty-title">Awaiting payload</p>
                  <p className="empty-subtitle">Submit text or upload a file to run a threat analysis.</p>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="empty-state">
                  <div className="spinner" />
                  <p className="empty-title">Analyzing threat vectors…</p>
                </div>
              )}

              {/* Result */}
              {result && !loading && (
                <div className="result-scroll">
                  {/* Severity + Score */}
                  <div className="severity-row">
                    <div
                      className="severity-badge"
                      style={{ borderColor: severityStyle.borderColor, color: severityStyle.color }}
                    >
                      <span className="sb-label">Severity</span>
                      <span className="sb-value">{result.threat_level}</span>
                    </div>
                    <div className="score-box" style={{ color: severityStyle.color }}>
                      <span className="sc-value">{result.risk_score}</span>
                      <span className="sc-label">Score</span>
                    </div>
                  </div>

                  <div className="result-row">
                    <span className="rr-key">Type</span>
                    <span className="rr-val">{formatThreatType(result.threat_type)}</span>
                  </div>
                  <div className="result-row">
                    <span className="rr-key">Subject</span>
                    <span className="rr-val">{result.target}</span>
                  </div>

                  <div className="indicators-section">
                    <span className="indicators-title">Indicators</span>
                    <ul className="indicator-list">
                      {result.indicators.map((indicator, i) => (
                        <li key={i}>{indicator}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="action-box">
                    <span className="action-box-label">Recommended Action</span>
                    <p className="action-box-text">{result.recommended_action}</p>
                  </div>

                  {/* Counter-measure (HIGH / CRITICAL only) */}
                  {(result.threat_level?.toUpperCase() === 'HIGH' || result.threat_level?.toUpperCase() === 'CRITICAL') && (
                    <div className="countermeasure-section">
                      <button
                        className="btn btn-danger"
                        onClick={deployCounterMeasure}
                        disabled={isGeneratingBait}
                      >
                        <IconZap />
                        {isGeneratingBait ? 'Generating counter-measure…' : 'Deploy Counter-Measure'}
                      </button>

                      {baitResponse && (
                        <div className="bait-output">
                          <span className="bait-label">Scam Bait Payload</span>
                          <p className="bait-text">{baitResponse}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom row ────────────────────────────────────────────── */}
        <div className="grid-bottom">

          {/* System Analytics */}
          <div className="card">
            <div className="card-header">
              <IconBarChart />
              <span className="card-title">System Analytics</span>
            </div>
            <div className="card-body charts-stack">

              {/* Donut */}
              <div className="chart-section">
                <span className="chart-label">Threat Distribution</span>
                {severityData.length > 0 ? (
                  <div>
                    <div className="donut-wrap">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart
                          onMouseEnter={() => setDonutHovered(true)}
                          onMouseLeave={() => setDonutHovered(false)}
                        >
                          <Pie
                            data={severityData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%" cy="50%"
                            innerRadius={52} outerRadius={78}
                            paddingAngle={3}
                            strokeWidth={0}
                          >
                            {severityData.map((entry, i) => (
                              <Cell
                                key={`cell-${i}`}
                                fill={entry.color}
                                stroke="none"
                              />
                            ))}
                            <Label
                              content={({ viewBox }) => {
                                const { cx, cy } = viewBox
                                return donutHovered ? null : (
                                  <g>
                                    <text
                                      x={cx} y={cy - 6}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                      style={{
                                        fontSize: '1.35rem',
                                        fontWeight: 700,
                                        fontFamily: 'JetBrains Mono, monospace',
                                        fill: 'var(--text-primary)',
                                      }}
                                    >
                                      {totalScans}
                                    </text>
                                    <text
                                      x={cx} y={cy + 14}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                      style={{
                                        fontSize: '0.63rem',
                                        fontWeight: 500,
                                        letterSpacing: '0.05em',
                                        fill: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                      }}
                                    >
                                      Total
                                    </text>
                                  </g>
                                )
                              }}
                            />
                          </Pie>
                          <Tooltip
                            content={<ChartTooltip />}
                            wrapperStyle={{ zIndex: 50, pointerEvents: 'none' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="donut-legend flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3 text-xs text-zinc-400">
                      {LEGEND_ITEMS.map((item) => {
                        const count = severityData.find(d => d.name === item.label)?.value || 0
                        return (
                          <div key={item.label} className="donut-legend-item flex items-center gap-1.5">
                            <span
                              className="donut-legend-dot w-2 h-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.label}</span>
                            <span className="donut-legend-count">({count})</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="chart-empty">No data yet</div>
                )}
              </div>

              {/* Bar */}
              <div className="chart-section">
                <span className="chart-label">Scan Activity Timeline</span>
                {timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={timelineData} barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="transparent"
                        tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                      <Bar dataKey="scans" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty">No data yet</div>
                )}
              </div>

            </div>
          </div>

          {/* Recent Scans Log */}
          <div className="card">
            <div className="card-header">
              <IconList />
              <span className="card-title">Recent Scans Log</span>
            </div>
            <div className="card-body" style={{ padding: '0', gap: 0 }}>
              <div className="table-wrap">
                <table className="sx-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Payload</th>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Score</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => (
                      <tr key={record.id}>
                        <td className="td-mono">
                          {record.timestamp ? new Date(record.timestamp).toLocaleString() : '—'}
                        </td>
                        <td
                          className="td-payload"
                          title={record.content_scanned}
                        >
                          {record.content_scanned?.length > 40
                            ? record.content_scanned.substring(0, 40) + '…'
                            : record.content_scanned}
                        </td>
                        <td
                          className="td-type truncate max-w-[200px]"
                          title={record.threat_type || ''}
                        >
                          {formatThreatType(record.threat_type)}
                        </td>
                        <td>
                          <SeverityBadge level={record.threat_level} />
                        </td>
                        <td className="td-score" style={{ color: getSeverityStyle(record.threat_level).color }}>
                          {record.risk_score}
                        </td>
                        <td>
                          <button className="btn-report" onClick={() => downloadReport(record.id)}>
                            <IconDownload />
                            Report
                          </button>
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan="6" className="td-empty">No scans recorded yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default App
