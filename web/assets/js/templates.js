export function feeds() {
  return `
    
  <!-- Navbar -->
  <div class="navbar">
    <h1>Forum</h1>
    <div class="actions">
      <span class="bell">🔔</span>
      <button id="logout">Logout</button>
    </div>
  </div>

  <!-- Main Content -->
  <div class="main">
    <!-- Left Sidebar: Online Users -->
    <div class="section left">
      <h3>Online Users</h3>
      <ul id="online-users">
        <li>Alice</li>
        <li>Bob</li>
        <li>Charlie</li>
      </ul>
    </div>

    <!-- Center: Feeds -->
    <div class="section center" id="feeds">
      <button id = "createpost"> Create post </button>

     
    </div>

    <!-- Right Sidebar: Profile -->
    <div class="section right">
      <h3>User Profile</h3>
      <p id ="user_name">Name: John Doe</p>
      <p id="user_email">Email: john@example.com</p>
    </div>
  </div>
`;
}



export function authTemplate() {
  return `
  <div class="auth">
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
