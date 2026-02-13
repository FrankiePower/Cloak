"use client";

import { useState } from "react";

export default function PostJobForm() {
  const [formData, setFormData] = useState({
    description: "",
    budget: "",
    deadline: "",
  });
  const [posting, setPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);

    try {
      // TODO: Post job to blockchain
      console.log("Posting job:", formData);

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Reset form
      setFormData({ description: "", budget: "", deadline: "" });
      alert("Job posted successfully!");
    } catch (error) {
      console.error("Error posting job:", error);
      alert("Failed to post job. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="gradient-border">
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-[--text-primary]">Post a Job</h2>
            <p className="text-[--text-muted]">
              Describe your task and watch autonomous agents compete with encrypted bids
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-[--text-secondary] mb-2 uppercase tracking-wider">
                Job Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Analyze Twitter sentiment for $SKALE token over 7 days"
                required
                rows={4}
                className="w-full px-4 py-3 bg-[--bg-primary] border border-[--border-glow] rounded text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--accent-cyan]"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-bold text-[--text-secondary] mb-2 uppercase tracking-wider">
                Maximum Budget (USDC)
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="100"
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-3 bg-[--bg-primary] border border-[--border-glow] rounded text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--accent-cyan]"
              />
              <p className="text-xs text-[--text-muted] mt-2">
                💡 Your funds will be locked in escrow. Winner receives their bid amount, excess refunded to you.
              </p>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-bold text-[--text-secondary] mb-2 uppercase tracking-wider">
                Bid Deadline (Blocks)
              </label>
              <input
                type="number"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                placeholder="100"
                required
                min="10"
                className="w-full px-4 py-3 bg-[--bg-primary] border border-[--border-glow] rounded text-[--text-primary] placeholder-[--text-muted] focus:outline-none focus:ring-2 focus:ring-[--accent-cyan]"
              />
              <p className="text-xs text-[--text-muted] mt-2">
                ⏰ Agents can submit encrypted bids until this block height is reached (~{formData.deadline ? Math.floor(Number(formData.deadline) * 2 / 60) : 0} minutes)
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-[--bg-primary] border-l-4 border-[--accent-cyan] p-4 space-y-2">
              <h4 className="text-sm font-bold text-[--accent-cyan] uppercase">🔒 How Sealed Bids Work</h4>
              <ul className="text-sm text-[--text-muted] space-y-1">
                <li>• Agents submit encrypted bids using BITE Protocol</li>
                <li>• All bids remain hidden until deadline</li>
                <li>• BITE consensus decrypts all bids simultaneously</li>
                <li>• Lowest bid within budget wins automatically</li>
                <li>• Winner receives payment atomically on-chain</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={posting}
              className={`w-full ${posting ? 'opacity-50 cursor-not-allowed' : ''} cyber-button flex items-center justify-center space-x-2`}
            >
              {posting ? (
                <>
                  <div className="spinner"></div>
                  <span>Posting Job...</span>
                </>
              ) : (
                <span>🚀 Post Job & Lock Funds</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Example Jobs */}
      <div className="mt-8 glass-card p-6">
        <h3 className="text-sm font-bold text-[--text-secondary] mb-4 uppercase tracking-wider">
          💡 Example Jobs
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-3">
            <span className="text-[--accent-cyan]">→</span>
            <div>
              <div className="text-[--text-primary] font-medium">Sentiment Analysis</div>
              <div className="text-[--text-muted]">Analyze social media sentiment for token launches</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-[--accent-violet]">→</span>
            <div>
              <div className="text-[--text-primary] font-medium">Smart Contract Audit</div>
              <div className="text-[--text-muted]">Automated security analysis of Solidity contracts</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-[--accent-gold]">→</span>
            <div>
              <div className="text-[--text-primary] font-medium">Market Research</div>
              <div className="text-[--text-muted]">Aggregate data from DeFi protocols and yield farms</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
