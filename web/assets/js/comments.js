import { Feeds } from "./feeds.js"

// Get CSRF token from cookie
function getCSRFTokenFromCookie() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export async function createComment(postid) {
    const textarea = document.getElementById("comment_content");
    const content = textarea.value.trim();

    if (content === "") {
        showCommentError("Please enter a comment before posting.");
        return;
    }

    if (content.length > 500) {
        showCommentError("Comment is too long. Maximum 500 characters allowed.");
        return;
    }

    const req = {
        "post_id": postid,
        "content": content
    };

    try {
        const token = getCSRFTokenFromCookie();
        if (!token) {
            showCommentError("Security token missing. Please refresh the page.");
            return;
        }

        const response = await fetch("/comment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": token
            },
            body: JSON.stringify(req),
            credentials: "include"
        });

        const data = await response.json();

        if (response.ok && data.message === "success") {
            // Clear the textarea
            textarea.value = "";
            // Update character count if it exists
            const charCount = document.querySelector(".char-count");
            if (charCount) charCount.textContent = "0/500";

            // Show success message briefly
            showCommentSuccess("Comment posted successfully!");

            // Don't call Feeds() here - let the calling function handle it
            return true;
        } else {
            showCommentError(data.message || "Failed to create comment. Please try again.");
            return false;
        }
    } catch (error) {
        console.error("Comment creation error:", error);
        showCommentError("An error occurred. Please try again.");
        return false;
    }
}

// Helper function to show comment errors
function showCommentError(message) {
    // Remove any existing error messages
    const existingError = document.querySelector(".comment-error");
    if (existingError) existingError.remove();

    const errorDiv = document.createElement("div");
    errorDiv.className = "comment-error";
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #dc3545;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 8px;
        padding: 0.75rem;
        margin: 0.5rem 0;
        font-size: 0.9rem;
    `;

    const commentForm = document.querySelector(".comment-form");
    if (commentForm) {
        commentForm.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// Helper function to show comment success
function showCommentSuccess(message) {
    const successDiv = document.createElement("div");
    successDiv.className = "comment-success";
    successDiv.textContent = message;
    successDiv.style.cssText = `
        color: #155724;
        background: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 8px;
        padding: 0.75rem;
        margin: 0.5rem 0;
        font-size: 0.9rem;
    `;

    const commentForm = document.querySelector(".comment-form");
    if (commentForm) {
        commentForm.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    }
}