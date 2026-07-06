const { verifyCoach, supabase, json } = require('./lib/verify-coach')

exports.handler = async (event) => {
  const auth = await verifyCoach(event)
  if (auth.error) return json(auth.statusCode, { error: auth.error })
  const { coach } = auth

  // ── GET: list recent notifications for this coach ──
  if (event.httpMethod === 'GET') {
    const { data: notifications, error } = await supabase
      .from('coach_notifications')
      .select('id, member_id, type, title, message, read, created_at, members(name, email)')
      .eq('coach_id', coach.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return json(500, { error: error.message })

    const unreadCount = (notifications || []).filter(n => !n.read).length

    return json(200, { notifications: notifications || [], unreadCount })
  }

  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  const body = JSON.parse(event.body || '{}')
  const { action } = body

  // ── Mark one notification read ──
  if (action === 'markRead') {
    const { notificationId } = body
    if (!notificationId) return json(400, { error: 'notificationId required' })

    const { error } = await supabase
      .from('coach_notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('coach_id', coach.id)

    if (error) return json(500, { error: error.message })
    return json(200, { success: true })
  }

  // ── Mark all notifications read ──
  if (action === 'markAllRead') {
    const { error } = await supabase
      .from('coach_notifications')
      .update({ read: true })
      .eq('coach_id', coach.id)
      .eq('read', false)

    if (error) return json(500, { error: error.message })
    return json(200, { success: true })
  }

  return json(400, { error: `Unknown action: ${action}` })
}
