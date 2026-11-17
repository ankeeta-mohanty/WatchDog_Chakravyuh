const API_URL = "http://localhost:5000";

document.addEventListener("DOMContentLoaded", () => {
  const scanForm = document.getElementById("scanForm");
  if (scanForm) scanForm.addEventListener("submit", handleEmailScan);

  document.querySelectorAll(".scan-another-btn, #scanAnotherBtnBottom")
    .forEach(button => button.addEventListener("click", resetToScanForm));

  const downloadBtn = document.getElementById("downloadBtn");
  if (downloadBtn) downloadBtn.addEventListener("click", handleDownloadReport);
});

async function handleEmailScan(event) {
  event.preventDefault();

  const email = document.getElementById("emailInput").value.trim();
  const consent = document.getElementById("consentInput").checked;
  const submitButton = document.getElementById("submitBtn");
  const loadingContainer = document.getElementById("loadingContainer");

  if (!isValidEmail(email)) {
    showError("Please enter a valid email address.");
    return;
  }

  if (!consent) {
    showError("Confirm that you own or have permission to check this address.");
    return;
  }

  submitButton.disabled = true;
  submitButton.style.opacity = "0.5";
  submitButton.textContent = "⏳";
  loadingContainer.style.display = "block";

  try {
    let response;
    try {
      response = await fetch(`${API_URL}/api/scan-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent })
      });
    } catch {
      throw new Error("Cannot connect to the backend at localhost:5000. Start it with npm start.");
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("The backend returned an invalid response. Check its terminal for errors.");
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || "Scan failed.");
    }

    displayResults(data);
    setTimeout(() => {
      document.getElementById("resultsSection").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 300);
  } catch (error) {
    console.error("Email scan failed:", error);
    showError(error.message);
  } finally {
    loadingContainer.style.display = "none";
    submitButton.disabled = false;
    submitButton.style.opacity = "1";
    submitButton.textContent = "→";
  }
}

function displayResults(data) {
  document.getElementById("resultsSection").style.display = "block";
  displayEmailInfo(data);
  displayRiskScore(data);
  displayAIExplanation(data);
  displayExposureSignals(data);
  displayRecommendations(data);
}

function displayEmailInfo(data) {
  document.getElementById("emailDisplay").textContent = data.email;
  document.getElementById("timeDisplay").textContent =
    new Date(data.timestamp).toLocaleString();
}

function displayRiskScore(data) {
  const scoreNumber = document.getElementById("scoreNumber");
  const riskBadge = document.getElementById("riskBadge");
  const warningIcon = document.getElementById("warningIcon");
  const riskSection = document.getElementById("riskScoreSection");
  const scoreOutOf = document.getElementById("scoreOutOf");

  if (data.riskScore === null || data.riskScore === undefined) {
    scoreNumber.textContent = "N/A";
    scoreOutOf.style.display = "none";
    riskBadge.textContent = "CHECK UNAVAILABLE";
    riskBadge.className = "risk-badge unknown-risk";
    warningIcon.textContent = "ℹ️";
    riskSection.style.borderColor = "#64748b";
    return;
  }

  scoreOutOf.style.display = "";
  animateNumber(scoreNumber, 0, data.riskScore, 800);
  riskBadge.textContent = `${data.riskLevel} INDICATOR`;
  riskBadge.className = `risk-badge ${data.riskLevel.toLowerCase()}-risk`;

  if (data.riskLevel === "HIGH") {
    warningIcon.textContent = "🚨";
    riskSection.style.borderColor = "#ef4444";
  } else if (data.riskLevel === "MEDIUM") {
    warningIcon.textContent = "⚠️";
    riskSection.style.borderColor = "#f59e0b";
  } else {
    warningIcon.textContent = "✅";
    riskSection.style.borderColor = "#10b981";
  }
}

function displayAIExplanation(data) {
  document.getElementById("aiExplanation").style.display = "block";
  document.getElementById("explanationText").textContent = data.explanation;
  document.getElementById("platformCountDisplay").textContent =
    data.platformLookupStatus === "available" ? data.platformCount : "Not checked";
  document.getElementById("breachCountDisplay").textContent =
    data.breachLookupStatus === "available" ? data.breachCount : "Not checked";
  document.getElementById("aiModelDisplay").textContent =
    `ℹ️ ${data.aiModel || "Rule-based guidance"}`;

  document.getElementById("platformVisibility").textContent =
    data.platformLookupStatus === "available" ? "Checked" : "Not checked";
  document.getElementById("breachExposure").textContent =
    data.breachLookupStatus === "unavailable"
      ? "Lookup unavailable"
      : data.breachLookupStatus === "not_configured"
        ? "Not configured"
        : data.breachCount > 0
          ? "Detected"
          : "No records found";
  document.getElementById("publicIntel").textContent = "Not checked";
  document.getElementById("overallRisk").textContent =
    data.riskLevel === "UNKNOWN" ? "Unknown" : data.riskLevel;
  document.getElementById("exposureSummary").style.display = "block";
}

function displayExposureSignals(data) {
  const container = document.getElementById("platformsContainer");
  container.replaceChildren();

  const platformNotice = document.createElement("p");
  platformNotice.className = "breach-data";
  platformNotice.textContent =
    "Account-registration lookups are not performed by this version.";
  container.appendChild(platformNotice);

  if (data.breachLookupStatus !== "available") {
    const notice = document.createElement("p");
    notice.className = "breach-data";
    notice.textContent = data.breachLookupStatus === "not_configured"
      ? "Breach records were not checked. Configure HIBP_API_KEY in the backend."
      : "The breach-data provider could not be reached. No conclusion can be drawn.";
    container.appendChild(notice);
    return;
  }

  if (data.breaches.length === 0) {
    const notice = document.createElement("p");
    notice.className = "breach-data";
    notice.textContent =
      "The checked provider returned no known breach records. This is not a guarantee of no exposure.";
    container.appendChild(notice);
    return;
  }

  data.breaches.forEach(breach => {
    const card = document.createElement("div");
    card.className = "breach-card";
    const title = document.createElement("h3");
    title.className = "breach-title";
    title.textContent = breach.name;
    const date = document.createElement("p");
    date.className = "breach-data";
    date.textContent = breach.breachDate
      ? `Breach date: ${breach.breachDate}`
      : "Breach date not provided";
    card.append(title, date);
    container.appendChild(card);
  });
}

function displayRecommendations(data) {
  const container = document.getElementById("recommendationsContainer");
  container.replaceChildren();

  data.recommendations.forEach((recommendation, index) => {
    const item = document.createElement("div");
    item.className = "ai-rec-item";
    item.style.animationDelay = `${index * 0.1}s`;

    const number = document.createElement("span");
    number.className = "rec-number";
    number.textContent = String(index + 1);
    const text = document.createElement("span");
    text.className = "rec-text";
    text.textContent = recommendation;

    item.append(number, text);
    container.appendChild(item);
  });
}

function animateNumber(element, start, end, duration) {
  let startTime = null;
  function animate(time) {
    if (!startTime) startTime = time;
    const progress = Math.min((time - startTime) / duration, 1);
    element.textContent = String(Math.floor(progress * (end - start) + start));
    if (progress < 1) requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function showError(message) {
  const oldMessage = document.querySelector(".error-message");
  if (oldMessage) oldMessage.remove();

  const messageElement = document.createElement("div");
  messageElement.className = "error-message";
  messageElement.textContent = message;
  document.getElementById("loadingContainer").after(messageElement);
  setTimeout(() => messageElement.remove(), 7000);
}

function resetToScanForm() {
  document.getElementById("resultsSection").style.display = "none";
  document.getElementById("emailInput").value = "";
  document.getElementById("consentInput").checked = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleDownloadReport() {
  alert("Report downloads are not available yet.");
}
