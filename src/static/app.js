document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // escape HTML to avoid injection when rendering participant names/emails
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // clear previous options except the placeholder
      Array.from(activitySelect.querySelectorAll("option"))
        .filter(o => o.value !== "")
        .forEach(o => o.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHtml =
          details.participants && details.participants.length
            ? `<h5 class="participants-title">Participants</h5><ul class="participants-list">${details.participants
                .map(p => `<li class="participant-item"><span class="participant-email">${escapeHtml(p)}</span><button class="participant-delete" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(p)}" title="Unregister">✖</button></li>`)
                .join("")}</ul>`
            : `<h5 class="participants-title">Participants</h5><p class="info">No participants yet.</p>`;

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Attach unregister handlers for participant delete buttons
        activityCard.querySelectorAll(".participant-delete").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const activityName = btn.dataset.activity;
            const email = btn.dataset.email;
            try {
              const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, { method: "POST" });
              const res = await resp.json();
              if (resp.ok) {
                messageDiv.textContent = res.message;
                messageDiv.className = "success";
                // Refresh activities to update UI
                fetchActivities();
              } else {
                messageDiv.textContent = res.detail || "Failed to unregister";
                messageDiv.className = "error";
              }
              messageDiv.classList.remove("hidden");
              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 5000);
            } catch (err) {
              console.error("Error unregistering:", err);
              messageDiv.textContent = "Failed to unregister. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the newly-signed-up participant appears
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
