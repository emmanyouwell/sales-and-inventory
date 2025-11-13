import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData> {
  columns: Array<{
    header: string;
    accessorKey?: string;
    cell?: ({ row }: { row: { original: TData } }) => React.ReactNode;
  }>;
  data: TData[];
}

export function DataTable<TData extends Record<string, any>>({
  columns,
  data,
}: DataTableProps<TData>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead 
                key={index}
                className={index === columns.length - 1 ? "text-right" : "text-left"}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length ? (
            data.map((row, rowIndex) => (
              <TableRow key={rowIndex} data-testid={`row-product-${row.id || rowIndex}`}>
                {columns.map((column, colIndex) => (
                  <TableCell 
                    key={colIndex}
                    className={colIndex === columns.length - 1 ? "text-right" : "text-left"}
                  >
                    {column.cell 
                      ? column.cell({ row: { original: row } })
                      : column.accessorKey 
                        ? row[column.accessorKey]
                        : ""
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
