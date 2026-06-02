export const metadata = {
  title: "Runekeeper - Login",
  // description: "Join or Create a Room in Runekeeper",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="bg-overlay" />
      <div className="content-effects">
        {children}
      </div>
    </div>
  );
}