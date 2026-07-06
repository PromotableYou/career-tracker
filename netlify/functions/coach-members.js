const { verifyCoach, supabase, json } = require('./lib/verify-coach')
const crypto = require('crypto')

const TRACKER_BASE_URL = 'https://pycaptracker.netlify.app'

exports.handler = async (event) => {
  const auth = await verifyCoach(event)
  if (auth.error) return json(auth.statusCode, { error: auth.error })
  const { coach } = auth

  // ── GET: list all members (admins see all, coaches see their own) ──
  if (event.httpMethod === 'GET') {
    let query = supabase
      .from('members')
      .select('id, name, email, token, last_active, created_at, coach_id, coaches(name)')
      .order('created_at', { ascending: false })

    if (!coach.is_admin) {
      query = query.eq('coach_id', coach.id)
    }

    const { data: members, error } = await query
    if (error) return json(500, { error: error.message })

    return json(200, { members })
  }

  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  const body = JSON.parse(event.body || '{}')
  const { action } = body

  // ── Invite / create a new member ──
  if (action === 'invite') {
    const { email, name, coachId } = body
    if (!email) return json(400, { error: 'Email is required' })

    const normEmail = email.toLowerCase().trim()

    // Check if already exists
    const { data: existing } = await supabase
      .from('members')
      .select('id, token')
      .eq('email', normEmail)
      .maybeSingle()

    if (existing) {
      return json(200, {
        member: existing,
        trackerUrl: `${TRACKER_BASE_URL}?uid=${existing.token}`,
        alreadyExists: true,
      })
    }

    const token = crypto.randomUUID()
    const assignedCoachId = coachId || coach.id

    const { data: member, error } = await supabase
      .from('members')
      .insert({
        name: name || normEmail.split('@')[0],
        email: normEmail,
        token,
        coach_id: assignedCoachId,
        created_at: new Date().toISOString(),
      })
      .select('id, token')
      .single()

    if (error) return json(500, { error: error.message })

    // Initialise empty tracker data
    await supabase.from('tracker_data').insert({ member_id: member.id, data: {} })

    return json(200, {
      member,
      trackerUrl: `${TRACKER_BASE_URL}?uid=${token}`,
      alreadyExists: false,
    })
  }

  // ── Reassign a member to a different coach ──
  if (action === 'reassign') {
    const { memberId, toCoachId } = body
    if (!memberId) return json(400, { error: 'memberId required' })

    const { error } = await supabase
      .from('members')
      .update({ coach_id: toCoachId || null })
      .eq('id', memberId)

    if (error) return json(500, { error: error.message })
    return json(200, { success: true })
  }

  // ── Remove (unassign) a member from this coach ──
  if (action === 'unassign') {
    const { memberId } = body
    if (!memberId) return json(400, { error: 'memberId required' })

    const { error } = await supabase
      .from('members')
      .update({ coach_id: null })
      .eq('id', memberId)

    if (error) return json(500, { error: error.message })
    return json(200, { success: true })
  }

  // ── List all coaches (for reassignment dropdown) ──
  if (action === 'listCoaches') {
    const { data: coaches, error } = await supabase
      .from('coaches')
      .select('id, name, email')
      .order('name')

    if (error) return json(500, { error: error.message })
    return json(200, { coaches })
  }

  return json(400, { error: `Unknown action: ${action}` })
}
