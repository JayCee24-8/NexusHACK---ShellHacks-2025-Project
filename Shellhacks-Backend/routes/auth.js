import { Router } from "express";
import { prisma } from "../prisma.js";
import { hashPassword, verifyPassword } from "../auth/hash.js";
import { registerSchema, loginSchema } from "../auth/validate.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (exists)
      return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        passwordHash,
        academicYear: data.academicYear ?? null,
        major: data.major ?? null,
        interests: data.interests ?? [],
        skills: data.skills ?? [],
        bio: data.bio ?? null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        skills: true,
        interests: true,
      },
    });

    // create session
    req.session.userId = user.id;
    res.status(201).json({ user });
  } catch (err) {
    const message = err?.issues?.[0]?.message || err.message || "Invalid data";
    res.status(400).json({ error: message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    req.session.userId = user.id;
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        skills: user.skills,
        interests: user.interests,
      },
    });
  } catch (err) {
    const message = err?.issues?.[0]?.message || err.message || "Invalid data";
    res.status(400).json({ error: message });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.json({ ok: true });
  });
});

export default router;
