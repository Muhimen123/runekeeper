"use client";
import { useState } from "react";
import "@/app/auth_init/auth.css";
import GlassContainer from "@/app/components/GlassContainer";
import { AuthInput } from "@/app/(auth)/components/AuthInput";
import RpgButtonV2 from "@/app/components/RpgButton/RpgButtonV2";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  
  // 1. Define React State Hooks for form data
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 2. Form submission handler
  const handleSignup = async () => {
    if (!email || !password || !username) {
      setError("All fields are required glyphs!");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8080/api/v1/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.toLowerCase().trim(), // Matches your database check constraint
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Supabase returns the session token info inside the payload
        if (data.access_token) {
          localStorage.setItem("supabase_token", data.access_token);
          localStorage.setItem("user_id", data.user.id);
        }
        router.push("/homepage");
      } else {
        setError(data.message || "Signup incantation failed.");
      }
    } catch (err) {
      console.log(err);
      setError("Could not reach the authentication archives.");
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
          <p className="text-beige text-2xl">Signup</p>
        </div>

        {/* Display system feedback errors */}
        {error && <p className="text-red-500 font-mono text-sm max-w-xs text-center">{error}</p>}

        <div className="flex flex-col gap-3">
          <AuthInput 
            inputLabel="Name" 
            type="text" 
            value={username} 
            onChange={(e: any) => setUsername(e.target.value)} 
          />
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
          text={loading ? "Casting..." : "Sign Up"} 
          onClick={handleSignup} 
          // disabled={loading}
        />
        
        <Image
          className="absolute -left-5 -bottom-10"
          src={"/assets/stone_2.png"}
          alt="Pebble Graphic"
          width={120}
          height={120}
        />

        <Image
          className="absolute -right-5 -top-10"
          src={"/assets/quillV2.png"}
          alt="Pebble Graphic"
          width={80}
          height={80}
        />
      </GlassContainer>
    </div>
  );
}