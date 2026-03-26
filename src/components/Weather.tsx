import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Cloud, CloudRain, Sun, CloudSun, Snowflake, CloudLightning, CloudFog, Droplets, Thermometer, Wind } from "lucide-react";

const SETUBAL_ID = 1151200;
const API_URL = `https://api.ipma.pt/open-data/forecast/meteorology/cities/daily/${SETUBAL_ID}.json`;

type ForecastDay = {
  forecastDate: string;
  tMin: string;
  tMax: string;
  precipitaProb: string;
  idWeatherType: number;
  predWindDir: string;
  classWindSpeed: number;
  classPrecInt: number;
};

const weatherDescriptions: Record<number, { pt: string; en: string }> = {
  [-99]: { pt: "---", en: "---" },
  0: { pt: "Sem informação", en: "No information" },
  1: { pt: "Céu limpo", en: "Clear sky" },
  2: { pt: "Céu pouco nublado", en: "Partly cloudy" },
  3: { pt: "Céu parcialmente nublado", en: "Sunny intervals" },
  4: { pt: "Céu muito nublado", en: "Cloudy" },
  5: { pt: "Céu nublado por nuvens altas", en: "High cloud" },
  6: { pt: "Aguaceiros/chuva", en: "Showers/rain" },
  7: { pt: "Aguaceiros fracos", en: "Light showers" },
  8: { pt: "Aguaceiros fortes", en: "Heavy showers" },
  9: { pt: "Chuva/aguaceiros", en: "Rain/showers" },
  10: { pt: "Chuva fraca", en: "Light rain" },
  11: { pt: "Chuva forte", en: "Heavy rain" },
  12: { pt: "Períodos de chuva", en: "Intermittent rain" },
  13: { pt: "Chuva fraca intermitente", en: "Light intermittent rain" },
  14: { pt: "Chuva forte intermitente", en: "Heavy intermittent rain" },
  15: { pt: "Chuvisco", en: "Drizzle" },
  16: { pt: "Neblina", en: "Mist" },
  17: { pt: "Nevoeiro", en: "Fog" },
  18: { pt: "Neve", en: "Snow" },
  19: { pt: "Trovoada", en: "Thunderstorms" },
  20: { pt: "Aguaceiros com trovoada", en: "Showers & thunder" },
  21: { pt: "Granizo", en: "Hail" },
  22: { pt: "Geada", en: "Frost" },
  23: { pt: "Chuva com trovoada", en: "Rain & thunder" },
  24: { pt: "Nebulosidade convectiva", en: "Convective clouds" },
  25: { pt: "Períodos de muito nublado", en: "Partly cloudy" },
  26: { pt: "Nevoeiro", en: "Fog" },
  27: { pt: "Céu nublado", en: "Cloudy" },
  28: { pt: "Aguaceiros de neve", en: "Snow showers" },
  29: { pt: "Chuva e neve", en: "Rain and snow" },
  30: { pt: "Chuva e neve", en: "Rain and snow" },
};

const getWeatherIcon = (id: number) => {
  if (id === 1) return Sun;
  if ([2, 3, 5, 25].includes(id)) return CloudSun;
  if ([4, 24, 27].includes(id)) return Cloud;
  if ([6, 7, 8, 9, 10, 11, 12, 13, 14, 15].includes(id)) return CloudRain;
  if ([16, 17, 26].includes(id)) return CloudFog;
  if ([18, 28, 29, 30].includes(id)) return Snowflake;
  if ([19, 20, 21, 23].includes(id)) return CloudLightning;
  return Cloud;
};

const getWeatherColor = (id: number) => {
  if (id === 1) return "text-amber-400";
  if ([2, 3, 5, 25].includes(id)) return "text-amber-300";
  if ([4, 24, 27].includes(id)) return "text-gray-400";
  if ([6, 7, 8, 9, 10, 11, 12, 13, 14, 15].includes(id)) return "text-blue-400";
  if ([16, 17, 26].includes(id)) return "text-gray-300";
  if ([18, 28, 29, 30].includes(id)) return "text-blue-200";
  if ([19, 20, 21, 23].includes(id)) return "text-purple-400";
  return "text-gray-400";
};

const Weather = () => {
  const { t, language } = useLanguage();
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setForecast(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const lang = (["pt", "es"].includes(language)) ? "pt" : "en";

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayNames: Record<string, string[]> = {
      pt: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
      en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    };
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const weekday = (dayNames[lang] || dayNames.en)[date.getDay()];
    return { weekday, date: `${day}/${month}` };
  };

  return (
    <section className="section-padding bg-muted/30">
      <div className="container-max" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <span className="text-sm font-semibold text-turquoise uppercase tracking-widest font-display mb-3 block">
            {t("weather_tag")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-800 text-foreground mb-4 tracking-tight">
            {t("weather_title")}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t("weather_desc")}
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 w-40 h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {forecast.map((day, i) => {
              const Icon = getWeatherIcon(day.idWeatherType);
              const iconColor = getWeatherColor(day.idWeatherType);
              const { weekday, date } = formatDate(day.forecastDate);
              const desc = weatherDescriptions[day.idWeatherType]?.[lang] || "---";
              const precipProb = parseFloat(day.precipitaProb);

              return (
                <motion.div
                  key={day.forecastDate}
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.1 * i, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  className="bg-card rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow duration-300 text-center flex flex-col items-center gap-2"
                >
                  <div className="font-display font-700 text-foreground text-sm">
                    {weekday}
                  </div>
                  <div className="text-muted-foreground text-xs">{date}</div>

                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Icon size={36} className={iconColor} />
                  </motion.div>

                  <p className="text-muted-foreground text-xs leading-tight min-h-[2rem] flex items-center">
                    {desc}
                  </p>

                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="text-blue-500">{Math.round(parseFloat(day.tMin))}°</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-red-500">{Math.round(parseFloat(day.tMax))}°</span>
                  </div>

                  {precipProb > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Droplets size={12} className="text-blue-400" />
                      <span>{Math.round(precipProb)}%</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Wind size={12} />
                    <span>{day.predWindDir}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center text-xs text-muted-foreground mt-6"
        >
          {t("weather_source")}
        </motion.p>
      </div>
    </section>
  );
};

export default Weather;
