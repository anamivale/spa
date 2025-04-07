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

if (!emailInput.checkValidity()) {
	console.log("Please enter an email address");
    return
} 


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
    err.textContent = "fill all the fields";
    console.log(err.textContent);
    return;
  }
  document.getElementById("app").innerHTML = feeds();
}
