import { Signup } from "./auth.js";
import { Feeds } from "./feeds.js";
import { authTemplate } from "./templates.js";

document.addEventListener("DOMContentLoaded", () => {
  if (IsCookiesPresent()) {
    Feeds();
  } else {
    document.getElementById("app").innerHTML = authTemplate();
    document.getElementById("signup").addEventListener("click", () => {
      console.log("clicked");
      Signup();
    });
  }
});

function IsCookiesPresent() {
  return getCookie("session_id") !== null;
}
function getCookie(name) {
  let match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
  return null;
}
