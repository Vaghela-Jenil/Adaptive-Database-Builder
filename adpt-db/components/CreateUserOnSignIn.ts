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
      .then((response) => {
        // const { message, user_id, status } = response.data;
        console.log("Create user response:", response.data);
      }).catch(err => console.error("Create user failed", err));
  }, [isLoaded, isSignedIn, user?.id]);

  return null;
}
