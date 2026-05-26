export function Table({ columns = [], rows = [], getRowKey, emptyMessage = "No data available", className = "" }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white/90 dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={`px-5 py-3 font-bold ${column.className || ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            {rows.length ? (
              rows.map((row, rowIndex) => (
                <tr key={getRowKey?.(row, rowIndex) || row.id || rowIndex} className="hover:bg-slate-50/80 dark:hover:bg-white/5">
                  {columns.map((column) => (
                    <td key={column.key} className={`px-5 py-4 text-slate-600 dark:text-slate-300 ${column.cellClassName || ""}`}>
                      {column.render ? column.render(row, rowIndex) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
