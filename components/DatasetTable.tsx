import React from 'react';
import { DatasetRow, DatasetColumn } from '../types';

interface DatasetTableProps {
  data: DatasetRow[];
  columns: DatasetColumn[];
  isLoading?: boolean;
}

const DatasetTable: React.FC<DatasetTableProps> = ({ data, columns, isLoading }) => {
  if (data.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-lg border border-slate-200">
        <p className="text-lg">No data generated yet.</p>
        <p className="text-sm">Configure your dataset on the left to begin.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
            <tr>
              <th scope="col" className="px-6 py-4 border-b border-slate-100 w-16 text-center">
                #
              </th>
              {columns.map((col, idx) => (
                <th key={idx} scope="col" className="px-6 py-4 border-b border-slate-100 whitespace-nowrap min-w-[150px]">
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-slate-400 text-center">
                  {rowIdx + 1}
                </td>
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-6 py-4">
                    {row[col.name] !== undefined && row[col.name] !== null ? (
                      <span className="line-clamp-2" title={String(row[col.name])}>
                        {String(row[col.name])}
                      </span>
                    ) : (
                      <span className="text-slate-300 italic">--</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {isLoading && (
               <tr className="animate-pulse bg-slate-50/50">
                 <td className="px-6 py-4 text-center">...</td>
                 {columns.map((_, idx) => (
                   <td key={idx} className="px-6 py-4">
                     <div className="h-4 w-24 bg-slate-200 rounded"></div>
                   </td>
                 ))}
               </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
        <span>Total Rows: {data.length}</span>
        <span>Previewing all data</span>
      </div>
    </div>
  );
};

export default DatasetTable;