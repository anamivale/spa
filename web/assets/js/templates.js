export function feeds() {
  return `
    
  <!-- Navbar -->
  <div class="navbar">
    <h1>Forum</h1>
    <div id ="nav-elements">
    <div id ="home">🏠</div>
    <div class="categories-dropdown">
                    <button class="dropdown-button">Categories ▼</button>
                    <div class="dropdown-content">
                        <li class = "cat-el">Health</li>
                        <li class = "cat-el">Technology</li>
                        <li class = "cat-el">Education</li>
                        <li class = "cat-el">Entertainment</li>
                        <li class = "cat-el">My Posts</li>
                        <li class = "cat-el">Travel</li>
                        <li class = "cat-el">All</li>
                    </div>
                </div>

    </div>
    <div class="actions">
      <span class="bell">🔔 <span id="notification-count" class="hidden">0</span></span>
      <button id="logout">Logout</button>
    </div>
  </div>

  <!-- Main Content -->
  <div class="main">
    <!-- Left Sidebar: Online Users -->
    <div class="section left" >
      <h3>Users</h3>
      <ul id="online-users">
        
      </ul>
    </div>

    <!-- Center: Feeds -->
    <div class="section center" id="feed-container">
      <button id = "createpost"> Create post </button>
      <div id = "feeds"> </div>     
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
          <button id="signup">Sign up</button>
      </div>
  </div>

  <div class="login">
      <div>
          <label for="chk" aria-hidden="true" id="label">Login</label>
          <input type="text" id="username" placeholder="Email/Nickname" class="username" required />
          <input type="password" id="password" name="pswd" placeholder="Password" class="password" required />
          <button id="login">Login</button>
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
\      Health
      <input type="checkbox" name="category" value="Health" />

    </label>
        <br />

    <label>
    Technology
            <input type="checkbox" name="category" value="Technology" />

    </label>
        <br />

    <label>
    Education
            <input type="checkbox" name="category" value="Education" />

    </label>
    <br />

    <label>
    Entertainment
            <input type="checkbox" name="category" value="Entertainment" />

    </label>
    <br />

    <label>
    Travel
            <input type="checkbox" name="category" value="Travel" />

    </label>
    <br /><br />
    <input type="file" id = "file" name="img" accept="img/*" />

    <button type="submit" id = "create" >Create Post</button>
  </div>
</div>`
}


export function messagesUi() {
  return `
   <div class="message-area" id="sms">
      <div id="messages"></div>
      <div id="message-input" class="hidden">
          <textarea id="message-text" placeholder="Type your message..."></textarea>
          <button id="send-button" class="btn">Send</button>
      </div>
   </div>
  `;
}
