import React from "react";
import type { User, Team, AppNotification } from "../types";
import { Avatar } from "./Avatar";

interface ParticipantCardProps {
  user: User;
  onInvite: (user: User) => void;
  onRequestToJoin: (user: User) => void;
  currentUser: User;
  currentUserTeam: Team | null;
  isTeamFull: boolean;
  notifications: AppNotification[];
  isMatch?: boolean;
  matchJustification?: string;
}

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="bg-fiu-blue/50 text-shell-accent text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full">
    {children}
  </span>
);

const ParticipantCard: React.FC<ParticipantCardProps> = ({
  user,
  onInvite,
  onRequestToJoin,
  currentUser,
  currentUserTeam,
  isTeamFull,
  notifications,
  isMatch = false,
  matchJustification,
}) => {
  const participantTeam = user.team;

  const renderActionButton = () => {
    const isCurrentUserLeader = currentUserTeam?.leaderId === currentUser.id;
    const isUserInMyTeam =
      currentUserTeam?.memberIds.includes(user.id) ?? false;

    const baseButtonClasses =
      "w-full sm:w-auto mt-2 sm:mt-0 text-shell-bg font-bold py-1 px-4 rounded-md text-sm transition-colors duration-300";
    const enabledClasses = "bg-shell-accent hover:bg-opacity-80";
    const disabledClasses = "bg-gray-600 text-gray-400 cursor-not-allowed";

    // Check if I (as a leader) have already invited this user. This data comes from the GET /users endpoint.
    if (user.inviteStatusFromMyTeam === "PENDING") {
      return (
        <button disabled className={`${baseButtonClasses} ${disabledClasses}`}>
          Invited
        </button>
      );
    }

    // Check if I have a pending request to join this user's team. This data comes from the GET /teams/invites notification endpoint.
    const pendingRequest = notifications.find(
      (n) =>
        n.type === "request" &&
        n.inviter.id === currentUser.id &&
        n.team.id === user.team?.id
    );

    if (pendingRequest) {
      return (
        <button disabled className={`${baseButtonClasses} ${disabledClasses}`}>
          Request Sent
        </button>
      );
    }

    if (isUserInMyTeam) {
      return (
        <button disabled className={`${baseButtonClasses} ${disabledClasses}`}>
          In Your Team
        </button>
      );
    }

    if (currentUserTeam) {
      // Current user IS on a team
      if (isCurrentUserLeader) {
        if (isTeamFull) {
          return (
            <button
              disabled
              className={`${baseButtonClasses} ${disabledClasses}`}
            >
              Team Full
            </button>
          );
        }
        if (!user.isOpenToTeams) {
          return (
            <button
              disabled
              className={`${baseButtonClasses} ${disabledClasses}`}
            >
              Not Looking
            </button>
          );
        }
        if (user.team) {
          return (
            <button
              disabled
              className={`${baseButtonClasses} ${disabledClasses}`}
            >
              Already in a team
            </button>
          );
        }
        return (
          <button
            onClick={() => onInvite(user)}
            className={`${baseButtonClasses} ${enabledClasses}`}
          >
            Invite to Team
          </button>
        );
      } else {
        return (
          <button
            disabled
            className={`${baseButtonClasses} ${disabledClasses}`}
          >
            Only leaders invite
          </button>
        );
      }
    } else {
      // Current user is NOT on a team
      if (participantTeam) {
        if (!user.isOpenToTeams) {
          return (
            <button
              disabled
              className={`${baseButtonClasses} ${disabledClasses}`}
            >
              Not Looking
            </button>
          );
        }
        return (
          <button
            onClick={() => onRequestToJoin(user)}
            className={`${baseButtonClasses} ${enabledClasses}`}
          >
            Request to Join
          </button>
        );
      } else {
        return (
          <button
            disabled
            className={`${baseButtonClasses} ${disabledClasses}`}
          >
            Create a team to invite
          </button>
        );
      }
    }
  };

  return (
    <div
      className={`bg-shell-bg p-4 rounded-lg border transition-all duration-300 ${
        isMatch ? "border-shell-accent shadow-lg" : "border-fiu-blue/50"
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-start">
        <div className="flex items-center space-x-4">
          <Avatar src={user.profilePictureUrl} fullName={user.fullName} />
          <div>
            <div className="flex items-center flex-wrap gap-x-2">
              <h4 className="text-lg font-bold text-shell-text">
                {user.fullName}
              </h4>
              {user.isOpenToTeams ? (
                <span className="text-xs bg-green-500/30 text-green-300 font-bold py-0.5 px-2 rounded-full">
                  Open to Teams
                </span>
              ) : (
                <span className="text-xs bg-gray-500/30 text-gray-400 font-bold py-0.5 px-2 rounded-full">
                  Not Looking
                </span>
              )}
              {participantTeam && (
                <span className="text-xs bg-purple-500/30 text-purple-300 font-bold py-0.5 px-2 rounded-full">
                  Team: {participantTeam.name}
                </span>
              )}
            </div>
            <p className="text-sm text-shell-text-secondary mb-2">
              {user.major || "Undeclared"} - {user.academicYear || "N/A"}
            </p>
          </div>
        </div>
        {renderActionButton()}
      </div>

      {isMatch && matchJustification && (
        <div className="mt-3 p-3 bg-shell-accent/10 rounded-md border-l-4 border-shell-accent">
          <p className="text-sm text-shell-accent">
            <span className="font-bold">AI Match:</span> {matchJustification}
          </p>
        </div>
      )}

      <div className="mt-4">
        <h5 className="text-sm font-semibold text-shell-text-secondary mb-2">
          Skills
        </h5>
        <div className="flex flex-wrap">
          {user.skills.map((skill) => (
            <Tag key={skill}>{skill}</Tag>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <h5 className="text-sm font-semibold text-shell-text-secondary mb-1">
          Interests
        </h5>
        <p className="text-sm text-shell-text">
          {Array.isArray(user.interests)
            ? user.interests.join(", ")
            : user.interests}
        </p>
      </div>
      <div className="mt-4">
        <h5 className="text-sm font-semibold text-shell-text-secondary mb-1">
          Bio / Project Idea
        </h5>
        <p className="text-sm text-shell-text italic">
          "{user.bio || "No bio provided."}"
        </p>
      </div>
    </div>
  );
};

export default ParticipantCard;
