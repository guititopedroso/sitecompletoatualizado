import {
  Sun, 
  Cloudy, 
  CloudRain, 
  CloudSun, 
  CloudDrizzle, 
  CloudyIcon, 
  Cloud, 
  Thermometer, 
  Wind, 
  Navigation, 
  Droplets, 
  Sunrise, 
  Sunset, 
  SunDim,
  ThermometerIcon
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import SectionWrapper from "./ui/section-wrapper";
import { useEffect, useState } from "react";

// Interface para o objeto de previsão diária
interface Forecast {
  precipitaProb: string;
  tMin: string;
  tMax: string;
  predWindDir: string;
  idWeatherType: number;
  forecastDate: string;
}

// Mapeamento dos códigos de tempo para ícones com a nova cor
const weatherIconMapping: { [key: number]: JSX.Element } = {
  1: <Sun size={32} className="text-foreground" />, // Céu limpo
  2: <CloudSun size={32} className="text-foreground" />, // Céu pouco nublado
  3: <Cloud size={32} className="text-foreground" />, // Céu parcialmente nublado
  4: <CloudyIcon size={32} className="text-foreground" />, // Céu muito nublado ou encoberto
  6: <CloudRain size={32} className="text-foreground" />, // Aguaceiros
  9: <CloudDrizzle size={32} className="text-foreground" />, // Chuva
};

const Weather = () => {
  const { t, language } = useLanguage();
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch("/api/open-data/forecast/meteorology/cities/daily/1151200.json");
        if (!response.ok) {
          throw new Error("Failed to fetch weather data");
        }
        const data = await response.json();
        setForecast(data.data.slice(0, 5));
        setLoading(false);
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unknown error occurred");
          }
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language, { weekday: 'long' });
  }

  return (
    <section id="tempo" className="pt-24 pb-12 md:pt-32 md:pb-16 bg-foam">
      <SectionWrapper>
        <div className="container-max">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-sm font-semibold text-coral uppercase tracking-widest font-display mb-3 block">
              {t("weather_tag")}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-800 text-foreground mb-6 tracking-tight">
              {t("weather_title")}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t("weather_desc")}
            </p>
          </div>

          {loading && <p className="text-center">A carregar previsão...</p>}
          {error && <p className="text-center text-red-500">Erro: {error}</p>}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
              {forecast.map((day, i) => (
                <motion.div
                  key={day.forecastDate}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.7,
                    delay: 0.2 * i,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="bg-gray-400 bg-opacity-20 backdrop-blur-lg rounded-2xl p-6 shadow-lg text-foreground text-center flex flex-col items-center justify-between"
                >
                  <p className="font-bold text-lg capitalize mb-3">{getDayOfWeek(day.forecastDate)}</p>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-20 h-20 rounded-full bg-black/5 flex items-center justify-center mb-4"
                  >
                    {weatherIconMapping[day.idWeatherType] || (
                      <Sun size={32} className="text-foreground" />
                    )}
                  </motion.div>
                  <div className="flex items-center justify-center space-x-3 text-2xl font-bold mb-4">
                    <span className="text-coral">{day.tMax}°</span>
                    <span className="text-blue-500">{day.tMin}°</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <CloudRain size={18} />
                    <span>{day.precipitaProb}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
           <p className="text-xs text-center mt-8 text-muted-foreground"> {t("weather_source")}</p>
        </div>
      </SectionWrapper>
    </section>
  );
};

export default Weather;
