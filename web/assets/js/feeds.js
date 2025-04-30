import { Logout } from "./logout.js";
import { createPost } from "./post.js";
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
function getPosts() {
  fetch("/feeds")
    .then((res) => res.json())
    .then((data) => {
      if (data.type == "success") {
        //***********************************************feeds *********************************************
        let feedsUi = document.getElementById("feeds");
        feedsUi.className = "posts-container";
        if (data.response == null) {
          let elementUi = document.createElement("div");
          elementUi.textContent = "No posts yet, be the first to post!";
          feedsUi.appendChild(elementUi);
        } else {
          data.response?.forEach((element) => {
            let elementUi = document.createElement("div");
            elementUi.className = "post";
            let titleUi = document.createElement("p");
            titleUi.className = "title";
            titleUi.textContent = element.Title;

            let contentUi = document.createElement("p");
            contentUi.textContent = element.Content;

            let cat = element.Categories.replace("[", "");
            cat = cat.replace("]", "");
            cat = cat.replaceAll('"', "");

            let timeUi = document.createElement("p");
            timeUi.textContent =
              " Categories: " + cat + " | Created " + element.Time;

            let img = document.createElement("img");
            img.src = element.Imgurl;
            img.style.width = "70%";

            //*********************************************** reactions *********************************************

            let reactions = document.createElement("div");
            reactions.className = "reactions";
            let likes = document.createElement("button");
            let dislikes = document.createElement("button");
            let comment = document.createElement("button");
            reactions.appendChild(likes);
            reactions.appendChild(dislikes);
            reactions.appendChild(comment);

            likes.textContent = "likes:0";
            dislikes.textContent = "dislikes:0";
            comment.textContent = "comments:0";

            //*********************************************** end *********************************************

            elementUi.appendChild(titleUi);
            elementUi.appendChild(contentUi);
            elementUi.appendChild(timeUi);
            if (element.Imgurl != "") {
              elementUi.appendChild(img);
            }

            elementUi.appendChild(reactions);
            feedsUi.appendChild(elementUi);
          });
        }
        //*********************************************** end *********************************************

        //*********************************************** user *********************************************

        let name = document.getElementById("user_name");
        let email = document.getElementById("user_email");
        name.textContent = data.user[0];
        email.textContent = data.user[1];
        //*********************************************** end *********************************************
      }
    })
    .catch((err) => {
      console.error("Fetch error:", err);
    });
}
