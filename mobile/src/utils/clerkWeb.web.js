// Pre-initializes Clerk instance on Web to eliminate script injection and network timeout failures
import { Clerk } from "@clerk/clerk-js";

export function initClerkWeb(publishableKey) {
  if (typeof window !== "undefined" && !window.Clerk && publishableKey) {
    try {
      window.Clerk = new Clerk(publishableKey);
    } catch (err) {
      console.warn("Clerk web pre-initialization warning:", err);
    }
  }
}
