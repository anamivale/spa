import { clearChatState, currentChatUser, fetchMessages, fetchUnreadCounts, initChat, selectUser, setupEventListeners, showChatInterface, unreadCounts } from "./chat.js";
import { createComment } from "./comments.js";
import { Logout } from "./logout.js";
import { createPost } from "./post.js";
import { reactToComment, reactToPost } from "./reactions.js";
import { createPostForm, feeds } from "./templates.js";


export function Feeds() {
  let body = document.getElementById("app");
  body.innerHTML = feeds();
  let url = "/feeds"
  getPosts(url);


  const userIcon = document.getElementById("user-icon");
  const profilePopup = document.getElementById("profile-popup");

  if (userIcon && profilePopup) {
    userIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      profilePopup.classList.toggle('hidden');

    });

    profilePopup.addEventListener('click', (e) => {
      e.stopPropagation(); // ✅ prevent hiding when clicking inside popup
    });

    document.addEventListener('click', () => {
      profilePopup.classList.add('hidden');
    });
  }
  const categoriesSort = Array.from(document.querySelectorAll(".cat-el"))
  categoriesSort.forEach(el => {
    el.addEventListener("click", () => {
      url = "/feeds?cat=" + el.textContent.trim()
      getPosts(url);


    })

  })

  initChat()

  document.getElementById("logout").addEventListener("click", () => {
    Logout();
  });

  document.getElementById("home").addEventListener("click", () => {
    clearChatState()
    Feeds()
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

export async function getPosts(url) {

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.type === "success") {
      let feedsUi = document.getElementById("feeds");
      feedsUi.className = "posts-container";
      feedsUi.innerHTML = ""

      if (!data.response || data.response.length === 0) {
        let elementUi = document.createElement("div");
        elementUi.textContent = "No posts yet, be the first to post!";
        feedsUi.appendChild(elementUi);
      }


      data.response?.forEach((element) => {
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
          "Posted by: " + element.Username + "| Categories:" + cat + " | Created " + element.Time;

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
        comment.textContent = `comments: ${element.CommentCount}`;
        const cookieValue = getCookie("session_id");

        const ids = cookieValue.split(":")
        const sessionId = ids[0]

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
        elementUi.appendChild(timeUi);

        elementUi.appendChild(contentUi);

        if (element.Imgurl !== "") {
          elementUi.appendChild(img);
        }

        elementUi.appendChild(reactions);
        comment.addEventListener("click", () => {
          let existingCommentSection = elementUi.querySelector(".comment-section");

          if (existingCommentSection) {
            existingCommentSection.remove();
          } else {
            let commentSection = document.createElement("div");
            commentSection.classList.add("comment-section");

            let h1 = document.createElement("h1");
            h1.textContent = "Add a comment";
            commentSection.appendChild(h1);

            //form
            let commentForm = document.createElement("div");
            commentForm.className = "comment-form";

            let textarea = document.createElement("textarea");
            textarea.id = "comment_content"
            textarea.placeholder = "Add a comment...";


            let submitButton = document.createElement("button");
            submitButton.textContent = "comment"

            commentForm.appendChild(textarea)
            commentForm.appendChild(submitButton)
            commentSection.appendChild(commentForm);

            submitButton.addEventListener("click", () => {
              createComment(element.PostID)
            })

            //comments 
            element.Comments?.forEach(el => {
              let comments = document.createElement("div")
              comments.className = "comment";

              let userInfo = document.createElement("div");
              userInfo.className = "comment-header";

              let uname = document.createElement("p")
              uname.className = "comment-username";
              uname.textContent = el.Username

              let time = document.createElement("span");
              time.className = "comment-time";
              time.textContent = new Date(el.CreatedAt).toLocaleDateString();

              userInfo.appendChild(uname);
              userInfo.appendChild(time);

              let content = document.createElement("div")
              content.className = "comment-content";
              content.textContent = el.content

              comments.appendChild(userInfo);
              comments.appendChild(content)
              let reaction = document.createElement("div");
              reaction.className = "reactions";

              let likes = document.createElement("button");
              let dislikes = document.createElement("button");


              reaction.appendChild(likes);
              reaction.appendChild(dislikes);

              likes.textContent = `👍 ${el.LikeCount}`;

              dislikes.textContent = `👎 ${el.DislikeCount}`;

              likes.addEventListener("click", async () => {
                const creaction = await reactToComment(sessionId, el.CommentID, "like");

                likes.textContent = `👍 ${creaction.likes}`;
                dislikes.textContent = `👎 ${creaction.dislikes}`;
              });

              dislikes.addEventListener("click", async () => {
                const creaction = await reactToComment(sessionId, el.CommentID, "dislike");
                likes.textContent = `👍 ${creaction.likes}`;
                dislikes.textContent = `👎 ${creaction.dislikes}`;
              });

              comments.appendChild(reaction)
              commentSection.appendChild(comments)



            })
            elementUi.appendChild(commentSection);
          }
        });



        feedsUi.appendChild(elementUi);
      });





      let online_users = document.getElementById("online-users");
      if (!online_users) {
        console.error("online-users element not found");

      }

      // Clear existing users to prevent duplicates
      online_users.innerHTML = '';

      data.users?.forEach((user) => {
        const li = document.createElement("li");
        li.textContent = user.Nickname;
        li.dataset.userId = user.Id;

        // Add unread badge if there are unread messages
        if (unreadCounts[user.Id] && unreadCounts[user.Id] > 0) {
          const badge = document.createElement("span");
          badge.className = "unread-badge";
          badge.textContent = unreadCounts[user.Id];
          li.appendChild(badge);
        }

        li.addEventListener("click", () => {
          // First establish connection and create the UI
          showChatInterface(user);

          setupEventListeners();

          // Then select the user immediately
          selectUser(user);

          // After selecting user, fetch unread counts
          fetchUnreadCounts();
          fetchMessages(user.Id)
        });

        if (currentChatUser && currentChatUser.Id === user.Id) {
          li.classList.add("active");
        }

        online_users.appendChild(li);
      });


      let name = document.getElementById("profile-nickname");
      let email = document.getElementById("profile-email");
      let age = document.getElementById("profile-age");
      let fullname = document.getElementById("profile-fullname");
      let gender = document.getElementById("profile-gender");
      
      name.textContent = data.user.Nickname;
      email.textContent = data.user.Email;
      age.textContent = data.user.Age
      fullname.textContent = `${data.user.Fname} ${data.user.Lname}`
      gender.textContent = data.user.Gender

    }
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}
