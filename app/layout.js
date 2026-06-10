import "./globals.css";

export const metadata = {
  title: "Dashboard",
  description: "Financial metrics dashboard",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
