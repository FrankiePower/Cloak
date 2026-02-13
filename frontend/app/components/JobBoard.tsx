"use client";

import { useState, useEffect } from "react";

interface Job {
  jobId: number;
  description: string;
  budget: string;
  deadline: number;
  status: string;
  bidCount: number;
  winner?: string;
  winningBid?: string;
}

export default function JobBoard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);

  useEffect(() => {
    // TODO: Fetch jobs from blockchain
    // For now, showing placeholder
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-[--text-muted]">Loading jobs from BITE V2 Sandbox...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-4">🏗️</div>
        <h3 className="text-2xl font-bold mb-2 text-[--text-primary]">No Active Jobs</h3>
        <p className="text-[--text-muted]">
          Be the first to post a job and watch autonomous agents compete with sealed bids.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Job List */}
      <div className="grid grid-cols-1 gap-6">
        {jobs.map((job) => (
          <div
            key={job.jobId}
            className="gradient-border cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => setSelectedJob(job.jobId === selectedJob ? null : job.jobId)}
          >
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-[--text-muted] text-sm">JOB #{job.jobId}</span>
                    <span className={`status-${job.status.toLowerCase()}`}>{job.status}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[--text-primary]">{job.description}</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[--accent-cyan]">{job.budget} USDC</div>
                  <div className="text-xs text-[--text-muted] mt-1">MAX BUDGET</div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-[--text-muted]">📩 Bids:</span>
                  <span className="text-[--accent-gold] font-bold">{job.bidCount}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[--text-muted]">⏰ Deadline:</span>
                  <span className="text-[--text-secondary]">Block #{job.deadline}</span>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedJob === job.jobId && (
                <div className="pt-4 border-t border-[--border-glow] space-y-4">
                  {job.status === "Open" && (
                    <div className="bg-[--bg-primary] p-4 rounded">
                      <h4 className="text-sm font-bold text-[--accent-cyan] mb-2 uppercase">
                        🔒 Sealed Bids (Encrypted)
                      </h4>
                      <p className="text-[--text-muted] text-sm">
                        {job.bidCount} agents have submitted encrypted bids. Bids will be revealed simultaneously after the deadline using BITE Protocol.
                      </p>
                    </div>
                  )}

                  {job.winner && (
                    <div className="bg-[--bg-primary] p-4 rounded">
                      <h4 className="text-sm font-bold text-[--accent-gold] mb-2 uppercase">
                        🏆 Winner Selected
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[--text-muted]">Winner:</span>
                          <span className="text-[--accent-cyan] font-mono">{job.winner.slice(0, 10)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[--text-muted]">Winning Bid:</span>
                          <span className="text-[--accent-gold] font-bold">{job.winningBid} USDC</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
