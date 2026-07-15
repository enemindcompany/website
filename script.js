/**
 * ENEMIND — front-end logic
 * Talks to the Apps Script Web App, which reads/writes your Google Sheet.
 *
 * >>> REPLACE THIS with your own Apps Script Web App URL (ends in /exec) <<<
 * See Code.gs for how to get this URL.
 */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzQ_MeNo2v2Ix0LgVPf5FfsXHNmY1yzZk49kXvhRZE3eP7GNqdSgaVIyEhv4YkNagsBng/exec";

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Helper: POST JSON to Apps Script ----------
   Apps Script web apps don't support custom headers well with CORS,
   so we send as text/plain and parse JSON on the Apps Script side. */
async function postToSheet(payload) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

/* ---------- Request form ---------- */
const requestForm = document.getElementById("request-form");
const requestStatus = document.getElementById("request-status");

requestForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (APPS_SCRIPT_URL.includes("PASTE_YOUR")) {
    requestStatus.textContent = "Connect this form to your Apps Script URL first (see script.js).";
    requestStatus.className = "form-status err";
    return;
  }

  const submitBtn = requestForm.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  requestStatus.textContent = "Sending…";
  requestStatus.className = "form-status";

  try {
    const data = {
      type: "request",
      name: document.getElementById("r-name").value.trim(),
      contact: document.getElementById("r-contact").value.trim(),
      service: document.getElementById("r-service").value,
      message: document.getElementById("r-message").value.trim()
    };
    const result = await postToSheet(data);

    if (result.success) {
      requestStatus.textContent = "Request received — we'll be in touch.";
      requestStatus.className = "form-status ok";
      requestForm.reset();
    } else {
      throw new Error(result.error || "Something went wrong.");
    }
  } catch (err) {
    requestStatus.textContent = "Couldn't send your request. Please try again.";
    requestStatus.className = "form-status err";
  } finally {
    submitBtn.disabled = false;
  }
});

/* ---------- Comments: load + post ---------- */
const commentsList = document.getElementById("comments-list");
const commentsEmpty = document.getElementById("comments-empty");
const commentForm = document.getElementById("comment-form");
const commentStatus = document.getElementById("comment-status");

function renderComments(comments) {
  commentsList.innerHTML = "";

  if (!comments || comments.length === 0) {
    commentsList.innerHTML = `<p class="empty-note">No comments yet — be the first to write one.</p>`;
    return;
  }

  comments.forEach((c) => {
    const item = document.createElement("div");
    item.className = "comment-item";
    const time = c.timestamp ? new Date(c.timestamp).toLocaleDateString() : "";
    item.innerHTML = `
      <div class="top">
        <span class="name">${escapeHTML(c.name || "Anonymous")}</span>
        <span class="time">${escapeHTML(time)}</span>
      </div>
      <div class="body">${escapeHTML(c.comment || "")}</div>
    `;
    commentsList.appendChild(item);
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function loadComments() {
  if (APPS_SCRIPT_URL.includes("PASTE_YOUR")) {
    commentsList.innerHTML = `<p class="empty-note">Connect this page to your Apps Script URL to load comments (see script.js).</p>`;
    return;
  }
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?type=comments`);
    const data = await res.json();
    if (data.success) {
      renderComments(data.comments);
    } else {
      throw new Error(data.error);
    }
  } catch (err) {
    commentsList.innerHTML = `<p class="empty-note">Couldn't load comments right now.</p>`;
  }
}

commentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (APPS_SCRIPT_URL.includes("PASTE_YOUR")) {
    commentStatus.textContent = "Connect this form to your Apps Script URL first (see script.js).";
    commentStatus.className = "form-status err";
    return;
  }

  const submitBtn = commentForm.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  commentStatus.textContent = "Posting…";
  commentStatus.className = "form-status";

  try {
    const name = commentForm.querySelector("[name=c-name]").value.trim();
    const comment = commentForm.querySelector("[name=c-comment]").value.trim();
    const result = await postToSheet({ type: "comment", name, comment });

    if (result.success) {
      commentStatus.textContent = "Posted.";
      commentStatus.className = "form-status ok";
      commentForm.reset();
      loadComments();
    } else {
      throw new Error(result.error || "Something went wrong.");
    }
  } catch (err) {
    commentStatus.textContent = "Couldn't post your comment. Please try again.";
    commentStatus.className = "form-status err";
  } finally {
    submitBtn.disabled = false;
  }
});

loadComments();
