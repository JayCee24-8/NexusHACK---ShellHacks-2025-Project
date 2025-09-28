
import React, { useState } from 'react';
import { getProjectIdeas } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

const ProjectIdeaGenerator: React.FC = () => {
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [ideas, setIdeas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateIdeas = async () => {
    if (!skills && !interests) {
      setError('Please enter some skills or interests to generate ideas.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setIdeas([]);
    try {
      const generatedIdeas = await getProjectIdeas(skills, interests);
      setIdeas(generatedIdeas);
    } catch (e) {
      setError('Failed to generate ideas. The AI might be busy, please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-shell-card p-8 rounded-lg shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-shell-text mb-2">🚀 Project Idea Generator</h2>
        <p className="text-shell-text-secondary">Unleash your creativity with AI-powered project ideas tailored to your skills and interests.</p>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-shell-text-secondary mb-1">Your Skills</label>
            <input 
              type="text" 
              id="skills" 
              value={skills} 
              onChange={(e) => setSkills(e.target.value)} 
              placeholder="e.g., React, Python, Figma" 
              className="w-full bg-shell-bg border border-fiu-blue rounded-md p-2 text-shell-text focus:ring-shell-accent focus:border-shell-accent" 
            />
          </div>
          <div>
            <label htmlFor="interests" className="block text-sm font-medium text-shell-text-secondary mb-1">Your Interests</label>
            <input 
              type="text" 
              id="interests" 
              value={interests} 
              onChange={(e) => setInterests(e.target.value)} 
              placeholder="e.g., AI for social good, hiking" 
              className="w-full bg-shell-bg border border-fiu-blue rounded-md p-2 text-shell-text focus:ring-shell-accent focus:border-shell-accent" 
            />
          </div>
        </div>

        <button 
          onClick={handleGenerateIdeas} 
          disabled={isLoading} 
          className="w-full bg-fiu-blue text-white font-bold py-3 px-4 rounded-md hover:bg-fiu-gold transition-colors duration-300 disabled:bg-gray-500 flex justify-center items-center"
        >
          {isLoading ? (
            <>
              <LoadingSpinner className="w-5 h-5 mr-2" />
              Generating Ideas...
            </>
          ) : (
            '✨ Generate Ideas'
          )}
        </button>

        {error && <p className="text-red-400 text-sm mt-1 text-center">{error}</p>}
      </div>

      {ideas.length > 0 && (
        <div className="mt-10">
          <h3 className="text-2xl font-bold text-shell-accent mb-4 text-center">Your Generated Ideas</h3>
          <div className="space-y-4">
            {ideas.map((idea, index) => (
              <div key={index} className="bg-shell-bg p-4 rounded-lg border border-fiu-blue/50">
                <p className="text-shell-text">{idea}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectIdeaGenerator;
