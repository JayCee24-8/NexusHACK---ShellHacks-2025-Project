import type { Invite, JoinRequest, AppNotification } from "../types";
import api from "./api";

interface NotificationsResponse {
  invites: Invite[];
  requests: JoinRequest[];
}

export async function getPendingNotifications(): Promise<AppNotification[]> {
  const response = await api<NotificationsResponse>("GET", "/teams/invites");

  const formattedInvites: AppNotification[] = response.invites.map(
    (invite) => ({
      ...invite,
      type: "invite",
    })
  );

  const formattedRequests: AppNotification[] = response.requests.map((req) => ({
    ...req,
    type: "request",
  }));

  return [...formattedInvites, ...formattedRequests];
}

// FIX: Changed teamId and inviteeId from number to string.
export async function inviteUser(
  teamId: string,
  inviteeId: string
): Promise<void> {
  await api("POST", `/teams/${teamId}/invite`, { inviteeId });
}

// FIX: Changed teamId from number to string.
export async function requestToJoinTeam(teamId: string): Promise<void> {
  await api("POST", `/teams/${teamId}/request`);
}

export async function acceptNotification(
  inviteId: string,
  force: boolean
): Promise<void> {
  await api("POST", `/teams/invites/${inviteId}/accept?force=${force}`);
}

export async function declineNotification(inviteId: string): Promise<void> {
  await api("POST", `/teams/invites/${inviteId}/decline`);
}
