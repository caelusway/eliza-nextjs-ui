export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen text-green-400 font-mono overflow-hidden flex items-start justify-center">
      {children}
    </div>
  );
}