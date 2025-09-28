import React, { useState, useEffect, useRef, useCallback } from "react";
import type { User, ChatMessage, Team } from "../types";
import * as chatService from "../services/chatService";
import { Avatar } from "./Avatar";
import { LoadingSpinner } from "./LoadingSpinner";

interface TeamChatProps {
  myTeamMembers: User[];
  currentUser: User;
  currentUserTeam: Team | null;
}

const TeamChat: React.FC<TeamChatProps> = ({
  myTeamMembers,
  currentUser,
  currentUserTeam,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  const teamId = currentUserTeam?.id;

  const fetchMessages = useCallback(
    async (isInitialLoad = false) => {
      if (!teamId) {
        setMessages([]);
        setIsLoading(false);
        return;
      }
      if (isInitialLoad) setIsLoading(true);
      setError(null);
      try {
        const history = await chatService.getMessages(teamId);
        setMessages(history);
      } catch {
        setError("Failed to load chat history.");
      } finally {
        if (isInitialLoad) setIsLoading(false);
      }
    },
    [teamId]
  );

  // Effect for the initial load
  useEffect(() => {
    fetchMessages(true);
  }, [fetchMessages]);

  // Effect for continuous polling for new messages
  useEffect(() => {
    if (teamId) {
      const intervalId = setInterval(() => fetchMessages(false), 3000); // Poll every 3 seconds
      return () => clearInterval(intervalId); // Cleanup on unmount
    }
  }, [teamId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !teamId || isSending) return;

    const content = newMessage;
    setNewMessage(""); // Optimistically clear input
    setIsSending(true);

    try {
      // Instead of waiting for the next poll, we can get an immediate update.
      const savedMessage = await chatService.sendMessage(teamId, content);
      setMessages((prevMessages) => [...prevMessages, savedMessage]);
    } catch (err) {
      setError("Failed to send message.");
      setNewMessage(content); // Restore input on failure
    } finally {
      setIsSending(false);
    }
  };

  if (!currentUserTeam) {
    return (
      <div className="max-w-4xl mx-auto bg-shell-card shadow-2xl rounded-lg flex flex-col h-[75vh] items-center justify-center text-center p-4">
        <h2 className="text-2xl font-bold text-shell-text">No Team, No Chat</h2>
        <p className="text-shell-text-secondary mt-2">
          Create or join a team from the dashboard to start collaborating!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-shell-card shadow-2xl rounded-lg flex flex-col h-[75vh]">
      <div className="p-4 border-b border-fiu-blue">
        <h2 className="text-2xl font-bold text-shell-text">
          Team Chat: {currentUserTeam.name}
        </h2>
        <p className="text-shell-text-secondary">
          {myTeamMembers.map((m) => m.fullName).join(", ")}
        </p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <LoadingSpinner className="w-10 h-10" />
          </div>
        )}
        {error && <div className="text-center text-red-400">{error}</div>}
        {!isLoading &&
          !error &&
          messages.map((msg) => {
            const isCurrentUser = msg.author.id === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-3 ${
                  isCurrentUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isCurrentUser && (
                  <Avatar
                    src={msg.author.profilePictureUrl}
                    fullName={msg.author.fullName}
                    size="sm"
                  />
                )}
                <div
                  className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                    isCurrentUser ? "bg-fiu-blue" : "bg-shell-bg"
                  }`}
                >
                  {!isCurrentUser && (
                    <p className="text-xs font-bold text-shell-accent mb-1">
                      {msg.author.fullName}
                    </p>
                  )}
                  <p className="text-shell-text text-sm break-words">
                    {msg.content}
                  </p>
                  <p className="text-xs text-shell-text-secondary mt-1 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {isCurrentUser && (
                  <Avatar
                    src={currentUser.profilePictureUrl}
                    fullName={currentUser.fullName}
                    size="sm"
                  />
                )}
              </div>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-fiu-blue">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center space-x-3"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-shell-bg border border-fiu-blue rounded-full py-2 px-4 text-shell-text focus:ring-shell-accent focus:border-shell-accent"
            autoComplete="off"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending}
            className="bg-shell-accent text-shell-bg font-bold rounded-full p-3 hover:bg-opacity-80 transition-colors duration-300 disabled:bg-gray-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 rotate-90"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeamChat;
