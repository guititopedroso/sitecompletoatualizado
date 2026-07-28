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
    return new Promise<void>((resolve, reject) => {
      const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || "340938308657-ipo3qfp2ieka9o65nvj67f91uemvivcl.apps.googleusercontent.com";
      if (!clientId) {
        reject(new Error("VITE_GOOGLE_CLIENT_ID não está configurado no ficheiro .env. Por favor adicione o seu Client ID da consola Google Cloud no .env."));
        return;
      }

      const loadGsiScript = () => {
        if ((window as any).google?.accounts?.oauth2) {
          return Promise.resolve();
        }
        return new Promise<void>((res, rej) => {
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.defer = true;
          script.onload = () => res();
          script.onerror = () => rej(new Error("Erro ao carregar Google Identity Services SDK"));
          document.head.appendChild(script);
        });
      };

      loadGsiScript().then(() => {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "email profile openid",
          error_callback: (err: any) => {
            console.error("Google GIS Error Callback:", err);
            reject(new Error(err.message || "A janela do Google foi fechada ou o domínio não está autorizado nas credenciais da Google."));
          },
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              reject(new Error(tokenResponse.error_description || tokenResponse.error || "Erro no login Google"));
              return;
            }
            try {
              const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              }).then(r => r.json());

              if (!userInfo.email) {
                throw new Error("Não foi possível obter o email da conta Google.");
              }

              const res = await fetchApi("/api/auth/google", {
                method: "POST",
                body: {
                  email: userInfo.email,
                  displayName: userInfo.name || userInfo.email.split("@")[0],
                  photoURL: userInfo.picture,
                  sub: userInfo.sub
                }
              });

              localStorage.setItem("rc_token", res.token);
              setUser(res.user);
              resolve();
            } catch (err) {
              reject(err);
            }
          }
        });
        client.requestAccessToken();
      }).catch(reject);
    });
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
