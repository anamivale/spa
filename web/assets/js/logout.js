import { loadAuthView } from "./auth.js";
import { disconnectWebSocket } from "./chat.js";

export function Logout() {
    fetch("/logout", { method: "POST" })
        .then(res => {
            // Add WebSocket cleanup
           

            loadAuthView()
            disconnectWebSocket()

            
        })
        .catch(err => console.log(err.message));
}