import "../styles/globals.scss";

export const metadata = {
  title: "ASCII Image Converter",
  description: "Upload an image and convert it into ASCII text.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
