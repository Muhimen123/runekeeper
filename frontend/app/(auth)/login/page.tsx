"use client";
import "@/app/auth_init/auth.css";
import GlassContainer from "@/app/components/GlassContainer";
import { AuthInput } from "@/app/(auth)/components/AuthInput";
import RpgButtonV2 from "@/app/components/RpgButton/RpgButtonV2";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage()
{
  const router = useRouter();

  return (
    <div className="flex flex-col items-center h-screen justify-center">
      <div className="runekeeper-logo-container">
        <h1 className="runekeeper-title">Runekeeper</h1>
      </div>

      <GlassContainer className="flex flex-col gap-10 w-fit h-fit p-10 items-center relative">
        <div className="w-full flex">
          <div className="w-1/3 flex items-start">
            <button 
              onClick={()=>router.push("/")}
              className="size-10">
              <Image 
                className="cursor-pointer hover:brightness-85 transition"
                src={"/assets/back_arrow.png"}
                alt="back arrow"
                width={40}
                height={40}
                >
                </Image>
            </button>
          </div>
          <p className="text-beige text-2xl">Login</p>
        </div>
        <div className="flex flex-col gap-3">
          <AuthInput inputLabel="Email" type="email"></AuthInput>
          <AuthInput inputLabel="Password" type="password"></AuthInput>
        </div>
        <RpgButtonV2 text="Login" onClick={()=>router.push("/homepage")}></RpgButtonV2>

        <Image
        className="absolute -left-5 -bottom-10"
        src={"/assets/pebbles.png"}
        alt="Pebble Graphic"
        width={90}
        height={90}
        ></Image>
        
        <Image
        className="absolute -right-5 -bottom-10"
        src={"/assets/stone_2.png"}
        alt="Pebble Graphic"
        width={120}
        height={120}
        ></Image>
      </GlassContainer>
    </div>
  );
}