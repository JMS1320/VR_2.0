"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Leaf, Droplets, Scissors, ArrowRightLeft, Sun, Moon, AlertCircle, Skull } from "lucide-react"
import { supabase, debugSupabase, getActiveLots } from "@/lib/supabase"
import { format } from "date-fns"

interface Lot {
  id: string
  number: number
}

export default function InputForm() {
  const [activityType, setActivityType] = useState<string | null>(null)
  const [trasplanteType, setTrasplanteType] = useState<string>("1")
  const [cosechaType, setCosechaType] = useState<string>("cosecha")
  const [pesadaType, setPesadaType] = useState<string>("testigo")
  const [activeLots, setActiveLots] = useState<Lot[]>([])
  const [nextLotNumber, setNextLotNumber] = useState<number>(1)
  const [formData, setFormData] = useState({
    lot: "",
    quantity: "",
    variety: "",
    observations: "",
    // Campos para pesada
    pesoTestigoConRaiz: "",
    pesoTestigoSinRaiz: "",
    cantidadTestigo: "",
    pesoLoteConRaiz: "",
    pesoLoteSinRaiz: "",
    // Campo para mortandad
    mortality: "",
    // Opciones adicionales
    cerrarLote: false,
  })
  const [debugMode, setDebugMode] = useState(false)
  const [siembraType, setSiembraType] = useState<string>("normal")
  const [manualPlantingDate, setManualPlantingDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [registerTransplant, setRegisterTransplant] = useState<boolean>(false)
  const [transplantQuantity, setTransplantQuantity] = useState<string>("")

  // Campos para niveles
  const [nivelesData, setNivelesData] = useState({
    // pH
    ph_sector1: "",
    ph_sector2: "",
    ph_sector3: "",
    ph_sector4: "",
    ph_sector5: "",
    ph_tanque: "",
    // Conductividad
    conductividad_sector1: "",
    conductividad_sector2: "",
    conductividad_sector3: "",
    conductividad_sector4: "",
    conductividad_sector5: "",
    conductividad_tanque: "",
    // Temperatura
    temperatura_sector1: "",
    temperatura_sector2: "",
    temperatura_sector3: "",
    temperatura_sector4: "",
    temperatura_sector5: "",
    temperatura_tanque: "",
    // Batería
    bateria: "",
  })

  // Modifica la función getNextLotNumber para obtener correctamente el siguiente número de lote
  useEffect(() => {
    // Ejecutar depuración al cargar
    debugSupabase()

    // Fetch active lots for dropdown
    async function fetchActiveLots() {
      console.log("Consultando lotes activos para dropdown...")
      // Usar la nueva función que maneja espacios en blanco
      const { data, error } = await getActiveLots()

      if (error) {
        console.error("Error fetching lots:", error)
        return
      }

      console.log("Datos de lotes activos:", data)

      if (data && data.length > 0) {
        // Mapea los datos para que coincidan con la interfaz Lot
        const mappedLots = data.map((lot) => ({
          id: lot.id,
          number: lot["Lote #"],
        }))

        console.log("Lotes activos mapeados para dropdown:", mappedLots)
        setActiveLots(mappedLots)
      } else {
        // Si no hay datos, establecer un array vacío
        setActiveLots([])
      }
    }

    // Get next lot number
    async function getNextLotNumber() {
      console.log("Obteniendo próximo número de lote...")
      const { data, error } = await supabase
        .from("Lotes")
        .select('"Lote #"') // Corregido: Escapar el nombre de la columna con comillas dobles
        .order('"Lote #"', { ascending: false }) // Corregido: Escapar el nombre de la columna con comillas dobles
        .limit(1)

      if (error) {
        console.error("Error fetching next lot number:", error)
        return
      }

      console.log("Datos para próximo número de lote:", data)

      if (data && data.length > 0) {
        // Incrementa el número del último lote
        const nextNumber = Number.parseInt(data[0]["Lote #"]) + 1
        setNextLotNumber(nextNumber)
        console.log("Próximo número de lote:", nextNumber)
      } else {
        // Si no hay lotes, comienza con 1
        setNextLotNumber(1)
        console.log("No hay lotes, comenzando con 1")
      }
    }

    fetchActiveLots()
    getNextLotNumber()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleNivelesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Validar que sea un número decimal válido
    if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
      setNivelesData({
        ...nivelesData,
        [name]: value,
      })
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData({
      ...formData,
      [name]: checked,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    console.log(`Seleccionando ${name}: ${value}`)
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleActivityTypeChange = (type: string) => {
    setActivityType(type)
    // Reset specialized form states when changing activity
    if (type !== "siembra") {
      setSiembraType("normal")
      setRegisterTransplant(false)
    }
  }

  // Calcular promedios para niveles
  const calcularPromediosPH = () => {
    const valores = [
      nivelesData.ph_sector1,
      nivelesData.ph_sector2,
      nivelesData.ph_sector3,
      nivelesData.ph_sector4,
      nivelesData.ph_sector5,
      nivelesData.ph_tanque,
    ]
      .filter((val) => val !== "")
      .map((val) => Number.parseFloat(val))

    if (valores.length === 0) return null
    return valores.reduce((sum, val) => sum + val, 0) / valores.length
  }

  const calcularPromediosConductividad = () => {
    const valores = [
      nivelesData.conductividad_sector1,
      nivelesData.conductividad_sector2,
      nivelesData.conductividad_sector3,
      nivelesData.conductividad_sector4,
      nivelesData.conductividad_sector5,
      nivelesData.conductividad_tanque,
    ]
      .filter((val) => val !== "")
      .map((val) => Number.parseFloat(val))

    if (valores.length === 0) return null
    return valores.reduce((sum, val) => sum + val, 0) / valores.length
  }

  const calcularPromediosTemperatura = () => {
    const valores = [
      nivelesData.temperatura_sector1,
      nivelesData.temperatura_sector2,
      nivelesData.temperatura_sector3,
      nivelesData.temperatura_sector4,
      nivelesData.temperatura_sector5,
      nivelesData.temperatura_tanque,
    ]
      .filter((val) => val !== "")
      .map((val) => Number.parseFloat(val))

    if (valores.length === 0) return null
    return valores.reduce((sum, val) => sum + val, 0) / valores.length
  }

  // Calcular peso por planta basado en muestra testigo
  const calcularPesoPlantaConRaiz = () => {
    if (!formData.pesoTestigoConRaiz || !formData.cantidadTestigo) return "0.00"
    const pesoTestigo = Number.parseFloat(formData.pesoTestigoConRaiz)
    const cantidad = Number.parseFloat(formData.cantidadTestigo)
    if (cantidad === 0) return "0.00"
    return (pesoTestigo / cantidad).toFixed(2)
  }

  const calcularPesoPlantaSinRaiz = () => {
    if (!formData.pesoTestigoSinRaiz || !formData.cantidadTestigo) return "0.00"
    const pesoTestigo = Number.parseFloat(formData.pesoTestigoSinRaiz)
    const cantidad = Number.parseFloat(formData.cantidadTestigo)
    if (cantidad === 0) return "0.00"
    return (pesoTestigo / cantidad).toFixed(2)
  }

  // Calcular peso total del lote basado en peso por planta y cantidad
  const calcularPesoLoteConRaiz = () => {
    if (pesadaType === "lote" && formData.pesoLoteConRaiz) {
      return formData.pesoLoteConRaiz
    }

    if (!formData.quantity) return "0.00"
    const pesoPlanta = Number.parseFloat(calcularPesoPlantaConRaiz())
    const cantidad = Number.parseFloat(formData.quantity)
    return ((pesoPlanta * cantidad) / 1000).toFixed(2)
  }

  const calcularPesoLoteSinRaiz = () => {
    if (pesadaType === "lote" && formData.pesoLoteSinRaiz) {
      return formData.pesoLoteSinRaiz
    }

    if (!formData.quantity) return "0.00"
    const pesoPlanta = Number.parseFloat(calcularPesoPlantaSinRaiz())
    const cantidad = Number.parseFloat(formData.quantity)
    return ((pesoPlanta * cantidad) / 1000).toFixed(2)
  }

  // Validar formulario de niveles
  const validarFormularioNiveles = () => {
    // Verificar que al menos un campo de pH esté completo
    const hayPH = Object.entries(nivelesData)
      .filter(([key]) => key.startsWith("ph_"))
      .some(([_, value]) => value !== "")

    // Verificar que al menos un campo de conductividad esté completo
    const hayConductividad = Object.entries(nivelesData)
      .filter(([key]) => key.startsWith("conductividad_"))
      .some(([_, value]) => value !== "")

    // Verificar que al menos un campo de temperatura esté completo
    const hayTemperatura = Object.entries(nivelesData)
      .filter(([key]) => key.startsWith("temperatura_"))
      .some(([_, value]) => value !== "")

    // Verificar que el campo de batería esté completo
    const hayBateria = nivelesData.bateria !== ""

    return hayPH && hayConductividad && hayTemperatura && hayBateria
  }

  // Modifica la función handleSubmit para mostrar más información de depuración
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const now = new Date()
    const currentDate = format(now, "yyyy-MM-dd")
    const currentTime = format(now, "HH:mm:ss")

    try {
      if (activityType === "niveles") {
        // Validar que al menos se haya completado un campo de cada tipo
        if (!validarFormularioNiveles()) {
          alert(
            "Por favor complete al menos un campo de cada tipo (pH, conductividad, temperatura) y el campo de batería",
          )
          return
        }

        // Calcular promedios
        const ph_promedio = calcularPromediosPH()
        const conductividad_promedio = calcularPromediosConductividad()
        const temperatura_promedio = calcularPromediosTemperatura()

        // Preparar datos para insertar
        const nivelesDataToInsert: any = {
          fecha: currentDate,
          hora: currentTime,
          observaciones: formData.observations,
          bateria: nivelesData.bateria ? Number.parseFloat(nivelesData.bateria) : null,
          ph_promedio,
          conductividad_promedio,
          temperatura_promedio,
        }

        // Agregar campos individuales solo si tienen valor
        Object.entries(nivelesData).forEach(([key, value]) => {
          if (value !== "" && key !== "bateria") {
            nivelesDataToInsert[key] = Number.parseFloat(value)
          }
        })

        console.log("Datos a insertar en Niveles:", nivelesDataToInsert)

        // Insertar en la tabla Niveles
        const { error } = await supabase.from("Niveles").insert([nivelesDataToInsert])

        if (error) {
          console.error("Error registrando niveles:", error)
          alert("Error al registrar los niveles: " + error.message)
          return
        }

        alert("Niveles registrados correctamente. Recargando página...")
        window.location.reload()
      } else if (activityType === "siembra") {
        // Determine which date to use based on siembra type
        const plantingDate = siembraType === "plantines" ? manualPlantingDate : currentDate

        // Mostrar datos que se están enviando
        const lotData = {
          "Lote #": nextLotNumber,
          "Fecha Siembra": plantingDate,
          "Cantidad Inicial": Number.parseInt(formData.quantity),
          "Cantidad Actual": Number.parseInt(formData.quantity),
          Estado: "Activo", // Asegurarse de que no haya espacios o caracteres de nueva línea
          Variedad: formData.variety,
        }

        console.log("Datos a insertar en Lotes:", lotData)

        // First create a new lot
        const { data: newLotData, error: lotError } = await supabase.from("Lotes").insert([lotData]).select()

        console.log("Respuesta de Supabase:", { data: newLotData, error: lotError })

        if (lotError) {
          console.error("Error creating lot:", lotError)
          alert("Error al crear el lote: " + lotError.message)
          return
        }

        // Then record the planting activity
        const { error: activityError } = await supabase.from("Labores").insert([
          {
            lote_id: newLotData[0].id,
            fecha: plantingDate,
            hora: currentTime,
            Labor: siembraType === "plantines" ? "plantines_comprados" : "siembra",
            Cantidad: Number.parseInt(formData.quantity),
            Variedad: formData.variety,
            Observaciones: formData.observations,
          },
        ])

        if (activityError) {
          console.error("Error recording activity:", activityError)
          alert("Error al registrar la actividad")
          return
        }

        // If registering a transplant along with the purchased seedlings
        if (siembraType === "plantines" && registerTransplant && transplantQuantity) {
          const transplantQty = Number.parseInt(transplantQuantity)

          // Record transplant activity
          const laborValue = `trasplante ${trasplanteType}`

          const { error: transplantError } = await supabase.from("Labores").insert([
            {
              lote_id: newLotData[0].id,
              fecha: currentDate, // Use current date for the transplant
              hora: currentTime,
              Labor: laborValue,
              Cantidad: transplantQty,
              Observaciones: `Trasplante inmediato de plantines comprados (${transplantQty} de ${formData.quantity})`,
            },
          ])

          if (transplantError) {
            console.error("Error recording transplant activity:", transplantError)
            alert("Error al registrar la actividad de trasplante")
            // Continue anyway since the main planting was successful
          }
        }

        alert("Datos guardados correctamente. Recargando página...")

        // Forzar recarga de la página para mostrar los nuevos datos
        window.location.reload()
      } else if (activityType === "trasplante") {
        // Verificar que se haya seleccionado un lote
        if (!formData.lot) {
          alert("Por favor seleccione un lote")
          return
        }

        // Record transplant activity with the specific transplant number
        const laborValue = `trasplante ${trasplanteType}`

        const { error: activityError } = await supabase.from("Labores").insert([
          {
            lote_id: formData.lot,
            fecha: currentDate,
            hora: currentTime,
            Labor: laborValue,
            Cantidad: Number.parseInt(formData.quantity),
            Observaciones: formData.observations,
          },
        ])

        if (activityError) {
          console.error("Error recording activity:", activityError)
          alert("Error al registrar la actividad")
          return
        }

        // IMPORTANTE: Ya no actualizamos la cantidad actual para trasplantes
        // Solo registramos la actividad

        alert("Datos guardados correctamente. Recargando página...")
        window.location.reload()
      } else if (activityType === "cosecha") {
        // Verificar que se haya seleccionado un lote
        if (!formData.lot) {
          alert("Por favor seleccione un lote")
          return
        }

        // Determinar qué tipo de actividad estamos registrando
        if (cosechaType === "cosecha") {
          // Registrar cosecha
          const { error: activityError } = await supabase.from("Labores").insert([
            {
              lote_id: formData.lot,
              fecha: currentDate,
              hora: currentTime,
              Labor: "cosecha",
              Cantidad: Number.parseInt(formData.quantity),
              Observaciones: formData.observations,
            },
          ])

          if (activityError) {
            console.error("Error recording activity:", activityError)
            alert("Error al registrar la actividad: " + JSON.stringify(activityError))
            return
          }

          // Update current quantity in the lot
          const { data: lotData, error: lotFetchError } = await supabase
            .from("Lotes")
            .select('"Cantidad Actual"')
            .eq("id", formData.lot)
            .single()

          if (lotFetchError) {
            console.error("Error fetching lot:", lotFetchError)
            return
          }

          const newQuantity = lotData["Cantidad Actual"] - Number.parseInt(formData.quantity)

          // Actualizar la cantidad actual
          const updateData: any = {
            "Cantidad Actual": Math.max(0, newQuantity),
          }

          // Si se seleccionó cerrar lote, actualizar el estado
          if (formData.cerrarLote) {
            updateData.Estado = "Cerrado"
          }

          const { error: lotUpdateError } = await supabase.from("Lotes").update(updateData).eq("id", formData.lot)

          if (lotUpdateError) {
            console.error("Error updating lot:", lotUpdateError)
            return
          }

          alert("Datos guardados correctamente. Recargando página...")
          window.location.reload()
        } else if (cosechaType === "pesada") {
          // Calcular los valores de peso
          const pesoPlantaConRaiz = Number.parseFloat(calcularPesoPlantaConRaiz())
          const pesoPlantaSinRaiz = Number.parseFloat(calcularPesoPlantaSinRaiz())
          const pesoLoteConRaiz = Number.parseFloat(calcularPesoLoteConRaiz())
          const pesoLoteSinRaiz = Number.parseFloat(calcularPesoLoteSinRaiz())

          // Obtener la cantidad actual del lote antes de registrar la pesada
          const { data: lotData, error: lotFetchError } = await supabase
            .from("Lotes")
            .select('"Cantidad Actual"')
            .eq("id", formData.lot)
            .single()

          if (lotFetchError) {
            console.error("Error fetching lot:", lotFetchError)
            return
          }

          // Calcular la nueva cantidad (restar la cantidad cosechada)
          const cantidad = Number.parseInt(formData.quantity)
          const newQuantity = lotData["Cantidad Actual"] - cantidad

          // Registrar pesada
          const activityData: any = {
            lote_id: formData.lot,
            fecha: currentDate,
            hora: currentTime,
            Labor: "pesada",
            // MODIFICACIÓN AQUÍ: Usar formData.quantity en lugar de formData.cantidadTestigo
            Cantidad: Number.parseInt(formData.quantity),
            // Agregar campo para la cantidad del testigo
            "Cantidad Testigo": pesadaType === "testigo" ? Number.parseInt(formData.cantidadTestigo) : null,
            Observaciones: formData.observations,
            "Peso Testigo con Raiz": pesadaType === "testigo" ? Number.parseFloat(formData.pesoTestigoConRaiz) : null,
            "Peso Testigo sin Raiz": pesadaType === "testigo" ? Number.parseFloat(formData.pesoTestigoSinRaiz) : null,
            "Peso Lote con Raiz": pesoLoteConRaiz,
            "Peso Lote sin Raiz": pesoLoteSinRaiz,
            "Peso Planta con Raiz": pesoPlantaConRaiz,
            "Peso Planta sin Raiz": pesoPlantaSinRaiz,
          }

          console.log("Datos a insertar en Labores (pesada):", activityData)

          const { error: activityError } = await supabase.from("Labores").insert([activityData])

          if (activityError) {
            console.error("Error recording activity:", activityError)
            alert("Error al registrar la actividad: " + JSON.stringify(activityError))
            return
          }

          // Actualizar la cantidad actual y posiblemente el estado del lote
          const updateData: any = {
            "Cantidad Actual": Math.max(0, newQuantity),
          }

          // Si se seleccionó cerrar lote, actualizar el estado
          if (formData.cerrarLote) {
            updateData.Estado = "Cerrado"
          }

          const { error: lotUpdateError } = await supabase.from("Lotes").update(updateData).eq("id", formData.lot)

          if (lotUpdateError) {
            console.error("Error updating lot:", lotUpdateError)
            return
          }

          alert("Datos guardados correctamente. Recargando página...")
          window.location.reload()
        } else if (cosechaType === "cierre") {
          // Registrar cierre de lote
          const { error: activityError } = await supabase.from("Labores").insert([
            {
              lote_id: formData.lot,
              fecha: currentDate,
              hora: currentTime,
              Labor: "cierre",
              Observaciones: formData.observations,
            },
          ])

          if (activityError) {
            console.error("Error recording activity:", activityError)
            alert("Error al registrar la actividad: " + JSON.stringify(activityError))
            return
          }

          // Actualizar el estado del lote a "Cerrado"
          const { error: lotUpdateError } = await supabase
            .from("Lotes")
            .update({
              Estado: "Cerrado",
            })
            .eq("id", formData.lot)

          if (lotUpdateError) {
            console.error("Error updating lot:", lotUpdateError)
            return
          }

          alert("Datos guardados correctamente. Recargando página...")
          window.location.reload()
        }
      } else if (activityType === "mortandad") {
        // Verificar que se haya seleccionado un lote
        if (!formData.lot) {
          alert("Por favor seleccione un lote")
          return
        }

        // Record mortality activity
        const { error: activityError } = await supabase.from("Labores").insert([
          {
            lote_id: formData.lot,
            fecha: currentDate,
            hora: currentTime,
            Labor: "mortandad",
            Cantidad: Number.parseInt(formData.mortality),
            Observaciones: formData.observations,
          },
        ])

        if (activityError) {
          console.error("Error recording activity:", activityError)
          alert("Error al registrar la actividad")
          return
        }

        // Update current quantity in the lot
        const { data: lotData, error: lotFetchError } = await supabase
          .from("Lotes")
          .select('"Cantidad Actual"')
          .eq("id", formData.lot)
          .single()

        if (lotFetchError) {
          console.error("Error fetching lot:", lotFetchError)
          return
        }

        const newQuantity = lotData["Cantidad Actual"] - Number.parseInt(formData.mortality)

        // Actualizar la cantidad actual
        const { error: lotUpdateError } = await supabase
          .from("Lotes")
          .update({
            "Cantidad Actual": Math.max(0, newQuantity),
          })
          .eq("id", formData.lot)

        if (lotUpdateError) {
          console.error("Error updating lot:", lotUpdateError)
          return
        }

        alert("Datos guardados correctamente. Recargando página...")
        window.location.reload()
      } else {
        // For other activity types (apertura, cierre, etc.)
        const { error: activityError } = await supabase.from("Labores").insert([
          {
            lote_id: formData.lot || null,
            fecha: currentDate,
            hora: currentTime,
            Labor: activityType || "",
            Observaciones: formData.observations,
          },
        ])

        if (activityError) {
          console.error("Error recording activity:", activityError)
          alert("Error al registrar la actividad")
          return
        }

        alert("Datos guardados correctamente. Recargando página...")
        window.location.reload()
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar los datos")
    }
  }

  const getCurrentDateTime = () => {
    const now = new Date()
    const date = format(now, "dd/MM/yyyy")
    const time = format(now, "HH:mm")
    return { date, time }
  }

  const { date, time } = getCurrentDateTime()

  const renderActivityForm = () => {
    if (!activityType) return null

    switch (activityType) {
      case "niveles":
        return (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Sección de pH */}
            <div className="border p-4 rounded-md">
              <h3 className="font-medium mb-2">pH</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="ph_sector1">Sector 1</Label>
                  <Input
                    id="ph_sector1"
                    name="ph_sector1"
                    type="text"
                    inputMode="decimal"
                    placeholder="pH"
                    value={nivelesData.ph_sector1}
                    onChange={handleNivelesInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ph_sector2">Sector 2</Label>
                  <Input
                    id="ph_sector2"
                    name="ph_sector2"
                    type="text"
                    inputMode="decimal"
                    placeholder="pH"
                    value={nivelesData.ph_sector2}
                    onChange={handleNivelesInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ph_sector3">Sector 3</Label>
                  <Input
                    id="ph_sector3"
                    name="ph_sector3"
                    type="text"
                    inputMode="decimal"
                    placeholder="pH"
                    value={nivelesData.ph_sector3}
                    onChange={handleNivelesInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ph_sector4">Sector 4</Label>
                  <Input
                    id="ph_sector4"
                    name="ph_sector4"
                    type="text"
                    inputMode="decimal"
                    placeholder="pH"
                    value={nivelesData.ph_sector4}
                    onChange={handleNivelesInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ph_sector5">Sector 5</Label>
                  <Input
                    id="ph_sector5"
                    name="ph_sector5"
                    type="text"
                    inputMode="decimal"
                    placeholder="pH"
                    value={nivelesData.ph_sector5}
                    onChange={handleNivelesInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ph_tanque">Tanque</Label>
                  <Input
                    id="ph_tanque"
                    name="ph_tanque"
                    type="text"
                    inputMode="decimal"
                    placeholder="pH"
                    value={nivelesData.ph_tanque}
                    onChange={handleNivelesInputChange}
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label>Promedio pH</Label>
                <Input value={calcularPromediosPH() ? calcularPromediosPH()?.toFixed(2) : ""} disabled />
              </div>
            </div>

            {/* Sección de Conductividad */}
            <div className="border p-4 rounded-md">
              <h3 className="font-medium mb-2">Conductividad</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="conductividad_sector1">Sector 1</Label>
                  <Input
                    id="conductividad_sector1"
                    name="conductividad_sector1"
                    type="text"
                    inputMode="decimal"
                    placeholder="Conductividad"
                    value={nivelesData.conductividad_sector1}
                    onChange={handleNivelesInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="conductividad_sector2">Sector 2</Label>
                  <Input
                    id="conductividad_sector2"
                    name="conductividad_sector2"
                    type="text"
                    inputMode="decimal"
                    placeholder="Conductividad"
                    value={nivelesData.conductividad_sector2}
                    onChange={handleNivelesInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="conductividad_sector3">Sector 3</Label>
                  <Input
                    id="conductividad_sector3"
                    name="conductividad_sector3"
                    type="text"
                    inputMode="decimal"
                    placeholder="Conductividad"
                    value={nivelesData.conductividad_sector3}
                    onChange={handleNivelesInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="conductividad_sector4">Sector 4</Label>
                  <Input
                    id="conductividad_sector4"
                    name="conductividad_sector4"
                    type="text"
                    inputMode="decimal"
                    placeholder="Conductividad"
                    value={nivelesData.conductividad_sector4}
                    onChange={handleNivelesInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="conductividad_sector5">Sector 5</Label>
                  <Input
                    id="conductividad_sector5"
                    name="conductividad_sector5"
                    type="text"
                    inputMode="decimal"
                    placeholder="Conductividad"
                    value={nivelesData.conductividad_sector5}
                    onChange={handleNivelesInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="conductividad_tanque">Tanque</Label>
                  <Input
                    id="conductividad_tanque"
                    name="conductividad_tanque"
                    type="text"
                    inputMode="decimal"
                    placeholder="Conductividad"
                    value={nivelesData.conductividad_tanque}
                    onChange={handleNivelesInputChange}
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label>Promedio Conductividad</Label>
                <Input
                  value={calcularPromediosConductividad() ? calcularPromediosConductividad()?.toFixed(2) : ""}
                  disabled
                />
              </div>
            </div>

            {/* Sección de Temperatura */}
            <div className="border p-4 rounded-md">
              <h3 className="font-medium mb-2">Temperatura del Agua</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="temperatura_sector1">Sector 1</Label>
                  <Input
                    id="temperatura_sector1"
                    name="temperatura_sector1"
                    type="text"
                    inputMode="decimal"
                    placeholder="Temperatura"
                    value={nivelesData.temperatura_sector1}
                    onChange={handleNivelesInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="temperatura_sector2">Sector 2</Label>
                  <Input
                    id="temperatura_sector2"
                    name="temperatura_sector2"
                    type="text"
                    inputMode="decimal"
                    placeholder="Temperatura"
                    value={nivelesData.temperatura_sector2}
                    onChange={handleNivelesInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="temperatura_sector3">Sector 3</Label>
                  <Input
                    id="temperatura_sector3"
                    name="temperatura_sector3"
                    type="text"
                    inputMode="decimal"
                    placeholder="Temperatura"
                    value={nivelesData.temperatura_sector3}
                    onChange={handleNivelesInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="temperatura_sector4">Sector 4</Label>
                  <Input
                    id="temperatura_sector4"
                    name="temperatura_sector4"
                    type="text"
                    inputMode="decimal"
                    placeholder="Temperatura"
                    value={nivelesData.temperatura_sector4}
                    onChange={handleNivelesInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="temperatura_sector5">Sector 5</Label>
                  <Input
                    id="temperatura_sector5"
                    name="temperatura_sector5"
                    type="text"
                    inputMode="decimal"
                    placeholder="Temperatura"
                    value={nivelesData.temperatura_sector5}
                    onChange={handleNivelesInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="temperatura_tanque">Tanque</Label>
                  <Input
                    id="temperatura_tanque"
                    name="temperatura_tanque"
                    type="text"
                    inputMode="decimal"
                    placeholder="Temperatura"
                    value={nivelesData.temperatura_tanque}
                    onChange={handleNivelesInputChange}
                  />
                </div>
              </div>
              <div className="mt-2">
                <Label>Promedio Temperatura</Label>
                <Input
                  value={calcularPromediosTemperatura() ? calcularPromediosTemperatura()?.toFixed(2) : ""}
                  disabled
                />
              </div>
            </div>

            {/* Sección de Batería */}
            <div className="border p-4 rounded-md">
              <h3 className="font-medium mb-2">Batería</h3>
              <div className="grid gap-2">
                <Label htmlFor="bateria">Nivel de Batería</Label>
                <Input
                  id="bateria"
                  name="bateria"
                  type="text"
                  inputMode="decimal"
                  placeholder="Nivel de batería"
                  value={nivelesData.bateria}
                  onChange={handleNivelesInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                name="observations"
                placeholder="Ingrese observaciones"
                value={formData.observations}
                onChange={handleInputChange}
              />
            </div>
            <Button type="submit" className="w-full">
              Guardar
            </Button>
          </form>
        )

      case "siembra":
        return (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Siembra Type Selection */}
            <div className="grid gap-2">
              <Label>Tipo de Siembra</Label>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="siembraNormal"
                    name="siembraType"
                    value="normal"
                    checked={siembraType === "normal"}
                    onChange={() => setSiembraType("normal")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="siembraNormal">Siembra Normal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="siembraPlantines"
                    name="siembraType"
                    value="plantines"
                    checked={siembraType === "plantines"}
                    onChange={() => setSiembraType("plantines")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="siembraPlantines">Plantines Comprados</Label>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lot">Lote (asignado automáticamente)</Label>
              <Input id="lot" value={nextLotNumber} disabled />
            </div>

            {/* Date input for purchased seedlings */}
            {siembraType === "plantines" && (
              <div className="grid gap-2">
                <Label htmlFor="manualPlantingDate">Fecha de Siembra Original</Label>
                <Input
                  id="manualPlantingDate"
                  name="manualPlantingDate"
                  type="date"
                  value={manualPlantingDate}
                  onChange={(e) => setManualPlantingDate(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                placeholder="Ingrese cantidad"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="variety">Variedad</Label>
              <Input
                id="variety"
                name="variety"
                placeholder="Ingrese variedad"
                value={formData.variety}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Transplant option for purchased seedlings */}
            {siembraType === "plantines" && (
              <>
                <div className="flex items-center space-x-2 mt-4 border-t pt-4">
                  <input
                    type="checkbox"
                    id="registerTransplant"
                    name="registerTransplant"
                    checked={registerTransplant}
                    onChange={(e) => setRegisterTransplant(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="registerTransplant">Registrar trasplante inmediato</Label>
                </div>

                {registerTransplant && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="transplantType">Tipo de Trasplante</Label>
                      <div className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="trasplante1"
                            name="trasplanteType"
                            value="1"
                            checked={trasplanteType === "1"}
                            onChange={() => setTrasplanteType("1")}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="trasplante1">Trasplante 1</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="trasplante2"
                            name="trasplanteType"
                            value="2"
                            checked={trasplanteType === "2"}
                            onChange={() => setTrasplanteType("2")}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="trasplante2">Trasplante 2</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="trasplante3"
                            name="trasplanteType"
                            value="3"
                            checked={trasplanteType === "3"}
                            onChange={() => setTrasplanteType("3")}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="trasplante3">Trasplante 3</Label>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="transplantQuantity">Cantidad a trasplantar</Label>
                      <Input
                        id="transplantQuantity"
                        name="transplantQuantity"
                        type="number"
                        placeholder="Ingrese cantidad"
                        value={transplantQuantity}
                        onChange={(e) => setTransplantQuantity(e.target.value)}
                        max={formData.quantity}
                        required
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                name="observations"
                placeholder="Ingrese observaciones"
                value={formData.observations}
                onChange={handleInputChange}
              />
            </div>
            <Button type="submit" className="w-full">
              Guardar
            </Button>
          </form>
        )

      case "trasplante":
        return (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="trasplanteType">Tipo de Trasplante</Label>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="trasplante1"
                    name="trasplanteType"
                    value="1"
                    checked={trasplanteType === "1"}
                    onChange={() => setTrasplanteType("1")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="trasplante1">Trasplante 1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="trasplante2"
                    name="trasplanteType"
                    value="2"
                    checked={trasplanteType === "2"}
                    onChange={() => setTrasplanteType("2")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="trasplante2">Trasplante 2</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="trasplante3"
                    name="trasplanteType"
                    value="3"
                    checked={trasplanteType === "3"}
                    onChange={() => setTrasplanteType("3")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="trasplante3">Trasplante 3</Label>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lot">Lote</Label>
              <select
                id="lot"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.lot}
                onChange={(e) => handleSelectChange("lot", e.target.value)}
                required
              >
                <option value="">Seleccione lote</option>
                {activeLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    Lote {lot.number}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                placeholder="Ingrese cantidad"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                name="observations"
                placeholder="Ingrese observaciones"
                value={formData.observations}
                onChange={handleInputChange}
              />
            </div>
            <Button type="submit" className="w-full">
              Guardar
            </Button>
          </form>
        )

      case "cosecha":
        return (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="lot">Lote</Label>
              <select
                id="lot"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.lot}
                onChange={(e) => handleSelectChange("lot", e.target.value)}
                required
              >
                <option value="">Seleccione lote</option>
                {activeLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    Lote {lot.number}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de actividad */}
            <div className="grid gap-2">
              <Label>Tipo de Actividad</Label>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="cosechaTypeCosecha"
                    name="cosechaType"
                    value="cosecha"
                    checked={cosechaType === "cosecha"}
                    onChange={() => setCosechaType("cosecha")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="cosechaTypeCosecha">Cosecha</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="cosechaTypePesada"
                    name="cosechaType"
                    value="pesada"
                    checked={cosechaType === "pesada"}
                    onChange={() => setCosechaType("pesada")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="cosechaTypePesada">Cosecha + Pesada</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="cosechaTypeCierre"
                    name="cosechaType"
                    value="cierre"
                    checked={cosechaType === "cierre"}
                    onChange={() => setCosechaType("cierre")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="cosechaTypeCierre">Cierre de Lote</Label>
                </div>
              </div>
            </div>

            {/* Campos específicos según el tipo de actividad */}
            {cosechaType === "cosecha" && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Cantidad a cosechar</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    placeholder="Ingrese cantidad"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  <input
                    type="checkbox"
                    id="cerrarLote"
                    name="cerrarLote"
                    checked={formData.cerrarLote}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="cerrarLote">Cerrar lote después de cosechar</Label>
                </div>
              </>
            )}

            {cosechaType === "pesada" && (
              <>
                <div className="grid gap-2">
                  <Label>Tipo de Pesada</Label>
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="pesadaTypeTestigo"
                        name="pesadaType"
                        value="testigo"
                        checked={pesadaType === "testigo"}
                        onChange={() => setPesadaType("testigo")}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="pesadaTypeTestigo">Muestra Testigo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="pesadaTypeLote"
                        name="pesadaType"
                        value="lote"
                        checked={pesadaType === "lote"}
                        onChange={() => setPesadaType("lote")}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="pesadaTypeLote">Lote Completo</Label>
                    </div>
                  </div>
                </div>

                {pesadaType === "testigo" ? (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="cantidadTestigo">Cantidad de plantas en muestra</Label>
                      <Input
                        id="cantidadTestigo"
                        name="cantidadTestigo"
                        type="number"
                        placeholder="Ingrese cantidad"
                        value={formData.cantidadTestigo}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="pesoTestigoConRaiz">Peso de muestra con raíz (gramos)</Label>
                      <Input
                        id="pesoTestigoConRaiz"
                        name="pesoTestigoConRaiz"
                        type="number"
                        step="0.1"
                        placeholder="Ingrese peso con raíz"
                        value={formData.pesoTestigoConRaiz}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="pesoTestigoSinRaiz">Peso de muestra sin raíz (gramos)</Label>
                      <Input
                        id="pesoTestigoSinRaiz"
                        name="pesoTestigoSinRaiz"
                        type="number"
                        step="0.1"
                        placeholder="Ingrese peso sin raíz"
                        value={formData.pesoTestigoSinRaiz}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="quantity">Cantidad total del lote</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        placeholder="Ingrese cantidad total del lote"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Peso por planta con raíz (gramos)</Label>
                      <Input value={calcularPesoPlantaConRaiz()} disabled />
                    </div>
                    <div className="grid gap-2">
                      <Label>Peso por planta sin raíz (gramos)</Label>
                      <Input value={calcularPesoPlantaSinRaiz()} disabled />
                    </div>
                    <div className="grid gap-2">
                      <Label>Peso total del lote con raíz (Kg)</Label>
                      <Input value={calcularPesoLoteConRaiz()} disabled />
                    </div>
                    <div className="grid gap-2">
                      <Label>Peso total del lote sin raíz (Kg)</Label>
                      <Input value={calcularPesoLoteSinRaiz()} disabled />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="pesoLoteConRaiz">Peso total del lote con raíz (Kg)</Label>
                      <Input
                        id="pesoLoteConRaiz"
                        name="pesoLoteConRaiz"
                        type="number"
                        step="0.01"
                        placeholder="Ingrese peso total con raíz"
                        value={formData.pesoLoteConRaiz}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="pesoLoteSinRaiz">Peso total del lote sin raíz (Kg)</Label>
                      <Input
                        id="pesoLoteSinRaiz"
                        name="pesoLoteSinRaiz"
                        type="number"
                        step="0.01"
                        placeholder="Ingrese peso total sin raíz"
                        value={formData.pesoLoteSinRaiz}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="quantity">Cantidad total del lote</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        placeholder="Ingrese cantidad total del lote"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Peso por planta con raíz (gramos)</Label>
                      <Input
                        value={(
                          (Number.parseFloat(formData.pesoLoteConRaiz || "0") * 1000) /
                          Number.parseFloat(formData.quantity || "1")
                        ).toFixed(2)}
                        disabled
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Peso por planta sin raíz (gramos)</Label>
                      <Input
                        value={(
                          (Number.parseFloat(formData.pesoLoteSinRaiz || "0") * 1000) /
                          Number.parseFloat(formData.quantity || "1")
                        ).toFixed(2)}
                        disabled
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center space-x-2 mt-4">
                  <input
                    type="checkbox"
                    id="cerrarLote"
                    name="cerrarLote"
                    checked={formData.cerrarLote}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="cerrarLote">Cerrar lote después de registrar peso</Label>
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                name="observations"
                placeholder="Ingrese observaciones"
                value={formData.observations}
                onChange={handleInputChange}
              />
            </div>
            <Button type="submit" className="w-full">
              Guardar
            </Button>
          </form>
        )

      case "mortandad":
        return (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="lot">Lote</Label>
              <select
                id="lot"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.lot}
                onChange={(e) => handleSelectChange("lot", e.target.value)}
                required
              >
                <option value="">Seleccione lote</option>
                {activeLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    Lote {lot.number}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mortality">Cantidad de mortandad</Label>
              <Input
                id="mortality"
                name="mortality"
                type="number"
                placeholder="Ingrese cantidad"
                value={formData.mortality}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                name="observations"
                placeholder="Ingrese observaciones"
                value={formData.observations}
                onChange={handleInputChange}
              />
            </div>
            <Button type="submit" className="w-full">
              Guardar
            </Button>
          </form>
        )

      default:
        return (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                name="observations"
                placeholder="Ingrese observaciones"
                value={formData.observations}
                onChange={handleInputChange}
              />
            </div>
            <Button type="submit" className="w-full">
              Guardar
            </Button>
          </form>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Registro de Actividad</span>
          <Button variant="outline" size="sm" onClick={() => setDebugMode(!debugMode)} className="text-xs">
            {debugMode ? "Ocultar Debug" : "Mostrar Debug"}
          </Button>
        </CardTitle>
        <div className="flex justify-between text-sm text-muted-foreground">
          <div>Fecha: {date}</div>
          <div>Hora: {time}</div>
        </div>

        {debugMode && (
          <div className="mt-2 p-2 bg-muted text-xs rounded overflow-auto max-h-40">
            <p>Próximo número de lote: {nextLotNumber}</p>
            <p>Lotes activos: {activeLots.length}</p>
            <ul className="list-disc pl-5 mt-1">
              {activeLots.map((lot, index) => (
                <li key={index}>
                  ID: {lot.id.substring(0, 8)}... - Número: {lot.number}
                </li>
              ))}
            </ul>
            <p>Lote seleccionado: {formData.lot || "ninguno"}</p>
            <p>Tipo de cosecha: {cosechaType}</p>
            <p>Tipo de pesada: {pesadaType}</p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={activityType === "apertura" ? "default" : "outline"}
            onClick={() => handleActivityTypeChange("apertura")}
            className="flex flex-col h-auto py-4"
          >
            <Sun className="h-5 w-5 mb-1" />
            <span>Apertura</span>
          </Button>
          <Button
            variant={activityType === "cierre" ? "default" : "outline"}
            onClick={() => handleActivityTypeChange("cierre")}
            className="flex flex-col h-auto py-4"
          >
            <Moon className="h-5 w-5 mb-1" />
            <span>Cierre</span>
          </Button>
          <Button
            variant={activityType === "niveles" ? "default" : "outline"}
            onClick={() => handleActivityTypeChange("niveles")}
            className="flex flex-col h-auto py-4"
          >
            <AlertCircle className="h-5 w-5 mb-1" />
            <span>Niveles</span>
          </Button>
          <Button
            variant={activityType === "siembra" ? "default" : "outline"}
            onClick={() => handleActivityTypeChange("siembra")}
            className="flex flex-col h-auto py-4"
          >
            <Leaf className="h-5 w-5 mb-1" />
            <span>Siembra</span>
          </Button>
          <Button
            variant={activityType === "riego" ? "default" : "outline"}
            onClick={() => handleActivityTypeChange("riego")}
            className="flex flex-col h-auto py-4"
          >
            <Droplets className="h-5 w-5 mb-1" />
            <span>Riego</span>
          </Button>
          <Button
            variant={activityType === "trasplante" ? "default" : "outline"}
            onClick={() => handleActivityTypeChange("trasplante")}
            className="flex flex-col h-auto py-4"
          >
            <ArrowRightLeft className="h-5 w-5 mb-1" />
            <span>Trasplante</span>
          </Button>
          <Button
            variant={activityType === "mortandad" ? "default" : "outline"}
            onClick={() => handleActivityTypeChange("mortandad")}
            className="flex flex-col h-auto py-4"
          >
            <Skull className="h-5 w-5 mb-1" />
            <span>Mortandad</span>
          </Button>
          <Button
            variant={activityType === "cosecha" ? "default" : "outline"}
            onClick={() => handleActivityTypeChange("cosecha")}
            className="flex flex-col h-auto py-4"
          >
            <Scissors className="h-5 w-5 mb-1" />
            <span>Cosecha/Cierre</span>
          </Button>
        </div>

        {renderActivityForm()}
      </CardContent>
    </Card>
  )
}

