import React, { useState } from "react";
import type { User } from "../types";
import * as authService from "../services/authService";
import { Avatar } from "./Avatar";
import { LoadingSpinner } from "./LoadingSpinner";

interface ProfileProps {
  user: User;
  onUserUpdate: (user: User) => void;
  onLogout: () => void;
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

const Profile: React.FC<ProfileProps> = ({ user, onUserUpdate, onLogout }) => {
  const [formData, setFormData] = useState({
    ...user,
    skills: Array.isArray(user.skills) ? user.skills.join(", ") : "",
    interests: Array.isArray(user.interests) ? user.interests.join(", ") : "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);
    setError(null);
    try {
      const skillsAsArray = String(formData.skills)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const interestsAsArray = String(formData.interests)
        .split(/[,\\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const updatedUser = await authService.updateUser({
        ...formData,
        skills: skillsAsArray,
        interests: interestsAsArray,
      });
      onUserUpdate(updatedUser);
      setSuccessMessage("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile", err);
      setError((err as Error).message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-shell-card p-8 rounded-lg shadow-2xl">
      <h2 className="text-3xl font-bold text-shell-text mb-6">My Profile</h2>
      {error && (
        <div
          className="bg-red-900 border border-red-600 text-red-100 px-4 py-3 rounded-md mb-6 text-center"
          role="alert"
        >
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center space-x-6">
          <Avatar
            src={formData.profilePictureUrl}
            fullName={formData.fullName}
            size="lg"
          />
          <div>
            <label
              htmlFor="profilePicture"
              className="block text-sm font-medium text-shell-text-secondary mb-1"
            >
              Update Profile Picture
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
        </div>

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
            disabled
            className="w-full bg-gray-700 border border-fiu-blue rounded-md p-2 text-gray-400 cursor-not-allowed"
          />
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
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-shell-text-secondary mb-1"
          >
            Project Idea / Bio
          </label>
          <textarea
            name="bio"
            id="bio"
            rows={4}
            value={formData.bio}
            onChange={handleInputChange}
            className="w-full bg-shell-bg border border-fiu-blue rounded-md p-2 text-shell-text focus:ring-shell-accent focus:border-shell-accent"
          ></textarea>
        </div>

        <div className="flex items-center space-x-3 bg-shell-bg p-3 rounded-md">
          <input
            type="checkbox"
            name="isOpenToTeams"
            id="isOpenToTeams"
            checked={formData.isOpenToTeams}
            onChange={handleInputChange}
            className="h-5 w-5 rounded bg-shell-bg border-fiu-blue text-shell-accent focus:ring-shell-accent"
          />
          <label
            htmlFor="isOpenToTeams"
            className="font-medium text-shell-text"
          >
            Open to new teams
          </label>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={onLogout}
            className="text-sm text-red-400 hover:underline"
          >
            Sign Out
          </button>
          <div className="flex items-center space-x-4">
            {successMessage && (
              <p className="text-green-400">{successMessage}</p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-fiu-blue text-white font-bold py-2 px-6 rounded-md hover:bg-fiu-gold transition-colors duration-300 disabled:bg-gray-500 flex items-center justify-center"
            >
              {isLoading ? (
                <LoadingSpinner className="w-5 h-5" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Profile;
