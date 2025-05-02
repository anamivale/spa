import { Logout } from "./logout.js";
import { createPost } from "./post.js";
import { reactToPost } from "./reactions.js";
import { createPostForm, feeds } from "./templates.js";

export function Feeds() {
  let body = document.getElementById("app");
  body.innerHTML = feeds();
  getPosts();

  document.getElementById("logout").addEventListener("click", () => {
    Logout();
  });

  let Createpost = document.getElementById("createpost");

  Createpost.addEventListener("click", () => {
    let feedsUi = document.getElementById("feeds");

    feedsUi.innerHTML = createPostForm();

    let post = document.getElementById("create");

    post.addEventListener("click", () => {
      createPost();
    });
  });
}

async function getPosts() {
  try {
    const res = await fetch("/feeds");
    const data = await res.json();

    if (data.type === "success") {
      let feedsUi = document.getElementById("feeds");
      feedsUi.className = "posts-container";

      if (!data.response || data.response.length === 0) {
        let elementUi = document.createElement("div");
        elementUi.textContent = "No posts yet, be the first to post!";
        feedsUi.appendChild(elementUi);
        return;
      }

      data.response.forEach((element) => {
        let elementUi = document.createElement("div");
        elementUi.className = "post";

        let titleUi = document.createElement("p");
        titleUi.className = "title";
        titleUi.textContent = element.Title;

        let contentUi = document.createElement("p");
        contentUi.textContent = element.Content;

        let cat = element.Categories.replace("[", "")
          .replace("]", "")
          .replaceAll('"', "");
        let timeUi = document.createElement("p");
        timeUi.textContent =
          " Categories: " + cat + " | Created " + element.Time;

        let img = document.createElement("img");
        img.src = element.Imgurl;
        img.style.width = "70%";

        // Reaction buttons
        let reactions = document.createElement("div");
        reactions.className = "reactions";

        let likes = document.createElement("button");
        let dislikes = document.createElement("button");
        let comment = document.createElement("button");

        reactions.appendChild(likes);
        reactions.appendChild(dislikes);
        reactions.appendChild(comment);

        likes.textContent = `likes: ${element.LikeCount}`;
        dislikes.textContent = `dislikes: ${element.DislikeCount}`;
        comment.textContent = "comments: 0";
        const sessionId = getCookie("session_id");

        likes.addEventListener("click", async () => {
          const reaction = await reactToPost(sessionId, element.PostID, "like");
          likes.textContent = `likes: ${reaction.likes}`;
          dislikes.textContent = `dislikes: ${reaction.dislikes}`;
        });

        dislikes.addEventListener("click", async () => {
          const reaction = await reactToPost(
            sessionId,
            element.PostID,
            "dislike"
          );
          likes.textContent = `likes: ${reaction.likes}`;
          dislikes.textContent = `dislikes: ${reaction.dislikes}`;
        });

        elementUi.appendChild(titleUi);
        elementUi.appendChild(contentUi);
        elementUi.appendChild(timeUi);

        if (element.Imgurl !== "") {
          elementUi.appendChild(img);
        }

        elementUi.appendChild(reactions);
        feedsUi.appendChild(elementUi);
      });

      let name = document.getElementById("user_name");
      let email = document.getElementById("user_email");
      name.textContent = data.user[0];
      email.textContent = data.user[1];
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}
