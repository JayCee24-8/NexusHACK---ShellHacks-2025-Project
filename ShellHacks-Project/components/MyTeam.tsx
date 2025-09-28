import React from "react";
import type { User, MyTeamInfo } from "../types";
import { TEAM_SIZE_LIMIT } from "../constants";
import { Avatar } from "./Avatar";

interface MyTeamProps {
  myTeamInfo: MyTeamInfo;
  members: User[];
  currentUser: User;
  // FIX: Changed userId from number to string to match the User type.
  handleRemoveMember: (userId: string) => void;
  handleLeaveTeam: () => void;
  handleDeleteTeam: () => void;
}

const MyTeam: React.FC<MyTeamProps> = ({
  myTeamInfo,
  members,
  currentUser,
  handleRemoveMember,
  handleLeaveTeam,
  handleDeleteTeam,
}) => {
  const { team, role } = myTeamInfo;
  const teamSlots = Array.from({ length: TEAM_SIZE_LIMIT });
  const isLeader = role === "LEADER";
  const leaderName =
    members.find((m) => m.id === team.leaderId)?.fullName || "Unknown";

  return (
    <div className="bg-shell-card p-6 rounded-lg shadow-2xl sticky top-8">
      <h2 className="text-2xl font-bold text-shell-text mb-1">{team.name}</h2>
      <p className="text-sm text-shell-text-secondary mb-2">
        Team Leader: {leaderName}
      </p>
      <p className="text-shell-text-secondary mb-4">
        Team Size:{" "}
        <span className="font-bold text-shell-accent">
          {members.length} / {TEAM_SIZE_LIMIT}
        </span>
      </p>
      <div className="space-y-3">
        {teamSlots.map((_, index) => {
          const member = members[index];
          if (member) {
            return (
              <div
                key={member.id}
                className="bg-shell-bg p-3 rounded-md flex items-center justify-between transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={member.profilePictureUrl}
                    fullName={member.fullName}
                  />
                  <div>
                    <p className="font-bold text-shell-text">
                      {member.fullName}{" "}
                      {member.id === currentUser.id ? "(You)" : ""}
                    </p>
                    <p className="text-sm text-shell-text-secondary">
                      {member.major}
                    </p>
                  </div>
                </div>
                {isLeader && member.id !== currentUser.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-400 hover:text-red-300 text-xs font-semibold uppercase tracking-wider"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          }
          return (
            <div
              key={index}
              className="bg-shell-bg p-3 rounded-md border-2 border-dashed border-gray-600"
            >
              <p className="text-center text-shell-text-secondary">Open Slot</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-between items-center">
        {isLeader ? (
          <button
            onClick={handleDeleteTeam}
            className="w-full bg-red-800/50 text-red-300 font-bold py-2 px-4 rounded-md hover:bg-red-800/80 transition-colors duration-300"
          >
            Delete Team
          </button>
        ) : (
          <button
            onClick={handleLeaveTeam}
            className="w-full bg-yellow-800/50 text-yellow-300 font-bold py-2 px-4 rounded-md hover:bg-yellow-800/80 transition-colors duration-300"
          >
            Leave Team
          </button>
        )}
      </div>

      {members.length === TEAM_SIZE_LIMIT && (
        <div className="mt-4 text-center bg-green-900 border border-green-500 text-green-200 p-2 rounded-md">
          Your team is full! Let's get building!
        </div>
      )}
    </div>
  );
};

export default MyTeam;
