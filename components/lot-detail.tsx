"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  CalendarDays,
  Leaf,
  Droplets,
  Scissors,
  ArrowRightLeft,
  Sun,
  Moon,
  AlertCircle,
  Skull,
  Scale,
  ThermometerSun,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { type NivelesStats, getLoteNivelesStats } from "@/lib/statistics"

interface Lot {
  id: string
  "Lote #": number
  "Fecha Siembra": string
  "Cantidad Inicial": number
  "Cantidad Actual": number
  Estado: string
  Variedad: string
}

interface Activity {
  id: string
  lote_id: string
  fecha: string
  hora: string
  Labor: string
  Cantidad: number | null
  Variedad: string | null
  Observaciones: string | null
  "Peso Testigo con Raiz": number | null
  "Peso Testigo sin Raiz": number | null
  "Peso Lote con Raiz": number | null
  "Peso Lote sin Raiz": number | null
  "Peso Planta con Raiz": number | null
  "Peso Planta sin Raiz": number | null
}

interface LotDetailProps {
  lotId: string
  onBack: () => void
}

export default function LotDetail({ lotId, onBack }: LotDetailProps) {
  const [lot, setLot] = useState<Lot | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [totalHarvested, setTotalHarvested] = useState(0)
  const [totalMortality, setTotalMortality] = useState(0)
  const [nivelesStats, setNivelesStats] = useState<NivelesStats | null>(null)

  useEffect(() => {
    async function fetchLotDetails() {
      try {
        // Fetch lot details
        const { data: lotData, error: lotError } = await supabase.from("Lotes").select("*").eq("id", lotId).single()

        if (lotError) {
          console.error("Error fetching lot:", lotError)
          return
        }

        setLot(lotData)

        // Fetch activities for this lot
        const { data: activitiesData, error: activitiesError } = await supabase
          .from("Labores")
          .select("*")
          .eq("lote_id", lotId)
          .order("fecha", { ascending: false })
          .order("hora", { ascending: false })

        if (activitiesError) {
          console.error("Error fetching activities:", activitiesError)
          return
        }

        setActivities(activitiesData || [])

        // Calculate total harvested and mortality
        let harvestedCount = 0
        let mortalityCount = 0

        activitiesData?.forEach((activity) => {
          if (activity.Labor === "cosecha" && activity.Cantidad) {
            harvestedCount += activity.Cantidad
          }
          if (activity.Labor === "mortandad" && activity.Cantidad) {
            mortalityCount += activity.Cantidad
          }
        })

        setTotalHarvested(harvestedCount)
        setTotalMortality(mortalityCount)

        // Obtener estadísticas de niveles
        const stats = await getLoteNivelesStats(lotId)
        setNivelesStats(stats)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLotDetails()
  }, [lotId])

  // Format date as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd/MM/yyyy", { locale: es })
  }

  // Get activity icon
  const getActivityIcon = (type: string) => {
    if (type.startsWith("trasplante")) {
      return <ArrowRightLeft className="h-4 w-4" />
    }

    switch (type) {
      case "siembra":
      case "plantines_comprados":
        return <Leaf className="h-4 w-4" />
      case "riego":
        return <Droplets className="h-4 w-4" />
      case "cosecha":
        return <Scissors className="h-4 w-4" />
      case "pesada":
        return <Scale className="h-4 w-4" />
      case "apertura":
        return <Sun className="h-4 w-4" />
      case "cierre":
        return <Moon className="h-4 w-4" />
      case "niveles":
        return <AlertCircle className="h-4 w-4" />
      case "mortandad":
        return <Skull className="h-4 w-4" />
      default:
        return <CalendarDays className="h-4 w-4" />
    }
  }

  // Get activity name in Spanish
  const getActivityName = (type: string) => {
    if (type.startsWith("trasplante")) {
      const parts = type.split(" ")
      if (parts.length > 1) {
        return `Trasplante ${parts[1]}`
      }
      return "Trasplante"
    }

    switch (type) {
      case "siembra":
        return "Siembra"
      case "plantines_comprados":
        return "Plantines Comprados"
      case "riego":
        return "Riego"
      case "cosecha":
        return "Cosecha"
      case "pesada":
        return "Cosecha + Pesada"
      case "apertura":
        return "Apertura"
      case "cierre":
        return "Cierre de Lote"
      case "niveles":
        return "Niveles"
      case "mortandad":
        return "Mortandad"
      default:
        return type
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando detalles del lote...</div>
  }

  if (!lot) {
    return (
      <div className="text-center py-8">
        <p>No se encontró el lote</p>
        <Button onClick={onBack} className="mt-4">
          Volver
        </Button>
      </div>
    )
  }

  // Calculate days since planting
  const getDaysSincePlanting = () => {
    const today = new Date()
    const plantDate = new Date(lot["Fecha Siembra"])
    const diffTime = Math.abs(today.getTime() - plantDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Lote {lot["Lote #"]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-muted-foreground">Fecha de siembra</p>
              <p>{formatDate(lot["Fecha Siembra"])}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Días desde siembra</p>
              <p>{getDaysSincePlanting()} días</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cantidad sembrada</p>
              <p>{lot["Cantidad Inicial"]}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cantidad actual</p>
              <p>{lot["Cantidad Actual"]}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total cosechado</p>
              <p>{totalHarvested}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mortandad</p>
              <p>{totalMortality}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Variedad</p>
              <p>{lot["Variedad"]}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Estado</p>
              <p>{lot["Estado"] === "Activo" ? "Activo" : "Cerrado"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas de niveles */}
      {nivelesStats && (
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas de Niveles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* pH */}
              {nivelesStats.ph.avg !== null && (
                <div>
                  <div className="flex items-center">
                    <Droplets className="h-4 w-4 mr-2 text-blue-500" />
                    <p className="font-medium">pH</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div>
                      <p className="text-xs text-muted-foreground">Mínimo</p>
                      <p className="text-sm">{nivelesStats.ph.min?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Promedio</p>
                      <p className="text-sm font-medium">{nivelesStats.ph.avg.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Máximo</p>
                      <p className="text-sm">{nivelesStats.ph.max?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Conductividad */}
              {nivelesStats.conductividad.avg !== null && (
                <div>
                  <div className="flex items-center">
                    <Droplets className="h-4 w-4 mr-2 text-purple-500" />
                    <p className="font-medium">Conductividad</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div>
                      <p className="text-xs text-muted-foreground">Mínimo</p>
                      <p className="text-sm">{nivelesStats.conductividad.min?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Promedio</p>
                      <p className="text-sm font-medium">{nivelesStats.conductividad.avg.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Máximo</p>
                      <p className="text-sm">{nivelesStats.conductividad.max?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Temperatura */}
              {nivelesStats.temperatura.avg !== null && (
                <div>
                  <div className="flex items-center">
                    <ThermometerSun className="h-4 w-4 mr-2 text-orange-500" />
                    <p className="font-medium">Temperatura</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div>
                      <p className="text-xs text-muted-foreground">Mínimo</p>
                      <p className="text-sm">{nivelesStats.temperatura.min?.toFixed(2)}°C</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Promedio</p>
                      <p className="text-sm font-medium">{nivelesStats.temperatura.avg.toFixed(2)}°C</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Máximo</p>
                      <p className="text-sm">{nivelesStats.temperatura.max?.toFixed(2)}°C</p>
                    </div>
                  </div>
                </div>
              )}

              {!nivelesStats.ph.avg && !nivelesStats.conductividad.avg && !nivelesStats.temperatura.avg && (
                <p className="text-center py-2 text-muted-foreground">
                  No hay datos de niveles disponibles para este lote
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historial de Actividades</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-center py-4">No hay actividades registradas</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-muted p-2 rounded-full mr-2">{getActivityIcon(activity["Labor"])}</div>
                      <div>
                        <p className="font-medium">{getActivityName(activity["Labor"])}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.fecha)} - {activity.hora.substring(0, 5)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {activity["Cantidad"] && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Cantidad</p>
                      <p className="text-sm">{activity["Cantidad"]}</p>
                    </div>
                  )}

                  {activity["Peso Testigo con Raiz"] && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Peso testigo con raíz</p>
                      <p className="text-sm">{activity["Peso Testigo con Raiz"]} g</p>
                    </div>
                  )}

                  {activity["Peso Testigo sin Raiz"] && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Peso testigo sin raíz</p>
                      <p className="text-sm">{activity["Peso Testigo sin Raiz"]} g</p>
                    </div>
                  )}

                  {activity["Peso Planta con Raiz"] && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Peso por planta con raíz</p>
                      <p className="text-sm">{activity["Peso Planta con Raiz"]} g</p>
                    </div>
                  )}

                  {activity["Peso Planta sin Raiz"] && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Peso por planta sin raíz</p>
                      <p className="text-sm">{activity["Peso Planta sin Raiz"]} g</p>
                    </div>
                  )}

                  {activity["Peso Lote con Raiz"] && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Peso total con raíz</p>
                      <p className="text-sm">{activity["Peso Lote con Raiz"]} kg</p>
                    </div>
                  )}

                  {activity["Peso Lote sin Raiz"] && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Peso total sin raíz</p>
                      <p className="text-sm">{activity["Peso Lote sin Raiz"]} kg</p>
                    </div>
                  )}

                  {activity["Observaciones"] && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Observaciones</p>
                      <p className="text-sm">{activity["Observaciones"]}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

