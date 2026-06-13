"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryExamplePage() {
  const [hasSentServerError, setHasSentServerError] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold">Sentry verification</h1>
      <p className="text-sm text-slate-400">
        Use these buttons to send a test event to Sentry and confirm the client and server
        integrations are working. Remove this page once both events show up in Sentry.
      </p>

      <button
        type="button"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        onClick={() => {
          throw new Error("Sentry Example Frontend Error");
        }}
      >
        Throw client error
      </button>

      <button
        type="button"
        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium transition hover:border-slate-500"
        onClick={async () => {
          setHasSentServerError(true);
          await Sentry.startSpan({ name: "Example Frontend Span", op: "test" }, async () => {
            const res = await fetch("/api/sentry-example-api");
            if (!res.ok) {
              console.log("Server error captured by Sentry.");
            }
          });
        }}
      >
        Throw server error
      </button>

      {hasSentServerError && <p className="text-sm text-emerald-400">Server request sent.</p>}
    </main>
  );
}
