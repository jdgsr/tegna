const dashboardUrl =
  "https://public.tableau.com/views/RegionalSampleWorkbook/Storms";

const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const sendButton = document.getElementById("send-button");
const messages = document.getElementById("messages");
const status = document.getElementById("status");
const layout = document.getElementById("layout");
const toggleButton = document.getElementById("toggle-panel");
const iframeWrap = document.getElementById("iframe-wrap");
const chips = document.querySelectorAll(".chip");
const statusDot = document.querySelector(".status-dot");
const statusLabel = document.querySelector(".kpi:last-child .kpi-value");

const history = [];

function addMessage(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `message ${role}`;
  bubble.textContent = text;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

function addTypingIndicator() {
  const bubble = document.createElement("div");
  bubble.className = "message assistant";
  bubble.innerHTML =
    '<span class="typing-dots"><span></span><span></span><span></span></span>';
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

document
  .getElementById("share-dashboard")
  ?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(dashboardUrl);
      alert("Dashboard link copied.");
    } catch (error) {
      window.open(dashboardUrl, "_blank", "noopener,noreferrer");
    }
  });

document
  .getElementById("dashboard-info")
  ?.addEventListener("click", () => {
    alert(
      "Storm Tracking is a Tableau Public dashboard embedded in this page. " +
      "The AI assistant analyzes a fresh image of its default public view. " +
      "It cannot see filter changes made inside the embedded dashboard."
    );
  });

toggleButton?.addEventListener("click", () => {
  const collapsed = layout.classList.toggle("collapsed");
  toggleButton.textContent = collapsed ? "▶" : "◀";
  toggleButton.setAttribute("aria-expanded", String(!collapsed));
  toggleButton.title = collapsed ? "Expand assistant panel" : "Collapse assistant panel";
  toggleButton.setAttribute(
    "aria-label",
    collapsed ? "Expand assistant panel" : "Collapse assistant panel"
  );
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const prompt = chip.dataset.prompt;
    if (!prompt || !input) return;
    input.value = prompt;
    form?.requestSubmit();
  });
});

async function submitQuestion(question) {
  const priorHistory = history.slice(-6);

  addMessage("user", question);
  input.value = "";
  input.disabled = true;
  sendButton.disabled = true;
  status.textContent = "Analyzing...";
  iframeWrap?.classList.add("scanning");

  const pending = addTypingIndicator();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question,
        history: priorHistory
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Could not get an answer.");
    }

    pending.textContent = result.answer;

    history.push(
      { role: "user", content: question },
      { role: "assistant", content: result.answer }
    );
  } catch (error) {
    pending.textContent =
      error.message || "Something went wrong. Please try again.";
  } finally {
    input.disabled = false;
    sendButton.disabled = false;
    status.textContent = "Ready";
    iframeWrap?.classList.remove("scanning");
    input.focus();
  }
}

if (form && input && sendButton && messages && status) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    await submitQuestion(question);
  });
}

async function pollHealth() {
  try {
    const response = await fetch("/api/health");
    const health = await response.json();

    if (statusDot) {
      statusDot.classList.toggle("degraded", health.status !== "ok");
    }
    if (statusLabel) {
      statusLabel.lastChild.textContent =
        health.status === "ok" ? " Assistant Live" : " Assistant Degraded";
    }
  } catch {
    if (statusDot) statusDot.classList.add("degraded");
    if (statusLabel) statusLabel.lastChild.textContent = " Assistant Offline";
  }
}

pollHealth();
setInterval(pollHealth, 30_000);