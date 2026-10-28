/* Techtlee - contact form endpoint (Vercel serverless function).
   Sends the enquiry through Resend to CONTACT_TO; "Reply" in the mail client
   answers the visitor directly.
   Env (Vercel → Settings → Environment Variables):
     RESEND_API_KEY  required
     CONTACT_TO      default info@techtlee.com (comma-separated list allowed)
     CONTACT_FROM    default "Techtlee web <web@techtlee.com>" - domain must be verified in Resend */
const TO = (process.env.CONTACT_TO || 'info@techtlee.com').split(',').map(s => s.trim()).filter(Boolean);
const FROM = process.env.CONTACT_FROM || 'Techtlee web <web@techtlee.com>';
const EMAIL_RE = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[^\s@<>()",;]{2,}$/;

function clean(v, max) { return String(v == null ? '' : v).replace(/\r/g, '').trim().slice(0, max); }

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }

  /* only accept posts from the site itself */
  const origin = req.headers.origin || '';
  try { if (origin && new URL(origin).host !== req.headers.host) return res.status(403).json({ ok: false }); }
  catch (e) { return res.status(403).json({ ok: false }); }

  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }

  /* honeypot: bots fill every field; pretend success */
  if (clean(b.website, 200)) return res.status(200).json({ ok: true });

  const name = clean(b.name, 200).replace(/\n/g, ' ');
  const email = clean(b.email, 254);
  const message = clean(b.message, 5000);
  const lang = b.lang === 'en' ? 'en' : 'cs';
  if (!name || !EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: 'invalid' });

  if (!process.env.RESEND_API_KEY) { console.error('RESEND_API_KEY missing'); return res.status(500).json({ ok: false }); }

  const text = [
    'Jméno: ' + name,
    'E-mail: ' + email,
    'Jazyk webu: ' + lang.toUpperCase(),
    '',
    message || '(bez zprávy)',
    '',
    '-- ',
    'Odesláno z formuláře na techtlee.com. Odpověď půjde přímo odesílateli.'
  ].join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: TO, reply_to: email, subject: 'Poptávka z webu - ' + name, text })
    });
    if (!r.ok) { console.error('Resend', r.status, await r.text()); return res.status(502).json({ ok: false }); }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Resend fetch failed', e);
    return res.status(502).json({ ok: false });
  }
};
