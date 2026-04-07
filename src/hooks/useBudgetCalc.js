export function useBudgetCalc(semester, entries) {
  if (!semester) return null

  const startDate = new Date(semester.start_date)
  const endDate   = new Date(semester.end_date)
  const today     = new Date(); today.setHours(0,0,0,0)

  const totalDays   = Math.round((endDate - startDate) / 86400000)
  const dayNow      = Math.min(totalDays, Math.max(0, Math.round((today - startDate) / 86400000)))
  const dailyIdeal  = semester.budget / totalDays

  const totalSpent  = entries.reduce((sum, e) => sum + parseFloat(e.amount), 0)
  const balance     = parseFloat((semester.budget - totalSpent).toFixed(2))
  const expToday    = parseFloat((semester.budget - dailyIdeal * dayNow).toFixed(2))
  const diff        = parseFloat((balance - expToday).toFixed(2))
  const daysLeft    = totalDays - dayNow

  const weeksElapsed  = (dayNow || 1) / 7
  const avgWeekSpend  = parseFloat((totalSpent / weeksElapsed).toFixed(2))
  const expWeekSpend  = parseFloat((semester.budget / (totalDays / 7)).toFixed(2))

  // data points for chart
  const seenDays = {}, eventByDay = {}
  let running = semester.budget
  const sortedEntries = [...entries].sort((a,b) => a.date.localeCompare(b.date))
  for (const e of sortedEntries) {
    const day = Math.round((new Date(e.date) - startDate) / 86400000)
    running = parseFloat((running - parseFloat(e.amount)).toFixed(2))
    seenDays[day] = running
    eventByDay[day] = (eventByDay[day] || 0) + parseFloat(e.amount)
  }
  const dataPoints = [{ day: 0, balance: semester.budget }]
  for (const day of Object.keys(seenDays).map(Number).sort((a,b)=>a-b)) {
    dataPoints.push({ day, balance: seenDays[day] })
  }

  return {
    balance, expToday, diff, daysLeft, totalDays, dayNow,
    totalSpent, avgWeekSpend, expWeekSpend,
    dailyIdeal, startDate, endDate,
    dataPoints, eventByDay, sortedEntries,
    isUnder: diff >= 0
  }
}