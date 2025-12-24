import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Calendar as CalendarIcon, 
  Play, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Terminal, 
  RefreshCw
} from 'lucide-react';
import saveAs from 'file-saver';
import { generateSchedule } from './services/scheduleGenerator';
import { ProcessingStatus } from './types';

const App: React.FC = () => {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [logs, setLogs] = useState<string[]>([]);
  const [resultData, setResultData] = useState<Uint8Array | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus(ProcessingStatus.IDLE);
      setResultData(null);
      setLogs([]);
      setErrorMessage('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx')) {
        setFile(droppedFile);
        setStatus(ProcessingStatus.IDLE);
        setResultData(null);
        setLogs([]);
      } else {
        alert("Vui lòng chỉ upload file Excel (.xlsx)");
      }
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setStatus(ProcessingStatus.PROCESSING);
    setLogs(['🚀 Bắt đầu xử lý...']);
    setErrorMessage('');

    // Small delay to allow UI to update
    setTimeout(async () => {
      const result = await generateSchedule(file, month, year);
      
      setLogs(result.logs);
      
      if (result.success && result.data) {
        setResultData(result.data);
        setStatus(ProcessingStatus.SUCCESS);
      } else {
        setErrorMessage(result.message);
        setStatus(ProcessingStatus.ERROR);
      }
    }, 100);
  };

  const handleDownload = () => {
    if (!resultData) return;
    const blob = new Blob([resultData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `Lich_Hoc_Phi_Thang_${month}_${year}.xlsx`);
  };

  const handleReset = () => {
    setFile(null);
    setStatus(ProcessingStatus.IDLE);
    setLogs([]);
    setResultData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      {/* Header */}
      <div className="max-w-3xl w-full mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-3">
          <FileSpreadsheet className="w-8 h-8 text-green-600" />
          Tool Xếp Lịch Học Tự Động
        </h1>
        <p className="text-slate-600">
          Upload file Excel template, chọn tháng/năm và hệ thống sẽ tự động điền ngày học dựa trên thứ trong tuần.
        </p>
      </div>

      <div className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Controls */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Card 1: Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              1. Cấu hình thời gian
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tháng</label>
                <select 
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Năm</label>
                <input 
                  type="number" 
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Upload */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-500" />
              2. Upload File Excel
            </h2>
            
            {!file ? (
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".xlsx" 
                  className="hidden" 
                />
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-slate-700 font-medium">Click để chọn file hoặc kéo thả vào đây</p>
                <p className="text-slate-500 text-sm mt-1">Chỉ chấp nhận file .xlsx</p>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-slate-800 truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={handleReset}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleProcess}
            disabled={!file || status === ProcessingStatus.PROCESSING}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2
              ${!file 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : status === ProcessingStatus.PROCESSING
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg active:scale-[0.99]'
              }`}
          >
            {status === ProcessingStatus.PROCESSING ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                Bắt đầu xử lý
              </>
            )}
          </button>

        </div>

        {/* Right Column: Output & Logs */}
        <div className="space-y-6">
          
          {/* Result Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-slate-500" />
              Nhật ký xử lý
            </h2>

            {/* Logs Area */}
            <div className="flex-1 bg-slate-900 rounded-lg p-4 mb-4 overflow-y-auto max-h-[300px] min-h-[200px] font-mono text-xs text-green-400 shadow-inner">
              {logs.length === 0 ? (
                <span className="text-slate-500 italic">Chưa có nhật ký...</span>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="mb-1 border-b border-slate-800 pb-1 last:border-0">
                    <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>

            {/* Error Message */}
            {status === ProcessingStatus.ERROR && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm mb-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Success / Download */}
            {status === ProcessingStatus.SUCCESS && (
              <div className="mt-auto">
                <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="font-medium">Xử lý thành công!</p>
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Kết Quả
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;