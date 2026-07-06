const { verifyCoach, supabase, json } = require('./lib/verify-coach')

exports.handler = async (event) => {
  const auth = await verifyCoach(event)
  if (auth.error) return json(auth.statusCode, { error: auth.error })
  const { coach } = auth

  // ── GET: list actions for a member ──
  if (event.httpMethod === 'GET') {
    const memberId = event.queryStringParameters?.memberId
    if (!memberId) return json(400, { error: 'memberId required' })

    const { data: actions, error } = await supabase
      .from('member_actions')
      .select('id, coach_id, title, description, due_date, status, created_at, completed_at, coaches(name)')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })

    if (error) return json(500, { error: error.message })
    return json(200, { actions })
  }

  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  const body = JSON.parse(event.body || '{}')
  const { action } = body

  // ── Create an action item ──
  if (action === 'create') {
    const { memberId, title, description, dueDate } = body
    if (!memberId || !title) return json(400, { error: 'memberId and title required' })

    const { data: item, error } = await supabase
      .from('member_actions')
      .insert({
        coach_id: coach.id,
        member_id: memberId,
        title,
        description: description || null,
        due_date: dueDate || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) return json(500, { error: error.message })
    return json(200, { item })
  }

  // ── Mark action complete ──
  if (action === 'complete') {
    const { actionId } = body
    if (!actionId) return json(400, { error: 'actionId required' })

    const { data: item, error } = await supabase
      .from('member_actions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', actionId)
      .eq('coach_id', coach.id)
      .select()
      .single()

    if (error) return json(500, { error: error.message })
    return json(200, { item })
  }

  // ── Reopen a completed action ──
  if (action === 'reopen') {
    const { actionId } = body
    if (!actionId) return json(400, { error: 'actionId required' })

    const { data: item, error } = await supabase
      .from('member_actions')
      .update({ status: 'pending', completed_at: null })
      .eq('id', actionId)
      .eq('coach_id', coach.id)
      .select()
      .single()

    if (error) return json(500, { error: error.message })
    return json(200, { item })
  }

  // ── Delete an action ──
  if (action === 'delete') {
    const { actionId } = body
    if (!actionId) return json(400, { error: 'actionId required' })

    const { error } = await supabase
      .from('member_actions')
      .delete()
      .eq('id', actionId)
      .eq('coach_id', coach.id)

    if (error) return json(500, { error: error.message })
    return json(200, { success: true })
  }

  return json(400, { error: `Unknown action: ${action}` })
}
