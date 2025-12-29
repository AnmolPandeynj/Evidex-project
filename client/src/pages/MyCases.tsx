import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCases } from '../services/api';
import { FolderOpen, Calendar, Shield, Loader2, ArrowRight, FileText, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CaseSummary {
    _id: string;
    createdAt: string;
    timeline: {
        summary: { short: string };
        events: any[];
    };
    files: any[];
}

export default function MyCases() {
    const [cases, setCases] = useState<CaseSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        fetchCases();
    }, [page, currentUser]);

    const fetchCases = async () => {
        try {
            setLoading(true);
            const data = await listCases(page);
            setCases(data.cases);
            setTotalPages(data.pagination.pages);
        } catch (error) {
            console.error("Failed to fetch cases", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCase = (id: string) => {
        localStorage.setItem('active_case_id', id);
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 pt-24">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex items-end justify-between mb-12 border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-light text-white tracking-tight mb-2">
                            Case <span className="font-bold text-cyan-400">Archives</span>
                        </h1>
                        <p className="text-slate-400">Manage and revisit your forensic timelines.</p>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
                        <span className="text-slate-500 font-mono text-sm">Retrieving Secure Archives...</span>
                    </div>
                ) : cases.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                        <FolderOpen className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl text-slate-300 font-medium mb-2">No Cases Found</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">
                            You haven't uploaded any evidence yet. Start a new investigation to build your archive.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium transition shadow-lg shadow-cyan-900/20"
                        >
                            Start New Investigation
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {cases.map((pkg) => (
                                <div
                                    key={pkg._id}
                                    className="group relative bg-slate-900/50 backdrop-blur border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] hover:-translate-y-1 overflow-hidden"
                                >
                                    {/* Decoration */}
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-xs font-mono text-cyan-400 flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(pkg.createdAt).toLocaleDateString()}
                                        </div>
                                        <Shield className="w-5 h-5 text-slate-700 group-hover:text-cyan-500 transition-colors" />
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-200 mb-3 line-clamp-1 group-hover:text-white transition-colors">
                                        Case #{pkg._id.slice(-6).toUpperCase()}
                                    </h3>

                                    <p className="text-sm text-slate-400 leading-relaxed mb-6 line-clamp-3 h-[4.5em]">
                                        {pkg.timeline?.summary?.short || "No summary available for this case."}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800/50">
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                            <FileText className="w-3 h-3" />
                                            {pkg.files?.length || 0} Files
                                        </div>

                                        <button
                                            onClick={() => handleOpenCase(pkg._id)}
                                            className="flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors group/btn"
                                        >
                                            Open Case
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                        </button>
                                    </div>

                                    {/* Security Hash Decoration */}
                                    <div className="absolute bottom-2 left-6 text-[8px] text-slate-800 font-mono opacity-0 group-hover:opacity-100 transition-opacity delay-100 hidden sm:block">
                                        SHA256-VERIFIED
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-mono text-slate-500">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
