import { createClient } from "@supabase/supabase-js"

// Usar las variables de entorno directamente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Verificar que las variables se estén cargando correctamente
console.log("Verificando URL de Supabase:", supabaseUrl)
console.log(
  "Verificando ANON KEY (primeros 5 caracteres):",
  supabaseAnonKey ? supabaseAnonKey.substring(0, 5) : "no disponible",
)

// Si las variables no se están cargando, usar los valores directamente
if (!supabaseUrl) {
  console.warn("Variable de entorno no encontrada, usando URL directa")
}

export const supabase = createClient(supabaseUrl || "https://esueemjtoyieyxmymuaf.supabase.co", supabaseAnonKey)

// Función para obtener lotes activos con manejo de espacios en blanco
export async function getActiveLots() {
  // Usamos ILIKE con % para hacer una búsqueda más flexible que ignore espacios al final
  const { data, error } = await supabase
    .from("Lotes")
    .select("*")
    .ilike("Estado", "Activo%")
    .order('"Lote #"', { ascending: true })

  return { data, error }
}

// Función de ayuda para depuración
export async function debugSupabase() {
  try {
    console.log("=== INICIO DEPURACIÓN SUPABASE ===")

    // Verificar conexión
    const { data: connectionTest, error: connectionError } = await supabase
      .from("Lotes")
      .select("count", { count: "exact" })
    console.log("Prueba de conexión:", connectionTest ? "Exitosa" : "Fallida", connectionError)

    // Obtener todos los lotes sin filtros
    const { data: allLots, error: allLotsError } = await supabase.from("Lotes").select("*")
    console.log("Todos los lotes:", allLots, allLotsError)

    // Mostrar cada lote con su información completa
    if (allLots) {
      console.log("=== DETALLE DE TODOS LOS LOTES ===")
      allLots.forEach((lot, index) => {
        console.log(`Lote DB ${index + 1}:`)
        console.log(`  - ID: ${lot.id}`)
        console.log(`  - Lote #: ${lot["Lote #"]} (tipo: ${typeof lot["Lote #"]})`)
        console.log(`  - Estado: "${lot.Estado}" (tipo: ${typeof lot.Estado})`)
        console.log(`  - Fecha: ${lot["Fecha Siembra"]}`)
        console.log(`  - Cantidad Inicial: ${lot["Cantidad Inicial"]}`)
        console.log(`  - Cantidad Actual: ${lot["Cantidad Actual"]}`)
        console.log(`  - Variedad: ${lot.Variedad || "No especificada"}`)
      })
    }

    // Obtener lotes con estado "Activo" (exacto)
    const { data: activeLots, error: activeLotsError } = await supabase.from("Lotes").select("*").eq("Estado", "Activo")
    console.log("Lotes con estado 'Activo' (exacto):", activeLots, activeLotsError)

    // Obtener lotes con estado que comience con "Activo" (flexible)
    const { data: activeLotsFlexible, error: activeLotsFlexibleError } = await supabase
      .from("Lotes")
      .select("*")
      .ilike("Estado", "Activo%")
    console.log("Lotes con estado 'Activo%' (flexible):", activeLotsFlexible, activeLotsFlexibleError)

    // Consulta específica para el Lote 2
    const { data: lot2, error: lot2Error } = await supabase.from("Lotes").select("*").eq('"Lote #"', 2)
    console.log("Consulta específica para Lote #2:", lot2, lot2Error)

    if (lot2 && lot2.length > 0) {
      console.log("Detalle del Lote #2:")
      console.log(`  - ID: ${lot2[0].id}`)
      console.log(`  - Estado: "${lot2[0].Estado}" (tipo: ${typeof lot2[0].Estado})`)
      console.log(`  - Fecha: ${lot2[0]["Fecha Siembra"]}`)
      console.log(`  - Cantidad: ${lot2[0]["Cantidad Actual"]}`)
    } else {
      console.log("No se encontró el Lote #2 o hubo un error en la consulta")
    }

    console.log("=== FIN DEPURACIÓN SUPABASE ===")

    return { allLots, activeLots, activeLotsFlexible, lot2 }
  } catch (error) {
    console.error("Error en depuración:", error)
    return null
  }
}

