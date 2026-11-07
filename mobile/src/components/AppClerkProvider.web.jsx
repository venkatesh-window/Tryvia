import React from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { Clerk } from "@clerk/clerk-js";

export function AppClerkProvider({ children, publishableKey }) {
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      Clerk={Clerk}
      standardBrowser={true}
    >
      {children}
    </ClerkProvider>
  );
}
