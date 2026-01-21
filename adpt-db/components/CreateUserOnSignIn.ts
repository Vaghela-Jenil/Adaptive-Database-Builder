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

    axios.post("/api/auth/create-user")
      .then(() => console.log("User stored in DB"))
      .catch(err => console.error("Create user failed", err));
  }, [isLoaded, isSignedIn, user?.id]);

  return null;
}
