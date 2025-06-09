import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, ACCOUNT_ID } = process.env;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !ACCOUNT_ID) {
  console.error("‼️ .env dosyasında eksik tanım var.");
  process.exit(1);
}

const app = express();
app.use(cors()); // tüm origin'lere izin verir
app.use(express.json()); // JSON body parsing

// Sağlık kontrolü
app.get("/", (req, res) => res.send("Zoho proxy alive"));

// 1) Zoho’dan access_token al
async function getAccessToken() {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
  }).toString();

  const res = await fetch("https://accounts.zoho.eu/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const json = await res.json();
  if (!json.access_token) {
    throw new Error(`Zoho Token Error: ${JSON.stringify(json)}`);
  }
  return json.access_token;
}

// 2) /sendMail endpoint’i
app.post("/sendMail", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: "Eksik parametre" });
    }

    const token = await getAccessToken();
    const mailRes = await fetch(
      `https://mail.zoho.eu/api/accounts/${ACCOUNT_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromAddress: "info@netmedya.tr",
          toAddress: "info@netmedya.tr",
          subject: "Yeni İletişim Formu",
          content: `Ad: ${name}\nE-posta: ${email}\n\n${message}`,
        }),
      }
    );

    // Zoho 200 veya 201 dönebilir, bu yüzden mailRes.ok kullanıyoruz
    if (mailRes.ok) {
      return res.json({ success: true });
    } else {
      const err = await mailRes.text();
      return res.status(mailRes.status).json({ success: false, error: err });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3) Sunucuyu ayağa kaldır
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Proxy server running at http://localhost:${PORT}`)
);
