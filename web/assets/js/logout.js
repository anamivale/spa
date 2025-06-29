import { Logout as AuthLogout } from "./auth.js";
import { disconnectWebSocket } from "./chat.js";

export async function Logout() {
    // Use the improved logout function from auth.js
    await AuthLogout();
    // Add WebSocket cleanup
    disconnectWebSocket();
}