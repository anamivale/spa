import { loadAuthView } from "./auth.js";

export function Logout() {
    fetch("/logout", { method: "POST" })
        .then(res => loadAuthView())
        .catch(err => console.log(err.message));
}