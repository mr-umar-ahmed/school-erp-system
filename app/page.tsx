import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/constants";

// The proxy normally redirects "/" before this renders; this is a fallback.
export default async function Home() {
  const session = await getSession();
  redirect(session ? ROLE_HOME[session.role] : "/login");
}
