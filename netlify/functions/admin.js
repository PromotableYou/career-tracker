const { verifyCoach, supabase, json } = require('./lib/verify-coach')

function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

exports.handler = async (event) => {
  const auth = await verifyCoach(event)
  if (auth.error) return json(auth.statusCode, { error: auth.error })
  const { coach } = auth

  // ── POST: save coach notes ──
  if (event.httpMethod === 'POST') {
    const { memberId, notes } = JSON.parse(event.body || '{}')
    if (!memberId) return json(400, { error: 'No memberId' })

    const { error } = await supabase
      .from('members')
      .update({ coach_notes: notes })
      .eq('id', memberId)

    if (error) return json(500, { error: error.message })
    return json(200, { success: true })
  }

  // ── GET: fetch all members + tracker stats ──
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' })

  // Admins see all members; coaches see only their assigned members
  let memberQuery = supabase
    .from('members')
    .select('id, name, email, token, last_active, created_at, coach_notes, coach_id, coaches(name)')
    .order('last_active', { ascending: false, nullsFirst: false })

  if (!coach.is_admin) {
    memberQuery = memberQuery.eq('coach_id', coach.id)
  }

  const { data: members, error } = await memberQuery
  if (error) return json(500, { error: error.message })

  // Get tracker data for all returned members
  const memberIds = (members || []).map(m => m.id)
  const { data: trackerRows } = memberIds.length
    ? await supabase.from('tracker_data').select('member_id, data').in('member_id', memberIds)
    : { data: [] }

  const trackerMap = {}
  ;(trackerRows || []).forEach(row => { trackerMap[row.member_id] = row.data })

  // Auto-generate inactive notifications for the loading coach
  // (idempotent: only inserts if no notification for this member in the last 7 days)
  const inactiveThreshold = 7
  const sevenDaysAgo = new Date(Date.now() - inactiveThreshold * 86400000).toISOString()

  const inactiveMembers = (members || []).filter(m => {
    const d = daysSince(m.last_active)
    return d === null || d >= inactiveThreshold
  })

  if (inactiveMembers.length > 0) {
    // Fetch existing recent inactive notifications to avoid duplicates
    const { data: existingNotifs } = await supabase
      .from('coach_notifications')
      .select('member_id')
      .eq('coach_id', coach.id)
      .eq('type', 'inactive_member')
      .gte('created_at', sevenDaysAgo)

    const alreadyNotified = new Set((existingNotifs || []).map(n => n.member_id))

    const toInsert = inactiveMembers
      .filter(m => m.coach_id === coach.id && !alreadyNotified.has(m.id))
      .map(m => ({
        coach_id: coach.id,
        member_id: m.id,
        type: 'inactive_member',
        title: `${m.name || m.email} hasn't been active`,
        message: `${m.name || m.email} has not logged into their tracker for ${daysSince(m.last_active) ?? 'an unknown number of'} days.`,
      }))

    if (toInsert.length > 0) {
      await supabase.from('coach_notifications').insert(toInsert)
    }
  }

  // Build member summaries
  const memberStats = (members || []).map(m => {
    const d = trackerMap[m.id] || {}
    const apps = d.applications || []
    const interviews = apps.filter(a => a.interviewDate).length
    const offers = (d.offers || []).length
    const networking = (d.networking || []).length
    const checkins = (d.weeklyCheckins || []).filter(c => c.submitted).length
    const lastApp = apps.map(a => a.submittedDate).filter(Boolean).sort().pop() || null
    const lastCheckin = (d.weeklyCheckins || [])
      .filter(c => c.submitted && c.weekOf).map(c => c.weekOf).sort().pop() || null

    return {
      id: m.id,
      name: m.name || 'Unknown',
      email: m.email,
      token: m.token,
      lastActive: m.last_active,
      createdAt: m.created_at,
      coachNotes: m.coach_notes || '',
      coachId: m.coach_id,
      coachName: m.coaches?.name || '',
      totalApps: apps.length,
      interviews,
      offers,
      networking,
      checkinsSubmitted: checkins,
      lastApp,
      lastCheckin,
      targetRole: d.profile?.targetRole || '',
      coach: d.profile?.coach || '',
      wins: (d.wins || []).map(w => ({ id: w.id, text: w.text, date: w.date })),
    }
  })

  return json(200, { members: memberStats, currentCoach: coach })
}
