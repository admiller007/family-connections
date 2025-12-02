"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { doc, getDoc } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";

export function ProtectedContent({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    async function checkUserProfile() {
      if (loading) return;

      if (!user) {
        router.replace(`/join?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Check if user has completed onboarding
      try {
        const profileDoc = await getDoc(doc(clientDb, "profiles", user.uid));

        // If no profile exists, redirect to onboarding
        if (!profileDoc.exists() || !profileDoc.data()?.username) {
          router.replace("/onboarding");
          return;
        }

        setCheckingProfile(false);
      } catch (error) {
        console.error("Error checking profile:", error);
        setCheckingProfile(false);
      }
    }

    checkUserProfile();
  }, [loading, user, pathname, router]);

  if (loading || !user || checkingProfile) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
        Checking your invite...
      </div>
    );
  }

  return <>{children}</>;
}
