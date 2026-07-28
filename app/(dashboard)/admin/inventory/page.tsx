import type { Metadata } from "next";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const user = await requireRole(["super_admin", "admin", "staff"]);
  const institutionId = institutionScope(user);

  const items = await prisma.inventoryItem.findMany({
    where: { institutionId },
    orderBy: { name: "asc" },
  });

  const lowStock = items.filter((i) => i.quantity <= i.minStockAlert);
  const totalValue = items.reduce(
    (sum, i) => sum + i.quantity * Number(i.unitPrice ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} item types tracked
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon="Boxes" label="Item Types" value={items.length} />
        <StatCard
          icon="Wallet"
          label="Stock Value"
          value={Math.round(totalValue)}
          prefix="₹"
        />
        <StatCard
          icon="ClipboardList"
          label="Low Stock Alerts"
          value={lowStock.length}
        />
      </div>

      {lowStock.length > 0 && (
        <GlassmorphicCard>
          <h2 className="mb-3 text-lg text-warning">⚠️ Low Stock</h2>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((i) => (
              <Badge
                key={i.id}
                className="rounded-full bg-warning/15 px-3 py-1 text-warning"
              >
                {i.name}: {i.quantity} {i.unit ?? ""}
              </Badge>
            ))}
          </div>
        </GlassmorphicCard>
      )}

      <GlassmorphicCard>
        {items.length === 0 ? (
          <EmptyState title="No inventory items" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4">Item</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Quantity</th>
                  <th className="py-2 pr-4">Unit price</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-b border-border/50">
                    <td className="py-2.5 pr-4 font-medium">{i.name}</td>
                    <td className="py-2.5 pr-4">{i.category ?? "—"}</td>
                    <td className="py-2.5 pr-4 tabular-nums">
                      {i.quantity} {i.unit ?? ""}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums">
                      ₹{Number(i.unitPrice ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 pr-4">{i.location ?? "—"}</td>
                    <td className="py-2.5">
                      <Badge
                        className={
                          i.quantity <= i.minStockAlert
                            ? "rounded-full bg-warning/15 text-warning"
                            : "rounded-full bg-success/15 text-success"
                        }
                      >
                        {i.quantity <= i.minStockAlert ? "Low" : "OK"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassmorphicCard>
    </div>
  );
}
