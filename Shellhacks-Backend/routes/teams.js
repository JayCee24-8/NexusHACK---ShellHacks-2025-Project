import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
const TEAM_SIZE_LIMIT = 4;

// Get current user's team info (if any)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const membership = await prisma.teamMember.findUnique({
      where: { userId: req.session.userId },
      include: {
        team: {
          include: {
            members: { select: { userId: true } },
          },
        },
      },
    });

    if (!membership) {
      return res.json({ team: null, role: null });
    }

    const { team, role } = membership;
    const responseTeam = {
      ...team,
      memberIds: team.members.map((m) => m.userId),
    };
    delete responseTeam.members;

    res.json({ team: responseTeam, role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get team info." });
  }
});

// Get all pending invites and requests for the current user
router.get("/invites", requireAuth, async (req, res) => {
  const userId = req.session.userId;
  try {
    // Invites sent TO me
    const invites = await prisma.teamInvite.findMany({
      where: { inviteeId: userId, status: "PENDING", kind: "INVITE" },
      include: { team: { select: { id: true, name: true } } },
    });

    // Requests sent to teams I LEAD
    const myLedTeams = await prisma.team.findMany({
      where: { leaderId: userId },
      select: { id: true },
    });
    const myLedTeamIds = myLedTeams.map((t) => t.id);

    const requests = await prisma.teamInvite.findMany({
      where: {
        teamId: { in: myLedTeamIds },
        status: "PENDING",
        kind: "REQUEST",
      },
      include: {
        inviter: { select: { id: true, fullName: true } },
        team: { select: { id: true, name: true } },
      },
    });

    res.json({ invites, requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve notifications." });
  }
});

// Create a team
router.post("/", requireAuth, async (req, res) => {
  const { name } = req.body;
  const userId = req.session.userId;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "Team name is required" });
  }

  const existingMembership = await prisma.teamMember.findUnique({
    where: { userId },
  });
  if (existingMembership) {
    return res.status(400).json({ error: "User is already in a team" });
  }

  try {
    const newTeam = await prisma.team.create({
      data: {
        name: name.trim(),
        leaderId: userId,
        members: {
          create: {
            userId: userId,
            role: "LEADER",
          },
        },
      },
    });
    res.status(201).json({ team: { ...newTeam, memberIds: [userId] } });
  } catch (error) {
    res.status(500).json({ error: "Could not create team" });
  }
});

// Invite a user to a team
router.post("/:id/invite", requireAuth, async (req, res) => {
  const teamId = req.params.id;
  const inviterId = req.session.userId;
  const { inviteeId } = req.body;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });
  if (!team) return res.status(404).json({ error: "Team not found." });
  if (team.leaderId !== inviterId)
    return res.status(403).json({ error: "Only team leader can invite." });
  if (team.members.length >= TEAM_SIZE_LIMIT)
    return res.status(400).json({ error: "Team is full." });

  await prisma.teamInvite.create({
    data: { teamId, inviterId, inviteeId, kind: "INVITE" },
  });
  res.status(204).send();
});

// Request to join a team
router.post("/:id/request", requireAuth, async (req, res) => {
  const teamId = req.params.id;
  const inviterId = req.session.userId; // user requesting is the "inviter" in this context

  const existingMembership = await prisma.teamMember.findUnique({
    where: { userId: inviterId },
  });
  if (existingMembership)
    return res.status(400).json({ error: "You are already in a team." });

  await prisma.teamInvite.create({
    data: { teamId, inviterId, kind: "REQUEST" },
  });
  res.status(204).send();
});

// Accept an invite or request
router.post("/invites/:id/accept", requireAuth, async (req, res) => {
  const inviteId = req.params.id;
  const userId = req.session.userId;
  const force = req.query.force === "true";

  try {
    await prisma.$transaction(async (tx) => {
      const invite = await tx.teamInvite.findUnique({
        where: { id: inviteId },
        include: { team: { include: { members: true } } },
      });
      if (!invite || invite.status !== "PENDING")
        throw { status: 404, message: "Invite not found or already handled." };

      // Auth check
      if (invite.kind === "INVITE" && invite.inviteeId !== userId)
        throw { status: 403, message: "Forbidden" };
      if (invite.kind === "REQUEST" && invite.team.leaderId !== userId)
        throw { status: 403, message: "Forbidden" };

      const userToJoinId =
        invite.kind === "INVITE" ? invite.inviteeId : invite.inviterId;

      if (invite.team.members.length >= TEAM_SIZE_LIMIT)
        throw { status: 400, message: "Team is now full." };

      const existingMembership = await tx.teamMember.findUnique({
        where: { userId: userToJoinId },
        include: { team: true },
      });
      if (existingMembership) {
        if (existingMembership.role === "LEADER") {
          if (!force)
            throw {
              status: 409,
              message: "User is a leader of another team.",
              code: "HAS_TEAM_CONFIRM_REQUIRED",
            };
          await tx.team.delete({ where: { id: existingMembership.teamId } });
        } else {
          await tx.teamMember.delete({ where: { id: existingMembership.id } });
        }
      }

      await tx.teamMember.create({
        data: { teamId: invite.teamId, userId: userToJoinId },
      });
      await tx.teamInvite.update({
        where: { id: inviteId },
        data: { status: "ACCEPTED" },
      });
    });
    res.status(204).send();
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: error.message || "Server error", code: error.code });
  }
});

// Decline an invite or request
router.post("/invites/:id/decline", requireAuth, async (req, res) => {
  const inviteId = req.params.id;
  // For simplicity, we allow any involved party (inviter, invitee, leader) to decline/cancel.
  await prisma.teamInvite.update({
    where: { id: inviteId },
    data: { status: "DECLINED" },
  });
  res.status(204).send();
});

// Delete a team
router.delete("/:id", requireAuth, async (req, res) => {
  const teamId = req.params.id;
  const userId = req.session.userId;

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return res.status(404).json({ error: "Team not found" });
  if (team.leaderId !== userId)
    return res
      .status(403)
      .json({ error: "Only the team leader can delete the team" });

  try {
    await prisma.team.delete({ where: { id: teamId } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete team." });
  }
});

// Leave a team
router.post("/:id/leave", requireAuth, async (req, res) => {
  const teamId = req.params.id;
  const userId = req.session.userId;

  try {
    const membership = await prisma.teamMember.findFirst({
      where: { userId, teamId },
    });
    if (!membership)
      return res.status(400).json({ error: "User is not in this team" });

    if (membership.role === "LEADER") {
      await prisma.team.delete({ where: { id: teamId } });
    } else {
      await prisma.teamMember.delete({ where: { id: membership.id } });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to leave team." });
  }
});

// Remove a member
router.delete("/:id/members/:memberId", requireAuth, async (req, res) => {
  const teamId = req.params.id;
  const memberIdToRemove = req.params.memberId;
  const leaderId = req.session.userId;

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return res.status(404).json({ error: "Team not found" });
  if (team.leaderId !== leaderId)
    return res
      .status(403)
      .json({ error: "Only the team leader can remove members" });
  if (memberIdToRemove === leaderId)
    return res.status(400).json({ error: "Leader cannot remove themselves" });

  try {
    await prisma.teamMember.deleteMany({
      where: { teamId, userId: memberIdToRemove },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to remove member." });
  }
});

// Get chat messages for a team
router.get("/:id/chat", requireAuth, async (req, res) => {
  const teamId = req.params.id;
  const userId = req.session.userId;

  const isMember = await prisma.teamMember.findFirst({
    where: { teamId, userId },
  });
  if (!isMember)
    return res
      .status(403)
      .json({ error: "You are not a member of this team." });

  const messages = await prisma.teamMessage.findMany({
    where: { teamId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: {
        select: { id: true, fullName: true, profilePictureUrl: true },
      },
    },
  });
  res.json({ messages });
});

// Post a new chat message
router.post("/:id/chat/messages", requireAuth, async (req, res) => {
  const teamId = req.params.id;
  const authorId = req.session.userId;
  const { content } = req.body;

  const isMember = await prisma.teamMember.findFirst({
    where: { teamId, userId: authorId },
  });
  if (!isMember)
    return res
      .status(403)
      .json({ error: "You are not a member of this team." });

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({ error: "Message content cannot be empty." });
  }

  const message = await prisma.teamMessage.create({
    data: { teamId, authorId, content },
    include: {
      author: {
        select: { id: true, fullName: true, profilePictureUrl: true },
      },
    },
  });

  res.status(201).json({ message });
});

export default router;
