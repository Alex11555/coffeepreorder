// Live weather for the greeting block.
//
// No native location permission needed: we geolocate roughly by IP, then
// fetch the current condition from Open-Meteo (free, no API key). Everything
// is best-effort — if any step fails we just return null and the UI falls
// back to a time-of-day emoji.
import { useEffect, useState } from 'react';

// WMO weather codes → emoji, split day/night where it matters.
// https://open-meteo.com/en/docs (weather_code table)
function codeToEmoji(code, isDay) {
  if (code === 0) return isDay ? '☀️' : '🌙';          // clear
  if (code === 1) return isDay ? '🌤️' : '🌙';          // mainly clear
  if (code === 2) return '⛅';                           // partly cloudy
  if (code === 3) return '☁️';                           // overcast
  if (code === 45 || code === 48) return '🌫️';          // fog
  if (code >= 51 && code <= 57) return '🌦️';            // drizzle
  if (code >= 61 && code <= 67) return '🌧️';            // rain
  if (code >= 71 && code <= 77) return '🌨️';            // snow
  if (code >= 80 && code <= 82) return '🌧️';            // rain showers
  if (code >= 85 && code <= 86) return '🌨️';            // snow showers
  if (code >= 95) return '⛈️';                           // thunderstorm
  return isDay ? '☀️' : '🌙';
}

async function getCoords() {
  // Try several free, HTTPS, no-key IP-geolocation services for resilience
  // (any single one can be rate-limited). All must be https for iOS ATS.
  const sources = [
    async () => {
      const j = await (await fetch('https://get.geojs.io/v1/ip/geo.json')).json();
      return { lat: parseFloat(j.latitude), lon: parseFloat(j.longitude) };
    },
    async () => {
      const j = await (await fetch('https://freeipapi.com/api/json')).json();
      return { lat: j.latitude, lon: j.longitude };
    },
    async () => {
      const j = await (await fetch('https://ipwho.is/')).json();
      return { lat: j.latitude, lon: j.longitude };
    },
  ];
  for (const src of sources) {
    try {
      const c = await src();
      if (Number.isFinite(c.lat) && Number.isFinite(c.lon)) return c;
    } catch {}
  }
  return null;
}

export default function useWeather() {
  const [weather, setWeather] = useState(null); // { emoji, tempC }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const coords = await getCoords();
        if (!coords || cancelled) return;
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}` +
          `&longitude=${coords.lon}&current=temperature_2m,weather_code,is_day`;
        const r = await fetch(url);
        const j = await r.json();
        if (cancelled || !j.current) return;
        const { weather_code, is_day, temperature_2m } = j.current;
        setWeather({
          emoji: codeToEmoji(weather_code, is_day === 1),
          tempC: Math.round(temperature_2m),
        });
      } catch {
        // leave null — caller falls back to a time-based emoji
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return weather;
}
