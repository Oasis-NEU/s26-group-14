import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useSemester } from '../hooks/useSemester'
import { useBudgetCalc } from '../hooks/useBudgetCalc'
import Chart from './Chart'
import Suggestions from './Suggestions'

export default function Dashboard({ session }) {
  const { semester, entries, loading, createSemester, addEntry, deleteEntry, archiveSemester, restoreSemester } = useSemester(session.user.id)
  const calc = useBudgetCalc(semester, entries)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [archiveRefresh, setArchiveRefresh] = useState(0)

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loading) return <p style={{ padding: '2rem', color: 'var(--text-dim)' }}>Loading...</p>

  return (
    <div className="container">

      {drawerOpen && <div className="drawer-overlay open" onClick={() => setDrawerOpen(false)} />}

      <div className={`drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-title">Semester Settings</div>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>
        </div>
        <div className="drawer-body">

          <div className="drawer-section">
            <div className="drawer-section-title">Configuration</div>
            <p className="drawer-note">
              Set your semester dates and starting balance.
              {semester && ' Saving new settings will start a fresh semester — archive first if you want to keep current entries.'}
            </p>
            <SemesterConfig onSubmit={createSemester} current={semester} onClose={() => setDrawerOpen(false)} />
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">Danger Zone</div>
            <p className="drawer-note">Clears current entries and settings. Archived semesters are preserved.</p>
            <ClearData userId={session.user.id} />
          </div>

          <div className="drawer-section">
            <div className="drawer-section-title">Semester Archive</div>
            <p className="drawer-note">Use the Archive bar on the main page to save the current semester.</p>
            <ArchiveList
              userId={session.user.id}
              refresh={archiveRefresh}
              onRestore={async (id) => {
                if (semester) {
                  const ok = window.confirm('Restoring this semester will clear your current entries. Continue?')
                  if (!ok) return
                }
                await restoreSemester(id)
                setDrawerOpen(false)
              }}
              onDelete={() => setArchiveRefresh(r => r + 1)}
            />
          </div>

        </div>
      </div>

      {/* Header */}
      <div className="header">
        <div className="header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.2rem' }}>
            <img src="/logo.png" alt="HowlMuch" style={{ height: '40px', width: 'auto' }} />
            <h1>HowlMuch</h1>
          </div>
          <div className="ticker-bar">
            <span className="ticker-sym">
              {semester ? `${semester.name} · ${semester.start_date.slice(0,4)}` : 'Not configured'}
            </span>
            {calc && (
              <span className={`ticker-change ${calc.isUnder ? 'up' : 'down'}`}>
                {calc.isUnder
                  ? `▲ $${calc.diff.toFixed(2)} under`
                  : `▼ $${Math.abs(calc.diff).toFixed(2)} over`}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="burger-btn" onClick={() => setDrawerOpen(true)} title="Settings">
            <span /><span /><span />
          </button>
          <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
        </div>
      </div>

      {/* Setup banner */}
      {!semester && (
        <div className="setup-banner">
          <div style={{ flex: 1 }}>
            <div className="setup-banner-title">Welcome! Configure your semester to get started.</div>
            <div className="setup-banner-desc">
              Open the <strong>≡ menu</strong> top right, enter your dates and budget, then hit Apply.
            </div>
          </div>
          <button className="btn-blue" onClick={() => setDrawerOpen(true)}>Open Settings →</button>
        </div>
      )}

      {semester && calc && (
        <>
          <LogForm onSubmit={addEntry} />

          <ArchiveRow
            semester={semester}
            onArchive={async (name) => {
              await archiveSemester(name)
              setArchiveRefresh(r => r + 1)
            }}
          />

          <div className="stats">
            <div className="stat">
              <div className="stat-label">Starting Budget</div>
              <div className="stat-value neutral">${parseFloat(semester.budget).toFixed(2)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Current Balance</div>
              <div className={`stat-value ${calc.balance >= 0 ? 'up' : 'down'}`}>
                ${calc.balance.toFixed(2)}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">Total Spent</div>
              <div className="stat-value down">${calc.totalSpent.toFixed(2)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Days Left</div>
              <div className="stat-value dim">{calc.daysLeft}</div>
            </div>
            <div className={`verdict ${calc.isUnder ? 'good' : 'bad'}`} style={{ gridColumn: '1/-1' }}>
              <div className="verdict-badge">
                {calc.isUnder ? 'UNDER BUDGET ✓' : 'OVER BUDGET'}
              </div>
              <div className="verdict-text">
                {calc.isUnder
                  ? <span>Spent <strong>${calc.diff.toFixed(2)} less than expected</strong>. Target: ${calc.expToday.toFixed(2)} · Actual: ${calc.balance.toFixed(2)}</span>
                  : <span>Spent <strong>${Math.abs(calc.diff).toFixed(2)} more than expected</strong>. Target: ${calc.expToday.toFixed(2)} · Actual: ${calc.balance.toFixed(2)}</span>
                }
              </div>
            </div>
          </div>

          <div className="chart-log-grid">
            <Chart calc={calc} semester={semester} />
            <div className="mini-log">
              <div className="mini-log-title">Transaction Log</div>
              <div className="mini-entry-list">
                {entries.length === 0
                  ? <div className="empty-state">No entries yet.</div>
                  : [...entries].reverse().map(e => (
                      <div key={e.id} className="mini-entry-item">
                        <span className="mini-entry-date">{e.date}</span>
                        <span className="mini-entry-label">{e.label || '—'}</span>
                        <span className="mini-entry-amount">-${parseFloat(e.amount).toFixed(2)}</span>
                        <button className="mini-entry-del" onClick={() => deleteEntry(e.id)}>✕</button>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>

          <Suggestions calc={calc} session={session} />
        </>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

function LogForm({ onSubmit }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0,10))
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [msg, setMsg] = useState({ text: '', type: '' })

  async function handleSubmit(e) {
    e.preventDefault()
    const { error } = await onSubmit(date, parseFloat(amount), label)
    if (error) { setMsg({ text: 'Error: ' + error.message, type: 'err' }); return }
    setAmount('')
    setLabel('')
    setMsg({ text: `Added $${parseFloat(amount).toFixed(2)}`, type: 'ok' })
    setTimeout(() => setMsg({ text: '', type: '' }), 2000)
  }

  return (
    <div className="panel" style={{ marginBottom: '1.2rem' }}>
      <div className="panel-title">Log Spending</div>
      <form onSubmit={handleSubmit} className="log-form-row">
        <div className="form-row">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>Amount ($)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.00" required min="0.01" step="0.01" />
        </div>
        <div className="form-row" style={{ flex: 1.5 }}>
          <label>Label (optional)</label>
          <input type="text" value={label} onChange={e => setLabel(e.target.value)}
            placeholder="e.g. groceries" />
        </div>
        <button type="submit" className="btn btn-primary"
          style={{ alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>
          + Add
        </button>
      </form>
      {msg.text && <div className={`form-msg ${msg.type}`}>{msg.text}</div>}
    </div>
  )
}

function ArchiveRow({ semester, onArchive }) {
  const [name, setName] = useState(semester?.name || '')
  const [msg, setMsg] = useState({ text: '', type: '' })

  async function handleArchive() {
    if (!name.trim()) { setMsg({ text: 'Enter a name first.', type: 'err' }); return }
    await onArchive(name)
    setMsg({ text: `"${name}" archived. Set up a new semester in the ≡ menu.`, type: 'ok' })
  }

  return (
    <div className="archive-row">
      <span className="archive-row-label">Archive Semester</span>
      <div className="form-row">
        <label>Label</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Spring 2026" />
      </div>
      <button className="btn-blue" onClick={handleArchive}>Save to Archive →</button>
      {msg.text && <div className={`form-msg ${msg.type}`} style={{ width: '100%' }}>{msg.text}</div>}
    </div>
  )
}

function SemesterConfig({ onSubmit, current, onClose }) {
  const [name, setName] = useState(current?.name || '')
  const [startDate, setStartDate] = useState(current?.start_date || '')
  const [endDate, setEndDate] = useState(current?.end_date || '')
  const [budget, setBudget] = useState(current?.budget || '')
  const [msg, setMsg] = useState({ text: '', type: '' })

  async function handleSubmit(e) {
    e.preventDefault()
    const { error } = await onSubmit(name, startDate, endDate, parseFloat(budget))
    if (error) {
      setMsg({ text: error.message, type: 'err' })
    } else {
      setMsg({ text: 'Saved!', type: 'ok' })
      setTimeout(() => { setMsg({ text: '', type: '' }); onClose() }, 800)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Semester name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Spring 2026" required />
      </div>
      <div className="settings-row">
        <div className="form-row">
          <label>Start date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>End date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
        </div>
      </div>
      <div className="form-row">
        <label>Starting budget ($)</label>
        <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
          placeholder="e.g. 300" required min="1" step="0.01" />
      </div>
      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
        Apply Changes
      </button>
      {msg.text && <div className={`form-msg ${msg.type}`}>{msg.text}</div>}
    </form>
  )
}

function ClearData({ userId }) {
  const [confirming, setConfirming] = useState(false)

  async function handleClear() {
    await supabase.from('entries').delete().eq('user_id', userId)
    await supabase.from('semesters').update({ is_active: false }).eq('user_id', userId).eq('is_active', true)
    setConfirming(false)
    window.location.reload()
  }

  if (!confirming) {
    return (
      <button className="btn btn-danger" style={{ width: '100%' }} onClick={() => setConfirming(true)}>
        ⊗ Clear Current Data
      </button>
    )
  }

  return (
    <div className="inline-confirm show">
      <span className="inline-confirm-msg">Clear current entries and settings? Archive is kept.</span>
      <button className="btn btn-danger" onClick={handleClear}>Yes, clear</button>
      <button className="btn btn-ghost" onClick={() => setConfirming(false)}>Cancel</button>
    </div>
  )
}

function ArchiveList({ userId, refresh, onRestore, onDelete }) {
  const [archives, setArchives] = useState([])
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    supabase
      .from('semesters')
      .select('*, entries(amount)')
      .eq('user_id', userId)
      .eq('is_active', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => setArchives(data || []))
  }, [userId, refresh])

  async function handleDelete(id) {
    // delete entries first, then the semester
    await supabase.from('entries').delete().eq('semester_id', id)
    await supabase.from('semesters').delete().eq('id', id)
    setArchives(prev => prev.filter(a => a.id !== id))
    setDeletingId(null)
    onDelete()
  }

  if (!archives.length) return <p className="archive-empty">No archived semesters yet.</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {archives.map(sem => {
        const totalDays = Math.round((new Date(sem.end_date) - new Date(sem.start_date)) / 86400000)
        const totalSpent = (sem.entries || []).reduce((s, e) => s + parseFloat(e.amount), 0)
        const finalBalance = parseFloat(sem.budget) - totalSpent
        const pctSpent = ((totalSpent / sem.budget) * 100).toFixed(1)
        const avgWeek = (totalSpent / (totalDays / 7)).toFixed(2)
        const expWeek = (sem.budget / (totalDays / 7)).toFixed(2)
        const under = finalBalance >= 0
        const isDeleting = deletingId === sem.id

        return (
          <div key={sem.id} className="archive-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
              <div className="archive-card-name">{sem.name}</div>
              <button
                className="archive-card-del"
                style={{ position: 'static', fontSize: '1.1rem', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.2rem' }}
                onClick={() => setDeletingId(isDeleting ? null : sem.id)}
              >✕</button>
            </div>

            {isDeleting && (
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.58rem', color: 'var(--red)', flex: 1 }}>Delete permanently?</span>
                <button className="btn btn-danger" style={{ fontSize: '0.55rem', padding: '0.2rem 0.5rem' }} onClick={() => handleDelete(sem.id)}>Yes</button>
                <button className="btn btn-ghost" style={{ fontSize: '0.55rem', padding: '0.2rem 0.5rem' }} onClick={() => setDeletingId(null)}>No</button>
              </div>
            )}

            <div className="archive-card-dates">{sem.start_date} – {sem.end_date}</div>
            <div className="archive-card-stat">Budget: <span>${parseFloat(sem.budget).toFixed(2)}</span></div>
            <div className="archive-card-stat">Total spent: <span className="down">${totalSpent.toFixed(2)}</span> ({pctSpent}%)</div>
            <div className="archive-card-stat">Final balance: <span className={under ? 'up' : 'down'}>${finalBalance.toFixed(2)}</span></div>
            <div className="archive-card-stat">Avg/week: <span className={parseFloat(avgWeek) <= parseFloat(expWeek) ? 'up' : 'down'}>${avgWeek}</span> vs ${expWeek} expected</div>
            <div className="archive-card-stat">Transactions: <span>{(sem.entries || []).length}</span></div>

            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem' }}>
              <button className="btn-blue" style={{ flex: 1 }} onClick={() => onRestore(sem.id)}>
                ↩ Restore
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}