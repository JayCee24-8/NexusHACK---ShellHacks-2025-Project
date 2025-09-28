import type { User } from "./types";

export const TEAM_SIZE_LIMIT = 4;

// This mock data is now only used for initial database seeding if the backend is empty.
// The frontend will fetch real user data from the API.
export const MOCK_USERS: User[] = [
  {
    // FIX: Changed id to a string to match the User type.
    id: "1",
    fullName: "Elena Rodriguez",
    email: "elena@fiu.edu",
    password: "password123",
    major: "Computer Science",
    academicYear: "Senior",
    skills: ["Python", "Machine Learning", "Data Analysis", "Flask"],
    interests: ["AI for social good", "hiking", "indie music"],
    bio: "An app that uses ML to identify plant diseases from photos.",
    isOpenToTeams: true,
    team: null,
  },
  {
    // FIX: Changed id to a string to match the User type.
    id: "2",
    fullName: "Ben Carter",
    email: "ben@fiu.edu",
    password: "password123",
    major: "Electrical Engineering",
    academicYear: "Junior",
    skills: ["Arduino", "C++", "IoT", "Circuit Design"],
    interests: ["Building custom hardware", "robotics", "playing guitar"],
    bio: "A smart home device that monitors energy consumption and suggests savings.",
    isOpenToTeams: true,
    team: null,
  },
  {
    // FIX: Changed id to a string to match the User type.
    id: "3",
    fullName: "Aisha Khan",
    email: "aisha@fiu.edu",
    password: "password123",
    major: "UX/UI Design",
    academicYear: "Senior",
    skills: ["Figma", "User Research", "Prototyping", "HTML/CSS"],
    interests: [
      "Creating accessible designs",
      "digital art",
      "learning new languages",
    ],
    bio: "Redesigning a local non-profit's website to improve user engagement.",
    isOpenToTeams: false,
    team: null,
  },
  {
    // FIX: Changed id to a string to match the User type.
    id: "4",
    fullName: "Carlos Gomez",
    email: "carlos@fiu.edu",
    password: "password123",
    major: "Computer Science",
    academicYear: "Sophomore",
    skills: ["JavaScript", "React", "Node.js", "Firebase"],
    interests: ["Web3", "video games", "watching soccer"],
    bio: "A decentralized application for tracking personal carbon footprint.",
    isOpenToTeams: true,
    team: null,
  },
  {
    // FIX: Changed id to a string to match the User type.
    id: "5",
    fullName: "Samantha Lee",
    email: "samantha@fiu.edu",
    password: "password123",
    major: "Data Science",
    academicYear: "Graduate",
    skills: ["R", "Tableau", "SQL", "Statistics"],
    interests: ["Data visualization", "cooking", "running marathons"],
    bio: "An interactive dashboard visualizing city crime data to find patterns.",
    isOpenToTeams: true,
    team: null,
  },
  {
    // FIX: Changed id to a string to match the User type.
    id: "6",
    fullName: "David Chen",
    email: "david@fiu.edu",
    password: "password123",
    major: "Cybersecurity",
    academicYear: "Junior",
    skills: ["Network Security", "Penetration Testing", "Python", "Linux"],
    interests: ["Ethical hacking", "CTF competitions", "sci-fi movies"],
    bio: "A tool to scan smart contracts for common vulnerabilities.",
    isOpenToTeams: false,
    team: null,
  },
  {
    // FIX: Changed id to a string to match the User type.
    id: "7",
    fullName: "Maria Garcia",
    email: "maria@fiu.edu",
    password: "password123",
    major: "Software Engineering",
    academicYear: "Senior",
    skills: ["Java", "Spring Boot", "AWS", "Docker"],
    interests: ["Backend systems", "cloud architecture", "salsa dancing"],
    bio: "A scalable microservice backend for a food delivery startup.",
    isOpenToTeams: true,
    team: null,
  },
  {
    // FIX: Changed id to a string to match the User type.
    id: "8",
    fullName: "Leo Petrov",
    email: "leo@fiu.edu",
    password: "password123",
    major: "Computer Graphics",
    academicYear: "Sophomore",
    skills: ["Unity", "C#", "Blender", "Shader Programming"],
    interests: ["Game development", "3D modeling", "virtual reality"],
    bio: "An educational VR experience that takes users on a tour of ancient Rome.",
    isOpenToTeams: true,
    team: null,
  },
];
