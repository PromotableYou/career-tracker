const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Called when a member says "resend my link" — returns token so GHL can email it
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const { email } = JSON.parse(event.body || '{}')
  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email required' }) }
  }

  const { data: member } = await supabase
    .from('members')
    .select('token, name')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (!member) {
    // Don't reveal whether email exists — just return success
    return { statusCode: 200, body: JSON.stringify({ success: true }) }
  }

  const trackerUrl = `https://pyimpacttracker.netlify.app?uid=${member.token}`

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, tracker_url: trackerUrl, name: member.name }),
  }
}
