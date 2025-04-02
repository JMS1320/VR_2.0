"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, Scissors, Skull, Droplets, ThermometerSun } from "lucide-react"
import { supabase, debugSupabase } from "@/lib/supabase"
import { differenceInDays, format } from "date-fns"
import { es } from "date-fns/locale"
import { type NivelesStats, getLoteNivelesStats } from "@/lib/statistics"

interface Lot {
  id: string
  loteNum: number
  fechaSiembra: string
  cantidadInicial: number
  cantidadActual: number
  estado: string
  variedad: string
  // Nuevos campos calculados
  totalCosechado: number
  totalMortandad: number
  pesoPromedio: number | null
  conRaiz: boolean // Indica si el peso promedio es con raíz o sin raíz
  // Estadísticas de niveles
  nivelesStats: NivelesStats | null
}

interface LotGridProps {
  onLotClick: (lotId: string) => void
  showClosed?: boolean
}

export default function LotGrid({ onLotClick, showClosed = false }: LotGridProps) {
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    async function fetchLots() {
      try {
        console.log("=== INICIO CONSULTA DE LOTES ===")

        // Ejecutar depuración
        const debug = await debugSupabase()
        setDebugInfo(debug)

        // Consulta principal sin filtro para ver todos los lotes
        console.log("Consultando TODOS los lotes...")
        const { data: allData, error: allError } = await supabase.from("Lotes").select("*")

        console.log("TODOS los lotes:", allData)
        console.log("Error en consulta de TODOS los lotes:", allError)

        // Ahora consulta con filtro de estado
        let query = supabase.from("Lotes").select("*")

        if (showClosed) {
          // Mostrar lotes cerrados
          query = query.eq("Estado", "Cerrado")
        } else {
          // Mostrar lotes activos
          query = query.ilike("Estado", "Activo%")
        }

        const { data, error } = await query.order('"Lote #"', { ascending: true })

        console.log(`Lotes ${showClosed ? "CERRADOS" : "ACTIVOS"}:`, data)
        console.log(`Error en consulta de lotes ${showClosed ? "CERRADOS" : "ACTIVOS"}:`, error)

        if (error) {
          console.error("Error fetching lots:", error)
          return
        }

        // Verificar si hay datos
        if (!data || data.length === 0) {
          console.log(`No se encontraron lotes ${showClosed ? "cerrados" : "activos"} en la consulta`)
        } else {
          console.log(`Se encontraron ${data.length} lotes ${showClosed ? "cerrados" : "activos"}`)

          // Verificar cada lote con información detallada
          data.forEach((lot, index) => {
            console.log(`Lote ${index + 1} (completo):`, lot)
            console.log(`  - ID: ${lot.id}`)
            console.log(`  - Lote #: ${lot["Lote #"]}`)
            console.log(`  - Fecha Siembra: ${lot["Fecha Siembra"]}`)
            console.log(`  - Cantidad Inicial: ${lot["Cantidad Inicial"]}`)
            console.log(`  - Cantidad Actual: ${lot["Cantidad Actual"]}`)
            console.log(`  - Estado: ${lot.Estado}`)
            console.log(`  - Variedad: ${lot.Variedad || "No especificada"}`)
          })

          // Obtener información adicional para cada lote (cosechas, mortandad, pesos)
          const lotsWithDetails = await Promise.all(
            data.map(async (lot) => {
              // Obtener actividades de cosecha y mortandad para este lote
              const { data: activities, error: activitiesError } = await supabase
                .from("Labores")
                .select("*")
                .eq("lote_id", lot.id)
                .in("Labor", ["cosecha", "pesada", "mortandad"])

              if (activitiesError) {
                console.error(`Error obteniendo actividades para lote ${lot["Lote #"]}:`, activitiesError)
                return {
                  id: lot.id,
                  loteNum: lot["Lote #"],
                  fechaSiembra: lot["Fecha Siembra"],
                  cantidadInicial: lot["Cantidad Inicial"],
                  cantidadActual: lot["Cantidad Actual"],
                  estado: lot.Estado.trim(),
                  variedad: lot.Variedad,
                  totalCosechado: 0,
                  totalMortandad: 0,
                  pesoPromedio: null,
                  conRaiz: false,
                  nivelesStats: null,
                }
              }

              // Calcular totales
              let totalCosechado = 0
              let totalMortandad = 0
              let sumaPesoSinRaiz = 0
              let sumaPesoConRaiz = 0
              let contadorPesoSinRaiz = 0
              let contadorPesoConRaiz = 0

              if (activities) {
                activities.forEach((activity) => {
                  // Sumar cosechas
                  if ((activity.Labor === "cosecha" || activity.Labor === "pesada") && activity.Cantidad) {
                    totalCosechado += activity.Cantidad
                  }

                  // Sumar mortandad
                  if (activity.Labor === "mortandad" && activity.Cantidad) {
                    totalMortandad += activity.Cantidad
                  }

                  // Acumular pesos para calcular promedios
                  if (activity["Peso Planta sin Raiz"]) {
                    sumaPesoSinRaiz += activity["Peso Planta sin Raiz"]
                    contadorPesoSinRaiz++
                  }

                  if (activity["Peso Planta con Raiz"]) {
                    sumaPesoConRaiz += activity["Peso Planta con Raiz"]
                    contadorPesoConRaiz++
                  }
                })
              }

              // Calcular peso promedio (preferir sin raíz)
              let pesoPromedio = null
              let conRaiz = false

              if (contadorPesoSinRaiz > 0) {
                pesoPromedio = sumaPesoSinRaiz / contadorPesoSinRaiz
                conRaiz = false
              } else if (contadorPesoConRaiz > 0) {
                pesoPromedio = sumaPesoConRaiz / contadorPesoConRaiz
                conRaiz = true
              }

              // Obtener estadísticas de niveles para este lote
              const nivelesStats = await getLoteNivelesStats(lot.id)

              return {
                id: lot.id,
                loteNum: lot["Lote #"],
                fechaSiembra: lot["Fecha Siembra"],
                cantidadInicial: lot["Cantidad Inicial"],
                cantidadActual: lot["Cantidad Actual"],
                estado: lot.Estado.trim(),
                variedad: lot.Variedad,
                totalCosechado,
                totalMortandad,
                pesoPromedio,
                conRaiz,
                nivelesStats,
              }
            }),
          )

          setLots(lotsWithDetails)
        }

        console.log("=== FIN CONSULTA DE LOTES ===")
      } catch (error) {
        console.error("Error en fetchLots:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLots()
  }, [showClosed])

  // Calculate days since planting
  const getDaysSincePlanting = (plantingDate: string) => {
    const today = new Date()
    const plantDate = new Date(plantingDate)
    return differenceInDays(today, plantDate)
  }

  // Format date as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy", { locale: es })
  }

  if (loading) {
    return <div className="text-center py-8">Cargando lotes...</div>
  }

  // Mostrar información de depuración si no hay lotes
  if (lots.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          {showClosed
            ? "No hay lotes cerrados. Los lotes se mostrarán aquí cuando se cierren."
            : "No hay lotes activos. Registra una siembra para comenzar."}
        </div>

        {debugInfo && (
          <div className="border p-4 rounded-md text-xs overflow-auto max-h-60">
            <h3 className="font-bold mb-2">Información de depuración:</h3>
            <p>Total de lotes en la base de datos: {debugInfo.allLots?.length || 0}</p>
            <p>Lotes con estado "Activo" (exacto): {debugInfo.activeLots?.length || 0}</p>
            <p>Lotes con estado "Activo%" (flexible): {debugInfo.activeLotsFlexible?.length || 0}</p>

            {debugInfo.allLots && debugInfo.allLots.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold">Lotes disponibles:</p>
                <ul className="list-disc pl-5">
                  {debugInfo.allLots.map((lot: any, index: number) => (
                    <li key={index}>
                      Lote #{lot["Lote #"]} - Estado: "{lot.Estado}" - ID: {lot.id.substring(0, 8)}...
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {debugInfo && debugInfo.lot2 && debugInfo.lot2.length > 0 && (
          <div className="mt-4 p-3 border border-red-300 bg-red-50 rounded-md">
            <h4 className="font-bold text-red-700">Depuración de Lote 2:</h4>
            <div>
              <p className="text-sm">Lote 2 encontrado en la base de datos:</p>
              <div className="text-xs mt-1 pl-2 border-l-2 border-red-300">
                <p>ID: {debugInfo.lot2[0].id}</p>
                <p>Estado: "{debugInfo.lot2[0].Estado}"</p>
                <p>Fecha: {debugInfo.lot2[0]["Fecha Siembra"]}</p>
                <p>Cantidad: {debugInfo.lot2[0]["Cantidad Actual"]}</p>
                <p>Variedad: {debugInfo.lot2[0].Variedad || "No especificada"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {lots.map((lot) => (
        <Card
          key={lot.id}
          className="cursor-pointer hover:bg-accent transition-colors"
          onClick={() => onLotClick(lot.id)}
        >
          <CardContent className="p-4">
            <div className="font-bold text-lg">Lote {lot.loteNum}</div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <CalendarDays className="h-3 w-3 mr-1" />
              {formatDate(lot.fechaSiembra)} ({getDaysSincePlanting(lot.fechaSiembra)} días)
            </div>

            {/* Plantas en camas */}
            <div className="mt-3 text-sm">
              <div className="font-medium">Plantas en camas:</div>
              <div className="flex justify-between">
                <span>Inicial: {lot.cantidadInicial}</span>
                <span>Actual: {lot.cantidadActual}</span>
              </div>
            </div>

            {/* Cosechado */}
            <div className="mt-2 text-sm flex items-start">
              <Scissors className="h-3 w-3 mr-1 mt-0.5" />
              <div>
                <span>Cosechado: {lot.totalCosechado}</span>
                {lot.pesoPromedio !== null && (
                  <div className="text-xs text-muted-foreground">
                    Peso promedio: {lot.pesoPromedio.toFixed(2)} g {lot.conRaiz ? "(con raíz)" : "(sin raíz)"}
                  </div>
                )}
              </div>
            </div>

            {/* Mortandad */}
            <div className="mt-1 text-sm flex items-center">
              <Skull className="h-3 w-3 mr-1" />
              <span>Mortandad: {lot.totalMortandad}</span>
            </div>

            {/* Estadísticas de niveles */}
            {lot.nivelesStats && (
              <div className="mt-3 border-t pt-2">
                <div className="text-sm font-medium">Estadísticas de niveles:</div>

                {/* pH */}
                {lot.nivelesStats.ph.avg !== null && (
                  <div className="mt-1 text-xs flex items-center">
                    <Droplets className="h-3 w-3 mr-1 text-blue-500" />
                    <span>pH: {lot.nivelesStats.ph.avg.toFixed(2)} </span>
                    <span className="text-muted-foreground ml-1">
                      (Min: {lot.nivelesStats.ph.min?.toFixed(2)}, Max: {lot.nivelesStats.ph.max?.toFixed(2)})
                    </span>
                  </div>
                )}

                {/* Conductividad */}
                {lot.nivelesStats.conductividad.avg !== null && (
                  <div className="mt-1 text-xs flex items-center">
                    <Droplets className="h-3 w-3 mr-1 text-purple-500" />
                    <span>Cond: {lot.nivelesStats.conductividad.avg.toFixed(2)} </span>
                    <span className="text-muted-foreground ml-1">
                      (Min: {lot.nivelesStats.conductividad.min?.toFixed(2)}, Max:{" "}
                      {lot.nivelesStats.conductividad.max?.toFixed(2)})
                    </span>
                  </div>
                )}

                {/* Temperatura */}
                {lot.nivelesStats.temperatura.avg !== null && (
                  <div className="mt-1 text-xs flex items-center">
                    <ThermometerSun className="h-3 w-3 mr-1 text-orange-500" />
                    <span>Temp: {lot.nivelesStats.temperatura.avg.toFixed(2)}°C </span>
                    <span className="text-muted-foreground ml-1">
                      (Min: {lot.nivelesStats.temperatura.min?.toFixed(2)}°C, Max:{" "}
                      {lot.nivelesStats.temperatura.max?.toFixed(2)}°C)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Variedad */}
            <div className="text-xs text-muted-foreground mt-2">{lot.variedad}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

