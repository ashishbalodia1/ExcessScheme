import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import StatusBadge from '../components/StatusBadge'
import ThemeToggle from '../components/ThemeToggle'
import { SCHEMES, APPLICATIONS, AI_FLAGS, TX_DATA, MINTED_HISTORY, REPORTS_DATA } from '../data/dashboardData'

const TABS = [
  { id:'overview',    icon:'📊', label:'Overview' },
  { id:'schemes',     icon:'🏛️', label:'Manage Schemes' },
  { id:'tokenize',    icon:'🔗', label:'Tokenize Funds' },
  { id:'applications',icon:'📝', label:'Applications', badge: 3 },
  { id:'flags',       icon:'🚨', label:'AI Flags', badge: 7 },
  { id:'reports',     icon:'📄', label:'Audit Reports' },
]

function BarChart() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')
    const data = [17, 36, 49, 64, 39, 77, 83]
    const labels = ['Aug','Sep','Oct','Nov','Dec','Jan','Feb']
    const th = document.documentElement.getAttribute('data-theme')
    const barColor = th === 'light' ? '#009E88' : '#00E8C6'
    const textColor = th === 'light' ? '#3D6458' : '#94A3B8'
    c.width = c.offsetWidth; c.height = c.offsetHeight || 180
    ctx.clearRect(0, 0, c.width, c.height)
    const pad = 30, bw = Math.floor((c.width - pad * 2) / data.length) - 8
    data.forEach((v, i) => {
      const x = pad + i * ((c.width - pad * 2) / data.length) + 4
      const h = (v / 100) * (c.height - 40)
      const y = c.height - 20 - h
      ctx.fillStyle = barColor + '22'
      ctx.beginPath()
      ctx.roundRect(x, y, bw, h, 4)
      ctx.fill()
      ctx.fillStyle = barColor
      ctx.beginPath()
      ctx.roundRect(x, c.height - 20 - 4, bw, 4, 2)
      ctx.fill()
      ctx.fillStyle = textColor
      ctx.font = '10px Inter'
      ctx.textAlign = 'center'
      ctx.fillText(labels[i], x + bw/2, c.height - 4)
    })
  }, [])
  return <canvas ref={canvasRef} style={{ width:'100%', height:'180px', display:'block' }} />
}

function DonutChart({ value = 73 }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext('2d')
    const th = document.documentElement.getAttribute('data-theme')
    c.width = c.offsetWidth || 160; c.height = c.offsetHeight || 160
    const cx = c.width/2, cy = c.height/2, r = (Math.min(c.width,c.height)/2) - 16
    ctx.clearRect(0,0,c.width,c.height)
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.strokeStyle='rgba(255,255,255,.06)'; ctx.lineWidth=14; ctx.stroke()
    const start = -Math.PI/2, end = start + (value/100)*Math.PI*2
    const grad = ctx.createLinearGradient(0,0,c.width,c.height)
    grad.addColorStop(0, th==='light'?'#009E88':'#00E8C6')
    grad.addColorStop(1, '#00A8FF')
    ctx.beginPath(); ctx.arc(cx,cy,r,start,end); ctx.strokeStyle=grad; ctx.lineWidth=14; ctx.lineCap='round'; ctx.stroke()
    ctx.fillStyle = th==='light'?'#0F2820':'#fff'
    ctx.font = 'bold 22px Inter'; ctx.textAlign='center'; ctx.textBaseline='middle'
    ctx.fillText(value+'%', cx, cy-6)
    ctx.fillStyle = th==='light'?'#3D6458':'#94A3B8'
    ctx.font = '11px Inter'; ctx.fillText('Utilized',cx,cy+14)
  }, [value])
  return <canvas ref={canvasRef} style={{ width:'160px', height:'160px', display:'block', margin:'0 auto' }} />
}

export default function GovDashboard() {
  const [tab, setTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024)
  const [schemeFilter, setSchemeFilter] = useState('')
  const [appFilter, setAppFilter] = useState('all')
  const [mintAmount, setMintAmount] = useState(50)
  const [mintScheme, setMintScheme] = useState('PM National Scholarship 2026')
  const [apps, setApps] = useState(APPLICATIONS)
  const [flags, setFlags] = useState(AI_FLAGS)
  const [showCreateScheme, setShowCreateScheme] = useState(false)
  const navigate = useNavigate()

  const filteredSchemes = SCHEMES.filter(s =>
    !schemeFilter || s.name.toLowerCase().includes(schemeFilter.toLowerCase())
  )
  const filteredApps = apps.filter(a =>
    appFilter === 'all' || a.status === appFilter
  )

  return (
    <div className="dash-body">
      <Sidebar
        role="gov"
        tabs={TABS}
        activeTab={tab}
        onTabChange={id => { setTab(id); if (window.innerWidth <= 1024) setSidebarOpen(false) }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="dash-main">
        {/* TOPBAR */}
        <div className="dash-topbar">
          <div className="topbar-left">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>
            <span className="topbar-title">ExpressScheme — Gov Panel</span>
          </div>
          <div className="topbar-right">
            <div className="topbar-search">
              <input type="text" placeholder="Search schemes, students…" />
            </div>
            <div className="topbar-chain"><span className="chain-dot"></span>Chain: Active</div>
            <button
              onClick={() => navigate('/wallet')}
              style={{ background:'rgba(0,232,198,.12)', color:'var(--accent)', border:'1px solid rgba(0,232,198,.3)', borderRadius:'7px', padding:'.38rem .85rem', fontSize:'.82rem', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:'.35rem', whiteSpace:'nowrap' }}
            >
              ◎ Wallet
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="tab-content active">
            <div className="dash-welcome">
              <div>
                <h1>Good Morning, Officer Rajiv 👋</h1>
                <p>Live status across all 7 active NSP / central scholarship schemes — FY 2025-26.</p>
              </div>
              <span className="welcome-date">Feb 20, 2026</span>
            </div>
            <div className="kpi-grid">
              {[
                { label:'Active Schemes',  val:'7',          trend:'↑ 3 added this quarter', cls:'kpi-accent', icon:'🏛️' },
                { label:'Total Budget',    val:'₹601 Cr',    trend:'Union Budget 2026 allocation', cls:'', icon:'💰' },
                { label:'Tokens Minted',  val:'26,700',      trend:'₹17.5 Cr tokenised on-chain', cls:'', icon:'🔗' },
                { label:'Applications',   val:'3,841',       trend:'↑ 312 in last 7 days', cls:'', icon:'📝' },
                { label:'AI Flags',       val:'6',           trend:'3 critical · 3 warning', cls:'kpi-warn', icon:'🚨' },
                { label:'Distributed',    val:'₹17.5 Cr',    trend:'68.1% AI pass rate', cls:'', icon:'💸' },
              ].map(k => (
                <div key={k.label} className={`kpi-card${k.cls?' '+k.cls:''}`}>
                  <div className="kpi-top">
                    <span className="kpi-label">{k.label}</span>
                    <span className="kpi-icon">{k.icon}</span>
                  </div>
                  <span className="kpi-val">{k.val}</span>
                  <span className={`kpi-trend ${k.cls==='kpi-warn'?'down':'up'}`}>{k.trend}</span>
                </div>
              ))}
            </div>
            <div className="charts-row">
              <div className="chart-card">
                <span className="chart-title">Monthly Token Distribution (₹ Cr) · Aug 2025 – Feb 2026</span>
                <BarChart />
              </div>
              <div className="chart-card" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                <span className="chart-title">Fund Utilisation</span>
                <DonutChart value={73} />
              </div>
            </div>
            <div className="tables-row">
              <div className="table-card">
                <div className="table-card-header">
                  <span className="chart-title" style={{ margin:0 }}>Recent Transactions</span>
                </div>
                <table className="dash-table">
                  <thead><tr><th>TX Hash</th><th>Scheme</th><th>Amount</th><th>Tokens</th><th>Status</th><th>Block</th></tr></thead>
                  <tbody>
                    {TX_DATA.map(tx => (
                      <tr key={tx.hash}>
                        <td className="tx-hash" title={tx.fullHash}>{tx.hash}</td>
                        <td>{tx.scheme}</td>
                        <td>{tx.amount}</td>
                        <td style={{fontVariantNumeric:'tabular-nums'}}>{tx.tokens ? tx.tokens.toLocaleString() : '—'}</td>
                        <td><StatusBadge status={tx.status} /></td>
                        <td style={{fontSize:'.72rem',color:'var(--text-3)'}}>{tx.block ? tx.block.toLocaleString() : 'Pending'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-card">
                <div className="table-card-header">
                  <span className="chart-title" style={{ margin:0 }}>AI Alerts</span>
                </div>
                <div className="alerts-feed">
                  {AI_FLAGS.slice(0,4).map(f => (
                    <div key={f.id} className={`alert-item ${f.type}`}>
                      <span className="alert-icon">{f.type==='critical'?'🔴':'🟡'}</span>
                      <div className="alert-body">
                        <div className="alert-title">{f.reason}</div>
                        <div className="alert-desc">{f.student} — {f.scheme}</div>
                        <div className="alert-time">{f.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCHEMES */}
        {tab === 'schemes' && (
          <div className="tab-content active">
            <div className="tab-header-row">
              <div>
                <h2>Manage Schemes</h2>
                <p>Create, edit, and tokenize scholarship schemes.</p>
              </div>
              <button className="btn-primary" onClick={() => setShowCreateScheme(true)}>+ Create Scheme</button>
            </div>
            <div className="filter-bar">
              <input
                className="filter-input"
                placeholder="Search schemes…"
                value={schemeFilter}
                onChange={e => setSchemeFilter(e.target.value)}
              />
              <select className="filter-select">
                <option>All Categories</option>
                <option>Merit</option>
                <option>Need-Based</option>
                <option>Disability</option>
                <option>Minority</option>
              </select>
            </div>
            <div className="schemes-grid">
              {filteredSchemes.map(s => (
                <div key={s.id} className="scheme-card">
                  <div className="sc-header">
                    <span className="sc-title">{s.name}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="sc-body">{s.criteria}</p>
                  <div className="sc-meta">
                    <span>🏛️ {s.ministry || s.cat}</span>
                    <span>💰 ₹{s.amount.toLocaleString()}/student</span>
                    <span>👥 {s.benef.toLocaleString()} beneficiaries</span>
                    <span>📅 {s.deadline}</span>
                  </div>
                  <div className="sc-footer">
                    <div className="sc-progress">
                      <div className="sc-progress-bar">
                        <div className="sc-progress-fill" style={{ width:`${s.filled}%` }}></div>
                      </div>
                      <span className="sc-pct">{s.filled}% filled</span>
                    </div>
                    <button
                      className="btn-sm btn-approve"
                      onClick={() => setTab('tokenize')}
                    >Tokenize →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOKENIZE */}
        {tab === 'tokenize' && (
          <div className="tab-content active">
            <div className="tab-header-row">
              <div><h2>Tokenize Funds</h2><p>Mint scholarship tokens for verified applicants.</p></div>
            </div>
            <div className="tokenize-layout">
              <div className="tokenize-form-card">
                <h3>Mint New Batch</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                  <div className="form-group">
                    <label>Select Scheme</label>
                    <select className="filter-select" style={{ width:'100%' }} value={mintScheme} onChange={e => setMintScheme(e.target.value)}>
                      {SCHEMES.filter(s=>s.status==='active').map(s=><option key={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Number of Tokens</label>
                    <input className="filter-input" type="number" value={mintAmount} onChange={e=>setMintAmount(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Lock Until</label>
                    <input className="filter-input" type="date" defaultValue="2026-12-31" />
                  </div>
                  <button className="btn-primary w-full" onClick={() => alert('Tokens minted on-chain!')}>⬡ Mint Tokens</button>
                </div>
              </div>
              <div className="tokenize-preview">
                <h3>Token Preview</h3>
                <div className="token-preview-card">
                  <div className="tpc-header">
                    <span className="tpc-badge">⬡ SCH-TOKEN</span>
                    <span className="tpc-id">BATCH-2026-LIVE</span>
                  </div>
                  <div className="tpc-grid">
                    <div className="tpc-item"><span className="tpc-l">Scheme</span><span className="tpc-v">{mintScheme.slice(0,24)}…</span></div>
                    <div className="tpc-item"><span className="tpc-l">Tokens</span><span className="tpc-v accent">{mintAmount.toLocaleString()}</span></div>
                    <div className="tpc-item"><span className="tpc-l">Value Each</span><span className="tpc-v">₹{(SCHEMES.find(s=>s.name===mintScheme)?.amount||12000).toLocaleString()}</span></div>
                    <div className="tpc-item"><span className="tpc-l">Total Value</span><span className="tpc-v accent">₹{(mintAmount*(SCHEMES.find(s=>s.name===mintScheme)?.amount||12000)).toLocaleString()}</span></div>
                  </div>
                  <div className="tpc-footer">Lock Until: <span>2026-12-31</span></div>
                </div>
                <div className="minted-list">
                  <h4>Recently Minted</h4>
                  {MINTED_HISTORY.map(m => (
                    <div key={m.txHash} className="minted-item">
                      <span className="mi-scheme">{m.scheme}</span>
                      <span>{m.tokens.toLocaleString()} tokens</span>
                      <span className="mi-val">{m.amount}</span>
                      <span style={{ color:'var(--text-3)', fontSize:'.72rem' }}>{m.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* APPLICATIONS */}
        {tab === 'applications' && (
          <div className="tab-content active">
            <div className="tab-header-row">
              <div><h2>Applications</h2><p>Review and approve student applications.</p></div>
            </div>
            <div className="apps-filters">
              {['all','Pending Review','AI Verified','Approved','Rejected'].map(f => (
                <button
                  key={f}
                  className={`btn-sm${appFilter===f?' btn-approve':' btn-view'}`}
                  onClick={() => setAppFilter(f)}
                >
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
            {filteredApps.map(a => (
              <div key={a.id} className="app-row">
                <div>
                  <div className="app-name">{a.name}</div>
                  <div className="app-id">{a.studentId} · {a.inst}</div>
                </div>
                <div className="app-scheme">{a.scheme}</div>
                <div className="app-amount">₹{a.amount.toLocaleString()}</div>
                <StatusBadge status={a.status} />
                <div style={{ fontSize:'.78rem', color:'var(--text-3)' }}>{a.date}</div>
                <div style={{ fontSize:'.75rem', color:'var(--text-3)', display:'flex', alignItems:'center', gap:'.25rem' }}>
                  🛡️ {a.aiScore}/100
                </div>
                <div className="app-actions">
                  {a.status === 'Pending Review' || a.status === 'AI Verified' ? (
                    <>
                      <button
                        className="btn-sm btn-approve"
                        onClick={() => setApps(prev => prev.map(x => x.id===a.id ? {...x,status:'Approved'} : x))}
                      >✓ Approve</button>
                      <button
                        className="btn-sm btn-reject"
                        onClick={() => setApps(prev => prev.map(x => x.id===a.id ? {...x,status:'Rejected'} : x))}
                      >✕ Reject</button>
                    </>
                  ) : (
                    <button className="btn-sm btn-view">View</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI FLAGS */}
        {tab === 'flags' && (
          <div className="tab-content active">
            <div className="tab-header-row">
              <div><h2>AI Fraud Flags</h2><p>Review and resolve AI-detected anomalies.</p></div>
              <div className="flag-summary">
                <span className="fs-chip critical">🔴 {flags.filter(f=>f.type==='critical').length} Critical</span>
                <span className="fs-chip warning">🟡 {flags.filter(f=>f.type==='warning').length} Warning</span>
              </div>
            </div>
            {flags.map(f => (
              <div key={f.id} className={`flag-card ${f.type}`}>
                <div className="flag-header">
                  <div>
                    <div className="flag-title">{f.reason}</div>
                    <div className="flag-id">{f.id} · {f.studentId}</div>
                  </div>
                  <StatusBadge status={f.type === 'critical' ? 'Rejected' : 'Pending'} />
                </div>
                <div className="flag-meta">
                  <span>👤 {f.student}</span>
                  <span>📋 {f.scheme}</span>
                  <span>🕐 {f.time}</span>
                </div>
                <div className="flag-details">{f.detail}</div>
                <div className="flag-actions">
                  <button className="btn-sm btn-reject" onClick={() => setFlags(prev => prev.filter(x=>x.id!==f.id))}>
                    Block Student
                  </button>
                  <button className="btn-sm btn-approve" onClick={() => setFlags(prev => prev.filter(x=>x.id!==f.id))}>
                    Mark Resolved
                  </button>
                  <button className="btn-sm btn-view">Request Documents</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REPORTS */}
        {tab === 'reports' && (
          <div className="tab-content active">
            <div className="tab-header-row">
              <div><h2>Audit Reports</h2><p>Download immutable on-chain audit logs.</p></div>
            </div>
            <div className="reports-grid">
              {REPORTS_DATA.map(r => (
                <div key={r.title} className="report-card">
                  <div className="rc-icon">{r.icon}</div>
                  <div className="rc-title">{r.title}</div>
                  <div className="rc-desc">{r.desc}</div>
                  <div className="rc-meta">{r.meta}</div>
                  <button className="btn-sm btn-view" onClick={() => alert('Downloading ' + r.title)}>
                    ⬇ Download PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CREATE SCHEME MODAL */}
      {showCreateScheme && (
        <div className="modal-overlay open" onClick={e=>e.target===e.currentTarget&&setShowCreateScheme(false)}>
          <div className="modal-box" style={{ maxWidth:'560px' }}>
            <button className="modal-close" onClick={() => setShowCreateScheme(false)}>✕</button>
            <div className="modal-title">Create New Scheme</div>
            <div className="modal-sub">Define the scheme parameters for tokenization.</div>
            <div className="modal-form">
              <div className="form-group"><label>Scheme Name</label><input type="text" placeholder="e.g. National Merit Award 2026" /></div>
              <div className="form-row">
                <div className="form-group"><label>Category</label><select className="filter-select" style={{width:'100%'}}><option>Merit</option><option>Need-Based</option><option>Disability</option><option>Minority</option></select></div>
                <div className="form-group"><label>Amount per Student (₹)</label><input type="number" placeholder="50000" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Total Budget (₹ Cr)</label><input type="number" placeholder="50" /></div>
                <div className="form-group"><label>Deadline</label><input type="date" /></div>
              </div>
              <div className="form-group"><label>Eligibility Criteria</label><input type="text" placeholder="Describe criteria…" /></div>
              <button className="btn-primary w-full" onClick={() => { alert('Scheme created!'); setShowCreateScheme(false) }}>
                Create & Tokenize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
