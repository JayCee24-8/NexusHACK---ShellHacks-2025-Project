import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const meWithMembership = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      skills: true,
      interests: true,
      major: true,
      academicYear: true,
      bio: true,
      profilePictureUrl: true,
      membership: {
        select: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!meWithMembership) {
    return res.status(404).json({ error: "User not found" });
  }

  const me = {
    ...meWithMembership,
    team: meWithMembership.membership ? meWithMembership.membership.team : null,
    isOpenToTeams: true, // Keep adding this field for UI consistency
  };
  delete me.membership; // Clean up the response object

  res.json({ user: me });
});

router.patch("/me", requireAuth, async (req, res) => {
  // We can now save `profilePictureUrl` since it will be in the schema.
  const allowed = (({
    fullName,
    skills,
    interests,
    major,
    academicYear,
    bio,
    profilePictureUrl,
  }) => ({
    fullName,
    skills,
    interests,
    major,
    academicYear,
    bio,
    profilePictureUrl,
  }))(req.body);
  try {
    const updated = await prisma.user.update({
      where: { id: req.session.userId },
      data: allowed,
      select: {
        id: true,
        email: true,
        fullName: true,
        skills: true,
        interests: true,
        major: true,
        academicYear: true,
        bio: true,
        profilePictureUrl: true,
      },
    });
    // Add the `isOpenToTeams` field back to the response for the frontend, respecting the value from the request.
    if (updated) {
      updated.isOpenToTeams =
        typeof req.body.isOpenToTeams === "boolean"
          ? req.body.isOpenToTeams
          : true;
    }
    res.json({ user: updated });
  } catch {
    res.status(400).json({ error: "Bad request" });
  }
});

// open search (no auth required)
router.get("/", async (req, res) => {
  const { skill, interest, q } = req.query;
  const where = {
    AND: [
      skill ? { skills: { has: String(skill) } } : {},
      interest ? { interests: { has: String(interest) } } : {},
      q
        ? {
            OR: [
              { fullName: { contains: String(q), mode: "insensitive" } },
              { email: { contains: String(q), mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };
  const usersWithTeams = await prisma.user.findMany({
    where,
    select: {
      id: true,
      fullName: true,
      email: true,
      skills: true,
      interests: true,
      major: true,
      academicYear: true,
      bio: true,
      profilePictureUrl: true,
      membership: {
        select: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  // Flatten the response to match frontend expectations and add isOpenToTeams
  let users = usersWithTeams.map((u) => ({
    ...u,
    team: u.membership ? u.membership.team : null,
    isOpenToTeams: true, // Manually add the field for the frontend
    membership: undefined, // remove the nested membership object
  }));

  // If user is logged in and is a team leader, attach their pending invite statuses
  if (req.session.userId) {
    try {
      const myMembership = await prisma.teamMember.findUnique({
        where: { userId: req.session.userId },
      });

      if (myMembership && myMembership.role === "LEADER") {
        const myTeamId = myMembership.teamId;
        const sentInvites = await prisma.teamInvite.findMany({
          where: {
            teamId: myTeamId,
            kind: "INVITE",
            status: "PENDING",
            inviteeId: { in: users.map((u) => u.id) },
          },
          select: {
            inviteeId: true,
          },
        });
        const sentInviteIds = new Set(sentInvites.map((i) => i.inviteeId));

        users = users.map((u) => ({
          ...u,
          inviteStatusFromMyTeam: sentInviteIds.has(u.id) ? "PENDING" : null,
        }));
      }
    } catch (e) {
      // Non-critical error, proceed without invite statuses
      console.error(
        "Could not fetch sent invites for user",
        req.session.userId,
        e
      );
    }
  }

  res.json({ users });
});

export default router;
