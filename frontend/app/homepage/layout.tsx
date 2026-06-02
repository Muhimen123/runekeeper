import React from "react";
import "../auth_init/auth.css";
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
  return <>{children}</>;
}