export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  major: string | null;
  academicYear:
    | "Freshman"
    | "Sophomore"
    | "Junior"
    | "Senior"
    | "Graduate"
    | null;
  skills: string[];
  interests: string[];
  bio: string | null;
  profilePictureUrl?: string;
  isOpenToTeams: boolean;
  team?: {
    id: string;
    name: string;
  } | null;
  membership?: {
    team: {
      id: string;
      name: string;
    };
  } | null;
  inviteStatusFromMyTeam?: "PENDING" | null;
}

export interface Team {
  id: string;
  name: string;
  leaderId: string;
  memberIds: string[];
}

export interface MyTeamInfo {
  team: Team;
  role: "LEADER" | "MEMBER";
}

export interface Match {
  id: string;
  fullName: string;
  major: string;
  skills: string[];
  justification: string;
}

export interface ChatMessage {
  id: string;
  author: {
    id: string;
    fullName: string;
    profilePictureUrl?: string;
  };
  content: string;
  createdAt: string; // ISO string
}

// Represents an invitation for ME to join a team
export interface Invite {
  id: string;
  team: {
    id: string;
    name: string;
  };
  status: "PENDING";
}

// Represents a request from another user to join MY team
export interface JoinRequest {
  id: string;
  team: {
    id: string;
    name: string;
  };
  inviter: {
    id: string;
    fullName: string;
  };
}

// A unified type for the UI
export type AppNotification =
  | ({ type: "invite" } & Invite)
  | ({ type: "request" } & JoinRequest);
