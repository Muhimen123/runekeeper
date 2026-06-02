import React from "react";
import "../auth_init/auth.css"; // Reuse general buttons/fonts
import "./homepage.css";

export const metadata = {
  title: "Runekeeper - Rooms",
  description: "Join or Create a Room in Runekeeper",
};

export default function HomepageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="homepage-container">
      <div className="homepage-overlay" />
      <div className="homepage-content">
        {children}
      </div>
    </div>
  );
}
