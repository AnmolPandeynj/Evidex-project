import React, { useCallback, useState } from 'react';
import exifr from 'exifr';
import Tesseract from 'tesseract.js';
import { Upload, CheckCircle, Loader2, Image as ImageIcon, FileType, X } from 'lucide-react';
import clsx from 'clsx';

interface FileUploadProps {
    onUploadComplete: (files: File[], metadata: any) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState<string>('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles(prev => [...prev, ...droppedFiles]);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...selectedFiles]);
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const processFiles = async () => {
        setProcessing(true);
        setStatus('Extracting metadata...');
        const metadataMap: any = {};

        try {
            for (const file of files) {
                setStatus(`Analyzing artifacts: ${file.name}...`);
                const meta: any = { filename: file.name };

                if (file.type.startsWith('image/')) {
                    try {
                        const exifData = await exifr.parse(file);
                        if (exifData) {
                            meta.exif = {
                                DateTimeOriginal: exifData.DateTimeOriginal,
                                Make: exifData.Make,
                                Model: exifData.Model
                            };
                        }
                    } catch (err) { console.warn("EXIF failed", err); }

                    try {
                        const { data: { text } } = await Tesseract.recognize(file, 'eng');
                        meta.ocrText = text;
                    } catch (err) { console.warn("OCR failed", err); }
                }
                metadataMap[file.name] = meta;
            }
            onUploadComplete(files, metadataMap);
        } catch (error) {
            console.error(error);
            setStatus("Process failed");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
            <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,application/pdf"
            />

            <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-b border-slate-800 p-12 text-center transition-all hover:bg-slate-800/30 cursor-pointer"
            >
                <div className="flex flex-col items-center gap-6 relative z-10">
                    <div className="p-5 bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-cyan-900/10">
                        <Upload className="w-10 h-10 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-medium text-slate-200">Drop evidence files or Click to Browse</h3>
                        <p className="text-slate-500 mt-2 text-sm">Supports JPG, PNG, PDF</p>
                    </div>
                </div>
            </div>

            {files.length > 0 && (
                <div className="bg-slate-900/50 backdrop-blur">
                    <div className="max-h-48 overflow-y-auto p-2 scrollbar-thin">
                        {files.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 hover:bg-slate-800/50 rounded-lg group transition-colors">
                                {f.type.startsWith('image') ? (
                                    <ImageIcon className="w-4 h-4 text-purple-400" />
                                ) : (
                                    <FileType className="w-4 h-4 text-blue-400" />
                                )}
                                <span className="text-sm text-slate-300 flex-1 truncate font-mono">{f.name}</span>
                                <span className="text-xs text-slate-600 font-mono mr-2">{(f.size / 1024).toFixed(0)}KB</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFile(i);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 hover:bg-red-500/10 rounded-md text-slate-500 hover:text-red-400"
                                    title="Remove file"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-slate-800">
                        <button
                            onClick={processFiles}
                            disabled={processing}
                            className={clsx(
                                "w-full py-3.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-300",
                                processing
                                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20 hover:shadow-cyan-900/40 transform hover:-translate-y-0.5"
                            )}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="font-mono text-sm uppercase tracking-wider">{status}</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Initiate Forensics Analysis</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
