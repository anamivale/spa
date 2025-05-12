import { currentChatUser, fetchMessages, fetchUnreadCounts, initChat, selectUser, setupEventListeners, showChatInterface, unreadCounts } from "./chat.js";
import { createComment } from "./comments.js";
import { Logout } from "./logout.js";
import { createPost } from "./post.js";
import { reactToComment, reactToPost } from "./reactions.js";
import { createPostForm, feeds } from "./templates.js";

export function Feeds() {
  let body = document.getElementById("app");
  body.innerHTML = feeds();
  getPosts();
  initChat()

  document.getElementById("logout").addEventListener("click", () => {
    Logout();
  });

  document.getElementById("home").addEventListener("click", () => {
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
          "Posted by: "+element.Username+"| Categories:" + cat + " | Created " + element.Time;

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
            let textarea = document.createElement("textarea");
            textarea.id = "comment_content"
            let submitButton = document.createElement("button");
            submitButton.textContent = "comment"
            commentForm.appendChild(textarea)
            commentForm.appendChild(submitButton)
            commentSection.appendChild(commentForm);

            submitButton.addEventListener("click", () =>{
              createComment(element.PostID)
            })

            //comments 
            element.Comments?.forEach(el =>{
              let comments = document.createElement("div")
              let uname = document.createElement("p")
              uname.textContent = `${ el.Username }|${ el.CreatedAt }`
              let content = document.createElement("p")
              content.textContent = el.content
              
              comments.appendChild(uname)
              comments.appendChild(content)
              let reaction = document.createElement("div");
              reaction.className = "reactions";

              let likes = document.createElement("button");
              let dislikes = document.createElement("button");
      
      
              reaction.appendChild(likes);
              reaction.appendChild(dislikes);
      
              likes.textContent = `likes: ${el.LikeCount}`;
              dislikes.textContent = `dislikes: ${el.DislikeCount}`;

              likes.addEventListener("click", async () => {
                const creaction = await reactToComment(sessionId, el.CommentID, "like");
                
                likes.textContent = `likes: ${creaction.likes}`;
                dislikes.textContent = `dislikes: ${creaction.dislikes}`;
              });
      
              dislikes.addEventListener("click", async () => {
                const creaction = await reactToComment(sessionId, el.CommentID, "dislike");
                likes.textContent = `likes: ${creaction.likes}`;
                dislikes.textContent = `dislikes: ${creaction.dislikes}`;
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
          return;
        }
      
        // Clear existing users to prevent duplicates
        online_users.innerHTML = '';
      
        data.users.forEach((user) => {
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
            showChatInterface();
      
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
      
      
      let name = document.getElementById("user_name");
      let email = document.getElementById("user_email");
      name.textContent = data.user[0];
      email.textContent = data.user[1];
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
