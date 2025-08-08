export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen text-white font-mono bg-black overflow-hidden flex items-start justify-center">
      {children}
    </div>
  );
}