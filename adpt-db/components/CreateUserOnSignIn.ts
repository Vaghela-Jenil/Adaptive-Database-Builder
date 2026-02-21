'use client';

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import axios from "axios";

export default function CreateUserOnSignIn() {
  const { isLoaded, isSignedIn, user } = useUser();
  const calledRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;
    if (calledRef.current) return;

    calledRef.current = true;

    async function createUser() {
      try {
        const res = await axios.post("/api/auth/verify-user");
        console.log("Create user response:", res.data);
      } catch (err) {
        console.error("Create user failed", err);
      }
    }

    createUser();
  }, [isLoaded, isSignedIn, user?.id]);

  return null;
}
