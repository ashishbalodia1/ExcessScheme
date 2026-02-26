import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import NetworkCanvas from '../components/NetworkCanvas'
import Sparkles from '../components/Sparkles'
import ThemeToggle from '../components/ThemeToggle'
import LoginModal from '../components/LoginModal'

const STATS = [
  { val: '2.4M+', label: 'Tokens Minted' },
  { val: '₹840Cr', label: 'Distributed' },
  { val: '99.97%', label: 'Uptime' },
  { val: '0', label: 'Frauds Passed' },
]

const FEATURES = [
  {
    icon:'🔗', title:'Blockchain Tokenisation', featured:true,
    desc:'Every rupee of government scholarship is minted as a cryptographic token on-chain — immutable, auditable, and tamper-proof.',
    tagline:'One rupee, one token. Forever on-chain.',
    highlights:[
      { icon:'⛓️', label:'Immutable Ledger', text:'Every mint, transfer, and redemption is written to a public blockchain. No record can be altered or deleted after it is confirmed.' },
      { icon:'🪙', label:'ERC-20 Scholarship Tokens', text:'Each scheme spawns a unique token contract. Tokens carry metadata: student ID, scheme ID, amount, expiry, and institution code.' },
      { icon:'🔒', label:'Smart Contract Escrow', text:'Scheme funds are locked in a smart contract at the time of creation. No officer can release funds outside the approved pipeline.' },
      { icon:'📜', label:'On-Chain Provenance', text:'Full audit trail from government treasury to student bank account — every wallet hop is timestamped and verifiable by anyone.' },
    ],
    stats:[{ val:'2.4M+', label:'Tokens Minted' },{ val:'₹840 Cr', label:'Locked in Contracts' },{ val:'0', label:'Tampered Records' }],
    tech:['Solidity Smart Contracts','ERC-20 Token Standard','IPFS Document Anchoring','Merkle Proof Verification'],
  },
  {
    icon:'🤖', title:'AI Fraud Detection',
    desc:'7-layer AI pipeline verifies identity, detects forgery, checks duplicates and cross-references income in real time before any fund release.',
    tagline:'Zero false payouts. Powered by AI.',
    highlights:[
      { icon:'🪪', label:'Layer 1 — Identity Verification', text:'Aadhaar biometric cross-reference against UIDAI with liveness detection to prevent photo spoofing and impersonation.' },
      { icon:'📄', label:'Layer 2 — Document Forgery Detection', text:'Deep-learning OCR extracts all fields. A GAN-based model flags pixel manipulation, font inconsistencies, and metadata anomalies.' },
      { icon:'🔍', label:'Layer 3 — Duplicate Screening', text:'Vector embeddings of student profiles are compared across all active applications to catch same-person multi-scheme abuse in real time.' },
      { icon:'💰', label:'Layer 4 — Income Cross-Reference', text:'Declared income is validated against PAN/ITR records and cross-checked with property registries and vehicle registration data.' },
      { icon:'🎓', label:'Layer 5 — Eligibility & Marks Check', text:'Academic records are validated against board databases. GPA, attendance percentage, and institution accreditation are verified automatically.' },
      { icon:'🏦', label:'Layer 6 — Bank Account Validation', text:'Account number and IFSC are verified via NPCI. The account must be in the applicant\'s own name — no proxy accounts permitted.' },
      { icon:'⛓️', label:'Layer 7 — Proof Anchoring', text:'A cryptographic hash of the full verification result is stored on-chain. Any post-verification document tampering is instantly detectable.' },
    ],
    stats:[{ val:'99.3%', label:'Detection Accuracy' },{ val:'<2s', label:'Avg Verify Time' },{ val:'7', label:'AI Layers' }],
    tech:['Computer Vision (YOLO)','NLP Document Parsing','Vector Similarity Search','GAN Forgery Detection','UIDAI API Integration'],
  },
  {
    icon:'🌉', title:'Bridge Student Model',
    desc:'A single bridge student atomically collects the full batch and distributes individual tokens — gas-efficient and fully traceable.',
    tagline:'Atomic batch distribution at scale.',
    highlights:[
      { icon:'🏗️', label:'Atomic Batch Execution', text:'The bridge student receives the entire scheme token batch in a single on-chain transaction, then distributes to all verified recipients atomically.' },
      { icon:'⛽', label:'80% Gas Savings', text:'Batch distribution consumes roughly 80% less gas than individual transfers. Cost savings are returned to the government fund pool.' },
      { icon:'📍', label:'Full Traceability', text:'Every hop is logged: bridge wallet → student wallet, with timestamp, block number, and scheme reference stored immutably on-chain.' },
      { icon:'🔐', label:'Multi-Sig Authorisation', text:'Bridge execution requires multi-signature approval from a Gov Officer plus a System Validator before the batch can be dispatched.' },
    ],
    stats:[{ val:'80%', label:'Gas Saved vs Direct' },{ val:'<30s', label:'Full Batch Settlement' },{ val:'100%', label:'Traceable Hops' }],
    tech:['Batch Transfer Contracts','Multi-Sig Wallets','Gas Estimation Engine','On-Chain Event Logging'],
  },
  {
    icon:'🏛️', title:'Gov Control Panel',
    desc:'Officers tokenize schemes, review AI-verified applications, resolve fraud flags, and download immutable audit reports.',
    tagline:'Full oversight. Zero paperwork.',
    highlights:[
      { icon:'🪙', label:'Scheme Tokenisation', text:'Create a scholarship scheme, set eligibility criteria and a budget cap. Funds are converted to tokens and locked in smart contract escrow instantly.' },
      { icon:'📋', label:'Application Review Queue', text:'AI pre-screens every application. Officers see a prioritised queue with AI trust scores allowing one-click approve or flag for manual review.' },
      { icon:'🚩', label:'Fraud Flag Resolution', text:'AI-detected anomalies surface with full evidence — side-by-side document comparison, confidence scores, and recommended officer actions.' },
      { icon:'📊', label:'Immutable Audit Reports', text:'Generate signed PDF reports of any scheme\'s fund flows at any point in time. Reports are blockchain-anchored and court-admissible.' },
    ],
    stats:[{ val:'6', label:'Dashboard Modules' },{ val:'100%', label:'Digital Paper Trail' },{ val:'<1 min', label:'Scheme Creation Time' }],
    tech:['Role-Based Access Control','PDF Report Generation','On-Chain Report Anchoring','Audit Event Bus'],
  },
  {
    icon:'🎓', title:'Citizen Portal',
    desc:'Students apply, track status, verify identity, hold tokens in a wallet, and redeem directly to their bank — all in one dashboard.',
    tagline:'From application to bank — one dashboard.',
    highlights:[
      { icon:'📝', label:'Scheme Discovery & Apply', text:'Browse all active schemes with eligibility filters. One-click application with document upload, Aadhaar pre-fill, and a live eligibility check before submission.' },
      { icon:'📡', label:'Real-Time Status Tracking', text:'Visual application timeline shows every stage: Submitted → AI Verified → Officer Approved → Token Minted → Distributed → Redeemed.' },
      { icon:'👛', label:'On-Chain Token Wallet', text:'Received scholarship tokens are held in a personal on-chain wallet. View balance, token metadata, expiry dates, and full transfer history.' },
      { icon:'💳', label:'Bank Redemption', text:'Redeem tokens directly to your linked bank account. NEFT/RTGS settlement completes within 2 hours. Full receipt stored on-chain.' },
    ],
    stats:[{ val:'6', label:'Portal Modules' },{ val:'2hr', label:'Redemption Settlement' },{ val:'100%', label:'Self-Service' }],
    tech:['Self-Sovereign Identity','Aadhaar Pre-Fill API','NPCI Bank Integration','Token Wallet Dashboard'],
  },
  {
    icon:'📊', title:'Real-Time Audit',
    desc:'Every token state transition is recorded on-chain. Transparent dashboards let the public verify fund flows without exposing student data.',
    tagline:'Public transparency. Private student data.',
    highlights:[
      { icon:'🔎', label:'Public Fund Explorer', text:'Anyone can query the blockchain for total funds disbursed per scheme, per state, or per year — without accessing any student personally identifiable information.' },
      { icon:'📈', label:'Live Analytics Dashboard', text:'Real-time charts of application rates, approval rates, fraud flag rates, and disbursement velocity. Data exportable as CSV or signed PDF.' },
      { icon:'🛡️', label:'Privacy-Preserving Design', text:'Student data is stored off-chain with zero-knowledge proof anchors on-chain. No name, Aadhaar, or bank details are ever written to the blockchain.' },
      { icon:'🏛️', label:'RTI-Ready Reports', text:'Government officers can generate Right-to-Information compliant audit reports in a single click, fully traceable to individual on-chain transactions.' },
    ],
    stats:[{ val:'100%', label:'Transactions Public' },{ val:'0 bytes', label:'PII on Chain' },{ val:'Live', label:'Dashboard Refresh' }],
    tech:['Zero-Knowledge Proofs','IPFS Data Store','Chain Indexer (The Graph)','CSV/PDF Export Engine'],
  },
]

const STEPS = [
  { num:'01', icon:'🏛️', title:'Gov Creates Scheme', desc:'Officer defines criteria, budget, and deadline. Funds are locked in a smart contract.' },
  { num:'02', icon:'📝', title:'Student Applies', desc:'Student submits application with documents through the portal.' },
  { num:'03', icon:'🤖', title:'AI Verifies', desc:'7-step AI pipeline verifies identity, documents, and eligibility.' },
  { num:'04', icon:'🔗', title:'Tokens Minted', desc:'Approved students receive cryptographic scholarship tokens.' },
  { num:'05', icon:'💸', title:'Bridge Distributes', desc:'Bridge student atomically distributes tokens to all verified recipients.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [loginRole, setLoginRole] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [featureModal, setFeatureModal] = useState(null)
  const countersRef = useRef(null)
  const [counters, setCounters] = useState(STATS.map(() => 0))
  const animatedRef = useRef(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const el = countersRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animatedRef.current) {
        animatedRef.current = true
        animateCounters()
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const animateCounters = () => {
    const targets = [2400000, 840, 99.97, 0]
    const duration = 2000
    const steps = 60
    let step = 0
    const interval = setInterval(() => {
      step++
      const progress = step / steps
      const eased = 1 - Math.pow(1 - progress, 3)
      setCounters(targets.map(t => Math.round(t * eased * 100) / 100))
      if (step >= steps) clearInterval(interval)
    }, duration / steps)
  }

  const formatCounter = (val, idx) => {
    if (idx === 0) return (val >= 1000000 ? (val / 1000000).toFixed(1) + 'M+' : val.toLocaleString())
    if (idx === 1) return '₹' + val + 'Cr'
    if (idx === 2) return val.toFixed(2) + '%'
    return '0'
  }

  return (
    <div>
      <NetworkCanvas />
      <Sparkles />
      {/* ambient bg orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      {/* NAVBAR */}
      <nav className="navbar" style={scrolled ? { borderBottomColor:'var(--border)' } : {}}>
        <div className="nav-inner">
          <div className="nav-brand">
            <span className="brand-icon">⚡</span>
            ExpressScheme
          </div>
          <div className="nav-links">
            <a href="#how-it-works">How It Works</a>
            <a href="#features">Features</a>
            <a href="#ai">AI Verify</a>
            <a onClick={() => navigate('/wallet')} style={{ cursor:'pointer' }}>◎ Wallet</a>
            <a onClick={() => navigate('/about')} style={{ cursor:'pointer' }}>About</a>
            <a href="#login" className="btn-nav">Launch App →</a>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
            <ThemeToggle />
            <button
              className={`nav-hamburger${navOpen ? ' open' : ''}`}
              onClick={() => setNavOpen(o => !o)}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE NAV DRAWER */}
      <div className={`nav-mobile-drawer${navOpen ? ' open' : ''}`}>
        <a href="#how-it-works" onClick={() => setNavOpen(false)}>How It Works</a>
        <a href="#features"     onClick={() => setNavOpen(false)}>Features</a>
        <a href="#ai"           onClick={() => setNavOpen(false)}>AI Verify</a>
        <button className="btn-nav-mobile" onClick={() => { setNavOpen(false); navigate('/about') }} style={{ background:'rgba(0,232,198,.08)', color:'var(--text-2)', border:'1px solid var(--border-2)' }}>ℹ️ About</button>
        <button className="btn-nav-mobile" onClick={() => { setNavOpen(false); navigate('/wallet') }} style={{ background:'rgba(0,232,198,.12)', color:'var(--accent)', border:'1px solid rgba(0,232,198,.25)' }}>◎ Algorand Wallet</button>
        <button className="btn-nav-mobile" onClick={() => { setNavOpen(false); setLoginRole('gov') }}>🏛️ Gov Officer Login</button>
        <button className="btn-nav-mobile" style={{ marginTop:'.5rem', background:'rgba(0,232,198,.12)', color:'var(--accent)' }} onClick={() => { setNavOpen(false); setLoginRole('user') }}>🎓 Citizen Portal</button>
      </div>

      {/* HERO */}
      <div className="hero-photo-wrap">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Blockchain × AI × Government Schemes
          </div>
          <h1 className="hero-title">
            Scheme Funds.<br />
            <span className="gradient-text">Tokenised.<br/>Verified.<br/>Distributed.</span>
          </h1>
          <p className="hero-sub">
            Blockchain-powered. AI-verified. Fraud-proof.
          </p>
          <div className="hero-cta">
            <button className="btn-primary" onClick={() => setLoginRole('gov')}>🏛️ Gov Officer Login</button>
            <button className="btn-ghost"   onClick={() => setLoginRole('user')}>🎓 Citizen Portal</button>
            <a onClick={() => navigate('/wallet')} style={{ cursor:'pointer' }}>◎ Wallet</a>
          </div>
          <div className="hero-stats" ref={countersRef}>
            {STATS.map((s, i) => (
              <div className="stat" key={i}>
                <span className="stat-val">{formatCounter(counters[i], i)}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <div className="token-orb">
            <div className="orb-ring ring1"></div>
            <div className="orb-ring ring2"></div>
            <div className="orb-ring ring3"></div>
            <div className="orb-core">
              <span className="orb-icon">⚡</span>
              <span className="orb-label">EXPRESS<br/>TOKEN</span>
            </div>
            <div className="floating-card fc1"><span className="fc-icon">🔗</span><span>On-Chain</span></div>
            <div className="floating-card fc2"><span className="fc-icon">🤖</span><span>AI Verified</span></div>
            <div className="floating-card fc3"><span className="fc-icon">🛡️</span><span>Fraud-Proof</span></div>
            <div className="floating-card fc4"><span className="fc-icon">💸</span><span>Instant Payout</span></div>
          </div>
        </div>
      </section>
      </div>{/* /hero-photo-wrap */}

      {/* HOW IT WORKS */}
      <section className="section section-dark" id="how-it-works">
        <div className="container">
          <p className="section-label" style={{ textAlign:'center' }}>How It Works</p>
          <h2 className="section-title">Five Steps to Transparent Scholarship</h2>
          <p className="section-sub">
            From government treasury to student wallet — every step recorded on the blockchain.
          </p>
          <div className="steps-flow">
            {STEPS.map((s, i) => (
              <>
                <div className="step-card" key={s.num}>
                  <div className="step-num">STEP {s.num}</div>
                  <div className="step-icon">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && <div className="step-arrow" key={`arr-${i}`}>→</div>}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="container">
          <p className="section-label" style={{ textAlign:'center' }}>Platform Features</p>
          <h2 className="section-title">Everything You Need for Fraud-Free Disbursement</h2>
          <p className="section-sub">Built for scale, trust, and total transparency.</p>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className={`feature-card glow-card${f.featured ? ' featured' : ''}`}>
                {f.featured && <div className="feature-glow"></div>}
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <button className="feature-link" onClick={() => setFeatureModal(f)}>Learn more →</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI SECTION */}
      <section className="section section-dark" id="ai">
        <div className="container">
          <div className="ai-split">
            <div className="ai-text">
              <p className="section-label">AI Verification</p>
              <h2 className="section-title" style={{ textAlign:'left' }}>
                7-Layer AI Pipeline That Never Sleeps
              </h2>
              <p>
                Before any token is issued, our AI runs every application through a
                rigorous pipeline — OCR extraction, identity cross-reference, forgery
                detection, duplicate check, income validation, and on-chain anchoring.
              </p>
              <p>
                Powered by vector embeddings, image forensics, and real-time database
                cross-reference — zero false payouts.
              </p>
              <ul className="ai-checks">
                {['Document OCR & Forgery Detection','Identity Biometric Cross-Reference','Duplicate Application Screening','Income Validation with PAN/ITR','On-Chain Cryptographic Proof Anchoring'].map(c => (
                  <li key={c}><span className="check">✓</span>{c}</li>
                ))}
              </ul>
            </div>
            <div className="ai-card">
              <div className="ai-card-header">
                <span className="ai-dot green"></span>
                AI Engine — Live Scan
              </div>
              <div className="ai-scan">
                {[
                  { label:'Aadhaar Identity Match', result:'✓ Verified', type:'verified' },
                  { label:'Income Certificate OCR', result:'✓ Authentic', type:'verified' },
                  { label:'Academic Marks Sheet', result:'⚠ Low Confidence', type:'warning' },
                  { label:'Bank Account Validation', result:'✓ Linked', type:'verified' },
                ].map(item => (
                  <div key={item.label} className={`scan-item ${item.type}`}>
                    <span className="scan-label">{item.label}</span>
                    <span className="scan-result">{item.result}</span>
                  </div>
                ))}
              </div>
              <div className="trust-score">
                <span>Trust Score</span>
                <div className="score-bar"><div className="score-fill" style={{ width:'87%' }}></div></div>
                <span className="score-val">87 / 100</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGIN CARDS */}
      <section className="section login-section" id="login">
        <div className="container">
          <p className="section-label" style={{ textAlign:'center' }}>Access Portal</p>
          <h2 className="section-title">Choose Your Role</h2>
          <p className="section-sub">
            Two portals, one platform — built for government officers and students alike.
          </p>
          <div className="login-cards">
            <div className="login-card glow-card login-gov" onClick={() => setLoginRole('gov')}>
              <div className="lcard-bg"></div>
              <div className="lcard-icon">🏛️</div>
              <h3>Government Officer</h3>
              <p>Create and tokenize scholarship schemes, review applications, resolve fraud flags, and download audit reports.</p>
              <ul className="lcard-list">
                {['Tokenize Scheme Funds','Review Applications','AI Fraud Flags','Audit Reports'].map(i => (
                  <li key={i}><span>▶</span>{i}</li>
                ))}
              </ul>
              <div className="lcard-btn"><span>Login as Gov Officer</span><span>→</span></div>
            </div>
            <div className="login-card glow-card login-user" onClick={() => setLoginRole('user')}>
              <div className="lcard-bg"></div>
              <div className="lcard-icon">🎓</div>
              <h3>Student / Applicant</h3>
              <p>Browse government schemes, apply, verify your documents with AI, track token wallet, and use bridge mode.</p>
              <ul className="lcard-list">
                {['Apply for Schemes','AI Self-Verify','Token Wallet','Bridge Mode'].map(i => (
                  <li key={i}><span>▶</span>{i}</li>
                ))}
              </ul>
              <div className="lcard-btn"><span>Login as Student</span><span>→</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="nav-brand brand-name">⚡ ExpressScheme</div>
            <p>Tokenised government scholarship distribution powered by blockchain and AI.</p>
          </div>
          <div className="footer-links">
            <div className="fl-col">
              <span className="fl-head">Platform</span>
              <a href="#">Gov Portal</a>
              <a href="#">Citizen Portal</a>
              <a href="#">AI Verify</a>
            </div>
            <div className="fl-col">
              <span className="fl-head">Company</span>
              <a onClick={() => navigate('/about')} style={{ cursor:'pointer' }}>About</a>
              <a href="mailto:parimeena404@gmail.com">Contact</a>
              <a href="https://github.com/ashishbalodia1/ExcessScheme" target="_blank" rel="noreferrer">GitHub</a>
            </div>
            <div className="fl-col">
              <span className="fl-head">Legal</span>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Use</a>
              <a href="#">Data Protection</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 ExpressScheme. Built for Hackathon. All rights reserved.
        </div>
      </footer>

      <LoginModal role={loginRole} onClose={() => setLoginRole(null)} />

      {/* FEATURE DETAIL MODAL */}
      {featureModal && (
        <div className="fmodal-overlay" onClick={e => e.target === e.currentTarget && setFeatureModal(null)}>
          <div className="fmodal-box">
            {/* Header */}
            <div className="fmodal-header">
              <div className="fmodal-icon">{featureModal.icon}</div>
              <div className="fmodal-header-text">
                <h2 className="fmodal-title">{featureModal.title}</h2>
                <p className="fmodal-tagline">{featureModal.tagline}</p>
              </div>
              <button className="fmodal-close" onClick={() => setFeatureModal(null)}>✕</button>
            </div>

            <div className="fmodal-body">
              {/* Key Highlights */}
              <div className="fmodal-section-label">How It Works</div>
              <div className="fmodal-highlights">
                {featureModal.highlights.map(h => (
                  <div key={h.label} className="fmodal-highlight">
                    <div className="fmh-icon">{h.icon}</div>
                    <div className="fmh-content">
                      <div className="fmh-label">{h.label}</div>
                      <p className="fmh-text">{h.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="fmodal-section-label">By the Numbers</div>
              <div className="fmodal-stats">
                {featureModal.stats.map(s => (
                  <div key={s.label} className="fmodal-stat">
                    <span className="fms-val gradient-text">{s.val}</span>
                    <span className="fms-label">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Tech Stack */}
              <div className="fmodal-section-label">Tech Stack</div>
              <div className="fmt-tags">
                {featureModal.tech.map(t => (
                  <span key={t} className="fmt-tag">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
