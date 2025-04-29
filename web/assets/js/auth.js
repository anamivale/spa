import { Feeds } from "./feeds.js";
import { authTemplate, feeds } from "./templates.js";

export function Signup() {
  const nickname = document.getElementById("nickname").value;
  const age = document.getElementById("age").value;
  const genderValue = document.querySelector(
    'input[name="gender"]:checked'
  )?.value;
  const fname = document.getElementById("fname").value;
  const lname = document.getElementById("lname").value;
  const email = document.getElementById("email").value;
  const pswd = document.getElementById("pswd").value;
  const cpswd = document.getElementById("cpswd").value;
  const err = document.getElementById("errors");
  const emailInput = document.getElementById("email");

  if (
    nickname == "" ||
    age == "" ||
    genderValue == "" ||
    fname == "" ||
    lname == "" ||
    email == "" ||
    pswd == "" ||
    cpswd == ""
  ) {
    document.getElementById("app").innerHTML = authTemplate();
    loadAuthView("fill all the fields")
    return;
  }

  if (!emailInput.checkValidity()) {
    console.log("Please enter an email address");
    loadAuthView("Please enter a valid email address")

    return
  }
  if (pswd !== cpswd) {
    console.log("passwords do not match");
    loadAuthView("passwords do not match")

    return
  }




  let ReqBody = {
    nickname: nickname,
    age: age,
    gender: genderValue,
    fname: fname,
    lname: lname,
    email: email,
    password: pswd,
  }

  try {
    fetch("http://localhost:8080/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(ReqBody)
    }).then((res) => {

      return res.json()
    }).then(data => {
      console.log(data);
      if (data.type === "success") {
        Feeds()

      } else {
        loadAuthView(data.type)
      }

    })



  } catch (error) {
    console.log(error.message);



  }
}

function loadAuthView(error) {
  document.getElementById("app").innerHTML = authTemplate();
  document.getElementById("errors").textContent = error
  document.getElementById("signup").addEventListener("click", () => {
    Signup();
  });
}
