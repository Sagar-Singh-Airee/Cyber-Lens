import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const examples = {
  url: 'https://secure-payments.example-login.net/verify?session=expired',
  email: 'From: PayPal Security <support@paypaI-account.co>\nSubject: Urgent: account limitation\n\nYour account is restricted. Verify your password within 30 minutes to restore access: http://paypaI-account.co/restore',
  log: 'Oct 26 09:18:42 sshd[2115]: Failed password for invalid user admin from 185.220.101.8 port 53112 ssh2\nOct 26 09:18:46 sshd[2118]: Failed password for invalid user root from 185.220.101.8 port 53305 ssh2'
}

const typeInfo = {
  url: { label: 'Suspicious URL', hint: 'Paste the complete address you received.', icon: 'link' },
  email: { label: 'Email message', hint: 'Include sender, subject, and the relevant content.', icon: 'mail' },
  log: { label: 'Security log', hint: 'Paste a short event or authentication snippet.', icon: 'terminal' }
}

const guideSteps = [
  ['01', 'Make the core flow work', 'One input → one result → clear next action. Nothing else outranks this.'],
  ['02', 'Protect the trust boundary', 'Keep keys server-side. Never store raw submissions by default.'],
  ['03', 'Design every state', 'Empty, loading, result, error, keyboard, and mobile states must feel intentional.'],
  ['04', 'Rehearse the failure path', 'Demo fallback and sample content must work without a network connection.']
]

// Terminal scan lines cycle through these
const SCAN_LINES = [
  '> Initializing threat analysis engine...',
  '> Parsing input structure...',
  '> Checking against known threat signatures...',
  '> Analyzing linguistic patterns...',
  '> Cross-referencing domain reputation...',
  '> Scanning for obfuscation techniques...',
  '> Evaluating credential harvest indicators...',
  '> Running heuristic risk scoring...',
  '> Correlating behavioral signals...',
  '> Finalizing threat assessment...',
]

function Icon({ name, size = 18, stroke = 1.8 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    scan: <><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" /><path d="M8 12h8M12 8v8" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5M12 7v5l3 2" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22.5z" /><path d="M4 5.5v15M8 7h8" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55v.09h-3v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.55-1H5.4v-3h.08A1.7 1.7 0 0 0 7 10a1.7 1.7 0 0 0-.34-1.88L6.6 8.06 8.72 5.94l.06.06A1.7 1.7 0 0 0 10.66 6 1.7 1.7 0 0 0 11.66 4.45v-.08h3v.08A1.7 1.7 0 0 0 15.66 6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06A1.7 1.7 0 0 0 19.32 10a1.7 1.7 0 0 0 1.55 1h.08v3h-.08A1.7 1.7 0 0 0 19.4 15z" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    terminal: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3M13 15h4" /></>,
    shield: <path d="M12 3 20 6v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-3z" />,
    spark: <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    external: <><path d="M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    x: <><path d="m6 6 12 12M18 6 6 18" /></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function RiskBadge({ risk }) {
  const title = risk === 'high' ? 'High risk' : risk === 'medium' ? 'Needs review' : 'Low risk'
  return <span className={`risk-badge ${risk}`}><span className="risk-dot" />{title}</span>
}

// Animated threat meter component
function ThreatMeter({ risk, confidence }) {
  const pct = Math.max(8, Math.min(98, confidence || 65))
  const color = risk === 'high' ? '#ef4444' : risk === 'medium' ? '#f59e0b' : '#00ff87'
  const label = risk === 'high' ? 'Critical' : risk === 'medium' ? 'Elevated' : 'Nominal'
  return (
    <div className="threat-meter" aria-label={`Threat level: ${label}`}>
      <div className="threat-meter-header">
        <span className="threat-meter-label">Threat Level</span>
        <span className="threat-meter-value" style={{ color }}>{label}</span>
      </div>
      <div className="threat-meter-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="threat-meter-fill"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
        <div className="threat-meter-glow" style={{ left: `${pct}%`, boxShadow: `0 0 12px 4px ${color}66`, background: color }} />
      </div>
      <div className="threat-meter-footer">
        <span>0%</span>
        <span>{pct}% confidence</span>
        <span>100%</span>
      </div>
    </div>
  )
}

// Confidence bar component
function ConfidenceBar({ percent, risk }) {
  const color = risk === 'high' ? '#ef4444' : risk === 'medium' ? '#f59e0b' : '#00ff87'
  return (
    <div className="confidence-bar-wrap">
      <div className="confidence-bar-label">
        <span>Confidence</span>
        <span style={{ color }}>{percent}%</span>
      </div>
      <div className="confidence-bar-track">
        <div
          className="confidence-bar-fill"
          style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${color}66, ${color})` }}
        />
      </div>
    </div>
  )
}

// Toast notification
function Toast({ message, visible }) {
  return (
    <div className={`toast ${visible ? 'toast-visible' : ''}`} role="status" aria-live="polite">
      <Icon name="check" size={14} />
      {message}
    </div>
  )
}

// Terminal scan animation
function TerminalScan() {
  const [lines, setLines] = useState([SCAN_LINES[0]])
  const [cursor, setCursor] = useState(true)

  useEffect(() => {
    let lineIndex = 1
    const lineTimer = setInterval(() => {
      if (lineIndex < SCAN_LINES.length) {
        setLines(prev => [...prev, SCAN_LINES[lineIndex]])
        lineIndex++
      }
    }, 600)
    const cursorTimer = setInterval(() => setCursor(c => !c), 530)
    return () => { clearInterval(lineTimer); clearInterval(cursorTimer) }
  }, [])

  return (
    <div className="terminal-scan" aria-live="polite" aria-label="Scanning in progress">
      <div className="terminal-header">
        <span className="terminal-dot red" />
        <span className="terminal-dot yellow" />
        <span className="terminal-dot green" />
        <span className="terminal-title">cyberlens — threat-scanner</span>
      </div>
      <div className="terminal-body">
        {lines.map((line, i) => (
          <div key={i} className="terminal-line">
            <span className="terminal-prompt">$</span>
            <span>{line}</span>
          </div>
        ))}
        <div className="terminal-line">
          <span className="terminal-prompt">$</span>
          <span className={`terminal-cursor ${cursor ? 'cursor-on' : ''}`}>▌</span>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [inputType, setInputType] = useState('url')
  const [text, setText] = useState('')
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cyberlens-history') || '[]') } catch { return [] }
  })
  const [copied, setCopied] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const inputRef = useRef(null)
  const resultRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('cyberlens-history', JSON.stringify(history.slice(0, 5)))
  }, [history])

  // Ctrl+Enter to submit
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (text.trim() && status !== 'loading') analyze()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  const showToast = useCallback((msg) => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }, [])

  const ready = text.trim().length > 0 && status !== 'loading'
  const inputMeta = typeInfo[inputType]
  const wordCount = useMemo(() => text.trim() ? text.trim().split(/\s+/).length : 0, [text])
  const charCount = text.length
  const charRemaining = 6000 - charCount

  function chooseType(type) {
    setInputType(type)
    setResult(null)
    setError('')
    inputRef.current?.focus()
  }

  function fillExample(type = inputType) {
    setInputType(type)
    setText(examples[type])
    setResult(null)
    setError('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function analyze() {
    if (!text.trim()) {
      setError('Add something to inspect first — a URL, email, or a short log excerpt.')
      inputRef.current?.focus()
      return
    }
    setStatus('loading')
    setError('')
    setResult(null)
    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), input_type: inputType })
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.detail || 'The service could not complete this check.')
      setResult(payload)
      setHistory(current => [{ id: payload.id || String(Date.now()), type: inputType, risk: payload.risk, summary: payload.summary, at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...current.filter(item => item.summary !== payload.summary)].slice(0, 5))
      showToast('Scan complete — results ready')
      // Auto-scroll to results
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    } catch (requestError) {
      setError(requestError.message || 'Connection failed. Confirm the CyberLens API is running, then try again.')
    } finally {
      setStatus('idle')
    }
  }

  function copyReport() {
    if (!result) return
    const report = `CyberLens AI • ${result.risk?.toUpperCase()} RISK\n\n${result.summary}\n\nEvidence:\n${result.findings.map(item => `• ${item.title}: ${item.detail}`).join('\n')}\n\nRecommended next steps:\n${result.actions.map(item => `• ${item}`).join('\n')}`
    navigator.clipboard?.writeText(report).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="app-shell">
      {/* Mobile hamburger overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} aria-label="Primary navigation">
        <a className="brand" href="#workspace" aria-label="CyberLens home">
          <span className="brand-mark"><Icon name="shield" size={21} /></span>
          <span>cyber<span>lens</span></span>
        </a>
        <nav className="side-nav">
          <a className="nav-item active" href="#workspace"><Icon name="grid" />Workspace</a>
          <a className="nav-item" href="#scanner"><Icon name="scan" />Scanner <span className="nav-status">Live</span></a>
          <a className="nav-item" href="#history"><Icon name="history" />History</a>
          <a className="nav-item" href="#guide"><Icon name="book" />Launch guide</a>
        </nav>
        <div className="side-bottom">
          <a className="nav-item" href="#settings"><Icon name="gear" />Settings</a>
          <div className="privacy-lock"><Icon name="shield" size={15} /><span><strong>Private by design</strong><small>Inputs are not saved</small></span></div>
        </div>
      </aside>

      <main className="main" id="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger" aria-label="Toggle navigation" onClick={() => setSidebarOpen(v => !v)}>
              <Icon name={sidebarOpen ? 'x' : 'menu'} size={20} />
            </button>
            <div className="crumb"><span>Workspace</span><Icon name="chevron" size={14} /><strong>New analysis</strong></div>
          </div>
          <div className="top-actions">
            <span className="connection"><i />Protected session</span>
            <button className="avatar" aria-label="Open profile">AK</button>
          </div>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-grid-bg" aria-hidden="true" />
          <div className="eyebrow"><Icon name="spark" size={15} />AI-assisted security review</div>
          <h1 id="hero-title" className="glitch-target">See what's hiding<br /><em>in plain sight.</em></h1>
          <p>Investigate a suspicious link, message, or event log. Get clear evidence and the right next move — never empty alarmism.</p>
        </section>

        <section className="workspace-grid">
          <div className="scanner-panel" id="scanner">
            <div className="panel-heading">
              <div><span className="section-kicker">Threat inspector</span><h2>Start a focused review</h2></div>
              <span className="privacy-note"><Icon name="shield" size={14} />Nothing is retained</span>
            </div>

            <div className="type-tabs" role="tablist" aria-label="Content to analyze">
              {Object.entries(typeInfo).map(([type, info]) => <button key={type} role="tab" aria-selected={inputType === type} className={inputType === type ? 'selected' : ''} onClick={() => chooseType(type)}><Icon name={info.icon} size={16} />{info.label}</button>)}
            </div>

            <label className={`input-wrap ${error ? 'has-error' : ''}`} htmlFor="scan-input">
              <span className="input-label">{inputMeta.hint}</span>
              <textarea id="scan-input" ref={inputRef} value={text} maxLength={6000} onChange={event => { setText(event.target.value); setError('') }} placeholder={inputType === 'url' ? 'https://example.com/sign-in' : inputType === 'email' ? 'Paste the message, including the sender and subject…' : 'Paste an authentication, endpoint, or application event…'} />
              <span className="input-footer">
                <span>{error ? <span className="input-error">{error}</span> : <>Sensitive details? Redact passwords and personal identifiers.</>}</span>
                <span className="char-counter">
                  <span>{wordCount} words</span>
                  <span className={charRemaining < 200 ? 'char-warn' : ''}>{charRemaining.toLocaleString()} left</span>
                </span>
              </span>
            </label>

            <div className="scan-actions">
              <button className="primary-button" onClick={analyze} disabled={!ready}>
                <span>{status === 'loading' ? <span className="loader" /> : <Icon name="scan" size={18} />}</span>
                {status === 'loading' ? 'Inspecting signals…' : 'Inspect for threats'}
                <Icon name="arrow" size={17} />
              </button>
              <button className="example-button" onClick={() => fillExample()}><Icon name="spark" size={16} />Try an example</button>
            </div>
            <div className="kbd-hint" aria-hidden="true"><kbd>Ctrl</kbd><span>+</span><kbd>↵</kbd><span>to submit</span></div>

            <div className="example-row"><span>Quick samples</span>{Object.entries(typeInfo).map(([type, info]) => <button key={type} onClick={() => fillExample(type)}><Icon name={info.icon} size={14} />{info.label}</button>)}</div>

            {status === 'loading' && <TerminalScan />}

            {result && <div ref={resultRef}><AnalysisResult result={result} copied={copied} onCopy={copyReport} /></div>}
          </div>

          <GuidePanel />
        </section>

        <section className="history-section" id="history">
          <div className="history-heading">
            <div><span className="section-kicker">This device</span><h2>Recent reviews</h2></div>
            {history.length > 0 && <button className="text-button" onClick={() => setHistory([])}><Icon name="trash" size={15} />Clear history</button>}
          </div>
          {history.length ? (
            <div className="history-list">
              {history.map(item => (
                <article className={`history-card risk-border-${item.risk}`} key={item.id}>
                  <div className="history-icon"><Icon name={typeInfo[item.type]?.icon || 'scan'} size={17} /></div>
                  <div className="history-content">
                    <span>{typeInfo[item.type]?.label || 'Analysis'} · {item.at}</span>
                    <p>{item.summary}</p>
                    <div className="history-risk-bar">
                      <div className={`history-risk-fill risk-fill-${item.risk}`} />
                    </div>
                  </div>
                  <RiskBadge risk={item.risk} />
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-history">
              <div><Icon name="history" size={21} /></div>
              <span>Your completed reviews appear here on this device.</span>
            </div>
          )}
        </section>
      </main>

      <Toast message={toastMsg} visible={toastVisible} />
    </div>
  )
}

function AnalysisResult({ result, copied, onCopy }) {
  const percent = Math.max(12, Math.min(96, result.confidence || 65))
  const scanId = result.id ? String(result.id).slice(0, 8) : 'demo1234'

  function handleCopyClick(e) {
    // Ripple effect
    const btn = e.currentTarget
    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    const rect = btn.getBoundingClientRect()
    ripple.style.left = `${e.clientX - rect.left}px`
    ripple.style.top = `${e.clientY - rect.top}px`
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
    onCopy()
  }

  return (
    <article className="result-card" aria-live="polite">
      <div className="result-top">
        <div>
          <span className="section-kicker">Analysis complete</span>
          <h2>{result.risk === 'high' ? 'Potential threat detected' : result.risk === 'medium' ? 'Proceed with caution' : 'No immediate red flags'}</h2>
        </div>
        <div className="result-actions">
          <span className="scan-id-badge">ID: {scanId}</span>
          <span className={`source-label ${result.source === 'openai' ? 'model' : ''}`}>
            <Icon name={result.source === 'openai' ? 'spark' : 'info'} size={13} />
            {result.source === 'openai' ? 'AI-assisted' : 'Guided demo mode'}
          </span>
          <button aria-label="Copy analysis report" className="copy-button" onClick={handleCopyClick}>
            {copied ? <Icon name="check" size={16} /> : <Icon name="copy" size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <ThreatMeter risk={result.risk} confidence={percent} />
      <ConfidenceBar percent={percent} risk={result.risk} />

      <div className="result-grid">
        <div className={`risk-orb ${result.risk}`} style={{ '--risk': `${percent * 3.6}deg` }}>
          <span>{result.risk}</span>
          <small>risk</small>
        </div>
        <div className="summary-block">
          <RiskBadge risk={result.risk} />
          <p>{result.summary}</p>
          <span>Confidence: {percent}% · Treat this as guidance, not a final security verdict.</span>
        </div>
      </div>

      <div className="findings">
        <h3>Why this was flagged</h3>
        {result.findings.map((finding, index) => (
          <div className="finding" key={`${finding.title}-${index}`}>
            <span className="finding-index">0{index + 1}</span>
            <div><strong>{finding.title}</strong><p>{finding.detail}</p></div>
          </div>
        ))}
      </div>

      <div className="actions-list">
        <div><Icon name="shield" size={17} /><strong>Safest next steps</strong></div>
        <ol>{result.actions.map((action, index) => <li key={`${action}-${index}`}>{action}</li>)}</ol>
      </div>
    </article>
  )
}

function GuidePanel() {
  return (
    <aside className="guide-panel" id="guide" aria-label="No-compromise launch guide">
      <div className="guide-glow" aria-hidden="true" />
      <div className="guide-header">
        <span className="guide-icon"><Icon name="book" size={18} /></span>
        <div>
          <span className="section-kicker">Build it right</span>
          <h2>Launch guide</h2>
        </div>
        <span className="guide-badge">No compromise</span>
      </div>
      <p className="guide-intro">The short path to a memorable hackathon product: ship the trustworthy core, then make it feel inevitable.</p>
      <div className="guide-steps">
        {guideSteps.map(([number, title, detail]) => (
          <div className="guide-step" key={number}>
            <span>{number}</span>
            <div><h3>{title}</h3><p>{detail}</p></div>
          </div>
        ))}
      </div>
      <div className="guide-divider" />
      <div className="launch-check">
        <div><span className="section-kicker">Before you submit</span><h3>Non-negotiables</h3></div>
        <ul>
          <li><Icon name="check" size={15} />A real end-to-end demo</li>
          <li><Icon name="check" size={15} />No secrets in the client or repo</li>
          <li><Icon name="check" size={15} />Three rehearsed scenarios</li>
          <li><Icon name="check" size={15} />Mobile and keyboard checked</li>
        </ul>
      </div>
      <a className="guide-link" href="/launch-guide.md" target="_blank" rel="noreferrer">
        Read the full execution guide <Icon name="arrow" size={16} />
      </a>
      <div className="guide-footer"><Icon name="spark" size={15} /><span>Great demos answer: "Why should I trust this?"</span></div>
    </aside>
  )
}

createRoot(document.getElementById('root')).render(<App />)
