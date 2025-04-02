import { supabase } from "@/lib/supabase"

// Interfaz para las estadísticas de niveles
export interface NivelesStats {
  ph: {
    min: number | null
    max: number | null
    avg: number | null
  }
  conductividad: {
    min: number | null
    max: number | null
    avg: number | null
  }
  temperatura: {
    min: number | null
    max: number | null
    avg: number | null
  }
}

// Función para obtener la fecha del primer trasplante de un lote
export async function getFechaTrasplante1(loteId: string): Promise<string | null> {
  try {
    // Modificado para manejar múltiples registros de trasplante 1
    // Eliminamos .single() y usamos el primer resultado del array ordenado por fecha ascendente
    const { data, error } = await supabase
      .from("Labores")
      .select("fecha")
      .eq("lote_id", loteId)
      .eq("Labor", "trasplante 1")
      .order("fecha", { ascending: true })
      .limit(1)

    if (error || !data || data.length === 0) {
      console.error("Error obteniendo fecha de trasplante 1:", error)
      return null
    }

    console.log(`Lote ${loteId}: Encontrada fecha de trasplante 1: ${data[0].fecha}`)
    return data[0].fecha
  } catch (error) {
    console.error("Error en getFechaTrasplante1:", error)
    return null
  }
}

// Función para obtener la fecha de cierre de un lote
export async function getFechaCierre(loteId: string): Promise<string | null> {
  try {
    // Primero intentamos buscar una labor de cierre
    const { data: dataCierre, error: errorCierre } = await supabase
      .from("Labores")
      .select("fecha")
      .eq("lote_id", loteId)
      .eq("Labor", "cierre")
      .order("fecha", { ascending: false })
      .limit(1)

    if (!errorCierre && dataCierre && dataCierre.length > 0) {
      return dataCierre[0].fecha
    }

    // Si no hay labor de cierre, buscamos la última cosecha
    const { data: dataCosecha, error: errorCosecha } = await supabase
      .from("Labores")
      .select("fecha")
      .eq("lote_id", loteId)
      .in("Labor", ["cosecha", "pesada"])
      .order("fecha", { ascending: false })
      .limit(1)

    if (!errorCosecha && dataCosecha && dataCosecha.length > 0) {
      return dataCosecha[0].fecha
    }

    // Si no hay ni cierre ni cosecha, devolvemos null
    return null
  } catch (error) {
    console.error("Error en getFechaCierre:", error)
    return null
  }
}

// Función para obtener estadísticas de niveles entre dos fechas
export async function getNivelesStats(fechaInicio: string, fechaFin: string): Promise<NivelesStats> {
  try {
    // Inicializar estadísticas con valores nulos
    const stats: NivelesStats = {
      ph: { min: null, max: null, avg: null },
      conductividad: { min: null, max: null, avg: null },
      temperatura: { min: null, max: null, avg: null },
    }

    // Obtener todos los registros de niveles entre las fechas
    const { data, error } = await supabase
      .from("Niveles")
      .select("*")
      .gte("fecha", fechaInicio)
      .lte("fecha", fechaFin)
      .order("fecha", { ascending: true })

    if (error || !data || data.length === 0) {
      console.error("Error obteniendo niveles:", error)
      return stats
    }

    // Arrays para almacenar valores de cada variable
    const phValues: number[] = []
    const conductividadValues: number[] = []
    const temperaturaValues: number[] = []

    // Recopilar valores
    data.forEach((nivel) => {
      if (nivel.ph_promedio !== null) phValues.push(nivel.ph_promedio)
      if (nivel.conductividad_promedio !== null) conductividadValues.push(nivel.conductividad_promedio)
      if (nivel.temperatura_promedio !== null) temperaturaValues.push(nivel.temperatura_promedio)
    })

    // Calcular estadísticas para pH
    if (phValues.length > 0) {
      stats.ph.min = Math.min(...phValues)
      stats.ph.max = Math.max(...phValues)
      stats.ph.avg = phValues.reduce((sum, val) => sum + val, 0) / phValues.length
    }

    // Calcular estadísticas para conductividad
    if (conductividadValues.length > 0) {
      stats.conductividad.min = Math.min(...conductividadValues)
      stats.conductividad.max = Math.max(...conductividadValues)
      stats.conductividad.avg = conductividadValues.reduce((sum, val) => sum + val, 0) / conductividadValues.length
    }

    // Calcular estadísticas para temperatura
    if (temperaturaValues.length > 0) {
      stats.temperatura.min = Math.min(...temperaturaValues)
      stats.temperatura.max = Math.max(...temperaturaValues)
      stats.temperatura.avg = temperaturaValues.reduce((sum, val) => sum + val, 0) / temperaturaValues.length
    }

    return stats
  } catch (error) {
    console.error("Error en getNivelesStats:", error)
    return {
      ph: { min: null, max: null, avg: null },
      conductividad: { min: null, max: null, avg: null },
      temperatura: { min: null, max: null, avg: null },
    }
  }
}

// Función para obtener todos los registros de niveles disponibles para un lote
export async function getAllNivelesForLote(loteId: string): Promise<NivelesStats> {
  try {
    // Inicializar estadísticas con valores nulos
    const stats: NivelesStats = {
      ph: { min: null, max: null, avg: null },
      conductividad: { min: null, max: null, avg: null },
      temperatura: { min: null, max: null, avg: null },
    }

    // Obtener todos los registros de niveles disponibles
    const { data, error } = await supabase.from("Niveles").select("*").order("fecha", { ascending: true })

    if (error || !data || data.length === 0) {
      console.error("Error obteniendo niveles:", error)
      return stats
    }

    console.log(`Encontrados ${data.length} registros de niveles en total`)

    // Arrays para almacenar valores de cada variable
    const phValues: number[] = []
    const conductividadValues: number[] = []
    const temperaturaValues: number[] = []

    // Recopilar valores
    data.forEach((nivel) => {
      if (nivel.ph_promedio !== null) phValues.push(nivel.ph_promedio)
      if (nivel.conductividad_promedio !== null) conductividadValues.push(nivel.conductividad_promedio)
      if (nivel.temperatura_promedio !== null) temperaturaValues.push(nivel.temperatura_promedio)
    })

    // Calcular estadísticas para pH
    if (phValues.length > 0) {
      stats.ph.min = Math.min(...phValues)
      stats.ph.max = Math.max(...phValues)
      stats.ph.avg = phValues.reduce((sum, val) => sum + val, 0) / phValues.length
    }

    // Calcular estadísticas para conductividad
    if (conductividadValues.length > 0) {
      stats.conductividad.min = Math.min(...conductividadValues)
      stats.conductividad.max = Math.max(...conductividadValues)
      stats.conductividad.avg = conductividadValues.reduce((sum, val) => sum + val, 0) / conductividadValues.length
    }

    // Calcular estadísticas para temperatura
    if (temperaturaValues.length > 0) {
      stats.temperatura.min = Math.min(...temperaturaValues)
      stats.temperatura.max = Math.max(...temperaturaValues)
      stats.temperatura.avg = temperaturaValues.reduce((sum, val) => sum + val, 0) / temperaturaValues.length
    }

    return stats
  } catch (error) {
    console.error("Error en getAllNivelesForLote:", error)
    return {
      ph: { min: null, max: null, avg: null },
      conductividad: { min: null, max: null, avg: null },
      temperatura: { min: null, max: null, avg: null },
    }
  }
}

// Modificar la función getLoteNivelesStats para ser más flexible
export async function getLoteNivelesStats(loteId: string): Promise<NivelesStats> {
  try {
    // Obtener fecha de trasplante 1 o siembra
    const fechaInicio = await getFechaTrasplante1(loteId)
    if (!fechaInicio) {
      console.log("No se encontró fecha de inicio para el lote:", loteId)
      return {
        ph: { min: null, max: null, avg: null },
        conductividad: { min: null, max: null, avg: null },
        temperatura: { min: null, max: null, avg: null },
      }
    }

    console.log(`Lote ${loteId}: Fecha de inicio para estadísticas: ${fechaInicio}`)

    // Obtener fecha de cierre o usar la fecha actual si no hay cierre
    let fechaFin = await getFechaCierre(loteId)
    if (!fechaFin) {
      const today = new Date()
      fechaFin = today.toISOString().split("T")[0]
    }

    console.log(`Lote ${loteId}: Fecha de fin para estadísticas: ${fechaFin}`)

    // Verificar si hay registros de niveles en este período
    const { data: nivelesData, error: nivelesError } = await supabase
      .from("Niveles")
      .select("id")
      .gte("fecha", fechaInicio)
      .lte("fecha", fechaFin)
      .limit(1)

    if (nivelesError) {
      console.error("Error verificando niveles:", nivelesError)
    }

    console.log(`Lote ${loteId}: Registros de niveles encontrados: ${nivelesData?.length || 0}`)

    // Si no hay registros en el período específico, intentar obtener todos los registros disponibles
    if (!nivelesData || nivelesData.length === 0) {
      console.log(
        `Lote ${loteId}: No se encontraron registros en el período específico, buscando todos los registros disponibles`,
      )
      return await getAllNivelesForLote(loteId)
    }

    // Obtener estadísticas entre las fechas
    const stats = await getNivelesStats(fechaInicio, fechaFin)

    // Loguear las estadísticas para depuración
    console.log(`Lote ${loteId}: Estadísticas calculadas:`, stats)

    return stats
  } catch (error) {
    console.error("Error en getLoteNivelesStats:", error)
    return {
      ph: { min: null, max: null, avg: null },
      conductividad: { min: null, max: null, avg: null },
      temperatura: { min: null, max: null, avg: null },
    }
  }
}

