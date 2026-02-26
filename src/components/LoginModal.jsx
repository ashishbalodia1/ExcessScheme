import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const EMPLOYMENT_OPTIONS = [
  { value: 'student',          label: '🎓 Student' },
  { value: 'employed_govt',    label: '🏛️ Employed – Government' },
  { value: 'employed_private', label: '🏢 Employed – Private Sector' },
  { value: 'self_employed',    label: '💼 Self-employed / Business' },
  { value: 'farmer',           label: '🌾 Farmer / Agricultural Worker' },
  { value: 'unemployed',       label: '🔍 Unemployed / Job-seeker' },
  { value: 'homemaker',        label: '🏠 Homemaker' },
  { value: 'retired',          label: '🧓 Retired' },
  { value: 'other',            label: '✳️ Other' },
]

function maskAadhaar(value) {
  const digits = value.replace(/\D/g, '').slice(0, 12)
  if (!digits) return 'XXXX XXXX XXXX ####'
  const padded = digits.padEnd(12, '#')
  const parts = [padded.slice(0,4), padded.slice(4,8), padded.slice(8,12)]
  return parts.map((p, i) => i < 2 ? p.replace(/[0-9]/g, 'X') : p).join(' ')
}

async function apiCall(path, body) {
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return r.json()
}

// ── Gov login ─────────────────────────────────────────────────────────
function GovLogin({ onDone }) {
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  return (
    <>
      <div className="modal-logo"><span>⚡</span> ExpressScheme</div>
      <div className="modal-title">Officer Login</div>
      <div className="modal-sub">Access the Government Control Panel</div>
      <form className="modal-form" onSubmit={e => { e.preventDefault(); onDone() }}>
        <div className="form-group">
          <label>Officer ID / Email</label>
          <input type="email" placeholder="officer@gov.in" value={email}
            onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" placeholder="Enter password" value={pass}
            onChange={e => setPass(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary w-full">🏛️ Enter Gov Portal</button>
      </form>
      <p className="modal-note">Demo: any email / password works</p>
    </>
  )
}

// ── Citizen portal ────────────────────────────────────────────────────
function CitizenAuth({ onDone }) {
  const [view,     setView]     = useState('login')
  const [loginTab, setLoginTab] = useState('password')

  // Register fields
  const [regName,    setRegName]    = useState('')
  const [regPhone,   setRegPhone]   = useState('')
  const [regPass,    setRegPass]    = useState('')
  const [regPass2,   setRegPass2]   = useState('')
  const [regAadhaar, setRegAadhaar] = useState('')
  const [regEmp,     setRegEmp]     = useState('')

  // Login fields
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPass,  setLoginPass]  = useState('')
  const [otp,        setOtp]        = useState('')
  const [otpSent,    setOtpSent]    = useState(false)
  const [demoOtp,    setDemoOtp]    = useState('')
  const [countdown,  setCountdown]  = useState(0)
  const timerRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')
  const [success, setSuccess] = useState('')

  const reset = () => { setErr(''); setSuccess('') }

  useEffect(() => {
    if (countdown <= 0) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [countdown])

  const handleRegister = async (e) => {
    e.preventDefault(); reset()
    if (regPass !== regPass2) { setErr('Passwords do not match'); return }
    if (regPhone.replace(/\D/g,'').length < 10) { setErr('Enter a valid 10-digit phone number'); return }
    if (regAadhaar && regAadhaar.replace(/\D/g,'').length !== 12) { setErr('Aadhaar must be 12 digits (or leave blank)'); return }
    setLoading(true)
    const res = await apiCall('/api/auth/register', {
      name: regName.trim(), phone: regPhone.replace(/\D/g,''),
      password: regPass, aadhaar: regAadhaar.replace(/\D/g,'') || null,
      employment: regEmp || 'not_specified',
    })
    setLoading(false)
    if (res.error) { setErr(res.error); return }
    setSuccess('Account created! You can now log in.')
    setTimeout(() => { setView('login'); setSuccess('') }, 2000)
  }

  const handleLoginPass = async (e) => {
    e.preventDefault(); reset()
    setLoading(true)
    const res = await apiCall('/api/auth/login', { phone: loginPhone.replace(/\D/g,''), password: loginPass })
    setLoading(false)
    if (res.error) { setErr(res.error); return }
    onDone(res.data)
  }

  const handleSendOtp = async () => {
    reset()
    if (loginPhone.replace(/\D/g,'').length < 10) { setErr('Enter a valid 10-digit phone number'); return }
    setLoading(true)
    const res = await apiCall('/api/auth/send-otp', { phone: loginPhone.replace(/\D/g,'') })
    setLoading(false)
    if (res.error) { setErr(res.error); return }
    setOtpSent(true); setCountdown(30)
    if (res.data?.demo_otp) setDemoOtp(res.data.demo_otp)
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault(); reset()
    setLoading(true)
    const res = await apiCall('/api/auth/verify-otp', { phone: loginPhone.replace(/\D/g,''), otp })
    setLoading(false)
    if (res.error) { setErr(res.error); return }
    onDone(res.data)
  }

  return (
    <>
      <div className="modal-logo"><span>⚡</span> ExpressScheme</div>

      <div className="modal-auth-tabs">
        <button className={view === 'login'    ? 'active' : ''} onClick={() => { setView('login');    reset() }}>Sign In</button>
        <button className={view === 'register' ? 'active' : ''} onClick={() => { setView('register'); reset() }}>New Account</button>
      </div>

      {/* ── REGISTER ── */}
      {view === 'register' && (
        <>
          <p className="modal-sub" style={{marginBottom:'1rem'}}>Create your citizen account</p>
          {err     && <div className="auth-msg error">{err}</div>}
          {success && <div className="auth-msg success">{success}</div>}
          <form className="modal-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" placeholder="Ramesh Kumar" value={regName}
                onChange={e => setRegName(e.target.value)} required />
            </div>
            <div className="form-row2">
              <div className="form-group">
                <label>Mobile Number *</label>
                <input type="tel" placeholder="98XXXXXXXX" value={regPhone}
                  onChange={e => setRegPhone(e.target.value)} required />
              </div>
            </div>
            <div className="form-row2">
              <div className="form-group">
                <label>Password *</label>
                <input type="password" placeholder="Min 8 chars" value={regPass}
                  onChange={e => setRegPass(e.target.value)} required minLength={8} />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input type="password" placeholder="Repeat" value={regPass2}
                  onChange={e => setRegPass2(e.target.value)} required minLength={8} />
              </div>
            </div>
            <div className="form-group">
              <label>Aadhaar Number <span className="optional-tag">optional</span></label>
              <input type="text" placeholder="Enter 12-digit Aadhaar" value={regAadhaar}
                onChange={e => setRegAadhaar(e.target.value.replace(/\D/g,'').slice(0,12))}
                inputMode="numeric" maxLength={12} />
              <div className="aadhaar-preview">{maskAadhaar(regAadhaar)}</div>
            </div>
            <div className="form-group">
              <label>Employment / Professional Status *</label>
              <select value={regEmp} onChange={e => setRegEmp(e.target.value)}
                className="form-select" required>
                <option value="">— Select your status —</option>
                {EMPLOYMENT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? '⏳ Creating account…' : '✅ Create Account'}
            </button>
          </form>
        </>
      )}

      {/* ── LOGIN ── */}
      {view === 'login' && (
        <>
          <p className="modal-sub" style={{marginBottom:'1rem'}}>Login to your citizen portal</p>
          <div className="modal-login-tabs">
            <button className={loginTab === 'password' ? 'active' : ''} onClick={() => { setLoginTab('password'); reset() }}>🔑 Password</button>
            <button className={loginTab === 'otp'      ? 'active' : ''} onClick={() => { setLoginTab('otp'); reset() }}>📱 OTP</button>
          </div>
          {err     && <div className="auth-msg error">{err}</div>}
          {success && <div className="auth-msg success">{success}</div>}

          {loginTab === 'password' && (
            <form className="modal-form" onSubmit={handleLoginPass}>
              <div className="form-group">
                <label>Mobile Number</label>
                <input type="tel" placeholder="98XXXXXXXX" value={loginPhone}
                  onChange={e => setLoginPhone(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="Your password" value={loginPass}
                  onChange={e => setLoginPass(e.target.value)} required />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? '⏳ Signing in…' : '🚀 Login'}
              </button>
            </form>
          )}

          {loginTab === 'otp' && (
            <form className="modal-form" onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label>Mobile Number</label>
                <div className="otp-phone-row">
                  <input type="tel" placeholder="98XXXXXXXX" value={loginPhone}
                    onChange={e => { setLoginPhone(e.target.value); setOtpSent(false); setOtp('') }}
                    required />
                  <button type="button" className="btn-otp-send"
                    onClick={handleSendOtp}
                    disabled={loading || countdown > 0}>
                    {loading && !otpSent ? '⏳' : countdown > 0 ? `${countdown}s` : otpSent ? '🔄 Resend' : 'Send OTP'}
                  </button>
                </div>
              </div>
              {otpSent && (
                <div className="form-group">
                  <label>Enter 6-digit OTP</label>
                  <input type="text" placeholder="_ _ _ _ _ _" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                    inputMode="numeric" maxLength={6} required
                    style={{letterSpacing:'0.4em', textAlign:'center', fontSize:'1.3rem'}} />
                  {demoOtp && <p className="modal-note" style={{textAlign:'left',marginTop:'.3rem'}}>Demo OTP: <strong>{demoOtp}</strong></p>}
                </div>
              )}
              <button type="submit" className="btn-primary w-full" disabled={loading || !otpSent}>
                {loading ? '⏳ Verifying…' : '✅ Verify & Login'}
              </button>
            </form>
          )}
        </>
      )}
    </>
  )
}

// ── Modal wrapper ─────────────────────────────────────────────────────
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
