export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-blue-200 text-green-400 font-mono overflow-hidden flex items-center justify-center">
      {children}
    </div>
  );
}