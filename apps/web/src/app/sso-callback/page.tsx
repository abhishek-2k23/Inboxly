"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/app/chat"
        signUpForceRedirectUrl="/app/chat"
      />
    </Suspense>
  );
}
