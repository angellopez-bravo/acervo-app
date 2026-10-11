"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconIdeas, IconLibrary, IconProfile } from "./icons";

const TABS = [
  { href: "/", label: "Inicio", Icon: IconHome },
  { href: "/biblioteca", label: "Biblioteca", Icon: IconLibrary },
  { href: "/perfil", label: "Perfil", Icon: IconProfile },
  { href: "/ideas", label: "Ideas", Icon: IconIdeas },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tabbar" aria-label="Secciones">
      <div className="tabbar-inner">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className="tab" aria-current={active ? "page" : undefined}>
              <Icon />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
