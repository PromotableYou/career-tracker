const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const body = JSON.parse(event.body || '{}')

    const email = (body.email || body.contact_email || '').toLowerCase().trim()
    const firstName = body.first_name || body.firstName || ''
    const lastName = body.last_name || body.lastName || ''
    const name = [firstName, lastName].filter(Boolean).join(' ') || ''
    const ghlContactId = body.contact_id || body.id || ''

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No email in webhook payload' }) }
    }

    // Check if member already exists
    const { data: existing } = await supabase
      .from('members')
      .select('id, token')
      .eq('email', email)
      .maybeSingle()

    let token

    if (existing) {
      token = existing.token
    } else {
      // Create new member
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({ email, name, ghl_contact_id: ghlContactId })
        .select('id, token')
        .single()

      if (memberError) throw memberError
      token = member.token

      // Initialise empty tracker data
      await supabase
        .from('tracker_data')
        .insert({ member_id: member.id, data: {} })
    }

    const trackerUrl = `https://pyimpacttracker.netlify.app?uid=${token}`

    // Return the URL so GHL workflow can map it to a custom field and send the email
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        tracker_url: trackerUrl,
        email,
        name,
      }),
    }
  } catch (err) {
    console.error('Webhook error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
