import { loadAuthView } from "./auth.js";

export  function Logout() {
    fetch("/logout").then(res => {loadAuthView()}).catch(err=>console.log(err.message))
}