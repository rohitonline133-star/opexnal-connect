import React, { useState } from "react";
import ProfileView from "./components/ProfileView";
import ReelsView from "./components/ReelsView";
import BottomNav from "./components/BottomNav";

export default function App() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="bg-black text-white min-h-screen pb-16">
      {activeTab === "profile" && <ProfileView />}
      {activeTab === "reels" && <ReelsView />}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
