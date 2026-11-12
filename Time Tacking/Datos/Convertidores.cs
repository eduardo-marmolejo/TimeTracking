using System.Globalization;

namespace Time_Tacking.Datos
{
    /// <summary>Convierte entre lo que muestra la interfaz (MM/dd/yyyy, reloj 12 h AM/PM, duración HH:MM) y lo que guarda la base (YYYY-MM-DD, minutos).</summary>
    public static class Convertidores
    {
        public static string FechaAIso(string? fecha)
        {
            if (DateTime.TryParseExact((fecha ?? "").Trim(), "MM/dd/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d))
                return d.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            throw new DatosException("La fecha no es válida. Usa el formato MM/DD/AAAA.");
        }

        public static string IsoAFecha(string iso)
        {
            if (DateTime.TryParseExact(iso, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d))
                return d.ToString("MM/dd/yyyy", CultureInfo.InvariantCulture);
            return iso;
        }

        /// <summary>Hora de reloj (inicio/fin) 12 h AM/PM a minutos desde medianoche (0-1439).</summary>
        public static int RelojAMinutos(string? hora)
        {
            var texto = (hora ?? "").Trim();
            if (DateTime.TryParseExact(texto,
                    new[] { "h:mm tt", "hh:mm tt", "h:mmtt", "hh:mmtt" },
                    CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
                return dt.Hour * 60 + dt.Minute;
            // Tolerancia: aceptar 24 h si llega en ese formato.
            if (DuracionAMinutos(texto, 1439, out var m24))
                return m24;
            throw new DatosException("La hora no es válida. Usa el formato hh:mm AM/PM (ej. 08:00 AM).");
        }

        /// <summary>Minutos desde medianoche a hora de reloj 12 h AM/PM.</summary>
        public static string MinutosAReloj(int minutos)
        {
            if (minutos < 0) minutos = 0;
            if (minutos > 1439) minutos = 1439;
            var dt = DateTime.Today.AddMinutes(minutos);
            return dt.ToString("hh:mm tt", CultureInfo.InvariantCulture);
        }

        /// <summary>Duración HH:MM (ej. descanso) a minutos. No usa AM/PM.</summary>
        public static int DuracionAMinutos(string? hora)
        {
            if (DuracionAMinutos((hora ?? "").Trim(), int.MaxValue, out var m))
                return m;
            throw new DatosException("La duración no es válida. Usa el formato HH:MM.");
        }

        public static string MinutosADuracion(int minutos)
        {
            if (minutos < 0) minutos = 0;
            return $"{minutos / 60:00}:{minutos % 60:00}";
        }

        private static bool DuracionAMinutos(string texto, int max, out int minutos)
        {
            minutos = 0;
            if (TimeSpan.TryParseExact(texto, @"h\:mm", CultureInfo.InvariantCulture, out var t)
                && t.TotalMinutes >= 0 && t.TotalMinutes <= max)
            {
                minutos = (int)t.TotalMinutes;
                return true;
            }
            return false;
        }
    }
}
