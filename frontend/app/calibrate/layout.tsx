export default function CalibrateLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0f0f13", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
