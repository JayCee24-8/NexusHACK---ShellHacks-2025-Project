import type { Team, MyTeamInfo } from "../types";
import api from "./api";

export async function getMyTeam(): Promise<MyTeamInfo> {
  return api<MyTeamInfo>("GET", "/teams/me");
}

export async function createTeam(name: string): Promise<Team> {
  const { team } = await api<{ team: Team }>("POST", "/teams", { name });
  return team;
}

// FIX: Changed teamId from number to string.
export async function deleteTeam(teamId: string): Promise<void> {
  await api("DELETE", `/teams/${teamId}`);
}

// FIX: Changed teamId from number to string.
export async function leaveTeam(teamId: string): Promise<void> {
  await api("POST", `/teams/${teamId}/leave`);
}

// FIX: Changed teamId and memberUserId from number to string.
export async function removeMember(
  teamId: string,
  memberUserId: string
): Promise<void> {
  await api("DELETE", `/teams/${teamId}/members/${memberUserId}`);
}
