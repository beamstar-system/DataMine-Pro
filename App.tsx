import React, { useState, useEffect } from 'react';
import { GeneratorConfig, DatasetRow, DatasetColumn, GenerationStatus } from './types';
import { generateDatasetBatch } from './services/geminiService';
import DatasetTable from './components/DatasetTable';
import { SparklesIcon, PlusIcon, TrashIcon, DownloadIcon, SearchIcon } from './components/Icons';
import { downloadCSV } from './utils/csvHelper';

const INITIAL_COLUMNS: DatasetColumn[] = [
  { name: 'Company' },
  { name: 'Revenue (2023)' },
  { name: 'Industry' },
  { name: 'Headquarters' }
];

const SUGGESTED_TOPICS = [
  "Top 20 Tech Companies by Revenue",
  "Nobel Prize Winners in Physics (2010-2024)",
  "Global Electric Vehicle Sales by Model 2023",
  "Michelin Star Restaurants in Tokyo"
];

export default function App() {
  const [config, setConfig] = useState<GeneratorConfig>({
    topic: 'Top Tech Companies 2024',
    columns: INITIAL_COLUMNS,
    rowCount: 5,
    context: ''
  });

  const [generatedData, setGeneratedData] = useState<DatasetRow[]>([]);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [sources, setSources] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAddColumn = () => {
    setConfig(prev => ({
      ...prev,
      columns: [...prev.columns, { name: `Column ${prev.columns.length + 1}` }]
    }));
  };

  const handleRemoveColumn = (index: number) => {
    if (config.columns.length <= 1) return;
    setConfig(prev => ({
      ...prev,
      columns: prev.columns.filter((_, i) => i !== index)
    }));
  };

  const handleColumnChange = (index: number, value: string) => {
    const newCols = [...config.columns];
    newCols[index].name = value;
    setConfig(prev => ({ ...prev, columns: newCols }));
  };

  const handleGenerate = async () => {
    if (!config.topic) {
      setError("Please specify a topic.");
      return;
    }
    
    setStatus(GenerationStatus.GENERATING);
    setError(null);

    try {
      // If we are "regenerating" from scratch, clear old data. 
      // If we implemented pagination, we would append. 
      // For this UI, let's treat "Generate" as "Start Over/New Batch".
      // To support "Add More", we'd need a separate button or logic.
      
      // Let's implement "Append" logic if the topic hasn't changed, else reset.
      // Simplification: Always append if data exists, add a "Clear" button.
      
      const result = await generateDatasetBatch(config, generatedData);
      
      setGeneratedData(prev => [...prev, ...result.data]);
      setSources(prev => [...new Set([...prev, ...result.sources])]);
      setStatus(GenerationStatus.COMPLETE);
    } catch (err: any) {
      setError(err.message || "Failed to generate dataset. Please try again.");
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleClear = () => {
    setGeneratedData([]);
    setSources([]);
    setStatus(GenerationStatus.IDLE);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 font-sans">
      
      {/* Sidebar / Configuration */}
      <aside className="w-full md:w-[400px] bg-white border-r border-slate-200 flex flex-col h-screen overflow-hidden z-20 shadow-lg md:shadow-none fixed md:relative">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-brand-600 text-white p-1.5 rounded-lg">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">DataMine Pro</h1>
          </div>
          <p className="text-xs text-slate-500">AI-Powered Real-World Dataset Generator</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Topic Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">Dataset Topic</label>
            <div className="relative">
              <input 
                type="text" 
                value={config.topic}
                onChange={(e) => setConfig({...config, topic: e.target.value})}
                placeholder="e.g. Fortune 500 Companies"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              />
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTED_TOPICS.map((t, i) => (
                <button 
                  key={i}
                  onClick={() => setConfig({...config, topic: t})}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md transition-colors text-left"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Context Section */}
          <div className="space-y-3">
             <label className="block text-sm font-semibold text-slate-700">Additional Context (Optional)</label>
             <textarea 
               value={config.context}
               onChange={(e) => setConfig({...config, context: e.target.value})}
               placeholder="e.g. Focus on companies founded after 2000. Values in USD."
               className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm min-h-[80px] focus:ring-2 focus:ring-brand-500 outline-none resize-none"
             />
          </div>

          {/* Schema Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700">Data Schema</label>
              <button 
                onClick={handleAddColumn}
                className="text-xs flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium"
              >
                <PlusIcon className="w-3 h-3" /> Add Column
              </button>
            </div>
            
            <div className="space-y-2">
              {config.columns.map((col, idx) => (
                <div key={idx} className="flex gap-2">
                  <input 
                    type="text" 
                    value={col.name}
                    onChange={(e) => handleColumnChange(idx, e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:border-brand-500 outline-none"
                    placeholder="Column Name"
                  />
                  <button 
                    onClick={() => handleRemoveColumn(idx)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove column"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

           {/* Settings */}
           <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">Batch Size</label>
            <div className="flex items-center gap-4">
               <input 
                 type="range" 
                 min="1" 
                 max="20" 
                 value={config.rowCount}
                 onChange={(e) => setConfig({...config, rowCount: parseInt(e.target.value)})}
                 className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
               />
               <span className="text-sm font-mono text-slate-600 w-8">{config.rowCount}</span>
            </div>
            <p className="text-[10px] text-slate-400">Higher batch sizes may increase generation time.</p>
          </div>

        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button 
            onClick={handleGenerate}
            disabled={status === GenerationStatus.GENERATING}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium text-white shadow-md transition-all
              ${status === GenerationStatus.GENERATING 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-brand-600 hover:bg-brand-700 hover:shadow-lg active:scale-[0.98]'}`}
          >
            {status === GenerationStatus.GENERATING ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching & Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Generate Dataset
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden pt-16 md:pt-0">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <h2 className="text-lg font-semibold text-slate-800 hidden md:block">
               {config.topic || "Untitled Dataset"}
             </h2>
             <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-full border border-slate-200 hidden md:inline-block">
                {generatedData.length} rows
             </span>
          </div>

          <div className="flex items-center gap-3">
             {generatedData.length > 0 && (
               <>
                 <button 
                   onClick={handleClear}
                   className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                 >
                   Clear Data
                 </button>
                 <button 
                   onClick={() => downloadCSV(generatedData, config.columns, config.topic || 'dataset')}
                   className="px-4 py-2 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-800 flex items-center gap-2 transition-colors shadow-sm"
                 >
                   <DownloadIcon className="w-4 h-4" />
                   Export CSV
                 </button>
               </>
             )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8 custom-scrollbar">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold">Generation Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="max-w-6xl mx-auto space-y-6">
            <DatasetTable 
              data={generatedData} 
              columns={config.columns} 
              isLoading={status === GenerationStatus.GENERATING} 
            />
            
            {/* Sources Section */}
            {sources.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-green-500"></span>
                   Verified Data Sources
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sources.map((src, i) => (
                    <a 
                      key={i} 
                      href={src} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-full transition-colors border border-brand-100 truncate max-w-[250px]"
                    >
                      {new URL(src).hostname.replace('www.', '')}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}