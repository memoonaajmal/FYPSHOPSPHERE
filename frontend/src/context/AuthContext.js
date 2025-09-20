"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import app  from "../../firebase/config";


const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // {email, name, roles: []}
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();

       const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/me`, {
  headers: { Authorization: `Bearer ${token}` },
});


        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
<AuthContext.Provider value={{ user, setUser, loading }}>
  {children}
</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
