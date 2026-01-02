import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    ArrowLeft,
    Code2,
    FileText,
    Search,
    Download
} from 'lucide-react';

const ResourcesPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const resources = [
        {
            title: "Documentation",
            icon: <BookOpen className="w-6 h-6 text-blue-400" />,
            description: "Comprehensive guides on using Evidex, from ingestion to reporting.",
            color: "blue"
        },
        {
            title: "API Reference",
            icon: <Code2 className="w-6 h-6 text-pink-400" />,
            description: "Endpoints and integration patterns for building on top of the Evidex platform.",
            color: "pink"
        },
        {
            title: "Case Studies",
            icon: <FileText className="w-6 h-6 text-emerald-400" />,
            description: "Real-world examples of how Evidex has accelerated criminal investigations.",
            color: "emerald"
        }
    ];

    const handleDownload = () => {
        // Mock download interaction
        alert("Downloading User Manual v2.4...");
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 selection:text-blue-100">

            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate('/')}
                    >
                        <div className="p-2 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg shadow-lg shadow-blue-500/20">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold tracking-tight text-white leading-none font-display">
                                EVIDEX
                            </h1>
                            <span className="text-[10px] font-mono text-blue-400 tracking-wider">RESOURCES</span>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </button>
                </div>
            </nav>

            <main className="pt-32 pb-24 px-6 relative">
                {/* Search Mockup */}
                <div className="max-w-2xl mx-auto mb-16 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-slate-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search documentation, API, and guides..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-full py-4 pl-12 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg"
                    />
                </div>

                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    {resources.map((item, index) => (
                        <div key={index} className="bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:border-slate-700 transition-colors group cursor-pointer">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border bg-slate-950 border-slate-800`}>
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors">{item.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                {item.description}
                            </p>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                Browse <span className="text-lg leading-none">&rarr;</span>
                            </span>
                        </div>
                    ))}
                </div>

                {/* Latest Manual Download */}
                <div className="max-w-3xl mx-auto bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                            <FileText className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <h4 className="text-white font-medium">User Manual v2.4.pdf</h4>
                            <p className="text-xs text-slate-500">Updated Jan 12, 2026 • 4.2 MB</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="p-3 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>

            </main>
        </div>
    );
};

export default ResourcesPage;
