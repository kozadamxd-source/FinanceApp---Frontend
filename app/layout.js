export const metadata = {
  title: "Dashboard",
  description: "Financial metrics dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
