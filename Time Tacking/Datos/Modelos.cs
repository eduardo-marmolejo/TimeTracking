namespace Time_Tacking.Datos
{
    /// <summary>Error de validación o de datos con un mensaje listo para mostrar al usuario.</summary>
    public class DatosException : Exception
    {
        public DatosException(string mensaje) : base(mensaje) { }
    }

    /// <summary>Proyecto con el total de minutos registrados.</summary>
    public record Proyecto(long Id, string Nombre, long TotalMinutos, string CreadoEn);

    /// <summary>Un registro de tiempo. Fecha en formato ISO (YYYY-MM-DD), horas en minutos desde medianoche.</summary>
    public record Registro(long Id, long IdProyecto, string Fecha, int Inicio, int Final, int Descanso, string Observaciones)
    {
        public int TotalMinutos => Final - Inicio - Descanso;
    }
}
