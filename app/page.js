
import Link from "next/link";

const pages = [
  {
    title: "3D Object",
    href: "/3d-object",
  },
  {
    title: "Static HD ASCII",
    href: "/ascii-converted",
  },
  {
    title: "Custom ASCII Conversion",
    href: "/ascii-converted2",
  },
];

export default function HomePage() {
  return (
    <main className="home">
      <div className="home__container">
        <h1 className="home__title">Ascii converted Modals</h1>

        <div className="home__links">
          {pages.map((page) => (
            <Link key={page.href} href={page.href} className="home__card">
              {page.title}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}