
import '../../components/ui/style.css'
import "leaflet/dist/leaflet.css";

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
      <body >
        <div className="app-shell">{children}</div>
      </body>
  );
}