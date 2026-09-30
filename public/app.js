const dashboardUrl =
  "https://public.tableau.com/views/RegionalSampleWorkbook/Storms";

const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const sendButton = document.getElementById("send-button");
const messages = document.getElementById("messages");
const status = document.getElementById("status");

const history = [];

function addMessage(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `message ${role}`;
  bubble.textContent = text;
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

if (form && input && sendButton && messages && status) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const question = input.value.trim();
    if (!question) return;

    const priorHistory = history.slice(-6);

    addMessage("user", question);
    input.value = "";
    input.disabled = true;
    sendButton.disabled = true;
    status.textContent = "Analyzing...";

    const pending = addMessage("assistant", "Reading the dashboard...");

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
      input.focus();
    }
  });
}
