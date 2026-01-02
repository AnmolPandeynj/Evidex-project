import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    Network,
    BrainCircuit,
    FileSearch,
    Shield,
    Lock,
    ArrowLeft,
    Clock,
    MapPin,
    FileCheck,
    Server,
    Fingerprint
} from 'lucide-react';

const FeaturesPage = () => {
    const navigate = useNavigate();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-100">

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px] mix-blend-screen opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[100px] mix-blend-screen opacity-20"></div>
            </div>

            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate('/')}
                    >
                        <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20">
                            <Fingerprint className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold tracking-tight text-white leading-none font-display">
                                EVIDEX
                            </h1>
                            <span className="text-[10px] font-mono text-cyan-400 tracking-wider">CAPABILITIES</span>
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

            <main className="relative z-10 pt-32 pb-24 px-6">

                {/* Header */}
                <div className="max-w-4xl mx-auto text-center mb-24">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                        Forensic Intelligence <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Deep Dive</span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
                        Evidex combines advanced AI, cryptographic verification, and temporal analysis to provide a complete investigative suite. Explore the core technologies below.
                    </p>
                </div>

                {/* Capability 1: Timeline */}
                <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
                    <div className="order-2 md:order-1">
                        <div className="w-16 h-16 bg-cyan-950/50 rounded-2xl flex items-center justify-center mb-8 border border-cyan-500/20 shadow-[0_0_30px_rgba(8,145,178,0.2)]">
                            <Activity className="w-8 h-8 text-cyan-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-6">Timeline Reconstruction</h2>
                        <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                            Chaos becomes order. Evidex automatically ingests mixed media files—photos, videos, documents—and extracts hidden EXIF timestamps to organize them into a precise linear chronology.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-slate-300">
                                <Clock className="w-5 h-5 text-cyan-500" />
                                <span>Absolute temporal precision up to the millisecond</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <MapPin className="w-5 h-5 text-cyan-500" />
                                <span>Geospatial context integration</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Server className="w-5 h-5 text-cyan-500" />
                                <span>Gap analysis to identify missing evidence periods</span>
                            </li>
                        </ul>
                    </div>
                    <div className="order-1 md:order-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none"></div>
                        {/* Mock Timeline UI */}
                        <div className="flex flex-col gap-6">
                            <div className="flex gap-4 items-center opacity-50">
                                <div className="w-20 text-right text-xs font-mono text-slate-500">09:41:00</div>
                                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                <div className="flex-1 h-12 bg-slate-800 rounded-lg"></div>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="w-20 text-right text-sm font-mono text-cyan-400">09:42:15</div>
                                <div className="w-4 h-4 rounded-full bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
                                <div className="flex-1 h-20 bg-slate-800 border border-cyan-500/30 rounded-lg p-3">
                                    <div className="w-1/2 h-2 bg-slate-700 rounded mb-2"></div>
                                    <div className="w-3/4 h-2 bg-slate-700 rounded"></div>
                                </div>
                            </div>
                            <div className="flex gap-4 items-center opacity-50">
                                <div className="w-20 text-right text-xs font-mono text-slate-500">09:45:00</div>
                                <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                <div className="flex-1 h-12 bg-slate-800 rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Capability 2: Graph */}
                <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                        {/* Mock Graph UI */}
                        <div className="aspect-square relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1),transparent)]"></div>
                            {/* Central Node */}
                            <div className="w-6 h-6 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)] z-10 relative"></div>

                            {/* Satellite Nodes */}
                            <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-slate-600 rounded-full z-10"></div>
                            <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-slate-600 rounded-full z-10"></div>
                            <div className="absolute top-1/2 right-1/4 w-4 h-4 bg-cyan-500 rounded-full z-10 shadow-[0_0_15px_rgba(34,211,238,0.4)]"></div>

                            {/* Connections */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-indigo-500/30" strokeWidth="2">
                                <line x1="50%" y1="50%" x2="25%" y2="25%" />
                                <line x1="50%" y1="50%" x2="75%" y2="66%" />
                                <line x1="50%" y1="50%" x2="75%" y2="50%" stroke="rgba(34,211,238,0.5)" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <div className="w-16 h-16 bg-indigo-950/50 rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                            <Network className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-6">Provenance Graph</h2>
                        <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                            Visualizing connections is key to understanding intent. The Provenance Graph maps relationships between files based on metadata similarity, location proximity, and device fingerprints.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-slate-300">
                                <Shield className="w-5 h-5 text-indigo-500" />
                                <span>Chain of custody verification</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Server className="w-5 h-5 text-indigo-500" />
                                <span>Device clustering analysis</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Activity className="w-5 h-5 text-indigo-500" />
                                <span>Anomaly detection in file sequences</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Capability 3: AI Verdicts */}
                <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
                    <div className="order-2 md:order-1">
                        <div className="w-16 h-16 bg-purple-950/50 rounded-2xl flex items-center justify-center mb-8 border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                            <BrainCircuit className="w-8 h-8 text-purple-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-6">AI Deductive Verdicts</h2>
                        <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                            Powered by Google's Gemini AI, Evidex acts as a co-pilot investigator. It scans visual content and metadata to generate synthesized "Verdicts"—narrative summaries that highlight key findings and potential inconsistencies.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-slate-300">
                                <Server className="w-5 h-5 text-purple-500" />
                                <span>Context-aware analysis of uploaded evidence</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <FileCheck className="w-5 h-5 text-purple-500" />
                                <span>Visual content recognition (OCR, objects, scenes)</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Lock className="w-5 h-5 text-purple-500" />
                                <span>Private & secure processing</span>
                            </li>
                        </ul>
                    </div>
                    <div className="order-1 md:order-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                    <BrainCircuit className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="flex-1 bg-slate-800/50 rounded-r-xl rounded-bl-xl p-4 text-sm text-slate-300 border border-slate-700/50">
                                    <p className="mb-2"><span className="text-purple-400 font-bold">VERDICT:</span> High confidence overlap in timestamps between Device A and Device B.</p>
                                    <p className="text-slate-400">Subject appears to be moving West. Vehicle license plate matches Case File #88.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Capability 4: Reporting */}
                <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex items-center justify-center">
                        <div className="w-56 h-72 bg-slate-950 border border-slate-700 rounded-lg shadow-2xl flex flex-col p-5 relative transform rotate-[-3deg] group-hover:rotate-0 transition-all duration-500 z-10">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-10 h-10 border-2 border-pink-500/50 rounded-full flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-pink-500" />
                                </div>
                                <div className="text-[10px] font-mono text-pink-500 border border-pink-500/30 px-2 py-0.5 rounded uppercase tracking-widest">
                                    Confidential
                                </div>
                            </div>

                            {/* Mock Content */}
                            <div className="space-y-3 mb-6">
                                <div className="w-24 h-1.5 bg-slate-800 rounded"></div>
                                <div className="space-y-1.5">
                                    <div className="w-full h-1 bg-slate-800/50 rounded"></div>
                                    <div className="w-full h-1 bg-slate-800/50 rounded"></div>
                                    <div className="w-3/4 h-1 bg-slate-800/50 rounded"></div>
                                </div>
                            </div>

                            {/* Evidence Block */}
                            <div className="flex gap-2 mb-6">
                                <div className="flex-1 h-12 bg-slate-900 rounded border border-slate-800 flex items-center justify-center">
                                    <div className="w-6 h-6 rounded-full bg-slate-800"></div>
                                </div>
                                <div className="flex-1 h-12 bg-slate-900 rounded border border-slate-800 flex items-center justify-center">
                                    <div className="w-4 h-4 rounded bg-slate-800"></div>
                                </div>
                            </div>

                            {/* Footer/Signature */}
                            <div className="mt-auto flex items-end justify-between">
                                <div className="space-y-1">
                                    <div className="w-16 h-0.5 bg-slate-700"></div>
                                    <div className="text-[8px] text-slate-600 font-mono">AUTHORIZED SIGNATURE</div>
                                </div>
                                <div className="w-12 h-12 bg-pink-500/10 rounded-full border border-pink-500/30 flex items-center justify-center">
                                    <FileCheck className="w-6 h-6 text-pink-500" />
                                </div>
                            </div>
                        </div>

                        {/* Background Stack Effect */}
                        <div className="w-56 h-72 bg-slate-900 border border-slate-800 rounded-lg shadow-xl absolute transform rotate-[4deg] translate-x-4 translate-y-2 scale-95 z-0"></div>
                    </div>
                    <div>
                        <div className="w-16 h-16 bg-pink-950/50 rounded-2xl flex items-center justify-center mb-8 border border-pink-500/20 shadow-[0_0_30px_rgba(236,72,153,0.2)]">
                            <FileSearch className="w-8 h-8 text-pink-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-6">Courtroom-Ready Reporting</h2>
                        <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                            Generate comprehensive PDF reports with a single click. Reports include the reconstructed timeline, graph visualization, full-resolution evidence images, and the AI verdict.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-slate-300">
                                <FileCheck className="w-5 h-5 text-pink-500" />
                                <span>Tamper-proof PDF generation</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Clock className="w-5 h-5 text-pink-500" />
                                <span>Embedded SHA-256 hashes for file integrity</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <MapPin className="w-5 h-5 text-pink-500" />
                                <span>Customizable detail levels (Standard vs. Full)</span>
                            </li>
                        </ul>
                    </div>
                </section>

            </main>

            {/* CTA */}
            <section className="py-24 bg-gradient-to-t from-slate-900 to-slate-950 border-t border-slate-800 text-center">
                <h2 className="text-3xl font-bold text-white mb-8">Ready to start your investigation?</h2>
                <button
                    onClick={() => navigate('/signup')}
                    className="px-10 py-4 bg-white text-slate-950 rounded-full font-bold text-lg hover:bg-cyan-50 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                    Get Started Now
                </button>
            </section>
        </div>
    );
};

export default FeaturesPage;
