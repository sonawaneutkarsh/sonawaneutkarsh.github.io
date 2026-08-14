import { books } from "@/data/books";
import { Container } from "@/components/container";

const SECTIONS: { status: "reading" | "read" | "owned"; label: string }[] = [
  { status: "reading", label: "Currently reading" },
  { status: "read", label: "Read" },
  { status: "owned", label: "Want to read" },
];

export function Books() {
  return (
    <section className="border-t border-line">
      <Container className="py-20 sm:py-24">
        <h2 className="eyebrow">Books</h2>
        <div className="mt-6 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {SECTIONS.map(({ status, label }) => (
            <div key={status}>
              <h3 className="text-sm font-medium">{label}</h3>
              <ul className="mt-4 space-y-3">
                {books
                  .filter((book) => book.status === status)
                  .map((book) => (
                    <li key={book.title} className="text-graphite">
                      {book.title}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
