import type { ChatMessage } from "../types";
import api from "./api";

// FIX: Changed teamId from number to string.
export async function getMessages(teamId: string): Promise<ChatMessage[]> {
  // The API supports cursor-based pagination, but we'll fetch the latest chunk for now.
  const { messages } = await api<{ messages: ChatMessage[] }>(
    "GET",
    `/teams/${teamId}/chat`
  );
  return messages.reverse(); // API returns newest first, we want to display oldest first.
}

// FIX: Changed teamId from number to string.
export async function sendMessage(
  teamId: string,
  content: string
): Promise<ChatMessage> {
  const { message } = await api<{ message: ChatMessage }>(
    "POST",
    `/teams/${teamId}/chat/messages`,
    { content }
  );
  return message;
}
