"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebaseClient";

export function FriendsButton() {
  const { userLoggedIn, currentUser } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!userLoggedIn || !currentUser) return;

    // Listen to this user's document for changes
    const unsub = onSnapshot(
      doc(firestore, "users", currentUser.uid),
      (snapshot) => {
        if (!snapshot.exists()) {
          setPendingCount(0);
          return;
        }
        const data = snapshot.data();
        const reqs: string[] = data.requestedFriends || [];
        setPendingCount(reqs.length);
      }
    );

    return () => {
      unsub();
    };
  }, [userLoggedIn, currentUser]);

  if (!userLoggedIn) {
    return null;
  }

  return (
    <Link href="/friends">
      <Button variant="outline" className="relative">
        <Users className="h-4 w-4 mr-2" />
        <span>Friends</span>
        {pendingCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {pendingCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}
