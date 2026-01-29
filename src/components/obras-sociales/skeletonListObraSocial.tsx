import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export default function SkeletonListObraSocialComponent() {
  const skeletonRows = Array.from({ length: 6 })

  return (
    <>

      <div className="space-y-3 md:hidden">
        {skeletonRows.map((_, i) => (
          <Card key={i} className="border-slate-200 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <Skeleton className="h-10 w-10 rounded-lg" />

                <div className="min-w-0">
                  {/* Nombre */}
                  <Skeleton className="h-4 w-48 max-w-[70vw]" />
                  {/* Estado */}
                  <Skeleton className="h-6 w-20 rounded-full mt-2" />
                  {/* Fecha */}
                  <Skeleton className="h-3 w-28 mt-2" />
                </div>
              </div>

              <Skeleton className="h-9 w-9 rounded-md shrink-0" />
            </div>
          </Card>
        ))}
      </div>

      <div className="hidden md:block">
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="border-b border-slate-100 bg-white">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[400px] text-xs font-semibold uppercase tracking-wider text-slate-500 pl-6 py-3 h-auto align-middle">
                    Obra Social
                  </TableHead>

                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 py-3 h-auto align-middle">
                    Estado
                  </TableHead>

                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 py-3 h-auto align-middle">
                    Fecha de creación
                  </TableHead>

                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500 pr-6 py-3 h-auto align-middle">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {skeletonRows.map((_, index) => (
                  <TableRow
                    key={index}
                    className="hover:bg-transparent border-slate-100"
                  >
                    {/* Obra Social (icono + nombre) */}
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-56" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    </TableCell>

                    {/* Estado */}
                    <TableCell className="py-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>

                    {/* Fecha */}
                    <TableCell className="py-4">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right pr-6 py-4">
                      <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
 