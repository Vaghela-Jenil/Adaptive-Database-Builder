'use client'
import { useEffect, useState } from "react";
import axios from "axios";

export default function UserList() {
  const [users, setUsers] = useState([]);


  useEffect(() => {

    const fetchUsers = async () => {
      try {
        const res = await axios.get("/api/admin/users");
        setUsers(res.data);
      } catch (err) {
        console.log("Failed to load users");
      } 
    };

    fetchUsers();
  }, []); 


  return (
    <div className="p-6">
      <div>
      {users.map((u: any) => (
        <div key={u.clerkId}>
          {u.name} — {u.email} — {u.role}
        </div>
      ))}
    </div>
    </div>
  );
}
