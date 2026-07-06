const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

exports.handler = async (event) => {
  const uid = event.queryStringParameters?.uid
  if (!uid) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No uid provided' }) }
  }

  // Look up member by token (include coach_id for notifications)
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, name, email, coach_id')
    .eq('token', uid)
    .maybeSingle()

  if (memberError || !member) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Member not found' }) }
  }

  // GET — return tracker data
  if (event.httpMethod === 'GET') {
    const { data: row } = await supabase
      .from('tracker_data')
      .select('data')
      .eq('member_id', member.id)
      .maybeSingle()

    await supabase.from('members').update({ last_active: new Date().toISOString() }).eq('id', member.id)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: row?.data || {}, member: { name: member.name, email: member.email } }),
    }
  }

  // POST — save tracker data
  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}')
    const newData = body.data

    // Fetch existing data to detect milestone changes
    const { data: existing } = await supabase
      .from('tracker_data')
      .select('data')
      .eq('member_id', member.id)
      .maybeSingle()

    const oldData = existing?.data || {}

    // Upsert new data
    const { error } = await supabase
      .from('tracker_data')
      .upsert(
        { member_id: member.id, data: newData, updated_at: new Date().toISOString() },
        { onConflict: 'member_id' }
      )

    if (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
    }

    // Trigger milestone notifications if member has an assigned coach
    if (member.coach_id) {
      await triggerNotifications(member, oldData, newData)
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) }
  }

  return { statusCode: 405, body: 'Method not allowed' }
}

async function triggerNotifications(member, oldData, newData) {
  const notifications = []
  const coachId = member.coach_id
  const memberId = member.id
  const memberName = member.name || member.email

  // Fetch existing milestone notifications (idempotency guard)
  const { data: existingNotifs } = await supabase
    .from('coach_notifications')
    .select('type')
    .eq('coach_id', coachId)
    .eq('member_id', memberId)
    .in('type', ['first_application', 'first_interview', 'first_offer', 'checkin_submitted'])

  const notifiedTypes = new Set((existingNotifs || []).map(n => n.type))

  const oldApps = oldData.applications || []
  const newApps = newData.applications || []
  const oldCheckins = (oldData.weeklyCheckins || []).filter(c => c.submitted).length
  const newCheckins = (newData.weeklyCheckins || []).filter(c => c.submitted).length

  // First application milestone
  if (!notifiedTypes.has('first_application') && oldApps.length === 0 && newApps.length > 0) {
    notifications.push({
      coach_id: coachId,
      member_id: memberId,
      type: 'first_application',
      title: `${memberName} submitted their first application!`,
      message: `${memberName} has added their first job application to the tracker.`,
    })
  }

  // First interview milestone
  const oldInterviews = oldApps.filter(a => a.interviewDate).length
  const newInterviews = newApps.filter(a => a.interviewDate).length
  if (!notifiedTypes.has('first_interview') && oldInterviews === 0 && newInterviews > 0) {
    notifications.push({
      coach_id: coachId,
      member_id: memberId,
      type: 'first_interview',
      title: `${memberName} has their first interview!`,
      message: `${memberName} has scheduled their first interview. Consider sending them encouragement.`,
    })
  }

  // First offer milestone
  const oldOffers = (oldData.offers || []).length
  const newOffers = (newData.offers || []).length
  if (!notifiedTypes.has('first_offer') && oldOffers === 0 && newOffers > 0) {
    notifications.push({
      coach_id: coachId,
      member_id: memberId,
      type: 'first_offer',
      title: `${memberName} received their first offer!`,
      message: `Amazing news — ${memberName} has received a job offer. Time to celebrate!`,
    })
  }

  // Weekly check-in submitted (allow repeated, but only one per day)
  if (newCheckins > oldCheckins) {
    const today = new Date().toISOString().split('T')[0]
    const { data: todaysCheckin } = await supabase
      .from('coach_notifications')
      .select('id')
      .eq('coach_id', coachId)
      .eq('member_id', memberId)
      .eq('type', 'checkin_submitted')
      .gte('created_at', `${today}T00:00:00Z`)
      .maybeSingle()

    if (!todaysCheckin) {
      notifications.push({
        coach_id: coachId,
        member_id: memberId,
        type: 'checkin_submitted',
        title: `${memberName} submitted a weekly check-in`,
        message: `${memberName} just completed their weekly check-in and reflection.`,
      })
    }
  }

  if (notifications.length > 0) {
    await supabase.from('coach_notifications').insert(notifications)
  }
}
