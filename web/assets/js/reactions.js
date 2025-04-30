export async function reactToPost(userId, postId, likeType) {
    
  
    try {
      const response = await fetch("/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          post_id: postId,
          like_type: likeType,
        }),
      });
  
      const data = await response.json();
  
      return {
        likes: data.likes,
        dislikes: data.dislikes,
      };
    } catch (error) {
      console.error("Error:", error);
      return {
        likes: 0,
        dislikes: 0,
      };
    }
  }
  