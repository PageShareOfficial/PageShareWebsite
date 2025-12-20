"use client";

import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const headingElements = Array.from(
      document.querySelectorAll("article h2, article h3")
    );

    const headingData: Heading[] = headingElements.map((el, index) => {
      const id = el.id || `heading-${index}`;
      if (!el.id) el.id = id;
      return {
        id,
        text: el.textContent || "",
        level: parseInt(el.tagName[1]),
      };
    });

    setHeadings(headingData);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0% -80% 0%" }
    );

    headingElements.forEach((el) => observer.observe(el));

    return () => {
      headingElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-20 self-start">
      <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Contents</h3>
      <ul className="space-y-2">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={`block text-sm transition-colors ${
                heading.level === 3 ? "pl-4" : ""
              } ${
                activeId === heading.id
                  ? "text-white font-medium"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

