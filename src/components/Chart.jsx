import { useRef, useEffect, useState } from 'react'

const NS = 'http://www.w3.org/2000/svg'
const W = 700, H = 340
const PAD = { top: 24, right: 24, bottom: 40, left: 64 }
const CW = W - PAD.left - PAD.right
const CH = H - PAD.top - PAD.bottom

function svgEl(tag, attrs) {
  const el = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  return el
}

export default function Chart({ calc, semester }) {
  const svgRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [showBestFit, setShowBestFit] = useState(true)

  useEffect(() => {
    if (!svgRef.current || !calc || !semester) return
    drawChart(svgRef.current, calc, semester, showBestFit, setTooltip, setTooltipPos)
  }, [calc, semester, showBestFit])

  return (
    <div className="chart-wrap" style={{ marginBottom: 0, position: 'relative' }}>
      <div className="chart-header">
        <span className="chart-title">Balance over time · hover dots for detail</span>
        <label className="toggle-label">
          <input type="checkbox" checked={showBestFit} onChange={e => setShowBestFit(e.target.checked)} />
          Show trend line
        </label>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair' }} />

      {tooltip && (
        <div className="tooltip" style={{ left: tooltipPos.x, top: tooltipPos.y, position: 'fixed' }}>
          <div className="tt-date">{tooltip.date} · Day {tooltip.day}</div>
          <div className="tt-ideal">Ideal balance: <span>${tooltip.ideal}</span></div>
          <div className="tt-actual">{tooltip.projected ? 'Projected' : 'Your'} balance: <span>${tooltip.actual}</span></div>
          {tooltip.bestFit && <div className="tt-bestfit">Trend line: <span>${tooltip.bestFit}</span></div>}
          {tooltip.dayEntries && tooltip.dayEntries.map((e, i) => (
            <div key={i} className="tt-txn">
              <span className="tt-txn-lbl">{e.label || '(unlabeled)'}</span>
              <span className="tt-txn-amt">-${parseFloat(e.amount).toFixed(2)}</span>
            </div>
          ))}
          {tooltip.dayEntries && tooltip.dayEntries.length > 1 && (
            <div className="tt-spent">Total: <span>-${tooltip.dayEntries.reduce((s,e) => s + parseFloat(e.amount), 0).toFixed(2)}</span></div>
          )}
          <div className={`tt-diff ${tooltip.diff >= 0 ? 'good' : 'bad'}`}>
            {tooltip.diff >= 0 ? '▲' : '▼'} ${Math.abs(tooltip.diff).toFixed(2)} {tooltip.diff >= 0 ? 'under' : 'over'} budget
          </div>
        </div>
      )}

      <div className="legend">
        <div className="legend-item">
          <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#3387bb" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
          Ideal rate
        </div>
        <div className="legend-item">
          <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#00d4aa" strokeWidth="2" /></svg>
          Your balance
        </div>
        <div className="legend-item">
          <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#00d4aa" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.4" /></svg>
          Projected
        </div>
        {showBestFit && (
          <div className="legend-item">
            <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#f0c040" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
            Trend
          </div>
        )}
        <div className="legend-item">
          <svg width="8" height="8"><circle cx="4" cy="4" r="3" fill="#00d4aa" opacity="0.8" /></svg>
          Transaction
        </div>
      </div>
    </div>
  )
}

function drawChart(svg, calc, semester, showBestFit, setTooltip, setTooltipPos) {
  svg.innerHTML = ''

  const { dataPoints, eventByDay, totalDays, dayNow, startDate, sortedEntries } = calc
  const startBudget = parseFloat(semester.budget)
  const last = dataPoints[dataPoints.length - 1]
  const dailyActual = (startBudget - last.balance) / (last.day || 1)
  const projEnd = last.balance - dailyActual * (totalDays - last.day)

  // y-axis range (supports negatives)
  const allVals = [startBudget, projEnd, ...dataPoints.map(p => p.balance)]
  const reg = linearRegression(dataPoints.map(p => ({ x: p.day, y: p.balance })))
  if (reg) { allVals.push(reg.at(0), reg.at(totalDays)) }
  const yMin = Math.min(0, ...allVals)
  const yMax = startBudget
  const yRange = yMax - yMin
  const yLow = yMin - yRange * 0.08
  const yHigh = yMax
  const ySpan = yHigh - yLow

  const xS = d => PAD.left + (d / totalDays) * CW
  const yS = v => PAD.top + (1 - (v - yLow) / ySpan) * CH
  const xToDay = px => ((px - PAD.left) / CW) * totalDays
  const idealAt = d => startBudget - (startBudget / totalDays) * d
  const actualAt = day => {
    if (day <= 0) return startBudget
    for (let i = 1; i < dataPoints.length; i++) {
      if (day <= dataPoints[i].day) {
        const p0 = dataPoints[i-1], p1 = dataPoints[i]
        return p0.balance + ((day - p0.day) / (p1.day - p0.day)) * (p1.balance - p0.balance)
      }
    }
    return last.balance - dailyActual * (day - last.day)
  }

  function el(tag, attrs, parent) {
    const e = svgEl(tag, attrs)
    if (parent) parent.appendChild(e)
    return e
  }

  // Gradient
  const defs = el('defs', {}, svg)
  const grad = el('linearGradient', { id: 'balGrad', x1: '0', x2: '0', y1: '0', y2: '1' }, defs)
  el('stop', { offset: '0%', 'stop-color': '#00d4aa', 'stop-opacity': '0.15' }, grad)
  el('stop', { offset: '100%', 'stop-color': '#00d4aa', 'stop-opacity': '0' }, grad)

  // Grid lines
  const gridStep = startBudget / 6
  for (let v = Math.ceil(yLow / gridStep) * gridStep; v <= yHigh + gridStep * 0.01; v += gridStep) {
    const rv = Math.round(v / 10) * 10
    const y = yS(rv)
    const isZero = rv === 0
    el('line', { x1: PAD.left, x2: W - PAD.right, y1: y, y2: y, stroke: isZero ? '#2a4050' : '#0f1a22', 'stroke-width': isZero ? 1.5 : 1 }, svg)
    el('text', { x: PAD.left - 8, y: y + 4, fill: isZero ? '#4a7090' : '#2a4050', 'font-size': 10, 'text-anchor': 'end', 'font-family': 'IBM Plex Mono, monospace' }, svg).textContent = '$' + rv
  }
  if (yLow < 0) {
    el('line', { x1: PAD.left, x2: W - PAD.right, y1: yS(0), y2: yS(0), stroke: '#2a4050', 'stroke-width': 1.5, 'stroke-dasharray': '2 2' }, svg)
  }

  // Month ticks
  const sd = new Date(semester.start_date)
  const ed = new Date(semester.end_date)
  const months = [{ label: fmtDate(sd), day: 0 }]
  const cur = new Date(sd); cur.setDate(1); cur.setMonth(cur.getMonth() + 1)
  while (cur <= ed) {
    const day = Math.round((cur - sd) / 86400000)
    if (day > 0 && day < totalDays) months.push({ label: cur.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(), day })
    cur.setMonth(cur.getMonth() + 1)
  }
  months.push({ label: fmtDate(ed), day: totalDays })
  for (const m of months) {
    el('line', { x1: xS(m.day), x2: xS(m.day), y1: PAD.top, y2: H - PAD.bottom, stroke: '#0f1a22', 'stroke-width': 1 }, svg)
    el('text', { x: xS(m.day), y: H - 8, fill: '#2a4050', 'font-size': 9, 'text-anchor': 'middle', 'font-family': 'IBM Plex Mono, monospace' }, svg).textContent = m.label
  }

  // Ideal line
  el('line', { x1: xS(0), y1: yS(startBudget), x2: xS(totalDays), y2: yS(0), stroke: '#3387bb', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, svg)

  // Gradient fill + actual line
  if (dataPoints.length > 1) {
    const zeroY = yS(Math.max(yLow, 0))
    const fillPts = dataPoints.map(p => `${xS(p.day)},${yS(p.balance)}`).join(' ')
    el('polygon', { points: `${xS(0)},${yS(startBudget)} ${fillPts} ${xS(last.day)},${zeroY} ${xS(0)},${zeroY}`, fill: 'url(#balGrad)' }, svg)
    el('polyline', { points: dataPoints.map(p => `${xS(p.day)},${yS(p.balance)}`).join(' '), fill: 'none', stroke: '#00d4aa', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg)
  }

  // Best fit line
  if (reg && showBestFit && dataPoints.length >= 2) {
    const y0 = reg.at(0), y1 = reg.at(totalDays)
    el('line', { x1: xS(0), y1: yS(y0), x2: xS(totalDays), y2: yS(y1), stroke: '#f0c040', 'stroke-width': 1.5, 'stroke-dasharray': '3 2', opacity: 0.8 }, svg)
    el('text', { x: xS(totalDays) - 4, y: yS(y1) + 14, fill: '#f0c040', 'font-size': 9, 'text-anchor': 'end', 'font-family': 'IBM Plex Mono, monospace', opacity: 0.7 }, svg).textContent = 'Trend: $' + y1.toFixed(0)
  }

  // Projected line
  if (last.day < totalDays) {
    el('line', { x1: xS(last.day), y1: yS(last.balance), x2: xS(totalDays), y2: yS(projEnd), stroke: '#00d4aa', 'stroke-width': 1.2, 'stroke-dasharray': '6 4', opacity: 0.4 }, svg)
    el('text', { x: xS(totalDays) - 4, y: yS(projEnd) - 8, fill: '#00d4aa', 'font-size': 9, 'text-anchor': 'end', 'font-family': 'IBM Plex Mono, monospace', opacity: 0.55 }, svg).textContent = 'Proj: $' + projEnd.toFixed(0)
  }

  // Today line
  if (dayNow > 0 && dayNow < totalDays) {
    el('line', { x1: xS(dayNow), x2: xS(dayNow), y1: PAD.top, y2: H - PAD.bottom, stroke: '#00d4aa', 'stroke-width': 1, opacity: 0.18 }, svg)
  }

  // Hover crosshair elements (drawn before dots so dots appear on top)
  const hL = el('line', { x1: 0, x2: 0, y1: PAD.top, y2: H - PAD.bottom, stroke: '#fff', 'stroke-width': 1, opacity: 0.07, visibility: 'hidden' }, svg)
  const hI = el('circle', { r: 3, fill: '#0d1317', stroke: '#2a4050', 'stroke-width': 2, visibility: 'hidden' }, svg)
  const hA = el('circle', { r: 4, fill: '#00d4aa', stroke: '#080c0e', 'stroke-width': 1.5, visibility: 'hidden' }, svg)
  const hB = el('circle', { r: 3, fill: '#f0c040', stroke: '#080c0e', 'stroke-width': 1.5, visibility: 'hidden' }, svg)

  // Transaction dots (hoverable)
  let hoveringDot = false
  for (const p of dataPoints.slice(1)) {
    const dot = el('circle', { cx: xS(p.day), cy: yS(p.balance), r: 5, fill: '#00d4aa', stroke: '#080c0e', 'stroke-width': 1.5, opacity: 0.85, style: 'cursor:pointer' }, svg)

    dot.addEventListener('mouseenter', ev => {
      hoveringDot = true
      dot.setAttribute('r', '7')
      dot.setAttribute('opacity', '1')
      ;[hL, hI, hA, hB].forEach(x => x.setAttribute('visibility', 'hidden'))

      const hd = new Date(sd); hd.setDate(hd.getDate() + p.day)
      const dayEntries = sortedEntries.filter(e =>
        Math.round((new Date(e.date) - new Date(semester.start_date)) / 86400000) === p.day
      )

      setTooltip({
        date: fmtDate(hd),
        day: p.day,
        actual: p.balance.toFixed(2),
        ideal: idealAt(p.day).toFixed(2),
        dayEntries,
        diff: p.balance - idealAt(p.day),
        projected: false
      })
      setTooltipPos({ x: ev.clientX + 16, y: ev.clientY - 16 })
    })

    dot.addEventListener('mousemove', ev => {
      setTooltipPos({ x: ev.clientX + 16, y: ev.clientY - 16 })
    })

    dot.addEventListener('mouseleave', () => {
      hoveringDot = false
      dot.setAttribute('r', '5')
      dot.setAttribute('opacity', '0.85')
      setTooltip(null)
    })
  }

  // Now dot
  el('circle', { cx: xS(last.day), cy: yS(last.balance), r: 6, fill: '#00d4aa', stroke: '#080c0e', 'stroke-width': 2 }, svg)
  const lx = xS(last.day)
  const anch = lx + 90 > W ? 'end' : 'start'
  el('text', { x: lx + (anch === 'end' ? -10 : 10), y: yS(last.balance) - 10, fill: '#00d4aa', 'font-size': 9, 'text-anchor': anch, 'font-family': 'IBM Plex Mono, monospace' }, svg).textContent = 'NOW $' + last.balance.toFixed(2)

  // SVG mousemove (crosshair)
  svg.addEventListener('mousemove', e => {
    if (hoveringDot) return
    const rect = svg.getBoundingClientRect()
    const svgX = (e.clientX - rect.left) * (W / rect.width)
    const day = Math.max(0, Math.min(totalDays, xToDay(svgX)))
    const xPx = xS(day)
    const ideal = idealAt(day)
    const actual = actualAt(day)
    const diff = actual - ideal
    const isProj = day > last.day
    const ns2 = eventByDay[Math.round(day)]
    const bfV = (reg && showBestFit) ? reg.at(day) : null
    const hd = new Date(sd); hd.setDate(hd.getDate() + Math.round(day))

    hL.setAttribute('x1', xPx); hL.setAttribute('x2', xPx); hL.setAttribute('visibility', 'visible')
    hI.setAttribute('cx', xPx); hI.setAttribute('cy', yS(ideal)); hI.setAttribute('visibility', 'visible')
    hA.setAttribute('cx', xPx); hA.setAttribute('cy', yS(actual)); hA.setAttribute('visibility', 'visible')
    if (bfV !== null) { hB.setAttribute('cx', xPx); hB.setAttribute('cy', yS(bfV)); hB.setAttribute('visibility', 'visible') }
    else hB.setAttribute('visibility', 'hidden')

    setTooltip({
      date: fmtDate(hd),
      day: Math.round(day),
      ideal: ideal.toFixed(2),
      actual: actual.toFixed(2),
      bestFit: bfV !== null ? bfV.toFixed(2) : null,
      spent: ns2 ? ns2.toFixed(2) : null,
      diff,
      projected: isProj
    })

    let tx = e.clientX + 16, ty = e.clientY - 16
    if (tx + 230 > window.innerWidth) tx = e.clientX - 234
    if (ty < 0) ty = 8
    setTooltipPos({ x: tx, y: ty })
  })

  svg.addEventListener('mouseleave', () => {
    if (!hoveringDot) {
      setTooltip(null)
      ;[hL, hI, hA, hB].forEach(x => x.setAttribute('visibility', 'hidden'))
    }
  })
}

function linearRegression(pts) {
  const n = pts.length; if (n < 2) return null
  let sx = 0, sy = 0, sxy = 0, sxx = 0
  for (const p of pts) { sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x }
  const denom = n * sxx - sx * sx
  if (!denom) return null
  const m = (n * sxy - sx * sy) / denom
  const b = (sy - m * sx) / n
  return { at: x => m * x + b }
}

function fmtDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}