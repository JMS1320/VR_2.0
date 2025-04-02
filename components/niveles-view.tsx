"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Battery, Droplets, ThermometerSun } from 'lucide-react'

interface Nivel {
  id: string
  fecha: string
  hora: string
  ph_promedio: number | null
  conductividad_promedio: number | null
  temperatura_promedio: number | null
  bateria: number | null
  observaciones: string | null
}

export default function NivelesView() {
  const [niveles, setNiveles] = useState<Nivel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNiveles() {
      try {
        const { data, error } = await supabase
          .from("Niveles")
          .select("*")
          .order("fecha", { ascending: false })
          .order("hora", { ascending: false })
          .limit(10)

        if (error) {
          console.error("Error fetching niveles:", error)
          return
        }

        setNiveles(data || [])
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNiveles()
  }, [])

  // Format date as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd/MM/yyyy", { locale: es })
  }

  if (loading) {
    return <div className="text-center py-8">Cargando datos de niveles...</div>
  }

  if (niveles.length === 0) {
    return <div className="text-center py-8">No hay registros de niveles disponibles.</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Últimos Registros de Niveles</h2>
      
      {niveles.map((nivel) => (
        <Card key={nivel.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex justify-between">
              <span>Registro de Niveles</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(nivel.fecha)} - {nivel.hora.substring(0, 5)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center">
                <div className="bg-blue-100 p-1.5 rounded-full mr-2">
                  <Droplets className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">pH Promedio</p>
                  <p className="font-medium">{nivel.ph_promedio?.toFixed(2) || "N/A"}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-purple-100 p-1.5 rounded-full mr-2">
                  <Droplets className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Conductividad</p>
                  <p className="font-medium">{nivel.conductividad_promedio?.toFixed(2) || "N/A"}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-orange-100 p-1.5 rounded-full mr-2">
                  <ThermometerSun className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Temperatura</p>
                  <p className="font-medium">{nivel.temperatura_promedio?.toFixed(2) || "N/A"}°C</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-green-100 p-1.5 rounded-full mr-2">
                  <Battery className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Batería</p>
                  <p className="font-medium">{nivel.bateria?.toFixed(2) || "N/A"}</p>
                </div>
              </div>
            </div>
            
            {nivel.observaciones && (
              <div className="mt-2 text-sm">
                <p className="text-xs text-muted-foreground">Observaciones</p>
                <p>{nivel.observaciones}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}