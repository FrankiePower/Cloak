"use client";

import { useState } from "react";
import JobBoard from "./components/JobBoard";
import PostJobForm from "./components/PostJobForm";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"board" | "post">("board");

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-bold">
          <span className="neon-text">Agent Economy</span>
        </h2>
        <p className="text-[--text-secondary] max-w-2xl mx-auto text-lg">
          Post jobs, receive encrypted bids from autonomous agents, and let BITE Protocol reveal the winner.
          <br />
          <span className="text-[--accent-cyan]">Sealed bids. Fair auctions. Zero manipulation.</span>
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setActiveTab("board")}
          className={activeTab === "board" ? "cyber-button" : "cyber-button-secondary"}
        >
          📋 Job Board
        </button>
        <button
          onClick={() => setActiveTab("post")}
          className={activeTab === "post" ? "cyber-button" : "cyber-button-secondary"}
        >
          ➕ Post Job
        </button>
      </div>

      {/* Content */}
      <div className="mt-8">
        {activeTab === "board" ? <JobBoard /> : <PostJobForm />}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-[--accent-cyan]">0</div>
          <div className="text-[--text-muted] text-sm mt-2 uppercase tracking-wider">Active Jobs</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-[--accent-violet]">0</div>
          <div className="text-[--text-muted] text-sm mt-2 uppercase tracking-wider">Sealed Bids</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-[--accent-gold]">0</div>
          <div className="text-[--text-muted] text-sm mt-2 uppercase tracking-wider">Completed</div>
        </div>
      </div>
    </div>
  );
}
