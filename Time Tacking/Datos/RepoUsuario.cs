using Microsoft.Data.Sqlite;

namespace Time_Tacking.Datos
{
    /// <summary>Nombre del usuario para el saludo. Tabla vacía = pedir el nombre.</summary>
    public static class RepoUsuario
    {
        /// <summary>Devuelve el nombre guardado, o null si todavía no hay (primera apertura).</summary>
        public static string? ObtenerNombre()
        {
            using var con = BaseDatos.Abrir();
            using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT Nombre FROM Usuarios ORDER BY idUsuarios LIMIT 1;";
            return cmd.ExecuteScalar() as string;
        }

        /// <summary>Guarda el nombre la primera vez; si ya existe, lo actualiza.</summary>
        public static void GuardarNombre(string? nombre)
        {
            nombre = (nombre ?? "").Trim();
            if (nombre.Length == 0)
                throw new DatosException("El nombre no puede estar vacío.");

            using var con = BaseDatos.Abrir();
            using var cmd = con.CreateCommand();
            cmd.CommandText = ObtenerNombre() is null
                ? "INSERT INTO Usuarios (Nombre) VALUES (@n);"
                : "UPDATE Usuarios SET Nombre = @n WHERE idUsuarios = (SELECT MIN(idUsuarios) FROM Usuarios);";
            cmd.Parameters.AddWithValue("@n", nombre);
            cmd.ExecuteNonQuery();
        }
    }
}
