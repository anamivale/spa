export function feeds() {
  return `
    
    <div class="feed">
        <button id="createpost">Create Post</button>
        <h1>Title</h1>
        <p>The body</p>

        
    </div>`;
}



export function authTemplate() {
  return `
  <div class="main">
  <input type="checkbox" id="chk" aria-hidden="true" />
  <p id= "errors"></p>

  <div class="signup">
      <div>
          <label for="chk" id="label" aria-hidden="true">Sign up</label>
          <input type="text" id="nickname" placeholder="Nickname" required />
          <input type="number" id="age" placeholder="Age" required />
          <div id="gender" class = "gender">
            <label>
                <input type="radio" name="gender" value="female"> Female
            </label>
            <label>
                <input type="radio" name="gender" value="male"> Male
            </label>
          </div>
          <input type="text" id="fname" placeholder="First Name" required />
          <input type="text" id="lname" placeholder="Last Name" required />      
          <input type="email" id="email" placeholder="Email" required />
          <input type="password" id="pswd" placeholder="Password" required />
          <input type="password" id="cpswd" placeholder="Confirm Password" required />
          <button id = "signup">Sign up</button>
      </div>
  </div>

  <div class="login">
      <div>
          <label for="chk" aria-hidden="true" id="label">Login</label>
          <input type="text" id="username" placeholder="Email/Nickname" required />
          <input type="password" name="pswd" placeholder="Password" required />
          <button>Login</button>
      </div>
  </div>
</div>
      `;
}

export function createPostForm() {
  return `
  <div class="create-post">
  <h2>Create a New Post</h2>
  <div>
    <label for="title">Title:</label>
    <input type="text" id="title" name="title" required />
    <br /><br />
  <div class = "cat">

    <label for="content">Content:</label>
    <textarea id="content" name="content" rows="5" cols="40" required></textarea>
    <br /><br />

    <label for="category">Category:</label>
    <label>
\      health
      <input type="checkbox" name="category" value="health" />

    </label>
        <br /><br />

    <label>
      health
            <input type="checkbox" name="category" value="health" />

    </label>
        <br /><br />

    <label>
      health
            <input type="checkbox" name="category" value="health" />

    </label>
    <br /><br />
    <input type="file" id = "file" name="img" accept="img/*" />

    <button type="submit" id = "create" >Create Post</button>
  </div>
</div>`
}
