import { createContext, useContext, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

interface UserType {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  provider: string;
  referralCode: string;
  firstName?: string;
  lastName?: string;
  phonePrefix?: string;
  phoneNumber?: string;
  birthDate?: string;
}

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  updatePhoto: (file: File) => Promise<string>;
  updateDisplayName: (name: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  updateUserData: (data: { firstName?: string; lastName?: string; phonePrefix?: string; phoneNumber?: string; birthDate?: string }) => Promise<void>;
  deleteUserAccount: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  const checkUserSession = async () => {
    const token = localStorage.getItem("rc_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchApi("/api/auth/me");
      setUser(data);
    } catch (err) {
      console.error("Session check failed:", err);
      localStorage.removeItem("rc_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserSession();
  }, []);

  const signInWithGoogle = async () => {
    throw new Error(
      "O início de sessão com o Google requer a configuração de OAuth 2.0 no backend MySQL. Por favor, registe-se ou inicie sessão com Email e Password."
    );
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const res = await fetchApi("/api/auth/login", {
        method: "POST",
        body: { email, password: pass }
      });
      localStorage.setItem("rc_token", res.token);
      setUser(res.user);
    } catch (error) {
      console.error("Error signing in with email:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const formattedName = name.trim().split(" ").map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(" ");
      
      const res = await fetchApi("/api/auth/register", {
        method: "POST",
        body: { email, password: pass, displayName: formattedName }
      });
      localStorage.setItem("rc_token", res.token);
      setUser(res.user);
    } catch (error) {
      console.error("Error signing up with email:", error);
      throw error;
    }
  };

  const updatePhoto = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      
      const res = await fetchApi("/api/auth/avatar", {
        method: "POST",
        body: formData
      });
      
      if (user) {
        setUser({ ...user, photoURL: res.photoURL });
      }
      return res.photoURL;
    } catch (error) {
      console.error("Error updating photo:", error);
      throw error;
    }
  };

  const updateDisplayName = async (name: string) => {
    try {
      await fetchApi("/api/auth/profile", {
        method: "PUT",
        body: { displayName: name }
      });
      if (user) {
        setUser({ ...user, displayName: name });
      }
    } catch (error) {
      console.error("Error updating name:", error);
      throw error;
    }
  };

  const updateUserPassword = async (newPassword: string) => {
    try {
      await fetchApi("/api/auth/change-password", {
        method: "PUT",
        body: { newPassword }
      });
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  };

  const updateUserData = async (data: { firstName?: string; lastName?: string; phonePrefix?: string; phoneNumber?: string; birthDate?: string }) => {
    try {
      await fetchApi("/api/auth/profile", {
        method: "PUT",
        body: data
      });
      if (user) {
        setUser({ ...user, ...data });
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      throw error;
    }
  };

  const deleteUserAccount = async () => {
    try {
      await fetchApi("/api/auth/account", {
        method: "DELETE"
      });
      localStorage.removeItem("rc_token");
      setUser(null);
      return true;
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem("rc_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, updatePhoto, updateDisplayName, updateUserPassword, updateUserData, deleteUserAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
