import "./globals.css";

export const metadata = {
  title: "Home Interiorismo | Lambrín, persianas, pasto sintético y más en Zihuatanejo",
  description:
    "Lambrín WPC, mármol sintético, persianas, pasto sintético, malla sombra, toldos, muro verde y techos de palapa. Suministro e instalación en Zihuatanejo, Guerrero.",
  icons: { icon: "/img/logo_hi.jpg" },
};

export const viewport = { themeColor: "#0F0D0B" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body style={{ background: "#0F0D0B" }}>{children}</body>
    </html>
  );
}
