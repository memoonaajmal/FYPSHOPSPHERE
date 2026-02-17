import { getAuth } from "firebase/auth";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000";

/**
 * Save a single chat message to the server
 * @param {{ sender: string, text: string, products?: Array }} message
 */
export async function saveChatMessage(message) {
  try {
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;

    const token = await firebaseUser.getIdToken();

    await fetch(`${BASE_URL}/api/chat/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages: [message] }),
    });
  } catch (err) {
    console.error("Failed to save chat message:", err);
  }
}
