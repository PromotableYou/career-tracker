const { verifyCoach, supabase, json } = require('./lib/verify-coach')

const SESSION_TYPES = [
  'General Q&A',
  'Confidence & Clarity',
  'Group Coaching',
  'Resumes & Interviews',
  '1:1 Coaching',
  'Check-in',
  'Other',
]

exports.handler = async (event) => {
  const auth = await verifyCoach(event)
  if (auth.error) return json(auth.statusCode, { error: auth.error })
  const { coach } = auth

  // ── GET: list sessions for a member ──
  if (event.httpMethod === 'GET') {
    const memberId = event.queryStringParameters?.memberId
    if (!memberId) return json(400, { error: 'memberId required' })

    const { data: sessions, error } = await supabase
      .from('coach_sessions')
      .select('id, coach_id, session_date, session_type, notes, key_takeaway, next_steps, created_at, coaches(name)')
      .eq('member_id', memberId)
      .order('session_date', { ascending: false })

    if (error) return json(500, { error: error.message })
    return json(200, { sessions })
  }

  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  const body = JSON.parse(event.body || '{}')
  const { action } = body

  // ── Create a session ──
  if (action === 'create') {
    const { memberId, sessionDate, sessionType, notes, keyTakeaway, nextSteps } = body
    if (!memberId) return json(400, { error: 'memberId required' })

    const { data: session, error } = await supabase
      .from('coach_sessions')
      .insert({
        coach_id: coach.id,
        member_id: memberId,
        session_date: sessionDate || new Date().toISOString().split('T')[0],
        session_type: sessionType || 'General Q&A',
        notes: notes || null,
        key_takeaway: keyTakeaway || null,
        next_steps: nextSteps || null,
      })
      .select()
      .single()

    if (error) return json(500, { error: error.message })
    return json(200, { session })
  }

  // ── Update a session ──
  if (action === 'update') {
    const { sessionId, sessionDate, sessionType, notes, keyTakeaway, nextSteps } = body
    if (!sessionId) return json(400, { error: 'sessionId required' })

    const update = {}
    if (sessionDate !== undefined) update.session_date = sessionDate
    if (sessionType !== undefined) update.session_type = sessionType
    if (notes !== undefined) update.notes = notes
    if (keyTakeaway !== undefined) update.key_takeaway = keyTakeaway
    if (nextSteps !== undefined) update.next_steps = nextSteps

    const { data: session, error } = await supabase
      .from('coach_sessions')
      .update(update)
      .eq('id', sessionId)
      .eq('coach_id', coach.id)
      .select()
      .single()

    if (error) return json(500, { error: error.message })
    return json(200, { session })
  }

  // ── Delete a session ──
  if (action === 'delete') {
    const { sessionId } = body
    if (!sessionId) return json(400, { error: 'sessionId required' })

    const { error } = await supabase
      .from('coach_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('coach_id', coach.id)

    if (error) return json(500, { error: error.message })
    return json(200, { success: true })
  }

  return json(400, { error: `Unknown action: ${action}` })
}
