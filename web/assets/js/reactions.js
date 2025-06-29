// Get CSRF token from cookie
function getCSRFTokenFromCookie() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export async function reactToPost(userId, postId, likeType) {
    try {
      const token = getCSRFTokenFromCookie();
      if (!token) {
        console.error("CSRF token missing");
        return { likes: 0, dislikes: 0 };
      }

      const response = await fetch("/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token
        },
        body: JSON.stringify({
          user_id: userId,
          post_id: postId,
          like_type: likeType,
        }),
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        likes: data.likes,
        dislikes: data.dislikes,
      };
    } catch (error) {
      console.error("Error reacting to post:", error);
      return {
        likes: 0,
        dislikes: 0,
      };
    }
  }


export async function reactToComment(userId, commentId, likeType) {
    try {
      const token = getCSRFTokenFromCookie();
      if (!token) {
        console.error("CSRF token missing");
        return { likes: 0, dislikes: 0 };
      }

      const response = await fetch("/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token
        },
        body: JSON.stringify({
          user_id: userId,
          comment_id: commentId,
          like_type: likeType,
        }),
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        likes: data.likes,
        dislikes: data.dislikes,
      };
    } catch (error) {
      console.error("Error reacting to comment:", error);
      return {
        likes: 0,
        dislikes: 0,
      };
    }
  }
  