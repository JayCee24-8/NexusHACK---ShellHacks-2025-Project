import React, { useState } from "react";
import type { User } from "../types";
import { getProjectIdeas } from "../services/geminiService";
import { LoadingSpinner } from "./LoadingSpinner";

interface OnboardingProps {
  onOnboardingComplete: (user: User) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onOnboardingComplete }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    major: "",
    skills: "",
    interests: "",
    projectIdea: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateIdeas = async () => {
    if (!formData.skills && !formData.interests) {
      setError("Please enter some skills or interests to generate ideas.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const ideas = await getProjectIdeas(formData.skills, formData.interests);
      if (ideas && ideas.length > 0) {
        setFormData((prev) => ({ ...prev, projectIdea: ideas.join("\n- ") }));
      }
    } catch (e) {
      setError("Failed to generate ideas. Please try again.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      // FIX: Changed Date.now() to a string to match the User type 'id' field.
      id: String(Date.now()),
      fullName: formData.fullName,
      major: formData.major,
      skills: formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      // FIX: Correctly parse interests that can be separated by commas or newlines.
      interests: formData.interests
        .replace(/\r\n?/g, "\n")
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
      bio: formData.projectIdea,
      email: "",
      academicYear: "Freshman",
      isOpenToTeams: true,
    };
    onOnboardingComplete(newUser);
  };

  return (
    <div className="max-w-3xl mx-auto bg-shell-card p-8 rounded-lg shadow-2xl">
      <h2 className="text-3xl font-bold text-shell-text mb-2">
        Welcome to ShellHacks!
      </h2>
      <p className="text-shell-text-secondary mb-6">
        Create your hacker profile to find a team.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-shell-text-secondary mb-1"
            >
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              required
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full bg-shell-bg border border-fiu-blue rounded-md p-2 text-shell-text focus:ring-shell-accent focus:border-shell-accent"
            />
          </div>
          <div>
            <label
              htmlFor="major"
              className="block text-sm font-medium text-shell-text-secondary mb-1"
            >
              Major / Area of Study
            </label>
            <input
              type="text"
              name="major"
              id="major"
              required
              value={formData.major}
              onChange={handleInputChange}
              className="w-full bg-shell-bg border border-fiu-blue rounded-md p-2 text-shell-text focus:ring-shell-accent focus:border-shell-accent"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="skills"
            className="block text-sm font-medium text-shell-text-secondary mb-1"
          >
            Skills (comma-separated)
          </label>
          <input
            type="text"
            name="skills"
            id="skills"
            required
            placeholder="e.g., React, Python, Figma"
            value={formData.skills}
            onChange={handleInputChange}
            className="w-full bg-shell-bg border border-fiu-blue rounded-md p-2 text-shell-text focus:ring-shell-accent focus:border-shell-accent"
          />
        </div>

        <div>
          <label
            htmlFor="interests"
            className="block text-sm font-medium text-shell-text-secondary mb-1"
          >
            Hobbies & Interests
          </label>
          <textarea
            name="interests"
            id="interests"
            rows={3}
            required
            value={formData.interests}
            onChange={handleInputChange}
            className="w-full bg-shell-bg border border-fiu-blue rounded-md p-2 text-shell-text focus:ring-shell-accent focus:border-shell-accent"
          ></textarea>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label
              htmlFor="projectIdea"
              className="block text-sm font-medium text-shell-text-secondary"
            >
              Project Ideas
            </label>
            <button
              type="button"
              onClick={handleGenerateIdeas}
              disabled={isLoading}
              className="text-sm text-shell-accent hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" /> Generating...
                </>
              ) : (
                "✨ Get AI Ideas"
              )}
            </button>
          </div>
          <textarea
            name="projectIdea"
            id="projectIdea"
            rows={4}
            value={formData.projectIdea}
            onChange={handleInputChange}
            className="w-full bg-shell-bg border border-fiu-blue rounded-md p-2 text-shell-text focus:ring-shell-accent focus:border-shell-accent"
            placeholder="Describe a project you'd like to build, or use the AI generator!"
          ></textarea>
          {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>

        <button
          type="submit"
          className="w-full bg-fiu-blue text-white font-bold py-3 px-4 rounded-md hover:bg-fiu-gold transition-colors duration-300"
        >
          Create Profile & Find Team
        </button>
      </form>
    </div>
  );
};

export default Onboarding;
