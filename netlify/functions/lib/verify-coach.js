const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

/**
 * Verify a coach JWT from the Authorization header.
 * Returns { coach, supabase } on success or { error, statusCode } on failure.
 */
async function verifyCoach(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return { error: 'No token provided', statusCode: 401 }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return { error: 'Invalid or expired session — please log in again', statusCode: 401 }

  const { data: coach, error: coachError } = await supabase
    .from('coaches')
    .select('id, name, email, is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (coachError || !coach) return { error: 'Account is not registered as a coach', statusCode: 403 }

  return { coach, supabase }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

module.exports = { verifyCoach, supabase, json }
