function aiExplain({ breaches, breachLookupStatus, riskLevel }) {
  if (breachLookupStatus !== "available") {
    return {
      explanation:
        "A breach check could not be completed, so this report cannot determine your breach exposure or assign a reliable risk score. Configure the official breach-data API to enable this check.",
      recommendations: [
        "Use a unique password for every account",
        "Enable two-factor authentication on important accounts",
        "Check the provider's account security page directly"
      ],
      aiModel: "Rule-based guidance"
    };
  }

  const explanation = breaches.length
    ? `The breach database returned ${breaches.length} known breach record${breaches.length === 1 ? "" : "s"} for this email. This indicator is based only on the checked breach source and does not represent every kind of online exposure.`
    : "The checked breach database returned no known breach records for this email. This is not a guarantee that the address has never been exposed elsewhere.";

  const recommendations = breaches.length
    ? [
        "Change reused passwords on affected accounts",
        "Enable two-factor authentication, especially on your email account",
        "Be alert for targeted phishing messages"
      ]
    : [
        "Continue using unique passwords for each account",
        "Enable two-factor authentication on important accounts",
        "Stay alert for unexpected password-reset or sign-in messages"
      ];

  return {
    explanation: `${explanation} The source-based indicator is ${riskLevel.toLowerCase()}.`,
    recommendations,
    aiModel: "Rule-based guidance"
  };
}

module.exports = { aiExplain };
