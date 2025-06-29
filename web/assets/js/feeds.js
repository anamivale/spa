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

        if (!cookieValue) {
          console.error("No session cookie found");
          return;
        }

        const ids = cookieValue.split(":");
        if (ids.length !== 2) {
          console.error("Invalid session cookie format");
          return;
        }
        const sessionId = ids[0];

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

            // Header
            let header = document.createElement("div");
            header.className = "comment-section-header";

            let headerTitle = document.createElement("h3");
            headerTitle.textContent = `Comments (${element.CommentCount})`;
            headerTitle.className = "comment-section-title";

            let toggleButton = document.createElement("button");
            toggleButton.textContent = "×";
            toggleButton.className = "comment-close-btn";
            toggleButton.addEventListener("click", () => {
              commentSection.remove();
            });

            header.appendChild(headerTitle);
            header.appendChild(toggleButton);
            commentSection.appendChild(header);

            // Comment form
            let commentForm = document.createElement("div");
            commentForm.className = "comment-form";

            let formHeader = document.createElement("div");
            formHeader.className = "comment-form-header";
            formHeader.innerHTML = '<span class="comment-form-title">💬 Add your comment</span>';

            let textarea = document.createElement("textarea");
            textarea.id = "comment_content";
            textarea.placeholder = "What are your thoughts?";
            textarea.rows = 3;

            let formActions = document.createElement("div");
            formActions.className = "comment-form-actions";

            let charCount = document.createElement("span");
            charCount.className = "char-count";
            charCount.textContent = "0/500";

            let submitButton = document.createElement("button");
            submitButton.textContent = "Post Comment";
            submitButton.className = "comment-submit-btn";
            submitButton.disabled = true;

            // Character count and validation
            textarea.addEventListener("input", () => {
              const value = textarea.value;
              const length = value.length;
              const trimmedValue = value.trim();

              charCount.textContent = `${length}/500`;

              if (length > 500) {
                charCount.style.color = "#ff4444";
                submitButton.disabled = true;
              } else if (trimmedValue.length > 0) {
                charCount.style.color = "#666";
                submitButton.disabled = false;
              } else {
                charCount.style.color = "#666";
                submitButton.disabled = true;
              }
            });

            formActions.appendChild(charCount);
            formActions.appendChild(submitButton);

            commentForm.appendChild(formHeader);
            commentForm.appendChild(textarea);
            commentForm.appendChild(formActions);
            commentSection.appendChild(commentForm);

            submitButton.addEventListener("click", async () => {
              const content = textarea.value.trim();
              if (content && content.length <= 500) {
                submitButton.disabled = true;
                submitButton.textContent = "Posting...";

                try {
                  await createComment(element.PostID);
                  textarea.value = "";
                  charCount.textContent = "0/500";
                  submitButton.textContent = "Post Comment";
                  // Refresh the post to show new comment
                  setTimeout(() => {
                    getPosts("/feeds");
                  }, 500);
                } catch (error) {
                  console.error("Error posting comment:", error);
                  submitButton.textContent = "Post Comment";
                  submitButton.disabled = false;
                }
              }
            });

            // Comments list
            let commentsContainer = document.createElement("div");
            commentsContainer.className = "comments-container";

            if (element.Comments && element.Comments.length > 0) {
              element.Comments.forEach(el => {
                let commentDiv = document.createElement("div");
                commentDiv.className = "comment";

                // User avatar and info
                let userInfo = document.createElement("div");
                userInfo.className = "comment-header";

                let avatar = document.createElement("div");
                avatar.className = "comment-avatar";
                avatar.textContent = el.Username.charAt(0).toUpperCase();

                let userDetails = document.createElement("div");
                userDetails.className = "comment-user-details";

                let username = document.createElement("span");
                username.className = "comment-username";
                username.textContent = el.Username;

                let time = document.createElement("span");
                time.className = "comment-time";
                time.textContent = new Date(el.CreatedAt).toLocaleString();

                userDetails.appendChild(username);
                userDetails.appendChild(time);
                userInfo.appendChild(avatar);
                userInfo.appendChild(userDetails);

                let content = document.createElement("div");
                content.className = "comment-content";
                content.textContent = el.content;

                commentDiv.appendChild(userInfo);
                commentDiv.appendChild(content);
                // Comment reactions
                let reactions = document.createElement("div");
                reactions.className = "comment-reactions";

                let likeBtn = document.createElement("button");
                let dislikeBtn = document.createElement("button");

                likeBtn.className = "comment-reaction-btn like-btn";
                dislikeBtn.className = "comment-reaction-btn dislike-btn";

                likeBtn.innerHTML = `<span class="reaction-icon">👍</span> <span class="reaction-count">${el.LikeCount}</span>`;
                dislikeBtn.innerHTML = `<span class="reaction-icon">👎</span> <span class="reaction-count">${el.DislikeCount}</span>`;

                likeBtn.addEventListener("click", async () => {
                  likeBtn.disabled = true;
                  try {
                    const reaction = await reactToComment(sessionId, el.CommentID, "like");
                    likeBtn.innerHTML = `<span class="reaction-icon">👍</span> <span class="reaction-count">${reaction.likes}</span>`;
                    dislikeBtn.innerHTML = `<span class="reaction-icon">👎</span> <span class="reaction-count">${reaction.dislikes}</span>`;
                  } catch (error) {
                    console.error("Error liking comment:", error);
                  }
                  likeBtn.disabled = false;
                });

                dislikeBtn.addEventListener("click", async () => {
                  dislikeBtn.disabled = true;
                  try {
                    const reaction = await reactToComment(sessionId, el.CommentID, "dislike");
                    likeBtn.innerHTML = `<span class="reaction-icon">👍</span> <span class="reaction-count">${reaction.likes}</span>`;
                    dislikeBtn.innerHTML = `<span class="reaction-icon">👎</span> <span class="reaction-count">${reaction.dislikes}</span>`;
                  } catch (error) {
                    console.error("Error disliking comment:", error);
                  }
                  dislikeBtn.disabled = false;
                });

                reactions.appendChild(likeBtn);
                reactions.appendChild(dislikeBtn);
                commentDiv.appendChild(reactions);
                commentsContainer.appendChild(commentDiv);



            });
            } else {
              let noComments = document.createElement("div");
              noComments.className = "no-comments";
              noComments.innerHTML = '<p>💭 No comments yet. Be the first to share your thoughts!</p>';
              commentsContainer.appendChild(noComments);
            }

            commentSection.appendChild(commentsContainer);
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
