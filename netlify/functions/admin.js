const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

exports.handler = async (event) => {
  // Protect with a secret key
  const key = event.queryStringParameters?.key
  if (!key || key !== process.env.COACH_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorised' }) }
  }

  // Save coach notes (POST)
  if (event.httpMethod === 'POST') {
    const { memberId, notes } = JSON.parse(event.body || '{}')
    if (!memberId) return { statusCode: 400, body: JSON.stringify({ error: 'No memberId' }) }
    const { error: updateError } = await supabase
      .from('members')
      .update({ coach_notes: notes })
      .eq('id', memberId)
    if (updateError) return { statusCode: 500, body: JSON.stringify({ error: updateError.message }) }
    return { statusCode: 200, body: JSON.stringify({ success: true }) }
  }

  // Get all members
  const { data: members, error } = await supabase
    .from('members')
    .select('id, name, email, token, last_active, created_at, coach_notes')
    .order('last_active', { ascending: false, nullsFirst: false })

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }

  // Get all tracker data
  const { data: trackerRows } = await supabase
    .from('tracker_data')
    .select('member_id, data')

  const trackerMap = {}
  ;(trackerRows || []).forEach(row => { trackerMap[row.member_id] = row.data })

  // Build member summaries
  const memberStats = members.map(m => {
    const d = trackerMap[m.id] || {}
    const apps = (d.applications || [])
    const interviews = apps.filter(a => a.interviewDate).length
    const offers = (d.offers || []).length
    const networking = (d.networking || []).length
    const checkins = (d.weeklyCheckins || []).filter(c => c.submitted).length
    const lastApp = apps.map(a => a.submittedDate).filter(Boolean).sort().pop() || null
    const lastCheckin = (d.weeklyCheckins || []).filter(c => c.submitted && c.weekOf).map(c => c.weekOf).sort().pop() || null

    return {
      id: m.id,
      name: m.name || 'Unknown',
      email: m.email,
      token: m.token,
      lastActive: m.last_active,
      createdAt: m.created_at,
      coachNotes: m.coach_notes || '',
      totalApps: apps.length,
      interviews,
      offers,
      networking,
      checkinsSubmitted: checkins,
      lastApp,
      lastCheckin,
      targetRole: d.profile?.targetRole || '',
      coach: d.profile?.coach || '',
    }
  })

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ members: memberStats }),
  }
}
