"use client";
import { useState } from "react";
import "@/app/auth_init/auth.css";
import GlassContainer from "@/app/components/GlassContainer";
import { AuthInput } from "@/app/(auth)/components/AuthInput";
import RpgButtonV2 from "@/app/components/RpgButton/RpgButtonV2";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  // 1. State properties to bind fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 2. HTTP POST execution trigger
  const handleLogin = async () => {
    if (!email || !password) {
      setError("Provide both email and passkey runes.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8080/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Save authorization metadata to persist the session context
        localStorage.setItem("supabase_token", data.access_token);
        localStorage.setItem("user_id", data.user.id);

        router.push("/homepage");
      } else {
        setError("Invalid email or password!");
      }
    } catch (err) {
      setError("The authentication vault is unresponsive.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center h-screen justify-center">
      <div className="runekeeper-logo-container">
        <h1 className="runekeeper-title">Runekeeper</h1>
      </div>

      <GlassContainer className="flex flex-col gap-10 w-fit h-fit p-10 items-center relative">
        <div className="w-full flex">
          <div className="w-1/3 flex items-start">
            <button onClick={() => router.push("/")} className="size-10">
              <Image
                className="cursor-pointer hover:brightness-85 transition"
                src={"/assets/back_arrow.png"}
                alt="back arrow"
                width={40}
                height={40}
              />
            </button>
          </div>
          <p className="text-beige text-2xl">Login</p>
        </div>

        {error && <p className="text-red-500 font-mono text-sm max-w-xs text-center">{error}</p>}

        <div className="flex flex-col gap-3">
          <AuthInput 
            inputLabel="Email" 
            type="email" 
            value={email} 
            onChange={(e: any) => setEmail(e.target.value)} 
          />
          <AuthInput 
            inputLabel="Password" 
            type="password" 
            value={password} 
            onChange={(e: any) => setPassword(e.target.value)} 
          />
        </div>

        <RpgButtonV2 
          text={loading ? "Verifying..." : "Login"} 
          onClick={handleLogin} 
          // disabled={loading}
        />

        <Image
          className="absolute -left-5 -bottom-10"
          src={"/assets/pebbles.png"}
          alt="Pebble Graphic"
          width={90}
          height={90}
        />

        <Image
          className="absolute -right-5 -bottom-10"
          src={"/assets/stone_2.png"}
          alt="Pebble Graphic"
          width={120}
          height={120}
        />
      </GlassContainer>
    </div>
  );
}