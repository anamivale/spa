import { Logout } from "./logout.js";
import { createPost } from "./post.js";
import { createPostForm, feeds } from "./templates.js";

export function Feeds() {
  let body = document.getElementById("app");
  body.innerHTML = feeds();
  getPosts();

  document.getElementById("logout").addEventListener("click", ()=>{
    Logout()
  })

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
        let feedsUi = document.getElementById("feeds");
        feedsUi.className = "posts-container";
        data.response.forEach((element) => {
          let elementUi = document.createElement("div");
          elementUi.className = "post";
          let titleUi = document.createElement("p");
          titleUi.className = "title";
          titleUi.textContent = element.Title;

          let contentUi = document.createElement("p");
          contentUi.textContent = element.Content;

          let categoriesUi = document.createElement("p");
          let cat = element.Categories.replace("[", "");
          cat = cat.replace("]", "");
          cat = cat.replaceAll('"', "");

          categoriesUi.textContent = cat;

          let timeUi = document.createElement("p");
          // Categories: Entertainment,Lifestyle | Created Mar 2025 
          timeUi.textContent =" Categories: "+cat +" | Created "+ element.Time;

          let img = document.createElement("img")
          img.src = element.Imgurl
          img.style.width = "70%"
          

          elementUi.appendChild(titleUi);
          elementUi.appendChild(contentUi);
          elementUi.appendChild(categoriesUi);
          elementUi.appendChild(timeUi);
          if (element.Imgurl != ""){          
          elementUi.appendChild(img)
          }
          feedsUi.appendChild(elementUi);
        });
      }
    })
    .catch((err) => {
      console.error("Fetch error:", err);
    });
}
