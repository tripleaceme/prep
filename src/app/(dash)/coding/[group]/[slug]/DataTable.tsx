/**
 * One table renderer for the three places a result set appears: the fixture
 * preview, the expected output, and what your own query returned.
 *
 * Shared deliberately. When the expected output and your result are drawn by
 * different code, a formatting difference reads as a wrong answer — the
 * numbers look different when only the rendering is.
 */
export function DataTable({
  columns,
  rows,
  types,
  caption,
}: {
  columns: string[];
  rows: (string | number | null)[][];
  /** Column types, shown under the names when the schema is the point. */
  types?: string[];
  caption?: string;
}) {
  return (
    <div>
      {caption ? (
        <p className="mb-2 font-mono text-sm font-semibold">{caption}</p>
      ) : null}

      <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)]">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-[var(--surface-3)]">
            <tr>
              {columns.map((column, i) => (
                <th
                  key={column}
                  className="whitespace-nowrap px-3 py-2 text-left align-bottom"
                >
                  <span className="block font-semibold">{column}</span>
                  {types?.[i] ? (
                    <span className="block text-[11px] font-normal lowercase text-[var(--text-faint)]">
                      {types[i]}
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="px-3 py-6 text-center text-sm text-[var(--text-faint)]"
                >
                  No rows
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-t border-[var(--border)]">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="whitespace-nowrap px-3 py-2 font-mono text-[13px] text-[var(--text-muted)]"
                    >
                      {cell === null || cell === "NULL" ? (
                        <span className="text-[var(--text-faint)]">NULL</span>
                      ) : (
                        String(cell)
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
