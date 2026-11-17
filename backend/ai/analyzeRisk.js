const { calculateRisk } = require("./riskCalculator");
const { aiExplain } = require("./aiExplain");

function analyzeRisk({
  email,
  platforms = [],
  breaches = [],
  breachLookupStatus
}) {
  const analysisAvailable = breachLookupStatus === "available";
  const { riskScore, riskLevel } = analysisAvailable
    ? calculateRisk({ platforms, breaches })
    : { riskScore: null, riskLevel: "UNKNOWN" };

  const explanation = aiExplain({
    email,
    platforms,
    breaches,
    breachLookupStatus,
    riskScore,
    riskLevel
  });

  return {
    riskScore,
    riskLevel,
    analysisAvailable,
    explanation: explanation.explanation,
    recommendations: explanation.recommendations,
    aiModel: explanation.aiModel
  };
}

module.exports = { analyzeRisk };
