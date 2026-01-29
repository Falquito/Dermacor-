import { useState, useEffect } from 'react'
import { fetchCoseguros } from '@/lib/utils'
import { Coseguro } from '@/types/coseguro'

export function useCoseguros() {
    const [coseguros, setCoseguros] = useState<Coseguro[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const refrescar = async () => {
        setLoading(true)
        try {
            const data = await fetchCoseguros()
            setCoseguros(data)
            setError(null)
        } catch {
            setError('Error al cargar los coseguros.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refrescar()
    }, [])

    return { coseguros, loading, error, refrescar }
}