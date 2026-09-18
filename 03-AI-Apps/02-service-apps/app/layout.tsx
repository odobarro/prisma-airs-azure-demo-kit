import "./globals.css";

export const metadata = {
  title: "Prisma AIRS - Model Security Hub",
  description: "SecOps Portal for AI Model & Skill Supply Chain Security",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#0a0f18] text-slate-200 antialiased">{children}</body>
    </html>
  );
}