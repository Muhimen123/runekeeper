"use client";

import { useRouter } from "next/navigation";

export default function AuthInitPage() {

  const router = useRouter();
  return (
    <>
      <div className="runekeeper-logo-container">
        <h1 className="runekeeper-title">Runekeeper</h1>
      </div>

      <div className="button-group">
        <div className="rpg-wood-btn-wrap">
          <button className="rpg-wood-btn" onClick={()=>router.push("/login")}>
            Login
          </button>
        </div>

        <div className="rpg-wood-btn-wrap">
          <button className="rpg-wood-btn" onClick={()=>router.push("/signup")}>
            Sign Up
          </button>
        </div>
      </div>
    </>
  );
}
