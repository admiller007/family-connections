"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";

export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (authLoading) return;

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const profileDoc = await getDoc(doc(clientDb, "profiles", user.uid));

        if (profileDoc.exists()) {
          const profile = profileDoc.data();
          setIsAdmin(profile?.isAdmin === true || profile?.role === "admin");
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [user, authLoading]);

  return { isAdmin, loading };
}
