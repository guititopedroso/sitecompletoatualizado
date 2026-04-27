import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword as firebaseUpdatePassword
} from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp, deleteDoc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserToFirestore = async (user: User, providerId: string) => {
    const userRef = doc(db, "users", user.uid);
    
    // Check if user already exists to preserve referralCode
    try {
      const userDoc = await getDoc(userRef);
      let referralCode = "";

      if (userDoc.exists() && userDoc.data().referralCode) {
        referralCode = userDoc.data().referralCode;
      } else {
        // Generate a new one if not exists
        const namePart = (user.displayName || "user").trim().toLowerCase().replace(/\s+/g, "").slice(0, 5);
        const randomPart = Math.random().toString(36).substring(2, 6);
        referralCode = `${namePart}-${randomPart}`;
      }

      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: providerId,
        referralCode,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Error syncing user:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        // Just as backup, sync on auth state change too
        syncUserToFirestore(user, user.providerData[0]?.providerId || "unknown");
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const res = await signInWithPopup(auth, provider);
      await syncUserToFirestore(res.user, "google.com");
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      await syncUserToFirestore(res.user, "password");
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
      
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(res.user, { displayName: formattedName });
      await syncUserToFirestore(res.user, "password");
    } catch (error) {
      console.error("Error signing up with email:", error);
      throw error;
    }
  };

  const updatePhoto = async (file: File) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No user logged in");
    
    try {
      const fileRef = ref(storage, `avatars/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await updateProfile(currentUser, { photoURL: url });
      
      // Force update Firestore
      await setDoc(doc(db, "users", currentUser.uid), { photoURL: url, updatedAt: serverTimestamp() }, { merge: true });
      
      // Update local state without losing methods
      setUser({ ...currentUser } as any); // Re-setting from currentUser to trigger re-render
      
      return url;
    } catch (error) {
      console.error("Error updating photo:", error);
      throw error;
    }
  };

  const updateDisplayName = async (name: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No user logged in");
    try {
      await updateProfile(currentUser, { displayName: name });
      
      // Update Firestore
      await setDoc(doc(db, "users", currentUser.uid), { displayName: name, updatedAt: serverTimestamp() }, { merge: true });
      
      // Trigger a re-render
      setUser({ ...currentUser } as any);
    } catch (error) {
       console.error("Error updating name:", error);
       throw error;
    }
  };

  const updateUserPassword = async (newPassword: string) => {
    if (!user) throw new Error("No user logged in");
    try {
      await firebaseUpdatePassword(user, newPassword);
    } catch (error) {
       console.error("Error updating password:", error);
       throw error;
    }
  };

  const updateUserData = async (data: { firstName?: string; lastName?: string; phonePrefix?: string; phoneNumber?: string; birthDate?: string }) => {
    if (!user) throw new Error("No user logged in");
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { 
        ...data, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
    } catch (error) {
       console.error("Error updating user data:", error);
       throw error;
    }
  };

  const deleteUserAccount = async () => {
    if (!user) throw new Error("No user logged in");
    const uid = user.uid;
    try {
      // 1. Delete Firestore data
      await deleteDoc(doc(db, "users", uid));
      // 2. Delete Auth record
      await user.delete();
      return true;
    } catch (error) {
       console.error("Error deleting account:", error);
       throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
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
