using Microsoft.Data.Sqlite;
using System.Globalization;

namespace Time_Tacking.Datos
{
    public static class RepoRegistros
    {
        /// <summary>Registros de un proyecto, del más reciente al más antiguo.</summary>
        public static List<Registro> Listar(long idProyecto)
        {
            using var con = BaseDatos.Abrir();
            using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT idRegistro, idProject, Fecha, horaInicio, horaFinal, horaDescanso, Remarks
                FROM RegistroTiempo
                WHERE idProject = @p
                ORDER BY Fecha DESC, horaInicio DESC, idRegistro DESC;";
            cmd.Parameters.AddWithValue("@p", idProyecto);

            var lista = new List<Registro>();
            using var rd = cmd.ExecuteReader();
            while (rd.Read())
                lista.Add(new Registro(rd.GetInt64(0), rd.GetInt64(1), rd.GetString(2),
                                       rd.GetInt32(3), rd.GetInt32(4), rd.GetInt32(5), rd.GetString(6)));
            return lista;
        }

        /// <summary>Suma de minutos trabajados en el proyecto.</summary>
        public static long TotalMinutos(long idProyecto)
        {
            using var con = BaseDatos.Abrir();
            using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT COALESCE(SUM(horaFinal - horaInicio - horaDescanso), 0)
                FROM RegistroTiempo WHERE idProject = @p;";
            cmd.Parameters.AddWithValue("@p", idProyecto);
            return Convert.ToInt64(cmd.ExecuteScalar());
        }

        /// <summary>Agrega un registro y devuelve su Id. La fecha va en ISO (YYYY-MM-DD).</summary>
        public static long Agregar(long idProyecto, string fechaIso, int inicio, int final, int descanso, string? observaciones)
        {
            Validar(fechaIso, inicio, final, descanso);
            try
            {
                using var con = BaseDatos.Abrir();
                using var cmd = con.CreateCommand();
                cmd.CommandText = @"
                    INSERT INTO RegistroTiempo (idProject, Fecha, horaInicio, horaFinal, horaDescanso, Remarks)
                    VALUES (@p, @f, @i, @fin, @d, @o)
                    RETURNING idRegistro;";
                Parametros(cmd, fechaIso, inicio, final, descanso, observaciones);
                cmd.Parameters.AddWithValue("@p", idProyecto);
                return Convert.ToInt64(cmd.ExecuteScalar());
            }
            catch (SqliteException ex) when (ex.SqliteErrorCode == 19 &&
                                             ex.Message.Contains("FOREIGN KEY", StringComparison.OrdinalIgnoreCase))
            {
                throw new DatosException("El proyecto ya no existe.");
            }
        }

        /// <summary>Modifica un registro existente.</summary>
        public static void Editar(long idRegistro, string fechaIso, int inicio, int final, int descanso, string? observaciones)
        {
            Validar(fechaIso, inicio, final, descanso);
            using var con = BaseDatos.Abrir();
            using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                UPDATE RegistroTiempo
                SET Fecha = @f, horaInicio = @i, horaFinal = @fin, horaDescanso = @d, Remarks = @o,
                    UpdateAt = datetime('now', 'localtime')
                WHERE idRegistro = @id;";
            Parametros(cmd, fechaIso, inicio, final, descanso, observaciones);
            cmd.Parameters.AddWithValue("@id", idRegistro);
            if (cmd.ExecuteNonQuery() == 0)
                throw new DatosException("El registro ya no existe.");
        }

        public static void Eliminar(long idRegistro)
        {
            using var con = BaseDatos.Abrir();
            using var cmd = con.CreateCommand();
            cmd.CommandText = "DELETE FROM RegistroTiempo WHERE idRegistro = @id;";
            cmd.Parameters.AddWithValue("@id", idRegistro);
            cmd.ExecuteNonQuery();
        }

        private static void Parametros(SqliteCommand cmd, string fechaIso, int inicio, int final, int descanso, string? obs)
        {
            cmd.Parameters.AddWithValue("@f", fechaIso);
            cmd.Parameters.AddWithValue("@i", inicio);
            cmd.Parameters.AddWithValue("@fin", final);
            cmd.Parameters.AddWithValue("@d", descanso);
            cmd.Parameters.AddWithValue("@o", (obs ?? "").Trim());
        }

        // Mensajes claros antes de llegar a los CHECK de la base (que son la red de seguridad).
        private static void Validar(string fechaIso, int inicio, int final, int descanso)
        {
            if (!DateTime.TryParseExact(fechaIso, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
                throw new DatosException("La fecha no es válida.");
            if (inicio < 0 || inicio > 1439 || final < 0 || final > 1439)
                throw new DatosException("Las horas deben estar entre 00:00 y 23:59.");
            if (final <= inicio)
                throw new DatosException("La hora final debe ser posterior a la hora de inicio.");
            if (descanso < 0)
                throw new DatosException("El descanso no puede ser negativo.");
            if (descanso > final - inicio)
                throw new DatosException("El descanso no puede ser mayor al tiempo entre inicio y final.");
        }
    }
}
