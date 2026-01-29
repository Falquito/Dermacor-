'use client'

import {useState } from 'react'
import { ProtectedPage } from '@/components/auth/ProtectedPage'
import HeaderCoseguro from '@/components/coseguros/header'
import SearcherCoseguro from '@/components/coseguros/searcherCoseguro'
import SkeletonListCoseguro from '@/components/coseguros/skeletonListCoseguro'
import ListadoCoseguro from '@/components/coseguros/listaCoseguro'
import { useCoseguros } from '@/hooks/useCoseguros'

function CosegurosContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVA' | 'INACTIVA'>('ALL')
  const { coseguros, loading, error, refrescar } = useCoseguros()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <HeaderCoseguro onRefresh={() => {}} loading />
          <div className="space-y-6">
            <SearcherCoseguro
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              setStatusFilter={setStatusFilter}
              disabled
            />
            <SkeletonListCoseguro />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-red-600">Error de carga</h3>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  const filtered = coseguros.filter((c) => {
    const matchesSearch = c.nombreCoseguro.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === 'ALL' ? true : statusFilter === 'ACTIVA' ? c.estadoCoseguro : !c.estadoCoseguro
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <HeaderCoseguro onRefresh={refrescar} />

        <div className="space-y-6">
          <SearcherCoseguro
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            setStatusFilter={setStatusFilter}
          />

          <ListadoCoseguro
            onRefresh={refrescar}
            coseguros={filtered}
            isFiltered={searchTerm !== '' || statusFilter !== 'ALL'}
          />
        </div>
      </div>
    </div>
  )
}

export default function CosegurosPage() {
  return (
    <ProtectedPage>
      <CosegurosContent />
    </ProtectedPage>
  )
}
