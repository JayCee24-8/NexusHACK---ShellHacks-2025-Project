import React, { useState, useRef, useEffect } from "react";
import type { User, AppNotification } from "../types";
import { Avatar } from "./Avatar";
import RequestsDropdown from "./RequestsDropdown";

interface HeaderProps {
  currentUser: User | null;
  setView: (
    view: "dashboard" | "profile" | "teamChat" | "projectIdeaGenerator"
  ) => void;
  pendingNotifications: AppNotification[];
  onAcceptRequest: (notification: AppNotification) => void;
  onDeclineRequest: (notificationId: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  currentUser,
  setView,
  pendingNotifications,
  onAcceptRequest,
  onDeclineRequest,
}) => {
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);
  const requestsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        requestsRef.current &&
        !requestsRef.current.contains(event.target as Node)
      ) {
        setIsRequestsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-shell-card shadow-lg">
      <div className="container mx-auto px-4 sm:px-8 py-4 flex justify-between items-center">
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => currentUser && setView("dashboard")}
        >
          <img
            src="/images/Logo.png"
            alt="ShellHacks Team Finder Logo"
            className="w-8 h-8"
          />
          <h1 className="text-xl md:text-2xl font-bold text-shell-text">
            ShellHacks Team Finder
          </h1>
        </div>

        {currentUser && (
          <nav className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => setView("dashboard")}
              className="text-shell-text-secondary hover:text-shell-accent transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => setView("projectIdeaGenerator")}
              className="text-shell-text-secondary hover:text-shell-accent transition-colors"
            >
              Idea Generator
            </button>
            {currentUser.team && (
              <button
                onClick={() => setView("teamChat")}
                className="text-shell-text-secondary hover:text-shell-accent transition-colors"
              >
                My Team
              </button>
            )}
            <div className="relative" ref={requestsRef}>
              <button
                onClick={() => setIsRequestsOpen((prev) => !prev)}
                className="relative text-shell-text-secondary hover:text-shell-accent transition-colors"
              >
                Requests
                {pendingNotifications.length > 0 && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>
              {isRequestsOpen && (
                <RequestsDropdown
                  notifications={pendingNotifications}
                  onAccept={onAcceptRequest}
                  onDecline={onDeclineRequest}
                  onClose={() => setIsRequestsOpen(false)}
                />
              )}
            </div>
            <button
              onClick={() => setView("profile")}
              className="flex items-center space-x-2 text-shell-text-secondary hover:text-shell-accent transition-colors"
            >
              <Avatar
                src={currentUser.profilePictureUrl}
                fullName={currentUser.fullName}
                size="sm"
              />
              <span className="hidden sm:inline">My Profile</span>
            </button>
          </nav>
        )}

        {!currentUser && (
          <div className="text-right">
            <p className="font-semibold text-fiu-gold hidden sm:block">
              Florida International University
            </p>
            <p className="text-sm text-shell-text-secondary hidden sm:block">
              Official Hackathon
            </p>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
