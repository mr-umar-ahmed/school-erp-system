import type { Metadata } from "next";
import { format } from "date-fns";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Library" };

export default async function StudentLibraryPage() {
  const user = await requireRole(["student"]);
  const institutionId = institutionScope(user);

  const [myLoans, books] = await Promise.all([
    prisma.libraryTransaction.findMany({
      where: { userId: user.id },
      include: { book: true },
      orderBy: { issueDate: "desc" },
      take: 10,
    }),
    prisma.libraryBook.findMany({
      where: { institutionId, availableCopies: { gt: 0 } },
      orderBy: { title: "asc" },
      take: 60,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Library</h1>

      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">My Books</h2>
        {myLoans.length === 0 ? (
          <EmptyState title="You haven't borrowed any books yet" />
        ) : (
          <ul className="space-y-2">
            {myLoans.map((l) => {
              const active = !l.returnDate;
              const overdue = active && l.dueDate < new Date();
              return (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {l.book.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {l.book.author} • due {format(l.dueDate, "d MMM yyyy")}
                    </p>
                  </div>
                  <Badge
                    className={
                      overdue
                        ? "rounded-full bg-destructive/15 text-destructive"
                        : active
                          ? "rounded-full bg-info/15 text-info"
                          : "rounded-full bg-success/15 text-success"
                    }
                  >
                    {overdue ? "overdue" : active ? "borrowed" : "returned"}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </GlassmorphicCard>

      <GlassmorphicCard>
        <h2 className="mb-3 text-lg">Browse Catalog</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => (
            <div key={b.id} className="rounded-2xl bg-secondary/60 p-4">
              <p className="line-clamp-1 text-sm font-semibold">{b.title}</p>
              <p className="text-xs text-muted-foreground">{b.author}</p>
              <p className="mt-1.5 text-xs">
                <span className="rounded-full bg-accent px-2 py-0.5 font-medium">
                  {b.category ?? "General"}
                </span>
                <span className="ml-2 text-muted-foreground">
                  Shelf {b.shelfLocation ?? "—"}
                </span>
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Visit the library desk to borrow any available title.
        </p>
      </GlassmorphicCard>
    </div>
  );
}
