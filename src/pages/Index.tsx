import { useSearchParams } from "react-router-dom";
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
  const ref = searchParams.get("ref") || undefined;

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
