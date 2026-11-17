require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { analyzeRisk } = require("./ai/analyzeRisk");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HIBP_API_URL = "https://haveibeenpwned.com/api/v3/breachedaccount";

app.use(cors());
app.use(express.json({ limit: "10kb" }));

function isValidEmail(email) {
  return typeof email === "string" &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function lookupBreaches(email) {
  const apiKey = process.env.HIBP_API_KEY;
  if (!apiKey) {
    return { status: "not_configured", breaches: [] };
  }

  try {
    const response = await axios.get(
      `${HIBP_API_URL}/${encodeURIComponent(email)}`,
      {
        headers: {
          "hibp-api-key": apiKey,
          "user-agent": "WatchDog-Chakravyuh"
        },
        params: { truncateResponse: false },
        timeout: 10000,
        validateStatus: status => status === 200 || status === 404
      }
    );

    if (response.status === 404) {
      return { status: "available", breaches: [] };
    }

    const breaches = Array.isArray(response.data)
      ? response.data.map(breach => ({
          name: breach.Name,
          breachDate: breach.BreachDate
        }))
      : [];

    return { status: "available", breaches };
  } catch (error) {
    const statusCode = error.response?.status;
    console.warn(
      `Have I Been Pwned lookup failed${statusCode ? ` (HTTP ${statusCode})` : ""}.`
    );
    return { status: "unavailable", breaches: [] };
  }
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "WatchDog backend is running",
    breachLookupConfigured: Boolean(process.env.HIBP_API_KEY),
    timestamp: new Date().toISOString()
  });
});

app.post("/api/scan-email", async (req, res) => {
  const { email, consent } = req.body || {};

  if (consent !== true) {
    return res.status(400).json({
      error: "Please confirm that this is your email address or that you have permission to check it."
    });
  }

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const breachLookup = await lookupBreaches(normalizedEmail);
  const analysis = analyzeRisk({
    email: normalizedEmail,
    platforms: [],
    breaches: breachLookup.breaches,
    breachLookupStatus: breachLookup.status
  });

  res.json({
    success: true,
    email: normalizedEmail,
    timestamp: new Date().toISOString(),
    platforms: [],
    platformCount: 0,
    platformLookupStatus: "not_configured",
    breaches: breachLookup.breaches,
    breachCount: breachLookup.breaches.length,
    breachLookupStatus: breachLookup.status,
    ...analysis
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`WatchDog backend listening at http://localhost:${PORT}`);
    console.log(
      `Have I Been Pwned breach lookup: ${process.env.HIBP_API_KEY ? "configured" : "not configured"}`
    );
  });
}

module.exports = app;
