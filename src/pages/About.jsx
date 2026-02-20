import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import '../styles/about.css'

const TECH = [
  { icon: '⚛️',  name: 'React 18 + Vite 6',      desc: 'Lightning-fast frontend with lazy-loaded routes and real-time updates.' },
  { icon: '⛓️',  name: 'Algorand TestNet',         desc: 'Standard assets for scholarship tokens, AlgoNode public endpoints, Pera Wallet connect.' },
  { icon: '🧠',  name: 'AI Verification',           desc: 'Computer vision, NLP OCR, vector similarity, GAN forgery detection & UIDAI API.' },
  { icon: '🐘',  name: 'Supabase (PostgreSQL)',     desc: '9-table relational schema: users, schemes, applications, tokens, fraud flags, audits.' },
  { icon: '🍃',  name: 'MongoDB Atlas',             desc: 'Document store mirroring all Supabase collections — dual-DB resilience.' },
  { icon: '🔐',  name: 'Multi-Sig Smart Contracts', desc: 'Bridge execution requires Gov Officer + System Validator co-signatures before dispatch.' },
]

const MILESTONES = [
  { year: '2025 Q3', event: 'Project kicked off — core blockchain architecture designed.' },
  { year: '2025 Q4', event: 'AI verification pipeline integrated; Supabase backend seeded with NSP data.' },
  { year: '2026 Jan', event: 'Algorand wallet dashboard live; Pera Wallet connect integrated.' },
  { year: '2026 Feb', event: 'MongoDB dual-DB layer added; realistic government scheme data deployed.' },
  { year: '2026 ↓',  event: 'MainNet deployment & MeitY evaluation planned.' },
]

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="about-page">
      {/* NAV */}
      <nav className="about-nav">
        <div className="about-nav-inner">
          <button className="about-brand" onClick={() => navigate('/')}>
            <span>⚡</span> ExpressScheme
          </button>
          <div className="about-nav-links">
            <button onClick={() => navigate('/')}>Home</button>
            <button onClick={() => navigate('/gov-dashboard')}>Gov Portal</button>
            <button onClick={() => navigate('/user-dashboard')}>Student Portal</button>
            <button onClick={() => navigate('/wallet')}>◎ Wallet</button>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      {/* HERO */}
      <section className="about-hero">
        <div className="about-hero-badge">⚡ About ExpressScheme</div>
        <h1 className="about-hero-title">
          Eliminating Scholarship Fraud<br />
          <span className="abt-grad">One Token at a Time</span>
        </h1>
        <p className="about-hero-sub">
          ExpressScheme is an open-source, blockchain-powered platform that tokenises every rupee of
          Indian government scholarship funds — making disbursement transparent, fraud-proof, and
          fully auditable from ministry treasury to student bank account.
        </p>
        <div className="about-kpis">
          <div className="abt-kpi"><span>₹840 Cr+</span><small>Simulated Distribution</small></div>
          <div className="abt-kpi"><span>2.4 M+</span><small>Tokens Minted</small></div>
          <div className="abt-kpi"><span>99.3%</span><small>AI Detection Accuracy</small></div>
          <div className="abt-kpi"><span>0</span><small>Frauds Passed</small></div>
        </div>
      </section>

      {/* MISSION */}
      <section className="about-section">
        <div className="about-section-inner">
          <h2 className="about-section-title">Our Mission</h2>
          <div className="about-mission-grid">
            <div className="abt-mission-card">
              <div className="abt-mc-icon">🎯</div>
              <h3>Mission</h3>
              <p>Ensure every eligible Indian student receives their government scholarship — on time, in full, without corruption or bureaucratic delay — through immutable blockchain records and AI fraud prevention.</p>
            </div>
            <div className="abt-mission-card">
              <div className="abt-mc-icon">🔭</div>
              <h3>Vision</h3>
              <p>A future where no government scholarship rupee is lost to fraud, ghost beneficiaries, or manual errors — where a student in rural India can verify their own scholarship on a public blockchain.</p>
            </div>
            <div className="abt-mission-card">
              <div className="abt-mc-icon">⚖️</div>
              <h3>Values</h3>
              <p>Radical transparency, privacy-preserving design (zero PII on-chain), open-source code, and government accountability — built to meet MeitY and NIC compliance standards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM WE SOLVE */}
      <section className="about-section about-section-alt">
        <div className="about-section-inner">
          <h2 className="about-section-title">The Problem We Solve</h2>
          <p className="about-section-sub">India disburses over <strong>₹2,000 Cr annually</strong> in central scholarship schemes. Current challenges include:</p>
          <div className="about-problems">
            {[
              { icon:'🕵️', title:'Ghost Beneficiaries', desc:'Fraudulent applications using forged Aadhaar and income certificates divert funds from genuine students.' },
              { icon:'📂', title:'Manual Verification', desc:'Paper-based processes in district offices cause 3–8 month delays and introduce human error at every step.' },
              { icon:'🔀', title:'No End-to-End Traceability', desc:'Once funds leave the ministry, there is no way to verify they reached the correct student and bank account.' },
              { icon:'🔁', title:'Duplicate Applications', desc:'The same student applies across multiple schemes or portals with no cross-database deduplication.' },
            ].map(p => (
              <div className="abt-problem" key={p.title}>
                <span className="abt-p-icon">{p.icon}</span>
                <div>
                  <strong>{p.title}</strong>
                  <p>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="about-section">
        <div className="about-section-inner">
          <h2 className="about-section-title">Technology Stack</h2>
          <div className="about-tech-grid">
            {TECH.map(t => (
              <div className="abt-tech-card" key={t.name}>
                <span className="abt-tech-icon">{t.icon}</span>
                <strong>{t.name}</strong>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MILESTONES */}
      <section className="about-section about-section-alt">
        <div className="about-section-inner">
          <h2 className="about-section-title">Timeline</h2>
          <div className="about-timeline">
            {MILESTONES.map((m, i) => (
              <div className="abt-tl-item" key={i}>
                <div className="abt-tl-dot" />
                <div className="abt-tl-content">
                  <span className="abt-tl-year">{m.year}</span>
                  <p>{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="about-section about-section-alt" id="contact">
        <div className="about-section-inner">
          <h2 className="about-section-title">Contact & Links</h2>
          <div className="about-contact-grid">
            <div className="abt-contact-card">
              <span className="abt-cc-icon">✉️</span>
              <strong>General Enquiries</strong>
              <a href="mailto:parimeena404@gmail.com">parimeena404@gmail.com</a>
            </div>
            <div className="abt-contact-card">
              <span className="abt-cc-icon">🐙</span>
              <strong>Source Code</strong>
              <a href="https://github.com/ashishbalodia1/ExcessScheme" target="_blank" rel="noreferrer">github.com/ashishbalodia1/ExcessScheme</a>
            </div>
            <div className="abt-contact-card">
              <span className="abt-cc-icon">🏛️</span>
              <strong>Built For</strong>
              <span>Hackathon 2026 — MeitY / NIC Innovation Challenge</span>
            </div>
            <div className="abt-contact-card">
              <span className="abt-cc-icon">⛓️</span>
              <strong>Blockchain Network</strong>
              <span>Algorand TestNet — AlgoNode public endpoints</span>
            </div>
            <div className="abt-contact-card">
              <span className="abt-cc-icon">📍</span>
              <strong>Location</strong>
              <span>India 🇮🇳</span>
            </div>
            <div className="abt-contact-card">
              <span className="abt-cc-icon">📜</span>
              <strong>License</strong>
              <span>MIT — open source, free to use and modify</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="about-footer">
        <p>© 2026 ExpressScheme · Built for Hackathon · MIT License</p>
        <div className="about-footer-links">
          <button onClick={() => navigate('/')}>Home</button>
          <button onClick={() => navigate('/gov-dashboard')}>Gov Portal</button>
          <button onClick={() => navigate('/user-dashboard')}>Student Portal</button>
          <button onClick={() => navigate('/wallet')}>◎ Wallet</button>
        </div>
      </footer>
    </div>
  )
}
