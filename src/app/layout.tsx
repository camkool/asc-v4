export const metadata = {
  title: "Ascendancy V4",
  description: "Ascendancy V4 starter on Vercel + Supabase",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0F1117", color: "#E8EAF2", fontFamily: "system-ui" }}>
        {children}
      </body>
    </html>
  );
}
