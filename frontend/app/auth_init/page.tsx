"use client";

import React from "react";

export default function AuthInitPage() {
  const handleLogin = () => {
    // Add routing or event handler as needed later
    console.log("Login clicked");
  };

  const handleSignUp = () => {
    // Add routing or event handler as needed later
    console.log("Sign Up clicked");
  };

  return (
    <>
      <div className="runekeeper-logo-container">
        <h1 className="runekeeper-title">Runekeeper</h1>
      </div>

      <div className="button-group">
        <div className="rpg-wood-btn-wrap">
          <button className="rpg-wood-btn" onClick={handleLogin}>
            Login
          </button>
        </div>

        <div className="rpg-wood-btn-wrap">
          <button className="rpg-wood-btn" onClick={handleSignUp}>
            Sign Up
          </button>
        </div>
      </div>
    </>
  );
}
