using Microsoft.Data.Sqlite;
using System.Reflection;

namespace Time_Tacking.Datos
{
    /// <summary>Ruta, conexión y creación/versión de la base TimeTracking.db (junto al .exe).</summary>
    public static class BaseDatos
    {
        /// <summary>Versión del esquema que trae Esquema.sql (debe coincidir con su PRAGMA user_version).</summary>
        public const int VersionActual = 1;

        public static string RutaArchivo { get; } =
            Path.Combine(AppContext.BaseDirectory, "TimeTracking.db");

        private static string CadenaConexion => new SqliteConnectionStringBuilder
        {
            DataSource = RutaArchivo,
            Mode = SqliteOpenMode.ReadWriteCreate,
            ForeignKeys = true   // en SQLite las llaves foráneas vienen apagadas
        }.ToString();

        /// <summary>Abre una conexión nueva. Usar siempre dentro de un using.</summary>
        public static SqliteConnection Abrir()
        {
            var con = new SqliteConnection(CadenaConexion);
            con.Open();
            return con;
        }

        /// <summary>Crea la base si no existe y revisa la versión del esquema. Llamar una vez al arrancar.</summary>
        public static void Inicializar()
        {
            using var con = Abrir();

            long version = Escalar(con, "PRAGMA user_version;");
            long tablas = Escalar(con,
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%';");

            if (version == 0 && tablas == 0)
            {
                // Base nueva: aplicar el esquema completo en una sola transacción.
                using var tx = con.BeginTransaction();
                using var cmd = con.CreateCommand();
                cmd.Transaction = tx;
                cmd.CommandText = LeerEsquema();
                cmd.ExecuteNonQuery();
                tx.Commit();
            }
            else if (version == 0)
            {
                throw new InvalidOperationException(
                    "Existe un archivo TimeTracking.db sin versión de esquema. Bórralo o muévelo para que la app cree uno nuevo.");
            }
            else if (version > VersionActual)
            {
                throw new InvalidOperationException(
                    $"La base tiene una versión más nueva ({version}) que esta aplicación ({VersionActual}).");
            }
            // Futuro: si version < VersionActual, aplicar aquí las migraciones que falten.
        }

        private static long Escalar(SqliteConnection con, string sql)
        {
            using var cmd = con.CreateCommand();
            cmd.CommandText = sql;
            return Convert.ToInt64(cmd.ExecuteScalar());
        }

        private static string LeerEsquema()
        {
            using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("Esquema.sql")
                ?? throw new InvalidOperationException("No se encontró Esquema.sql dentro del ejecutable.");
            using var lector = new StreamReader(stream);
            return lector.ReadToEnd();
        }
    }
}
