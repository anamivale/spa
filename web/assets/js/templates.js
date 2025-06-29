export function feeds() {
  return `
    <!-- Navbar -->
    <div class="navbar">
      <h1 id="home">Forum</h1>
      <div class="actions">
        <span class="bell">🔔 <span id="notification-count" class="hidden">0</span></span>
        
        <!-- User icon -->
        <span class="user-icon" id="user-icon">👤</span>

        <!-- Profile dropdown -->
        <div class="profile-popup hidden" id="profile-popup">
                  <h3>User Profile</h3>

          <p><strong>Name:</strong> <span id="profile-nickname">JohnDoe</span></p>
          <p><strong>Email:</strong> <span id="profile-email">john@example.com</span></p>
          <p><strong>Age:</strong> <span id="profile-age">28</span></p>
          <p><strong>Full Name:</strong> <span id="profile-fullname">John Doe</span></p>
          <p><strong>Gender:</strong> <span id="profile-gender">Male</span></p>
        </div>

        <button id="logout">Logout</button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main">
      <!-- Left Sidebar: Online Users -->
      <div class="section left">
        <div class="cat">
          <h3>Categories</h3>
          <div>
            <a class="cat-el">Health</a><hr />
            <a class="cat-el">Technology</a><hr />
            <a class="cat-el">Education</a><hr />
            <a class="cat-el">Entertainment</a><hr />
            <a class="cat-el">My Posts</a><hr />
            <a class="cat-el">Travel</a><hr />
            <a class="cat-el">All</a>
          </div>
        </div>
      </div>

      <!-- Center: Feeds -->
      <div class="section center" id="feed-container">
        <button id="createpost">Create post</button>
        <div id="feeds"></div>
      </div>

      <!-- Right Sidebar: Profile -->
      <div class="section right">

        <h3>Users</h3>
        <ul id="online-users"></ul>
      </div>
    </div>
  `;
}

export function authTemplate() {
  return `
    <div class="auth-container">
      <div class="auth">
        <input type="checkbox" id="chk" aria-hidden="true" />
        <div id="errors"></div>

        <div class="signup">
          <form id="signup-form" novalidate>
            <label for="chk" id="label" aria-hidden="true">Sign up</label>

            <input
              type="text"
              id="nickname"
              placeholder="Username"
              required
              minlength="3"
              maxlength="20"
              pattern="[a-zA-Z0-9_]+"
              title="Username must be 3-20 characters, letters, numbers, and underscores only"
            />

            <input
              type="number"
              id="age"
              placeholder="Age"
              required
              min="16"
              max="100"
              title="Age must be between 16 and 100"
            />

            <div id="gender" class="gender">
              <label>
                <input type="radio" name="gender" value="female" required />
                Female
              </label>
              <label>
                <input type="radio" name="gender" value="male" required />
                Male
              </label>
              <label>
                <input type="radio" name="gender" value="other" required />
                Other
              </label>
            </div>

            <input
              type="text"
              id="fname"
              placeholder="First Name"
              required
              minlength="2"
              maxlength="50"
              pattern="[a-zA-Z\\s]+"
              title="First name must be 2-50 characters, letters only"
            />

            <input
              type="text"
              id="lname"
              placeholder="Last Name"
              required
              minlength="2"
              maxlength="50"
              pattern="[a-zA-Z\\s]+"
              title="Last name must be 2-50 characters, letters only"
            />

            <input
              type="email"
              id="email"
              placeholder="Email"
              required
              title="Please enter a valid email address"
            />

            <input
              type="password"
              id="pswd"
              placeholder="Password"
              required
              minlength="6"
              title="Password must be at least 6 characters long"
            />

            <input
              type="password"
              id="cpswd"
              placeholder="Confirm Password"
              required
              minlength="6"
              title="Please confirm your password"
            />

            <button type="button" id="signup">Sign up</button>
          </form>
        </div>

        <div class="login">
          <form id="login-form" novalidate>
            <label for="chk" aria-hidden="true" id="label">Login</label>

            <input
              type="text"
              id="username"
              placeholder="Email or Username"
              class="username"
              required
              title="Enter your email or username"
            />

            <input
              type="password"
              id="password"
              placeholder="Password"
              class="password"
              required
              title="Enter your password"
            />

            <button type="button" id="login">Login</button>
          </form>
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

        <label for="content">Content:</label>
        <textarea id="content" name="content" rows="5" cols="40" required></textarea>
        <br /><br />

        <label for="category">Category:</label><br />
        <label>Health <input type="checkbox" name="category" value="Health" /></label><br />
        <label>Technology <input type="checkbox" name="category" value="Technology" /></label><br />
        <label>Education <input type="checkbox" name="category" value="Education" /></label><br />
        <label>Entertainment <input type="checkbox" name="category" value="Entertainment" /></label><br />
        <label>Travel <input type="checkbox" name="category" value="Travel" /></label><br /><br />

        <input type="file" id="file" name="img" accept="image/*" />
        <button type="submit" id="create">Create Post</button>
      </div>
    </div>
  `;
}

export function messagesUi() {
  return `
    <div class="message-area" id="sms">
      <div id="messages"></div>
      <div id="message-input" class="hidden">
        <div class="message-input-container">
          <div class="input-row">
            <textarea id="message-text" placeholder="Type your message..."></textarea>
            <div class="input-actions">
              <button id="image-button" class="btn-icon" title="Send Image">📷</button>
              <button id="send-button" class="btn">Send</button>
            </div>
          </div>
          <input type="file" id="image-input" accept="image/*" style="display: none;">
          <div id="image-preview" class="image-preview hidden"></div>
        </div>
      </div>
    </div>
  `;
}
