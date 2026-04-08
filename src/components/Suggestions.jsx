import { useState, useEffect } from 'react'

const DINING_DOLLAR_PLACES = `
ON CAMPUS:
- Anna's Taqueria (Marino Center) — burritos, tacos
- Dunkin' (Hayden Hall & Shillman Hall) — coffee, donuts, sandwiches
- Equator Coffees (Snell Library) — coffee, light bites
- Faculty Club at EXP — café-style food
- Fuel America (ISEC) — grab-and-go meals, snacks
- Juicygreens (International Village South) — salads, bowls, smoothies
- Modern Market (Churchill Hall) — bowls, sandwiches, salads
- Saxbys (EXP) — coffee, pastries
- Starbucks (Churchill Hall) — coffee, snacks
- Subway (Ryder Hall) — subs, sandwiches
- Tatte Bakery and Cafe (Marino Center) — pastries, sandwiches, coffee
- Wollaston's Market (Marino Center & West Village B) — convenience store, snacks, drinks

CURRY STUDENT CENTER:
- Choolaah — Indian rotisserie
- D'Angelo's — subs and sandwiches
- The Halal Shack — halal bowls and wraps
- Kigo Kitchen — Asian-inspired bowls
- Popeyes — fried chicken
- Sal's Pizza — pizza by the slice
- Starbucks — coffee, snacks
- The Market at Curry Student Center — grab-and-go items

OFF CAMPUS (nearby):
- Amelia's Cluck and Smash, 309 Huntington Ave — fried chicken sandwiches
- BaKala'O Kitchenette, 1002 Tremont St — Caribbean food
- Bangkok Pinto, 1041 Tremont St — Thai food
- Blaze Pizza, 1282 Boylston St — fast-casual pizza
- Boston Shawarma, 315 Huntington Ave — shawarma, Middle Eastern
- CVS, 231 Massachusetts Ave — convenience items
- Da Vinci Gelato and Waffle, 297 Huntington Ave — gelato, waffles, dessert
- El Jefe's Taqueria, 269 Huntington Ave — tacos, burritos
- Energize, 265 Massachusetts Ave — health food, smoothies
- Five Guys, 263 Huntington Ave — burgers, fries
- Giovanni's Market, 624 Columbus Ave — market, sandwiches
- Gyroscope, 305 Huntington Ave — gyros, Greek food
- H Mart, 1028 Beacon St — Korean/Asian grocery and food
- LUCIE drink + dine, 120 Huntington Ave — upscale dining
- Mamacita Mexican Eats, 329 Huntington Ave — Mexican food
- Panera Bread, 289 Huntington Ave — soups, sandwiches, salads
- Poke Station, 313 Huntington Ave — poke bowls
- Qdoba, 279 Massachusetts Ave — burritos, bowls
- Sprout, 305 Huntington Ave — healthy bowls and wraps
- Star Market, 53 Huntington Ave — grocery store
- Symphony Market, 291 Huntington Ave — market, grab-and-go
- TeaDo, 333 Huntington Ave — bubble tea, drinks
- University House of Pizza, 452 Huntington Ave — pizza, subs
- Wings Over Boston, 325 Huntington Ave — wings, tenders
`

const SWIPE_LOCATIONS = [
  { name: 'Stetson East', tag: 'Dining Hall · Meal Swipes', desc: 'All-you-can-eat dining hall on the East side of campus. Wide variety of stations — grill, deli, pizza, and salad bar.' },
  { name: 'International Village', tag: 'Dining Hall · Meal Swipes', desc: 'Large (and best by far) dining hall near Columbus Ave with a global cuisine focus. One of the main all-you-can-eat spots on campus.' },
  { name: '60 Belvidere', tag: 'Dining Hall · Meal Swipes', desc: 'Smaller residential dining hall near the Fenway area. All-you-can-eat with rotating menus.' },
  { name: 'Outtakes', tag: 'Grab & Go · Meal Swipes', desc: 'Grab-and-go dining that accepts meal swipes. Pre-packaged meals, sandwiches, snacks, drinks, and grocery-style items.' },
]

function buildPrompt(calc) {
  const { balance, diff, avgWeek, expWeek, daysLeft, isUnder } = calc
  const overBy = -diff

  const status = `
- Balance: $${balance.toFixed(2)}
- Spending $${avgWeek}/wk vs expected $${expWeek}/wk
- ${daysLeft} days left in the semester
`.trim()

  const slightlyOver = overBy > 0 && overBy <= 10
  const significantlyOver = overBy > 10

  if (isUnder) {
    return `You are a helpful dining advisor for a Northeastern University student in Boston.

The student uses dining dollars (a prepaid campus meal plan balance). Their current status:
${status}
- $${Math.abs(diff).toFixed(2)} UNDER their ideal spending pace — they have some extra room

IMPORTANT: You MUST only suggest places from the following verified list. Do not suggest any place not on this list.
${DINING_DOLLAR_PLACES}

Pick 3–4 places that fit the student's budget. For each give: name and location, a suggested item or meal with its approximate price range (e.g. $8–$12), and one sentence on why it's a good pick right now. Aim for variety — mix on-campus and off-campus if possible. Budget per meal: around $${Math.min(15, Math.max(6, diff)).toFixed(0)}–$${Math.min(22, Math.max(10, diff + 6)).toFixed(0)}.`
  }

  if (slightlyOver) {
    return `You are a helpful dining advisor for a Northeastern University student in Boston.

The student uses dining dollars (a prepaid campus meal plan balance). Their current status:
${status}
- $${overBy.toFixed(2)} OVER their ideal spending pace — only slightly, but worth watching

They are only slightly over budget, so still suggest 2–3 dining dollar spots — but pick cheaper options. For each give: name and location, a suggested item or meal with its approximate price range (e.g. $6–$9). Also include a short friendly heads-up (1–2 sentences) recommending they start mixing in more meal swipes. Meal swipe locations: Stetson East, International Village, 60 Belvidere (all-you-can-eat), and Outtakes (grab-and-go).

IMPORTANT: You MUST only suggest dining dollar places from the following verified list.
${DINING_DOLLAR_PLACES}

Keep the tone friendly and practical — not alarming.`
  }

  return `You are a helpful dining advisor for a Northeastern University student in Boston.

The student uses dining dollars (a prepaid campus meal plan balance). Their current status:
${status}
- $${overBy.toFixed(2)} OVER their ideal spending pace — they are spending too fast

They should switch primarily to meal swipes to conserve dining dollars. Meal swipe locations:
- Stetson East: all-you-can-eat dining hall, east side of campus
- International Village: large all-you-can-eat dining hall near Columbus Ave
- 60 Belvidere: smaller residential dining hall near Fenway
- Outtakes: grab-and-go, accepts meal swipes — pre-packaged meals, sandwiches, snacks, groceries

Also, if they do need to spend dining dollars, suggest 1–2 cheaper options from this verified list with approximate price ranges (e.g. $5–$8):
${DINING_DOLLAR_PLACES}

Give 2–3 practical tips on switching to meal swipes, and suggest which location suits which scenario. Keep it friendly and direct.`
}

export default function Suggestions({ calc, session }) {
  const [output, setOutput] = useState('Hit "Get Suggestions" for AI-powered dining recommendations based on your current budget.')
  const [outputClass, setOutputClass] = useState('')
  const [loading, setLoading] = useState(false)

  async function getSuggestions() {
  if (!calc) {
    setOutputClass('suggest-output err')
    setOutput('Configure semester settings before getting suggestions.')
    return
  }

  setLoading(true)
  setOutputClass('suggest-output loading')
  setOutput('Asking for recommendations...')

  try {
    const response = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: buildPrompt(calc), userId: session.user.id })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Server error')
    if (!data.text) throw new Error('No response received.')

    setOutputClass('suggest-output')
    setOutput(data.text)
  } catch (err) {
    setOutputClass('suggest-output err')
    setOutput('Error: ' + err.message)
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="panel" style={{ marginBottom: '1.2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div className="panel-title" style={{ marginBottom: 0 }}>Dining Suggestions</div>
        <button className="btn-yellow" onClick={getSuggestions} disabled={loading}>
          {loading ? 'Loading...' : '✦ Get Suggestions'}
        </button>
      </div>

      {/* Budget context */}
      {calc && (
        <div className="suggest-context">
          {calc.isUnder
            ? <>You are <span className="up">${Math.abs(calc.diff).toFixed(2)} under budget</span> — spending <span className="up">${calc.avgWeekSpend}/wk</span> vs expected <span className="dim">${calc.expWeekSpend}/wk</span>. Balance: <span className="up">${calc.balance.toFixed(2)}</span> with <span className="dim">{calc.daysLeft} days left</span>.</>
            : <>You are <span className="down">${Math.abs(calc.diff).toFixed(2)} over budget</span> — spending <span className="down">${calc.avgWeekSpend}/wk</span> vs expected <span className="dim">${calc.expWeekSpend}/wk</span>. Balance: <span className="down">${calc.balance.toFixed(2)}</span> with <span className="dim">{calc.daysLeft} days left</span>.</>
          }
        </div>
      )}

      {/* Output */}
      <div className={outputClass || 'suggest-output'}>
        {output || 'Hit "Get Suggestions" for AI-powered dining recommendations based on your current budget.'}
      </div>

      <hr className="suggest-divider" />

      {/* Meal swipe locations */}
      <div className="panel-title" style={{ marginBottom: '0.6rem' }}>Meal Swipe Locations</div>
      <div className="swipe-grid">
        {SWIPE_LOCATIONS.map(loc => (
          <div key={loc.name} className="swipe-card">
            <div className="swipe-card-name">{loc.name}</div>
            <div className="swipe-card-tag">{loc.tag}</div>
            <div className="swipe-card-desc">{loc.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}