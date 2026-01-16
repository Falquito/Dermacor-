import { useState, useEffect } from 'react'
import { ObraSocial } from "@/types/obraSocial"
import { fetchObrasApi } from '@/lib/utils'

export function useObraSocial() {
    const [obras, setObras] = useState<ObraSocial[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const refrescar = async () => {
        setLoading(true)
        try {
            const data = await fetchObrasApi()
            setObras(data)
            setError(null)
        } catch {
            setError('Error al cargar las obras sociales')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refrescar()
    }, [])

    return { obras, loading, error, refrescar }
}