import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCases } from '../services/api';
import { FolderOpen, Calendar, Shield, Loader2, ArrowRight, FileText, ChevronLeft, ChevronRight, Search, Filter, X, SortAsc } from 'lucide-react';
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

    // Search & Filter State
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'files'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const navigate = useNavigate();
    const { currentUser } = useAuth();

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchCases();
        }, 500); // 500ms debounce for search inputs
        return () => clearTimeout(timeoutId);
    }, [page, currentUser, searchQuery, sortBy, sortOrder]);

    const fetchCases = async () => {
        try {
            setLoading(true);
            const data = await listCases(page, 9, searchQuery, sortBy, sortOrder);
            setCases(data.cases);
            setTotalPages(data.pagination.pages);
        } catch (error) {
            console.error("Failed to fetch cases", error);
        } finally {
            setLoading(false);
        }
    };

    // No client-side filteredCases memo needed now.
    // We use 'cases' directly as it comes filtered from server.

    const handleOpenCase = (id: string) => {
        localStorage.setItem('active_case_id', id);
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 pt-24">
            <div className="max-w-7xl mx-auto">

                {/* Header with Search Toggle */}
                <div className="flex flex-col md:flex-row items-end justify-between mb-8 border-b border-slate-800 pb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-light text-white tracking-tight mb-2">
                            Case <span className="font-bold text-cyan-400">Archives</span>
                        </h1>
                        <p className="text-slate-400">Manage and revisit your forensic timelines.</p>
                    </div>

                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${showSearch
                            ? 'bg-cyan-900/20 border-cyan-500/50 text-cyan-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                    >
                        {showSearch ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                        <span className="text-sm font-medium">{showSearch ? 'Close Filters' : 'Filter & Sort'}</span>
                    </button>
                </div>

                {/* Search & Sort Panel */}
                {showSearch && (
                    <div className="mb-8 p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl animate-in slide-in-from-top-4 fade-in duration-300">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Search Input */}
                            <div className="flex-1 relative group">
                                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by ID, summary, or file count..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                                    autoFocus
                                />
                            </div>

                            {/* Sort Controls */}
                            <div className="flex items-center gap-3 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                                <div className="flex bg-slate-900 rounded-lg p-1">
                                    <button
                                        onClick={() => { setSortBy('date'); setPage(1); }}
                                        className={`p-2 rounded-md transition-all ${sortBy === 'date' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        title="Sort by Date"
                                    >
                                        <Calendar className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => { setSortBy('files'); setPage(1); }}
                                        className={`p-2 rounded-md transition-all ${sortBy === 'files' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        title="Sort by File Count"
                                    >
                                        <FileText className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="w-px h-6 bg-slate-800 mx-1"></div>
                                <button
                                    onClick={() => { setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); setPage(1); }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
                                >
                                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortAsc className="w-4 h-4 transform rotate-180" />}
                                    <span className="text-xs font-mono font-medium">{sortOrder === 'asc' ? 'ASC' : 'DESC'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
                        <span className="text-slate-500 font-mono text-sm">Retrieving Secure Archives...</span>
                    </div>
                ) : cases.length === 0 ? (
                    searchQuery ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                            <div className="bg-slate-900/50 p-4 rounded-full mb-4">
                                <Search className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="text-lg font-medium text-slate-300">No matching cases found</p>
                            <p className="text-sm">Try adjusting your search or filters.</p>
                            <button
                                onClick={() => { setSearchQuery(''); setShowSearch(false); setPage(1); }}
                                className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm font-medium hover:underline"
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
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
                    )
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
