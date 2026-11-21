const API_URL = "https://campus-maintenance-api-56nx.onrender.com/api/records";

const form = document.getElementById("maintenance-form");
const formHeading = document.getElementById("form-heading");
const recordIdField = document.getElementById("record-id");
const titleField = document.getElementById("title");
const categoryField = document.getElementById("category");
const statusField = document.getElementById("status");
const descriptionField = document.getElementById("description");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const refreshBtn = document.getElementById("refresh-btn");
const recordsContainer = document.getElementById("records-container");
const feedback = document.getElementById("feedback");

let recordsCache = [];

function showFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.style.color = isError ? "#b91c1c" : "#15803d";
}

function resetFormState() {
  recordIdField.value = "";
  form.reset();
  statusField.value = "Pending";
  formHeading.textContent = "Submit Maintenance Request";
  submitBtn.textContent = "Submit Request";
  cancelBtn.classList.add("hidden");
}

function escapeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function beginEdit(id) {
  const item = recordsCache.find((rec) => rec.id === id);
  if (!item) return;

  recordIdField.value = item.id;
  titleField.value = item.title;
  categoryField.value = item.category;
  statusField.value = item.status;
  descriptionField.value = item.description;

  formHeading.textContent = `Update Request #${item.id}`;
  submitBtn.textContent = "Update Request";
  cancelBtn.classList.remove("hidden");
  titleField.focus();
}

function renderList(items) {
  recordsCache = items;

  if (!Array.isArray(items) || items.length === 0) {
    recordsContainer.innerHTML = '<p class="muted">No maintenance requests found.</p>';
    return;
  }

  recordsContainer.innerHTML = items
    .map(
      (item) => `
      <article class="record-card">
        <div class="record-top">
          <span class="record-title">#${item.id} — ${escapeText(item.title)}</span>
          <strong>${escapeText(item.status)}</strong>
        </div>
        <div class="record-meta">Category: ${escapeText(item.category)}</div>
        <p class="record-desc">${escapeText(item.description)}</p>
        <div class="record-actions">
          <button type="button" class="btn btn-secondary" onclick="beginEdit(${item.id})">
            Edit
          </button>
          <button type="button" class="btn btn-danger" onclick="removeRecord(${item.id})">
            Delete
          </button>
        </div>
      </article>
    `
    )
    .join("");
}

async function fetchAllRecords() {
  recordsContainer.innerHTML = '<p class="muted">Loading maintenance records...</p>';
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error(`Could not load records (HTTP ${res.status})`);
    }
    const data = await res.json();
    renderList(data);
  } catch (err) {
    recordsContainer.innerHTML = `<p class="muted">Error: ${escapeText(err.message)}</p>`;
  }
}

async function removeRecord(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || `Failed to delete record (HTTP ${res.status})`);
    }
    showFeedback(`Deleted request #${id}.`);
    await fetchAllRecords();
  } catch (err) {
    showFeedback(err.message, true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    title: titleField.value.trim(),
    category: categoryField.value,
    description: descriptionField.value.trim(),
    status: statusField.value,
  };

  const editingId = recordIdField.value;
  const endpoint = editingId ? `${API_URL}/${editingId}` : API_URL;
  const method = editingId ? "PUT" : "POST";

  try {
    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || `Request failed (HTTP ${res.status})`);
    }

    showFeedback(
      editingId ? `Updated request #${editingId}.` : "New maintenance request added."
    );
    resetFormState();
    await fetchAllRecords();
  } catch (err) {
    showFeedback(err.message, true);
  }
});

cancelBtn.addEventListener("click", resetFormState);
refreshBtn.addEventListener("click", fetchAllRecords);

window.beginEdit = beginEdit;
window.removeRecord = removeRecord;

fetchAllRecords();