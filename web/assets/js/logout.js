import { loadAuthView } from "./auth.js";

export function Logout() {
    fetch("/logout", { method: "POST" })
        .then(res => {
            // Add WebSocket cleanup
            if (socket && socket.readyState !== WebSocket.CLOSED) {
                socket.close();
            }

            // Reset chat state
            currentUser = null;
            currentChatUser = null;
            unreadCounts = {};

            loadAuthView()
        })
        .catch(err => console.log(err.message));
}