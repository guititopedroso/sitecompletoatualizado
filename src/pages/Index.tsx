import { useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Weather from "@/components/Weather";
import Experiences from "@/components/Experiences";
import Safety from "@/components/Safety";
import Gallery from "@/components/Gallery";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

const Index = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const ref = searchParams.get("ref") || localStorage.getItem("royal_coast_referral") || undefined;

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Weather />
      <Experiences referralCode={ref} />
      <Safety />
      <About />
      <Gallery />
      <Testimonials />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
