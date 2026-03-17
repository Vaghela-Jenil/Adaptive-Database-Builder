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

    const syncUser = async () => {
    try {
      const response = await axios.post("/api/auth/verify-user");
      if (response.data?.isNewUser) {
        localStorage.setItem("onborda-tour-pending", "1");
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        throw new Error('You are banned from this application')
      }
    }
  };
  if (isSignedIn) syncUser();
  }, [isLoaded, isSignedIn, user?.id]);

  return null;
}
