import React from "react";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "../utils/tokenCache";

export function AppClerkProvider({ children, publishableKey }) {
  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={publishableKey}
    >
      {children}
    </ClerkProvider>
  );
}
