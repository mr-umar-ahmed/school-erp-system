import type { Metadata } from "next";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/shared/stat-card";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { BooksTable, LoansTable } from "./library-client";

export const metadata: Metadata = { title: "Library" };

export default async function AdminLibraryPage() {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);

  const [books, activeLoans] = await Promise.all([
    prisma.libraryBook.findMany({
      where: { institutionId },
      orderBy: { title: "asc" },
    }),
    prisma.libraryTransaction.findMany({
      where: { book: { institutionId }, returnDate: null },
      include: {
        book: { select: { title: true } },
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const overdue = activeLoans.filter((l) => l.dueDate < new Date()).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Library</h1>
        <p className="text-sm text-muted-foreground">
          Catalog, issues and returns.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon="BookOpen" label="Titles" value={books.length} />
        <StatCard icon="Boxes" label="Total Copies" value={totalCopies} />
        <StatCard icon="CalendarClock" label="Overdue Loans" value={overdue} />
      </div>

      <GlassmorphicCard>
        <Tabs defaultValue="catalog">
          <TabsList className="rounded-full">
            <TabsTrigger value="catalog">Catalog</TabsTrigger>
            <TabsTrigger value="loans">
              Issued ({activeLoans.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="catalog" className="mt-4">
            <BooksTable
              rows={books.map((b) => ({
                id: b.id,
                title: b.title,
                author: b.author,
                category: b.category,
                isbn: b.isbn,
                available: b.availableCopies,
                total: b.totalCopies,
                shelf: b.shelfLocation,
              }))}
            />
          </TabsContent>
          <TabsContent value="loans" className="mt-4">
            <LoansTable
              rows={activeLoans.map((l) => ({
                id: l.id,
                bookTitle: l.book.title,
                borrower: `${l.user.firstName} ${l.user.lastName}`,
                issueDate: l.issueDate.toISOString(),
                dueDate: l.dueDate.toISOString(),
                status: l.dueDate < new Date() ? "overdue" : "issued",
              }))}
            />
          </TabsContent>
        </Tabs>
      </GlassmorphicCard>
    </div>
  );
}
