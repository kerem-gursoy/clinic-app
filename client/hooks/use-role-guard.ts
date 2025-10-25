import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/types";
import { clearStoredAuth, fetchCurrentUser, getStoredAuthUser } from "@/lib/auth";

export function useRoleGuard(expectedRole: UserRole) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const cached = getStoredAuthUser();
      if (!cached || cached.role !== expectedRole) {
        clearStoredAuth();
        router.replace("/auth/login");
        return;
      }

      try {
        const verified = await fetchCurrentUser();
        if (cancelled) {
          return;
        }

        if (!verified) {
          clearStoredAuth();
          router.replace("/auth/login");
          return;
        }

        if (verified.role !== expectedRole) {
          clearStoredAuth();
          router.replace("/auth/login");
          return;
        }

        setIsChecking(false);
      } catch (err) {
        if (cancelled) {
          return;
        }
        console.error("Failed to verify current user", err);
        setIsChecking(false);
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [expectedRole, router]);

  return { isChecking };
}
