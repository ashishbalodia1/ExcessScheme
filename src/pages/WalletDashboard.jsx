/**
 * WalletDashboard.jsx — Algorand TestNet Wallet Dashboard
 *
 * Features:
 *   • Connect / disconnect Pera Wallet (WalletConnect)
 *   • Auto-reconnect on page refresh
 *   • ALGO balance display
 *   • Recent 10 transactions
 *   • Owned ASAs + NFTs with metadata
 *   • Clear loading / error / empty states
 *   • "TestNet" badge — prevents MainNet confusion
 *
 * Security:
 *   • NEVER handles private keys or mnemonics
 *   • Address treated as public data only
 *   • All signing goes through Pera Wallet app
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import {
  connectWallet,
  disconnectWallet,
  reconnectWallet,
  loadAddress,
} from '../lib/perawallet'
import {
  getAccountInfo,
  getRecentTransactions,
  getEnrichedAssets,
  getNetworkStatus,
  shortAddr,
  microToAlgo,
  fmtDate,
} from '../lib/algorand'
import '../styles/wallet.css'
import {
  makePeraSigner,
  optInToApp,
  registerStudent,
  markMilestoneComplete,
  releasePayout,
  getGlobalState,
  getStudentState,
  isOptedIn,
  APP_ID,
} from '../lib/scholarship-contract'

// ─── Transaction type labels ─────────────────────────────────────────────────
const TX_LABELS = {
  pay:   { label: 'Payment',        icon: '💸', color: '#00e8c6' },
  axfer: { label: 'Asset Transfer', icon: '🪙', color: '#a78bfa' },
  appl:  { label: 'App Call',       icon: '⚙️',  color: '#fbbf24' },
  acfg:  { label: 'Asset Config',   icon: '🔧', color: '#f87171' },
  afrz:  { label: 'Asset Freeze',   icon: '🧊', color: '#60a5fa' },
  keyreg:{ label: 'Key Reg',        icon: '🔑', color: '#34d399' },
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WalletDashboard() {
  const navigate = useNavigate()

  // Connection state
  const [address,     setAddress]     = useState(null)
  const [isDemo,      setIsDemo]      = useState(false)   // true = view-only demo
  const [connecting,  setConnecting]  = useState(false)
  const [connError,   setConnError]   = useState(null)

  // Dashboard data
  const [account,     setAccount]     = useState(null)
  const [txns,        setTxns]        = useState([])
  const [assets,      setAssets]      = useState([])
  const [network,     setNetwork]     = useState(null)

  // Loading / error per panel
  const [loadingAcct, setLoadingAcct] = useState(false)
  const [loadingTxns, setLoadingTxns] = useState(false)
  const [loadingAsts, setLoadingAsts] = useState(false)
  const [acctError,   setAcctError]   = useState(null)
  const [txnsError,   setTxnsError]   = useState(null)

  // Active tab
  const [tab, setTab] = useState('overview')  // overview | transactions | assets | contract

  // ── Contract tab state ────────────────────────────────────────────────────
  const [contractGlobal,  setContractGlobal]  = useState(null)
  const [contractStudent, setContractStudent] = useState(null)
  const [contractLoading, setContractLoading] = useState(false)
  const [contractTx,      setContractTx]      = useState(null)   // last txID
  const [contractError,   setContractError]   = useState(null)
  const [contractAction,  setContractAction]  = useState(null)   // in-flight action label
  const [authorityInput,  setAuthorityInput]  = useState('')     // for admin calls
  const [studentInput,    setStudentInput]    = useState('')     // for admin calls

  // ── Copy address to clipboard ─────────────────────────────────────────────
  const [copied, setCopied] = useState(false)
  const copyAddress = () => {
    if (!address) return
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── Fetch all dashboard data for a given address ──────────────────────────
  const fetchData = useCallback(async (addr) => {
    // Account info
    setLoadingAcct(true)
    setAcctError(null)
    try {
      const info = await getAccountInfo(addr)
      setAccount(info)
    } catch (e) {
      setAcctError('Could not load account info. The address may not exist on TestNet yet.')
    } finally {
      setLoadingAcct(false)
    }

    // Transactions
    setLoadingTxns(true)
    setTxnsError(null)
    try {
      const txList = await getRecentTransactions(addr, 10)
      setTxns(txList)
    } catch (e) {
      setTxnsError('Could not load recent transactions.')
    } finally {
      setLoadingTxns(false)
    }

    // Network status (fire and forget)
    getNetworkStatus().then(setNetwork).catch(() => {})
  }, [])

  // ── Load contract state ────────────────────────────────────────────
  const loadContractState = useCallback(async (addr) => {
    setContractLoading(true)
    setContractError(null)
    try {
      const [global, student] = await Promise.all([
        getGlobalState(),
        getStudentState(addr),
      ])
      setContractGlobal(global)
      setContractStudent(student)
    } catch (e) {
      setContractError(e.message ?? 'Failed to load contract state')
    } finally {
      setContractLoading(false)
    }
  }, [])

  // Auto-refresh contract state when switching to the contract tab
  useEffect(() => {
    if (tab === 'contract' && address) loadContractState(address)
  }, [tab, address, loadContractState])

  // ── Contract action runner ───────────────────────────────────────
  const runContractAction = async (label, fn) => {
    setContractAction(label)
    setContractError(null)
    setContractTx(null)
    try {
      const signer = makePeraSigner(address)
      const result = await fn(signer)
      setContractTx(result.txID)
      // Refresh state after action
      await loadContractState(address)
    } catch (e) {
      setContractError(
        e?.message?.includes('rejected')
          ? 'Transaction rejected in Pera Wallet.'
          : (e?.message ?? 'Transaction failed')
      )
    } finally {
      setContractAction(null)
    }
  }

  // Fetch enriched assets when account data arrives
  useEffect(() => {
    if (!account || !account.assets || account.assets.length === 0) {
      setAssets([])
      return
    }
    setLoadingAsts(true)
    getEnrichedAssets(account.assets)
      .then(setAssets)
      .catch(() => setAssets([]))
      .finally(() => setLoadingAsts(false))
  }, [account])

  // ── On mount: try to restore existing WalletConnect session ────────────────
  useEffect(() => {
    async function init() {
      try {
        const addr = await reconnectWallet()
        if (addr) {
          setAddress(addr)
          setIsDemo(false)
          fetchData(addr)
        }
        // No session → address stays null → connect screen shown
      } catch { /* no prior session */ }
    }
    init()
  }, [fetchData])

  // ── Connect wallet ────────────────────────────────────────────────────────
  async function handleConnect() {
    setConnecting(true)
    setConnError(null)
    try {
      const addr = await connectWallet()
      setAddress(addr)
      setIsDemo(false)
      fetchData(addr)
    } catch (e) {
      // USER_REJECTED_REQUEST or similar
      if (e?.message?.includes('rejected') || e?.message?.includes('cancel')) {
        setConnError('Connection cancelled. Open Pera Wallet and try again.')
      } else if (e?.message?.includes('No accounts')) {
        setConnError('No accounts found. Make sure Pera Wallet is unlocked.')
      } else {
        setConnError(e?.message ?? 'Connection failed. Is Pera Wallet installed?')
      }
    } finally {
      setConnecting(false)
    }
  }

  // ── Disconnect wallet ────────────────────────────────────────────────────
  async function handleDisconnect() {
    await disconnectWallet()
    setAddress(null)
    setIsDemo(false)
    setAccount(null)
    setTxns([])
    setAssets([])
    setAcctError(null)
    setTxnsError(null)
  }

  // ── Refresh data ──────────────────────────────────────────────────────────
  function handleRefresh() {
    if (address) fetchData(address)
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="wd-root">

      {/* ── Navbar ────────────────────────────────────── */}
      <nav className="wd-nav">
        <div className="wd-nav-inner">
          <div className="wd-nav-brand" onClick={() => navigate('/')}>
            <span>⚡</span> ExpressScheme
          </div>
          <div className="wd-nav-right">
            <span className="wd-testnet-badge">TESTNET</span>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="wd-container">

        {/* ── Page header ───────────────────────────── */}
        <div className="wd-header">
          <div>
            <h1 className="wd-title">
              <span className="wd-title-icon">◎</span> Algorand Wallet
            </h1>
            <p className="wd-subtitle">
              {address
                ? 'Connected via Pera Wallet · Algorand TestNet'
                : 'Connect your Pera Wallet to view your TestNet account'}
            </p>
          </div>
          <div className="wd-header-actions">
            {address ? (
              <>
                <button className="wd-btn wd-btn-ghost" onClick={handleDisconnect}>⏏ Disconnect</button>
                <button className="wd-btn wd-btn-ghost" onClick={handleRefresh} title="Refresh">↺</button>
              </>
            ) : (
              <button className="wd-btn wd-btn-primary" onClick={handleConnect} disabled={connecting}>
                {connecting ? <><span className="wd-spinner" /> Connecting…</> : '🔗 Connect Pera Wallet'}
              </button>
            )}
          </div>
        </div>

        {/* ── Connection error banner ─────────────────── */}
        {connError && (
          <div className="wd-error-banner">
            ⚠ {connError}
            <button onClick={() => setConnError(null)}>✕</button>
          </div>
        )}

        {/* ── Not connected: big connect screen ────────────────── */}
        {!address && (
          <div className="wd-connect-screen">
            <div className="wd-connect-orb">◎</div>
            <h2 className="wd-connect-title">Connect your Algorand Wallet</h2>
            <p className="wd-connect-sub">
              Use Pera Wallet on TestNet to view your ALGO balance,
              recent transactions, and owned assets.
            </p>
            <button
              className="wd-btn wd-btn-primary wd-btn-lg"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting
                ? <><span className="wd-spinner" /> Waiting for Pera Wallet…</>
                : '🔗 Connect Pera Wallet'
              }
            </button>
            <div className="wd-connect-steps">
              <div className="wd-step"><span>1</span>Open Pera Wallet on your phone</div>
              <div className="wd-step"><span>2</span>Scan the QR code or approve the deep-link</div>
              <div className="wd-step"><span>3</span>Your TestNet data loads automatically</div>
            </div>
            <a className="wd-faucet-link" href="https://bank.testnet.algorand.network/" target="_blank" rel="noreferrer">
              🚰 Need TestNet ALGO? Use the faucet →
            </a>
          </div>
        )}

        {/* ── Address card (only when connected) ──────────────── */}
        {address && (
          <div className="wd-address-card">
            <div className="wd-address-left">
              <div className="wd-avatar">{address.slice(0, 2)}</div>
              <div>
                <div className="wd-address-label">Wallet Address</div>
                <div className="wd-address-full"><code title={address}>{address}</code></div>
                <div className="wd-address-short">{shortAddr(address)}</div>
              </div>
            </div>
            <div className="wd-address-right">
              <button className="wd-copy-btn" onClick={copyAddress}>
                {copied ? '✓ Copied' : '⎘ Copy'}
              </button>
              {network?.lastRound && (
                <div className="wd-block-info">Block <strong>#{network.lastRound.toLocaleString()}</strong></div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab navigation (only when connected) ────────────── */}
        {address && (
        <div className="wd-tabs">
          {[
            { id: 'overview',     label: '◈ Overview'     },
            { id: 'transactions', label: '⇄ Transactions' },
            { id: 'assets',       label: '🪙 Assets'       },
            { id: 'contract',     label: '⛓️ Contract'     },
          ].map(t => (
            <button
              key={t.id}
              className={`wd-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        )}

        {/* ══════════════════════════════════════════════
            TABS — only shown when wallet is connected
        ══════════════════════════════════════════════ */}
        {address && tab === 'overview' && (
          <div className="wd-overview">

            {/* ALGO Balance card */}
            <div className="wd-stat-card wd-stat-algo">
              <div className="wd-stat-label">ALGO Balance</div>
              {loadingAcct ? (
                <div className="wd-skeleton wd-skeleton-lg" />
              ) : acctError ? (
                <div className="wd-stat-error">—</div>
              ) : (
                <>
                  <div className="wd-stat-value">
                    {account?.balance ?? '0.0000'}
                    <span className="wd-stat-unit">ALGO</span>
                  </div>
                  <div className="wd-stat-sub">
                    Min balance: {account?.minBalance ?? '0'} ALGO
                  </div>
                </>
              )}
            </div>

            {/* Asset count card */}
            <div className="wd-stat-card">
              <div className="wd-stat-label">Assets (ASA / NFT)</div>
              {loadingAcct ? (
                <div className="wd-skeleton wd-skeleton-lg" />
              ) : (
                <>
                  <div className="wd-stat-value">
                    {account?.assets?.length ?? 0}
                    <span className="wd-stat-unit">held</span>
                  </div>
                  <div className="wd-stat-sub">
                    NFTs: {assets.filter(a => a.isNFT).length}
                  </div>
                </>
              )}
            </div>

            {/* Transaction count card */}
            <div className="wd-stat-card">
              <div className="wd-stat-label">Recent Txns</div>
              {loadingTxns ? (
                <div className="wd-skeleton wd-skeleton-lg" />
              ) : (
                <>
                  <div className="wd-stat-value">
                    {txns.length}
                    <span className="wd-stat-unit">loaded</span>
                  </div>
                  <div className="wd-stat-sub">Last 10 on TestNet</div>
                </>
              )}
            </div>

            {/* Status card */}
            <div className="wd-stat-card">
              <div className="wd-stat-label">Node Status</div>
              <div className="wd-stat-value wd-stat-status">
                <span className="wd-online-dot" /> Online
              </div>
              <div className="wd-stat-sub">AlgoNode TestNet</div>
            </div>

            {acctError && (
              <div className="wd-panel-error" style={{ gridColumn:'1/-1' }}>
                ⚠ {acctError}
              </div>
            )}

            {/* Latest 3 transactions preview */}
            {txns.length > 0 && (
              <div className="wd-preview-panel" style={{ gridColumn:'1/-1' }}>
                <div className="wd-panel-header">
                  Recent Activity
                  <button className="wd-see-all" onClick={() => setTab('transactions')}>
                    See all →
                  </button>
                </div>
                {txns.slice(0, 3).map(tx => (
                  <TxnRow key={tx.id} tx={tx} myAddress={address} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: TRANSACTIONS
        ══════════════════════════════════════════════ */}
        {address && tab === 'transactions' && (
          <div className="wd-panel">
            <div className="wd-panel-header">
              Last 10 Transactions
              <span className="wd-panel-count">{txns.length}</span>
            </div>

            {loadingTxns && (
              <>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="wd-skeleton wd-skeleton-row" />
                ))}
              </>
            )}

            {!loadingTxns && txnsError && (
              <div className="wd-panel-error">{txnsError}</div>
            )}

            {!loadingTxns && !txnsError && txns.length === 0 && (
              <div className="wd-empty">
                <span className="wd-empty-icon">⇄</span>
                <p>No transactions found for this address on TestNet.</p>
                <small>Use the <a href="https://bank.testnet.algorand.network/" target="_blank" rel="noreferrer">TestNet Faucet</a> to fund your wallet.</small>
              </div>
            )}

            {!loadingTxns && txns.map(tx => (
              <TxnRow key={tx.id} tx={tx} myAddress={address} />
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: ASSETS
        ══════════════════════════════════════════════ */}
        {address && tab === 'assets' && (
          <div className="wd-panel">
            <div className="wd-panel-header">
              Held Assets
              <span className="wd-panel-count">{assets.length}</span>
            </div>

            {(loadingAcct || loadingAsts) && (
              <>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="wd-skeleton wd-skeleton-row" />
                ))}
              </>
            )}

            {!loadingAcct && !loadingAsts && assets.length === 0 && (
              <div className="wd-empty">
                <span className="wd-empty-icon">🪙</span>
                <p>No ASAs or NFTs found for this address.</p>
                <small>Opt-in to an asset on TestNet to see it here.</small>
              </div>
            )}

            {!loadingAcct && !loadingAsts && assets.map(ast => (
              <AssetRow key={ast.assetId} asset={ast} />
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════════
            CONTRACT TAB
        ════════════════════════════════════════════ */}
        {address && tab === 'contract' && (
          <div className="wd-panel wd-contract-panel">
            <div className="wd-panel-header">
              ⛓️ ScholarshipTreasury
              <span className="wd-panel-count" style={{ fontSize:'.75rem', fontWeight:400 }}>App #{APP_ID}</span>
              <button
                className="wd-btn-sm"
                onClick={() => loadContractState(address)}
                disabled={contractLoading}
                style={{ marginLeft:'auto' }}
              >
                {contractLoading ? '↻ Refreshing…' : '↻ Refresh'}
              </button>
            </div>

            {/* TX success banner */}
            {contractTx && (
              <div className="wd-contract-success">
                ✅ Transaction confirmed!  
                <a
                  href={`https://testnet.algoexplorer.io/tx/${contractTx}`}
                  target="_blank" rel="noreferrer"
                >
                  View on AlgoExplorer ↗
                </a>
              </div>
            )}

            {/* Error banner */}
            {contractError && (
              <div className="wd-contract-error">❌ {contractError}</div>
            )}

            {/* Global state */}
            {contractGlobal && (
              <div className="wd-contract-section">
                <div className="wd-contract-section-title">Scheme (Global State)</div>
                <div className="wd-contract-grid">
                  <div className="wd-cg-card">
                    <span className="wd-cg-label">Status</span>
                    <span className={`wd-cg-val ${contractGlobal.schemeActive ? 'wd-cg-active' : 'wd-cg-inactive'}`}>
                      {contractGlobal.schemeActive ? '● Active' : '● Inactive'}
                    </span>
                  </div>
                  <div className="wd-cg-card">
                    <span className="wd-cg-label">Payout / Student</span>
                    <span className="wd-cg-val">
                      {contractGlobal.payoutAmount
                        ? (Number(contractGlobal.payoutAmount) / 1e6).toFixed(4)
                        : '—'} ALGO
                    </span>
                  </div>
                  <div className="wd-cg-card">
                    <span className="wd-cg-label">Spent Budget</span>
                    <span className="wd-cg-val">
                      {contractGlobal.spentBudget !== null
                        ? (Number(contractGlobal.spentBudget) / 1e6).toFixed(4)
                        : '—'} ALGO
                    </span>
                  </div>
                  <div className="wd-cg-card">
                    <span className="wd-cg-label">Total Budget</span>
                    <span className="wd-cg-val">
                      {contractGlobal.totalBudget !== null
                        ? (Number(contractGlobal.totalBudget) / 1e6).toFixed(4)
                        : '—'} ALGO
                    </span>
                  </div>
                </div>
                {contractGlobal.authority && (
                  <div className="wd-cg-authority">
                    🛡️ Authority: <code>{contractGlobal.authority}</code>
                  </div>
                )}
              </div>
            )}

            {/* Student local state */}
            <div className="wd-contract-section">
              <div className="wd-contract-section-title">Your Student Status</div>
              {contractStudent === null ? (
                <div className="wd-contract-not-opted">
                  Not opted in — opt in below to participate.
                </div>
              ) : (
                <div className="wd-contract-status-row">
                  <span className={`wd-cs-badge ${contractStudent.isRegistered ? 'wd-cs-ok' : 'wd-cs-no'}`}>
                    {contractStudent.isRegistered ? '✔ Registered' : '✗ Not Registered'}
                  </span>
                  <span className={`wd-cs-badge ${contractStudent.milestoneCompleted ? 'wd-cs-ok' : 'wd-cs-no'}`}>
                    {contractStudent.milestoneCompleted ? '✔ Milestone Done' : '✗ Milestone Pending'}
                  </span>
                  <span className={`wd-cs-badge ${contractStudent.hasBeenPaid ? 'wd-cs-ok' : 'wd-cs-no'}`}>
                    {contractStudent.hasBeenPaid ? '✔ Paid' : '✗ Not Yet Paid'}
                  </span>
                </div>
              )}
            </div>

            {/* ─ Student actions ───────────────────────────── */}
            <div className="wd-contract-section">
              <div className="wd-contract-section-title">Student Actions</div>
              <div className="wd-contract-actions">

                {/* OPT IN */}
                {contractStudent === null ? (
                  <button
                    className="wd-contract-btn"
                    disabled={!!contractAction}
                    onClick={() => runContractAction('Opting in…', (signer) =>
                      optInToApp(address, signer)
                    )}
                  >
                    {contractAction === 'Opting in…' ? contractAction : '🔐 Opt In to App'}
                  </button>
                ) : (
                  <button className="wd-contract-btn wd-contract-btn-done" disabled>
                    ✔ Opted In
                  </button>
                )}

                {/* REGISTER STUDENT */}
                <button
                  className="wd-contract-btn"
                  disabled={!!contractAction || contractStudent === null || contractStudent?.isRegistered}
                  onClick={() => runContractAction('Registering…', (signer) =>
                    registerStudent(address, signer)
                  )}
                >
                  {contractAction === 'Registering…'
                    ? contractAction
                    : contractStudent?.isRegistered
                    ? '✔ Registered'
                    : '📝 Register as Student'}
                </button>

              </div>
            </div>

            {/* ─ Authority actions ─────────────────────────── */}
            <div className="wd-contract-section">
              <div className="wd-contract-section-title">
                Authority Actions
                <span className="wd-contract-auth-note">
                  (only the authority wallet can sign these)
                </span>
              </div>

              <label className="wd-contract-label">Student Address</label>
              <input
                className="wd-contract-input"
                placeholder="ALGOTESTSTUDENTADDRESS…"
                value={studentInput}
                onChange={e => setStudentInput(e.target.value)}
              />

              <div className="wd-contract-actions">

                {/* MARK MILESTONE */}
                <button
                  className="wd-contract-btn"
                  disabled={!!contractAction || !studentInput.trim()}
                  onClick={() => runContractAction('Marking milestone…', (signer) =>
                    markMilestoneComplete(address, studentInput.trim(), signer)
                  )}
                >
                  {contractAction === 'Marking milestone…'
                    ? contractAction
                    : '✅ Mark Milestone Complete'}
                </button>

                {/* RELEASE PAYOUT */}
                <button
                  className="wd-contract-btn wd-contract-btn-payout"
                  disabled={!!contractAction || !studentInput.trim()}
                  onClick={() => runContractAction('Releasing payout…', (signer) =>
                    releasePayout(address, studentInput.trim(), signer)
                  )}
                >
                  {contractAction === 'Releasing payout…'
                    ? contractAction
                    : '💸 Release Payout (Inner Txn)'}
                </button>

              </div>
              <p className="wd-contract-note">
                Payout is sent by the <strong>contract’s inner transaction</strong>.
                Your wallet sends <strong>0 ALGO directly</strong> — only an App Call.
              </p>
            </div>
          </div>
        )}
        <div className="wd-footer">
          <span className="wd-testnet-badge">TESTNET</span>
          Data from{' '}
          <a href="https://algonode.io" target="_blank" rel="noreferrer">AlgoNode</a>
          {' · '}
          <a href="https://bank.testnet.algorand.network/" target="_blank" rel="noreferrer">
            Get TestNet ALGO →
          </a>
          {' · '}
          <a href="https://testnet.algoexplorer.io" target="_blank" rel="noreferrer">
            AlgoExplorer
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Single transaction row */
function TxnRow({ tx, myAddress }) {
  const meta    = TX_LABELS[tx.type] ?? { label: tx.type, icon: '◈', color: '#9ca3af' }
  const isOutbound = tx.sender === myAddress
  const counterparty = tx.receiver ?? tx.assetRcv ?? '—'

  return (
    <div className="wd-txn-row">
      <div className="wd-txn-icon" style={{ color: meta.color }}>{meta.icon}</div>
      <div className="wd-txn-info">
        <div className="wd-txn-type">{meta.label}</div>
        <div className="wd-txn-parties">
          {isOutbound
            ? <>To: <code>{shortAddr(counterparty)}</code></>
            : <>From: <code>{shortAddr(tx.sender)}</code></>}
        </div>
        <div className="wd-txn-date">{fmtDate(tx.roundTime)}</div>
      </div>
      <div className="wd-txn-amount">
        {tx.type === 'pay' ? (
          <span className={isOutbound ? 'wd-neg' : 'wd-pos'}>
            {isOutbound ? '−' : '+'}{microToAlgo(tx.amount)} ALGO
          </span>
        ) : tx.type === 'axfer' && tx.assetId ? (
          <span className="wd-asset-amt">
            {tx.assetAmt} <small>ASA#{tx.assetId}</small>
          </span>
        ) : (
          <span className="wd-neutral">—</span>
        )}
        <div className="wd-txn-fee">fee: {microToAlgo(tx.fee)} ALGO</div>
        <a
          className="wd-txn-link"
          href={`https://testnet.algoexplorer.io/tx/${tx.id}`}
          target="_blank"
          rel="noreferrer"
        >
          View ↗
        </a>
      </div>
    </div>
  )
}

/** Single asset row */
function AssetRow({ asset }) {
  return (
    <div className="wd-asset-row">
      <div className="wd-asset-icon">
        {asset.isNFT ? '🖼' : '🪙'}
      </div>
      <div className="wd-asset-info">
        <div className="wd-asset-name">
          {asset.name}
          {asset.isNFT && <span className="wd-nft-badge">NFT</span>}
        </div>
        <div className="wd-asset-meta">
          Unit: <strong>{asset.unitName}</strong>
          {' · '}
          ID: <a
            href={`https://testnet.algoexplorer.io/asset/${asset.assetId}`}
            target="_blank"
            rel="noreferrer"
          >
            #{asset.assetId}
          </a>
          {asset.url && (
            <>{' · '}<a href={asset.url} target="_blank" rel="noreferrer" className="wd-asset-url">🔗 Metadata</a></>
          )}
        </div>
      </div>
      <div className="wd-asset-balance">
        <div className="wd-asset-amount">{asset.displayAmount.toLocaleString()}</div>
        <div className="wd-asset-unit">{asset.unitName}</div>
        {asset.frozen && <div className="wd-frozen-badge">🧊 Frozen</div>}
      </div>
    </div>
  )
}
