"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { BookUp, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, type Column } from "@/components/shared/data-table";
import { issueBook, returnBook } from "@/features/library/actions";

export interface BookRow {
  id: string;
  title: string;
  author: string;
  category: string | null;
  isbn: string | null;
  available: number;
  total: number;
  shelf: string | null;
}

function IssueDialog({ book }: { book: BookRow }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");

  const submit = () => {
    startTransition(async () => {
      const result = await issueBook({ bookId: book.id, borrowerEmail: email });
      if (result.error) toast.error(result.error);
      if (result.success) {
        toast.success(result.success);
        setOpen(false);
        setEmail("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="rounded-full"
          disabled={book.available < 1}
        >
          <BookUp className="size-4" />
          Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong rounded-3xl">
        <DialogHeader>
          <DialogTitle>Issue Book</DialogTitle>
          <DialogDescription>
            {book.title} — {book.available} of {book.total} available
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Borrower email</Label>
            <Input
              type="email"
              placeholder="alex.kumar@edu.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            onClick={submit}
            disabled={isPending || !email}
            className="w-full rounded-full"
          >
            {isPending ? "Issuing..." : "Issue for 14 days"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const bookColumns: Column<BookRow>[] = [
  {
    key: "title",
    header: "Book",
    sortable: true,
    accessor: (r) => r.title,
    cell: (r) => (
      <span>
        <span className="block font-semibold">{r.title}</span>
        <span className="text-xs text-muted-foreground">{r.author}</span>
      </span>
    ),
  },
  {
    key: "category",
    header: "Category",
    sortable: true,
    accessor: (r) => r.category ?? "",
    cell: (r) => r.category ?? "—",
  },
  {
    key: "isbn",
    header: "ISBN",
    accessor: (r) => r.isbn ?? "",
    cell: (r) => <span className="text-xs tabular-nums">{r.isbn ?? "—"}</span>,
  },
  {
    key: "shelf",
    header: "Shelf",
    accessor: (r) => r.shelf ?? "",
    cell: (r) => r.shelf ?? "—",
  },
  {
    key: "available",
    header: "Available",
    sortable: true,
    accessor: (r) => r.available,
    cell: (r) => (
      <Badge
        className={
          r.available > 0
            ? "rounded-full bg-success/15 text-success"
            : "rounded-full bg-destructive/15 text-destructive"
        }
      >
        {r.available}/{r.total}
      </Badge>
    ),
  },
  { key: "actions", header: "", cell: (r) => <IssueDialog book={r} /> },
];

export function BooksTable({ rows }: { rows: BookRow[] }) {
  return (
    <DataTable
      rows={rows}
      columns={bookColumns}
      getRowKey={(r) => r.id}
      searchPlaceholder="Search by title, author, ISBN..."
      pageSize={10}
      emptyTitle="No books in the catalog"
    />
  );
}

export interface LoanRow {
  id: string;
  bookTitle: string;
  borrower: string;
  issueDate: string;
  dueDate: string;
  status: string;
}

function ReturnButton({ transactionId }: { transactionId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      className="rounded-full"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await returnBook(transactionId);
          if (result.error) toast.error(result.error);
          if (result.success) toast.success(result.success);
        })
      }
    >
      <Undo2 className="size-4" />
      {isPending ? "..." : "Return"}
    </Button>
  );
}

const loanColumns: Column<LoanRow>[] = [
  {
    key: "book",
    header: "Book",
    sortable: true,
    accessor: (r) => r.bookTitle,
    cell: (r) => <span className="font-semibold">{r.bookTitle}</span>,
  },
  {
    key: "borrower",
    header: "Borrower",
    sortable: true,
    accessor: (r) => r.borrower,
    cell: (r) => r.borrower,
  },
  {
    key: "issued",
    header: "Issued",
    accessor: (r) => r.issueDate,
    cell: (r) => format(new Date(r.issueDate), "d MMM"),
  },
  {
    key: "due",
    header: "Due",
    sortable: true,
    accessor: (r) => r.dueDate,
    cell: (r) => format(new Date(r.dueDate), "d MMM yyyy"),
  },
  {
    key: "status",
    header: "Status",
    accessor: (r) => r.status,
    cell: (r) => (
      <Badge
        className={
          r.status === "overdue"
            ? "rounded-full bg-destructive/15 text-destructive"
            : "rounded-full bg-info/15 text-info"
        }
      >
        {r.status}
      </Badge>
    ),
  },
  {
    key: "actions",
    header: "",
    cell: (r) => <ReturnButton transactionId={r.id} />,
  },
];

export function LoansTable({ rows }: { rows: LoanRow[] }) {
  return (
    <DataTable
      rows={rows}
      columns={loanColumns}
      getRowKey={(r) => r.id}
      searchPlaceholder="Search active loans..."
      pageSize={8}
      emptyTitle="No books currently issued"
    />
  );
}
