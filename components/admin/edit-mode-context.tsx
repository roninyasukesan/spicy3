"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { localGetUser } from "@/lib/local-auth";

interface EditModeContextType {
  isAdmin: boolean;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
}

const EditModeContext = createContext<EditModeContextType>({
  isAdmin: false,
  isEditing: false,
  setIsEditing: () => {},
});

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const checkAdmin = () => {
      const user = localGetUser();
      const admin = user?.role === "admin";
      setIsAdmin(admin);
      if (!admin) setIsEditing(false); // Force exit edit mode if privileges lost
    };

    checkAdmin();
    window.addEventListener("spicy-auth-change", checkAdmin);
    return () => window.removeEventListener("spicy-auth-change", checkAdmin);
  }, []);

  return (
    <EditModeContext.Provider value={{ isAdmin, isEditing, setIsEditing }}>
      {children}
    </EditModeContext.Provider>
  );
}

export const useEditMode = () => useContext(EditModeContext);
