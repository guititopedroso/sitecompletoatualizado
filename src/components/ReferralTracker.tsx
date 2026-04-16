import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const ReferralTracker = () => {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      console.log("Captured referral code:", ref);
      localStorage.setItem("royal_coast_referral", ref);
    }
  }, [searchParams]);

  return null;
};

export default ReferralTracker;
