import { redirect } from "next/navigation";

// Landing page is deferred; route the root straight into the app. The /app
// layout redirects unauthenticated visitors to /sign-in.
export default function HomePage() {
  redirect("/app/inbox");
}
