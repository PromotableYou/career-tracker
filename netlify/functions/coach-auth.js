const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  const body = JSON.parse(event.body || '{}')
  const { action = 'login' } = body

  // ── Login ──────────────────────────────────────────────────────
  if (action === 'login') {
    const { email, password } = body
    if (!email || !password) return json(400, { error: 'Email and password required' })

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.session) return json(401, { error: 'Invalid email or password' })

    const { data: coach } = await supabase
      .from('coaches')
      .select('id, name, email, is_admin')
      .eq('id', data.user.id)
      .maybeSingle()

    if (!coach) return json(403, { error: 'This account is not registered as a coach. Contact your administrator.' })

    return json(200, {
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      coach,
    })
  }

  // ── Refresh token ──────────────────────────────────────────────
  if (action === 'refresh') {
    const { refreshToken } = body
    if (!refreshToken) return json(400, { error: 'Refresh token required' })

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })
    if (error || !data.session) return json(401, { error: 'Session expired — please log in again' })

    return json(200, {
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    })
  }

  // ── Register new coach (protected by COACH_SECRET for admin bootstrap) ──
  if (action === 'register') {
    const { email, password, name, adminKey } = body
    if (!adminKey || adminKey !== process.env.COACH_SECRET) {
      return json(401, { error: 'Admin key required to register coaches' })
    }
    if (!email || !password || !name) return json(400, { error: 'email, password and name are required' })

    const { data: existing } = await supabase.auth.admin.getUserByEmail(email)
    let userId

    if (existing?.user) {
      userId = existing.user.id
    } else {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (createError) return json(400, { error: createError.message })
      userId = created.user.id
    }

    const { error: upsertError } = await supabase
      .from('coaches')
      .upsert({ id: userId, name, email: email.toLowerCase() }, { onConflict: 'id' })

    if (upsertError) return json(500, { error: upsertError.message })

    return json(200, { success: true, message: `Coach account created for ${email}` })
  }

  return json(400, { error: `Unknown action: ${action}` })
}
