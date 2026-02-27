import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/* ─────────────────────────────────────────────
   localStorage-backed user database
   Each user: { id, name, phone, passwordHash,
     aadhaarHash, aadhaarLast4, employment, createdAt }
───────────────────────────────────────────── */
const DB_KEY = 'es_citizen_users'
const OTP_KEY = 'es_pending_otp'

function dbRead() {
  try { return JSON.parse(localStorage.getItem(DB_KEY) || '[]') } catch { return [] }
}
function dbWrite(users) {
  localStorage.setItem(DB_KEY, JSON.stringify(users))
}
function findByPhone(phone) {
  return dbRead().find(u => u.phone === phone) || null
}

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function storePendingOtp(phone, otp) {
  const expiry = Date.now() + 5 * 60 * 1000
  sessionStorage.setItem(OTP_KEY, JSON.stringify({ phone, otp, expiry }))
}
function validateOtp(phone, entered) {
  try {
    const s = JSON.parse(sessionStorage.getItem(OTP_KEY) || 'null')
    if (!s || s.phone !== phone) return 'No OTP found. Request a new one.'
    if (Date.now() > s.expiry) return 'OTP expired. Please request a new one.'
    if (s.otp !== entered) return 'Incorrect OTP. Please try again.'
    sessionStorage.removeItem(OTP_KEY)
    return null
  } catch { return 'OTP validation failed.' }
}

/* ─────────────────────────────────────────────
   Employment options
───────────────────────────────────────────── */
const EMP_OPTIONS = [
  { value: 'student',          label: 'Student' },
  { value: 'employed_govt',    label: 'Employed – Government' },
  { value: 'employed_private', label: 'Employed – Private Sector' },
  { value: 'self_employed',    label: 'Self-employed / Business Owner' },
  { value: 'farmer',           label: 'Farmer / Agricultural Worker' },
  { value: 'unemployed',       label: 'Unemployed / Job-seeker' },
  { value: 'homemaker',        label: 'Homemaker' },
  { value: 'retired',          label: 'Retired' },
  { value: 'daily_wage',       label: 'Daily Wage Worker' },
  { value: 'other',            label: 'Other' },
]

/* ─────────────────────────────────────────────
   Aadhaar live mask  XXXX XXXX 1234
───────────────────────────────────────────── */
function maskAadhaar(digits) {
  if (!digits) return ''
  const p = digits.padEnd(12, '·')
  const parts = [p.slice(0,4), p.slice(4,8), p.slice(8,12)]
  return parts.map((s, i) => i < 2 ? s.replace(/\d/g, 'X') : s).join('  ')
}

/* ─────────────────────────────────────────────
   6-box OTP input
───────────────────────────────────────────── */
function OtpBoxes({ value, onChange }) {
  const refs = Array.from({ length: 6 }, () => useRef(null))
  const digits = value.split('')

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = digits.slice(); next[i] = ''; onChange(next.join(''))
      } else if (i > 0) {
        refs[i - 1].current?.focus()
        const next = digits.slice(); next[i - 1] = ''; onChange(next.join(''))
      }
    }
  }
  const handleInput = (i, e) => {
    const ch = e.target.value.replace(/\D/g,'').slice(-1)
    if (!ch) return
    const next = digits.slice()
    next[i] = ch
    onChange(next.join(''))
    if (i < 5) refs[i + 1].current?.focus()
  }
  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    onChange(text.padEnd(6,'').slice(0,6))
    refs[Math.min(text.length, 5)].current?.focus()
    e.preventDefault()
  }

  return (
    <div className="otp-boxes">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i} ref={refs[i]}
          type="text" inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          onChange={e => handleInput(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={`otp-box${digits[i] ? ' filled' : ''}`}
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Countdown hook
───────────────────────────────────────────── */
function useCountdown(initial) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const start = (n = initial) => {
    clearInterval(ref.current)
    setCount(n)
    ref.current = setInterval(() => setCount(c => { if (c <= 1) { clearInterval(ref.current); return 0 } return c - 1 }), 1000)
  }
  useEffect(() => () => clearInterval(ref.current), [])
  return [count, start]
}

/* ─────────────────────────────────────────────
   Gov Login (simple, unchanged)
───────────────────────────────────────────── */
function GovLogin({ onDone }) {
  return (
    <>
      <div className="modal-brand">
        <span className="modal-brand-icon">🏛️</span>
        <div>
          <div className="modal-brand-name">ExpressScheme</div>
          <div className="modal-brand-sub">Government Officer Portal</div>
        </div>
      </div>
      <form className="modal-form" onSubmit={e => { e.preventDefault(); onDone() }}>
        <div className="form-group">
          <label>Officer ID / Email</label>
          <input type="email" placeholder="officer@gov.in" required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" placeholder="Enter password" required />
        </div>
        <button type="submit" className="btn-primary w-full mt-1">
          Enter Government Portal →
        </button>
      </form>
      <p className="modal-note mt-1">Demo: any valid email / password</p>
    </>
  )
}

/* ─────────────────────────────────────────────
   Citizen Portal
   Screens:
     login → phone → otp | pwd  (login flow)
     register → form → verify → success  (register flow)
───────────────────────────────────────────── */
function CitizenAuth({ onDone }) {
  const [screen, setScreen] = useState('phone')  // phone | otp | pwd | register | verify | success
  const [phone,   setPhone]   = useState('')
  const [name,    setName]    = useState('')
  const [pass,    setPass]    = useState('')
  const [pass2,   setPass2]   = useState('')
  const [aadhaar, setAadhaar] = useState('')
  const [emp,     setEmp]     = useState('')
  const [otp,     setOtp]     = useState('')
  const [busy,    setBusy]    = useState(false)
  const [err,     setErr]     = useState('')
  const [pendOtp, setPendOtp] = useState('')   // for demo display
  const [countdown, startCountdown] = useCountdown(30)

  const clearErr = () => setErr('')
  const fmt = (p) => p.replace(/\D/g,'')

  /* Step 1 — Phone continue */
  const handlePhoneContinue = (e) => {
    e.preventDefault(); clearErr()
    if (fmt(phone).length !== 10) { setErr('Please enter a valid 10-digit mobile number.'); return }
    const user = findByPhone(fmt(phone))
    if (user) {
      // Existing user → ask how to login (default: send OTP)
      handleSendOtp()
    } else {
      // New user
      setScreen('register')
    }
  }

  /* Send OTP (login) */
  const handleSendOtp = () => {
    clearErr()
    const code = genOtp()
    storePendingOtp(fmt(phone), code)
    setPendOtp(code)
    startCountdown(30)
    setOtp('')
    setScreen('otp')
  }

  /* Verify OTP (login) */
  const handleVerifyOtp = async (e) => {
    e && e.preventDefault(); clearErr()
    if (otp.length < 6) { setErr('Please enter the complete 6-digit OTP.'); return }
    const errMsg = validateOtp(fmt(phone), otp)
    if (errMsg) { setErr(errMsg); return }
    const user = findByPhone(fmt(phone))
    if (!user) { setErr('Account not found.'); return }
    onDone(user)
  }

  /* Password login */
  const handlePwdLogin = async (e) => {
    e.preventDefault(); clearErr()
    setBusy(true)
    const hash = await sha256(pass)
    setBusy(false)
    const user = findByPhone(fmt(phone))
    if (!user) { setErr('Mobile number not registered.'); return }
    if (user.passwordHash !== hash) { setErr('Incorrect password. Please try again.'); return }
    onDone(user)
  }

  /* Register submit — send OTP to verify phone */
  const handleRegisterSubmit = async (e) => {
    e.preventDefault(); clearErr()
    if (!name.trim()) { setErr('Full name is required.'); return }
    if (fmt(phone).length !== 10) { setErr('Valid 10-digit mobile number required.'); return }
    if (pass.length < 8) { setErr('Password must be at least 8 characters.'); return }
    if (pass !== pass2) { setErr('Passwords do not match.'); return }
    if (aadhaar && fmt(aadhaar).length !== 12) { setErr('Aadhaar must be exactly 12 digits.'); return }
    if (!emp) { setErr('Please select your employment / professional status.'); return }
    if (findByPhone(fmt(phone))) { setErr('This mobile number is already registered. Please sign in.'); return }
    // Send OTP for phone verification
    const code = genOtp()
    storePendingOtp(fmt(phone), code)
    setPendOtp(code)
    startCountdown(30)
    setOtp('')
    setScreen('verify')
  }

  /* Verify OTP → create account */
  const handleCreateAccount = async (e) => {
    e && e.preventDefault(); clearErr()
    if (otp.length < 6) { setErr('Please enter the complete 6-digit OTP.'); return }
    const errMsg = validateOtp(fmt(phone), otp)
    if (errMsg) { setErr(errMsg); return }
    setBusy(true)
    const [passwordHash, aadhaarHash] = await Promise.all([
      sha256(pass),
      aadhaar ? sha256(fmt(aadhaar)) : Promise.resolve(null),
    ])
    const user = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: fmt(phone),
      passwordHash,
      aadhaarHash,
      aadhaarLast4: aadhaar ? fmt(aadhaar).slice(-4) : null,
      employment: emp,
      createdAt: new Date().toISOString(),
    }
    const users = dbRead()
    users.push(user)
    dbWrite(users)
    setBusy(false)
    setScreen('success')
    setTimeout(() => onDone(user), 2200)
  }

  /* Auto-verify when 6 digits entered */
  useEffect(() => {
    if (otp.length === 6 && screen === 'otp') handleVerifyOtp()
    if (otp.length === 6 && screen === 'verify') handleCreateAccount()
  }, [otp])

  const maskedPhone = `+91 XXXXXX${fmt(phone).slice(-4)}`

  return (
    <>
      {/* Brand header */}
      <div className="modal-brand">
        <span className="modal-brand-icon">⚡</span>
        <div>
          <div className="modal-brand-name">ExpressScheme</div>
          <div className="modal-brand-sub">Citizen Services Portal</div>
        </div>
      </div>

      {/* ── STEP: PHONE ─────────────────────── */}
      {screen === 'phone' && (
        <form className="modal-form" onSubmit={handlePhoneContinue}>
          <div className="modal-step-title">Sign In / Register</div>
          <p className="modal-step-sub">Enter your mobile number to continue</p>
          {err && <div className="auth-msg error">{err}</div>}
          <div className="form-group">
            <label>Mobile Number</label>
            <div className="phone-input-wrap">
              <span className="phone-prefix">🇮🇳 +91</span>
              <input type="tel" placeholder="98XXXXXXXX" value={phone}
                onChange={e => { setPhone(e.target.value.replace(/\D/g,'').slice(0,10)); clearErr() }}
                inputMode="numeric" maxLength={10} autoFocus required />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full mt-1" disabled={fmt(phone).length < 10}>
            Continue →
          </button>
          <p className="modal-note mt-1">
            New user? Just enter your number — we'll guide you through registration.
          </p>
        </form>
      )}

      {/* ── STEP: OTP (login) ───────────────── */}
      {screen === 'otp' && (
        <form className="modal-form" onSubmit={handleVerifyOtp}>
          <button type="button" className="modal-back" onClick={() => { setScreen('phone'); clearErr() }}>← Back</button>
          <div className="modal-step-title">Verify Your Number</div>
          <p className="modal-step-sub">OTP sent to <strong>{maskedPhone}</strong></p>
          <div className="otp-sent-badge">📱 OTP sent to your mobile</div>
          {err && <div className="auth-msg error">{err}</div>}
          <div className="form-group" style={{alignItems:'center', gap:'.6rem'}}>
            <OtpBoxes value={otp} onChange={setOtp} />
          </div>
          {pendOtp && <p className="modal-note" style={{textAlign:'left'}}>Demo OTP: <strong style={{color:'var(--accent)'}}>{pendOtp}</strong></p>}
          <div className="otp-resend-row">
            {countdown > 0
              ? <span>Resend OTP in <strong>{countdown}s</strong></span>
              : <button type="button" className="link-btn" onClick={handleSendOtp}>Resend OTP</button>
            }
            <button type="button" className="link-btn" onClick={() => { setScreen('pwd'); clearErr() }}>
              Use password instead
            </button>
          </div>
          <button type="submit" className="btn-primary w-full mt-1" disabled={otp.length < 6}>
            Verify & Sign In
          </button>
        </form>
      )}

      {/* ── STEP: PASSWORD (login) ──────────── */}
      {screen === 'pwd' && (
        <form className="modal-form" onSubmit={handlePwdLogin}>
          <button type="button" className="modal-back" onClick={() => { setScreen('otp'); clearErr() }}>← Back</button>
          <div className="modal-step-title">Enter Password</div>
          <p className="modal-step-sub">Mobile: <strong>+91 {fmt(phone)}</strong></p>
          {err && <div className="auth-msg error">{err}</div>}
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Your account password" value={pass}
              onChange={e => { setPass(e.target.value); clearErr() }} autoFocus required />
          </div>
          <button type="submit" className="btn-primary w-full mt-1" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In →'}
          </button>
          <div className="otp-resend-row" style={{justifyContent:'center', marginTop:'.5rem'}}>
            <button type="button" className="link-btn" onClick={handleSendOtp}>Login with OTP instead</button>
          </div>
        </form>
      )}

      {/* ── STEP: REGISTER (form) ───────────── */}
      {screen === 'register' && (
        <form className="modal-form" onSubmit={handleRegisterSubmit}>
          <button type="button" className="modal-back" onClick={() => { setScreen('phone'); clearErr() }}>← Back</button>
          <div className="modal-step-title">Create Your Account</div>
          <p className="modal-step-sub">New to ExpressScheme — let's set you up</p>
          {err && <div className="auth-msg error">{err}</div>}
          <div className="form-group">
            <label>Full Name *</label>
            <input type="text" placeholder="As per Aadhaar / official ID" value={name}
              onChange={e => { setName(e.target.value); clearErr() }} required autoFocus />
          </div>
          <div className="form-group">
            <label>Mobile Number *</label>
            <div className="phone-input-wrap disabled">
              <span className="phone-prefix">🇮🇳 +91</span>
              <input type="tel" value={fmt(phone)} readOnly style={{opacity:.7}} />
            </div>
            <span className="field-hint">Pre-filled from previous step</span>
          </div>
          <div className="form-row2">
            <div className="form-group">
              <label>Password *</label>
              <input type="password" placeholder="Min 8 characters" value={pass}
                onChange={e => { setPass(e.target.value); clearErr() }} required minLength={8} />
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <input type="password" placeholder="Repeat password" value={pass2}
                onChange={e => { setPass2(e.target.value); clearErr() }} required />
            </div>
          </div>
          <div className="form-group">
            <label>Aadhaar Number <span className="optional-tag">optional</span></label>
            <input type="text" placeholder="12-digit Aadhaar number" value={aadhaar}
              onChange={e => { setAadhaar(e.target.value.replace(/\D/g,'').slice(0,12)); clearErr() }}
              inputMode="numeric" maxLength={12} />
            {aadhaar.length > 0 && (
              <div className="aadhaar-preview">
                <span className="aadh-label">Stored as:</span>
                <span className="aadh-mask">{maskAadhaar(aadhaar)}</span>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Employment / Professional Status *</label>
            <select value={emp} onChange={e => { setEmp(e.target.value); clearErr() }}
              className="form-select" required>
              <option value="">— Select your current status —</option>
              {EMP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full mt-1" disabled={busy}>
            {busy ? 'Please wait…' : 'Verify Mobile & Create Account →'}
          </button>
        </form>
      )}

      {/* ── STEP: VERIFY (register OTP) ─────── */}
      {screen === 'verify' && (
        <form className="modal-form" onSubmit={handleCreateAccount}>
          <button type="button" className="modal-back" onClick={() => { setScreen('register'); clearErr() }}>← Back</button>
          <div className="modal-step-title">Verify Mobile Number</div>
          <p className="modal-step-sub">OTP sent to <strong>{maskedPhone}</strong></p>
          <div className="otp-sent-badge">📱 OTP sent to your mobile</div>
          {err && <div className="auth-msg error">{err}</div>}
          <div className="form-group" style={{alignItems:'center', gap:'.6rem'}}>
            <OtpBoxes value={otp} onChange={setOtp} />
          </div>
          {pendOtp && <p className="modal-note" style={{textAlign:'left'}}>Demo OTP: <strong style={{color:'var(--accent)'}}>{pendOtp}</strong></p>}
          <div className="otp-resend-row">
            {countdown > 0
              ? <span>Resend in <strong>{countdown}s</strong></span>
              : <button type="button" className="link-btn" onClick={() => {
                  const code = genOtp(); storePendingOtp(fmt(phone), code); setPendOtp(code); startCountdown(30); clearErr()
                }}>Resend OTP</button>
            }
          </div>
          <button type="submit" className="btn-primary w-full mt-1" disabled={otp.length < 6 || busy}>
            {busy ? 'Creating account…' : 'Verify & Create Account →'}
          </button>
        </form>
      )}

      {/* ── STEP: SUCCESS ───────────────────── */}
      {screen === 'success' && (
        <div className="auth-success-screen">
          <div className="auth-success-icon">✅</div>
          <div className="auth-success-title">Account Created!</div>
          <p className="auth-success-sub">Welcome, <strong>{name}</strong>. Redirecting to your dashboard…</p>
          <div className="auth-success-bar"><div className="auth-success-fill" /></div>
        </div>
      )}
    </>
  )
}

/* ─────────────────────────────────────────────
   Modal wrapper
───────────────────────────────────────────── */
export default function LoginModal({ role, onClose }) {
  const navigate = useNavigate()
  if (!role) return null
  const isGov = role === 'gov'

  const handleDone = (user) => {
    onClose()
    if (isGov) {
      navigate('/gov-dashboard')
    } else {
      if (user) sessionStorage.setItem('citizen_user', JSON.stringify(user))
      navigate('/user-dashboard')
    }
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box${isGov ? '' : ' modal-box--citizen'}`}>
        <button className="modal-close" onClick={onClose}>✕</button>
        {isGov
          ? <GovLogin    onDone={handleDone} />
          : <CitizenAuth onDone={handleDone} />
        }
      </div>
    </div>
  )
}
