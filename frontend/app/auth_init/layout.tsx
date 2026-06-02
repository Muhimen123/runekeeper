import React from "react";
import "./auth.css";

export const metadata = {
  title: "Runekeeper - Welcome",
  description: "Enter the world of Runekeeper",
};

export default function AuthInitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-container">
      <div className="auth-overlay" />
      <div className="auth-content">
        {children}
      </div>
    </div>
  );
}
