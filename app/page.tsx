"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LotGrid from "@/components/lot-grid"
import InputForm from "@/components/input-form"
import LotDetail from "@/components/lot-detail"
import NivelesView from "@/components/niveles-view"

export default function Home() {
  const [activeTab, setActiveTab] = useState("produccion")
  const [selectedLot, setSelectedLot] = useState<string | null>(null)
  const [showClosedLots, setShowClosedLots] = useState(false)

  const handleLotClick = (lotId: string) => {
    setSelectedLot(lotId)
  }

  const handleBackToLots = () => {
    setSelectedLot(null)
  }

  return (
    <main className="container max-w-md mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-center mb-6">Control de Producción</h1>

      {selectedLot ? (
        <LotDetail lotId={selectedLot} onBack={handleBackToLots} />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="produccion">Activos</TabsTrigger>
            <TabsTrigger value="cerrados">Cerrados</TabsTrigger>
            <TabsTrigger value="niveles">Niveles</TabsTrigger>
            <TabsTrigger value="input">Registro</TabsTrigger>
          </TabsList>

          <TabsContent value="produccion" className="mt-4">
            <LotGrid onLotClick={handleLotClick} showClosed={false} />
          </TabsContent>

          <TabsContent value="cerrados" className="mt-4">
            <LotGrid onLotClick={handleLotClick} showClosed={true} />
          </TabsContent>

          <TabsContent value="niveles" className="mt-4">
            <NivelesView />
          </TabsContent>

          <TabsContent value="input" className="mt-4">
            <InputForm />
          </TabsContent>
        </Tabs>
      )}
    </main>
  )
}

