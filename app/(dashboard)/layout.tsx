import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/dal";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ROLE_HOME } from "@/lib/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const home = ROLE_HOME[user.role];
  const profileHref = home === "/admin" ? "/admin/settings" : `${home}/profile`;

  return (
    <div className="flex min-h-dvh flex-1">
      <Sidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          user={{
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            avatarUrl: user.avatarUrl,
            profileHref,
          }}
          notifications={notifications.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            isRead: n.isRead,
            actionUrl: n.actionUrl,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-8">
          {children}
        </main>
      </div>
      <BottomNav role={user.role} />
    </div>
  );
}
