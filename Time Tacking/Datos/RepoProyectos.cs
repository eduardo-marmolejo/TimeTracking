using Microsoft.Data.Sqlite;

namespace Time_Tacking.Datos
{
    public static class RepoProyectos
    {
        /// <summary>Todos los proyectos (más nuevos primero) con su total de minutos.</summary>
        public static List<Proyecto> ListarConTotales()
        {
            using var con = BaseDatos.Abrir();
            using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT p.idProject,
                       p.Nombre,
                       COALESCE(SUM(r.horaFinal - r.horaInicio - r.horaDescanso), 0) AS TotalMinutos,
                       p.CreateAt
                FROM Projects p
                LEFT JOIN RegistroTiempo r ON r.idProject = p.idProject
                GROUP BY p.idProject, p.Nombre, p.CreateAt
                ORDER BY p.CreateAt DESC, p.idProject DESC;";

            var lista = new List<Proyecto>();
            using var rd = cmd.ExecuteReader();
            while (rd.Read())
                lista.Add(new Proyecto(rd.GetInt64(0), rd.GetString(1), rd.GetInt64(2), rd.GetString(3)));
            return lista;
        }

        /// <summary>Crea un proyecto y devuelve su Id.</summary>
        public static long Crear(string? nombre)
        {
            nombre = (nombre ?? "").Trim();
            if (nombre.Length == 0)
                throw new DatosException("El nombre del proyecto no puede estar vacío.");

            try
            {
                using var con = BaseDatos.Abrir();
                using var cmd = con.CreateCommand();
                cmd.CommandText = "INSERT INTO Projects (Nombre) VALUES (@n) RETURNING idProject;";
                cmd.Parameters.AddWithValue("@n", nombre);
                return Convert.ToInt64(cmd.ExecuteScalar());
            }
            catch (SqliteException ex) when (ex.SqliteErrorCode == 19 &&
                                             ex.Message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase))
            {
                throw new DatosException("Ya existe un proyecto con ese nombre.");
            }
        }

        /// <summary>Actualiza el nombre de un proyecto.</summary>
        public static void Editar(long id, string? nombre)
        {
            nombre = (nombre ?? "").Trim();
            if (nombre.Length == 0)
                throw new DatosException("El nombre del proyecto no puede estar vacío.");

            try
            {
                using var con = BaseDatos.Abrir();
                using var cmd = con.CreateCommand();
                cmd.CommandText = "UPDATE Projects SET Nombre = @n WHERE idProject = @id;";
                cmd.Parameters.AddWithValue("@n", nombre);
                cmd.Parameters.AddWithValue("@id", id);
                int filas = cmd.ExecuteNonQuery();
                if (filas == 0)
                    throw new DatosException("El proyecto no existe.");
            }
            catch (SqliteException ex) when (ex.SqliteErrorCode == 19 &&
                                             ex.Message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase))
            {
                throw new DatosException("Ya existe un proyecto con ese nombre.");
            }
        }
    }
}
