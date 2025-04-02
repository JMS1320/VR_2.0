"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugForm() {
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  // Función para verificar si un módulo está disponible
  const checkModule = async (modulePath: string) => {
    try {
      // Intentar importar dinámicamente el módulo
      await import(modulePath)
      return `✅ Módulo disponible: ${modulePath}`
    } catch (error: any) {
      return `❌ Error en módulo: ${modulePath} - ${error.message}`
    }
  }

  // Función para verificar las rutas de importación
  const checkImports = async () => {
    const logs: string[] = []
    logs.push("=== VERIFICACIÓN DE IMPORTACIONES ===")

    // Verificar componentes UI
    logs.push(await checkModule("@/components/ui/button"))
    logs.push(await checkModule("@/components/ui/card"))
    logs.push(await checkModule("@/components/ui/input"))
    logs.push(await checkModule("@/components/ui/label"))
    logs.push(await checkModule("@/components/ui/textarea"))
    logs.push(await checkModule("@/components/ui/select"))
    logs.push(await checkModule("@/components/ui/checkbox"))
    logs.push(await checkModule("@/components/ui/dialog"))
    logs.push(await checkModule("@/components/ui/calendar"))
    logs.push(await checkModule("@/components/ui/popover"))

    // Verificar utilidades
    logs.push(await checkModule("@/lib/utils"))
    logs.push(await checkModule("@/lib/supabase"))
    logs.push(await checkModule("@/hooks/use-toast"))

    // Verificar dependencias externas
    logs.push(await checkModule("date-fns"))
    logs.push(await checkModule("date-fns/locale"))
    logs.push(await checkModule("lucide-react"))

    setDebugInfo(logs)
  }

  // Verificar estructura de archivos
  const checkFileStructure = () => {
    const logs: string[] = []
    logs.push("=== VERIFICACIÓN DE ESTRUCTURA DE ARCHIVOS ===")

    // Listar componentes disponibles
    const components = [
      "ui/button.tsx",
      "ui/card.tsx",
      "ui/input.tsx",
      "ui/label.tsx",
      "ui/textarea.tsx",
      "ui/select.tsx",
      "ui/checkbox.tsx",
      "ui/dialog.tsx",
      "ui/calendar.tsx",
      "ui/popover.tsx",
      "input-form.tsx",
      "lot-grid.tsx",
      "lot-detail.tsx",
    ]

    logs.push("Componentes que deberían estar disponibles:")
    components.forEach((comp) => {
      logs.push(`- components/${comp}`)
    })

    setDebugInfo((prev) => [...prev, ...logs])
  }

  // Verificar versiones
  const checkVersions = () => {
    const logs: string[] = []
    logs.push("=== VERIFICACIÓN DE VERSIONES ===")

    // Obtener información del navegador
    logs.push(`Navegador: ${navigator.userAgent}`)

    // Obtener información del entorno
    logs.push(`Entorno: ${process.env.NODE_ENV}`)

    setDebugInfo((prev) => [...prev, ...logs])
  }

  // Ejecutar todas las verificaciones
  const runAllChecks = async () => {
    setDebugInfo(["Iniciando verificaciones..."])
    await checkImports()
    checkFileStructure()
    checkVersions()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Depuración de Componentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runAllChecks} className="mb-4">
            Ejecutar Verificaciones
          </Button>

          <div className="bg-muted p-4 rounded-md">
            <h3 className="font-medium mb-2">Resultados:</h3>
            <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">{debugInfo.join("\n")}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

