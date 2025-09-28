import React, { useState } from "react";
import type { User } from "../types";
import * as authService from "../services/authService";
import { getProjectIdeas } from "../services/geminiService";
import { LoadingSpinner } from "./LoadingSpinner";

interface AuthProps {
  onLoginSuccess: (user: User) => void;
}

const resizeImage = (
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("File is not an image."));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error("FileReader did not return a result."));
      }
      const img = new Image();
      img.src = event.target.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Could not get canvas context"));
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.9)); // Use JPEG with 90% quality
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [authView, setAuthView] = useState<"login" | "register" | "forgot">(
    "login"
  );
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    major: "",
    academicYear: "Freshman" as User["academicYear"],
    skills: "",
    interests: "",
    bio: "",
    profilePictureUrl: "",
    isOpenToTeams: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setError(null);
        const resizedDataUrl = await resizeImage(file, 512, 512);
        setFormData((prev) => ({ ...prev, profilePictureUrl: resizedDataUrl }));
      } catch (err) {
        setError("Failed to process image. Please try another file.");
        console.error("Image resize failed:", err);
      }
    }
  };

  const handleGenerateIdeas = async () => {
    if (!formData.skills && !formData.interests) {
      setError("Please enter some skills or interests to generate ideas.");
      return;
    }
    setIsAiLoading(true);
    setError(null);
    try {
      const ideas = await getProjectIdeas(formData.skills, formData.interests);
      if (ideas && ideas.length > 0) {
        setFormData((prev) => ({ ...prev, bio: "- " + ideas.join("\n- ") }));
      }
    } catch (e) {
      setError("Failed to generate ideas. Please try again.");
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      let user;
      if (authView === "login") {
        user = await authService.login(formData.email, formData.password);
      } else {
        const { email, password, fullName, ...profileData } = formData;
        user = await authService.registerUser({
          ...profileData,
          email,
          password,
          fullName,
          skills: formData.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          interests: formData.interests
            .split(/[,\\n]/)
            .map((s) => s.trim())
            .filter(Boolean), // Backend expects an array
        });
      }
      onLoginSuccess(user);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setError("Please enter your email address.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await authService.requestPasswordReset(formData.email);
      setSuccessMessage(
        "If an account with this email exists, a password reset link has been sent."
      );
    } catch (err) {
      setError(
        (err as Error).message || "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewChange = (view: "login" | "register" | "forgot") => {
    setAuthView(view);
    setError(null);
    setSuccessMessage(null);
    setFormData((prev) => ({ ...prev, password: "" }));
  };

  if (authView === "forgot") {
    return (
      <div className="max-w-md mx-auto bg-shell-card p-8 rounded-lg shadow-2xl">
        <h2 className="text-3xl font-bold text-shell-text mb-2">
          Reset Password
        </h2>
        <p className="text-shell-text-secondary mb-6">
          Enter your email to receive a (mock) reset link.
        </p>
        <form onSubmit={handleResetSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-shell-text-secondary mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-shell-bg border border-fiu-blue rounded-md p-2 text-shell-text focus:ring-shell-accent focus:border-shell-accent"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-1 text-center">{error}</p>
          )}
          {successMessage && (
            <p className="text-green-400 text-sm mt-1 text-center">
              {successMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-fiu-blue text-white font-bold py-3 px-4 rounded-md hover:bg-fiu-gold transition-colors duration-300 disabled:bg-gray-500 flex justify-center items-center"
          >
            {isLoading ? <LoadingSpinner /> : "Send Reset Link"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={() => handleViewChange("login")}
            className="text-sm text-shell-accent hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-shell-card p-8 rounded-lg shadow-2xl">
      <h2 className="text-3xl font-bold text-shell-text mb-2">
        {authView === "login" ? "Login" : "Create Your Profile"}
      </h2>
      <p className="text-shell-text-secondary mb-6">
        {authView === "login"
          ? "Welcome back, hacker!"
          : "Join ShellHacks to find your dream team."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-shell-text-secondary mb-1"
          >
            Email Address
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className="w-full bg-shell-bg border border-fiu-blue rounded-md p-2 text-shell-text focus:ring-shell-accent focus:border-shell-accent"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-shell-text-secondary mb-1"
          >
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            required
            value={formData.password}
            onChange={handleInputChange}
            className="w-full bg-shell-bg border border-fiu-blue rounded-md p-2 text-shell-text focus:ring-shell-accent focus:border-shell-accent"
          />
        </div>

        {authView === "login" && (
          <div className="text-right -mt-4">
            <button
              type="button"
              onClick={() => handleViewChange("forgot")}
              className="text-sm text-shell-accent hover:underline focus:outline-none"
            >
              Forgot Password?
            </button>
          </div>
        )}

        {authView === "register" && (
          <>
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
                htmlFor="academicYear"
                className="block text-sm font-medium text-shell-text-secondary mb-1"
              >
                Academic Year
              </label>
              <select
                name="academicYear"
                id="academicYear"
                required
                value={formData.academicYear}
                onChange={handleInputChange}
                className="w-full bg-shell-bg border border-fiu-blue rounded-md p-2 text-shell-text focus:ring-shell-accent focus:border-shell-accent"
              >
                <option>Freshman</option>
                <option>Sophomore</option>
                <option>Junior</option>
                <option>Senior</option>
                <option>Graduate</option>
              </select>
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
                Hobbies & Interests (comma or new-line separated)
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
                  htmlFor="bio"
                  className="block text-sm font-medium text-shell-text-secondary"
                >
                  Project Ideas / Bio
                </label>
                <button
                  type="button"
                  onClick={handleGenerateIdeas}
                  disabled={isAiLoading}
                  className="text-sm text-shell-accent hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isAiLoading ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" /> Generating...
                    </>
                  ) : (
                    "✨ Get AI Ideas"
                  )}
                </button>
              </div>
              <textarea
                name="bio"
                id="bio"
                rows={4}
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full bg-shell-bg border border-fiu-blue rounded-md p-2 text-shell-text focus:ring-shell-accent focus:border-shell-accent"
                placeholder="Describe a project you'd like to build, or use the AI generator!"
              ></textarea>
            </div>
            <div>
              <label
                htmlFor="profilePicture"
                className="block text-sm font-medium text-shell-text-secondary mb-1"
              >
                Profile Picture (Optional)
              </label>
              <input
                type="file"
                name="profilePicture"
                id="profilePicture"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full text-sm text-shell-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-shell-accent file:text-shell-bg hover:file:bg-opacity-80"
              />
            </div>
          </>
        )}

        {error && (
          <p className="text-red-400 text-sm mt-1 text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-fiu-blue text-white font-bold py-3 px-4 rounded-md hover:bg-fiu-gold transition-colors duration-300 disabled:bg-gray-500 flex justify-center items-center"
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : authView === "login" ? (
            "Login"
          ) : (
            "Create Profile & Find Team"
          )}
        </button>
      </form>
      <div className="mt-6 text-center">
        <button
          onClick={() =>
            handleViewChange(authView === "login" ? "register" : "login")
          }
          className="text-sm text-shell-accent hover:underline"
        >
          {authView === "login"
            ? "Don't have an account? Sign up"
            : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};

export default Auth;
