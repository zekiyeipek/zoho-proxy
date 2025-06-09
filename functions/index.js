import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const {client_id, client_secret, refresh_token, account_id} =
  functions.config().zoho;

const app = express();
app.use(cors({origin: true}));
app.use(express.json());

app.get('/', (req, res) => res.send('🚀 Zoho proxy alive'));

async function getAccessToken() {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id,
    client_secret,
    refresh_token,
  }).toString();

  const r = await fetch('https://accounts.zoho.eu/oauth/v2/token', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: params,
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(JSON.stringify(j));
  return j.access_token;
}

app.post('/sendMail', async (req, res) => {
  const {name, email, message} = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({success: false, error: 'Eksik parametre'});
  }
  try {
    const token = await getAccessToken();
    const mailRes = await fetch(
        `https://mail.zoho.eu/api/accounts/${account_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fromAddress: 'info@netmedya.tr',
            toAddress: 'info@netmedya.tr',
            subject: 'Yeni İletişim Formu',
            content: `Ad: ${name}\nE-posta: ${email}\n\n${message}`,
          }),
        },
    );
    if (mailRes.ok) return res.json({success: true});
    const err = await mailRes.text();
    return res.status(mailRes.status).json({success: false, error: err});
  } catch (e) {
    console.error(e);
    return res.status(500).json({success: false, error: e.message});
  }
});

export const api = functions.https.onRequest(app);
