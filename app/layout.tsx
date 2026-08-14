import "./globals.css";

export const metadata = {
  title: "Home Interiorismo",
  description: "Revestimientos, persianas, pasto sintético y palapa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
