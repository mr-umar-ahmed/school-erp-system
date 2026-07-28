import type { Metadata } from "next";
import { format } from "date-fns";
import { requireRole, institutionScope } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { GlassmorphicCard } from "@/components/shared/glassmorphic-card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireRole(["super_admin", "admin"]);
  const institutionId = institutionScope(user);

  const [institution, years, classes, subjects, gradeScales] =
    await Promise.all([
      prisma.institution.findUnique({ where: { id: institutionId } }),
      prisma.academicYear.findMany({
        where: { institutionId },
        orderBy: { startDate: "desc" },
      }),
      prisma.schoolClass.findMany({
        where: { institutionId },
        orderBy: { numericOrder: "asc" },
        include: {
          sections: {
            orderBy: { name: "asc" },
            include: { _count: { select: { students: true } } },
          },
        },
      }),
      prisma.subject.findMany({
        where: { institutionId },
        orderBy: { name: "asc" },
      }),
      prisma.gradeScale.findMany({
        where: { institutionId },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          School configuration and academic structure.
        </p>
      </div>

      <Tabs defaultValue="school">
        <TabsList className="rounded-full">
          <TabsTrigger value="school">School</TabsTrigger>
          <TabsTrigger value="classes">Classes &amp; Sections</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="grades">Grading Scale</TabsTrigger>
        </TabsList>

        <TabsContent value="school" className="mt-4 space-y-4">
          <GlassmorphicCard>
            <h2 className="mb-4 text-lg">Institution Profile</h2>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {(
                [
                  ["Name", institution?.name],
                  ["Code", institution?.code],
                  ["Board", institution?.board],
                  ["Established", institution?.establishedYear],
                  ["Email", institution?.email],
                  ["Phone", institution?.phone],
                  ["City", institution?.city],
                  ["Website", institution?.website],
                ] as [string, string | number | null | undefined][]
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 border-b border-border/50 pb-2"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </GlassmorphicCard>
          <GlassmorphicCard>
            <h2 className="mb-3 text-lg">Academic Years</h2>
            <ul className="space-y-2">
              {years.map((y) => (
                <li
                  key={y.id}
                  className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-3 text-sm"
                >
                  <span className="font-semibold">{y.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(y.startDate, "d MMM yyyy")} –{" "}
                    {format(y.endDate, "d MMM yyyy")}
                  </span>
                  {y.isCurrent && (
                    <Badge className="rounded-full bg-success/15 text-success">
                      Current
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </GlassmorphicCard>
        </TabsContent>

        <TabsContent value="classes" className="mt-4">
          <GlassmorphicCard>
            <div className="grid gap-3 sm:grid-cols-2">
              {classes.map((c) => (
                <div key={c.id} className="rounded-2xl bg-secondary/60 p-4">
                  <p className="font-bold">{c.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {c.sections.map((s) => (
                      <Badge
                        key={s.id}
                        className="rounded-full bg-card text-foreground"
                      >
                        {s.name} • {s._count.students}/{s.capacity}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassmorphicCard>
        </TabsContent>

        <TabsContent value="subjects" className="mt-4">
          <GlassmorphicCard>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <Badge
                  key={s.id}
                  className="rounded-full bg-secondary px-3 py-1.5 text-secondary-foreground"
                >
                  {s.name}
                  <span className="ml-1.5 text-[10px] text-muted-foreground">
                    {s.code} • {s.type}
                  </span>
                </Badge>
              ))}
            </div>
          </GlassmorphicCard>
        </TabsContent>

        <TabsContent value="grades" className="mt-4">
          <GlassmorphicCard>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4">Grade</th>
                    <th className="py-2 pr-4">Range (%)</th>
                    <th className="py-2">Grade Point</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeScales.map((g) => (
                    <tr key={g.id} className="border-b border-border/50">
                      <td className="py-2 pr-4">
                        <Badge className="rounded-full bg-primary/12 text-primary">
                          {g.grade}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 tabular-nums">
                        {Number(g.minPercent)} – {Number(g.maxPercent)}
                      </td>
                      <td className="py-2 tabular-nums">
                        {g.gradePoint === null ? "—" : Number(g.gradePoint)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassmorphicCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
