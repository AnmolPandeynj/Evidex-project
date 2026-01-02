import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    Fingerprint,
    BrainCircuit,
    FileSearch,
    Activity,
    Network,
    ArrowRight,
    Lock,
    Database,
    CheckCircle2,
    Play,
    FileKey,
    EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    // Handle scroll for navbar styling
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-100 overflow-x-hidden">

            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen opacity-40 animate-pulse-slow"></div>
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px] mix-blend-screen opacity-30"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-slate-900/50 rounded-full blur-[100px] opacity-20"></div>
            </div>

            {/* Navbar */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20">
                            <Fingerprint className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold tracking-tight text-white leading-none font-display">
                                EVIDEX
                            </h1>
                            <span className="text-[10px] font-mono text-cyan-400 tracking-wider">TEMPORAL FORENSICS</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        {currentUser ? (
                            <>
                                <button onClick={handleLogout} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                                    Sign Out
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="bg-white text-slate-950 hover:bg-cyan-50 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center gap-2"
                                >
                                    Dashboard
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => navigate('/login')} className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden md:block">
                                    Sign In
                                </button>
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="bg-white text-slate-950 hover:bg-cyan-50 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center gap-2"
                                >
                                    Get Started
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-32 pb-24 md:pt-48 md:pb-32 px-6">
                <div className="max-w-7xl mx-auto text-center">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-md mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                        <span className="text-xs font-medium text-cyan-400 tracking-wide uppercase">AI-Powered Investigation Platform</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        Reconstruct the <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">Untitled Truth</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        Transform raw mixed-media evidence into coherent timelines using advanced AI.
                        Analyze chain of custody, verify details, and generate forensic-grade reports in minutes.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <button
                            onClick={() => navigate(currentUser ? '/dashboard' : '/signup')}
                            className="group relative px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full text-white font-semibold shadow-[0_0_40px_rgba(8,145,178,0.3)] hover:shadow-[0_0_60px_rgba(8,145,178,0.5)] transition-all overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative flex items-center gap-2">
                                {currentUser ? 'Go to Dashboard' : 'Start Investigation'}
                                <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            </span>
                        </button>
                        <button className="px-8 py-4 rounded-full border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium transition-colors flex items-center gap-2 backdrop-blur-sm bg-slate-900/20">
                            <Play className="w-4 h-4 fill-current" />
                            See How It Works
                        </button>
                    </div>

                    {/* Hero Visual Mockup */}
                    <div className="mt-20 relative px-4 animate-in fade-in zoom-in-95 duration-1000 delay-500">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10"></div>
                        <div className="relative max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl shadow-cyan-900/20">
                            {/* Browser Header */}
                            <div className="h-10 bg-slate-950 border-b border-slate-800 flex items-center px-4 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                </div>
                                <div className="ml-4 flex-1">
                                    <div className="h-6 w-96 bg-slate-900 rounded-md border border-slate-800 flex items-center px-3">
                                        <Lock className="w-3 h-3 text-emerald-500 mr-2" />
                                        <span className="text-[10px] text-slate-500 font-mono">evidex-secure.internal/case/8932-AX</span>
                                    </div>
                                </div>
                            </div>
                            {/* Abstract Interface Preview */}
                            <div className="aspect-[16/9] bg-slate-900 relative p-8 grid grid-cols-12 gap-6">
                                {/* Sidebar */}
                                <div className="col-span-3 space-y-4">
                                    <div className="h-32 bg-slate-800/50 rounded-lg animate-pulse" style={{ animationDelay: '0ms' }}></div>
                                    <div className="h-20 bg-slate-800/50 rounded-lg animate-pulse" style={{ animationDelay: '150ms' }}></div>
                                    <div className="h-40 bg-slate-800/50 rounded-lg animate-pulse" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                {/* Main Content */}
                                <div className="col-span-9 space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1 h-24 bg-indigo-500/10 border border-indigo-500/20 rounded-lg"></div>
                                        <div className="flex-1 h-24 bg-cyan-500/10 border border-cyan-500/20 rounded-lg"></div>
                                        <div className="flex-1 h-24 bg-purple-500/10 border border-purple-500/20 rounded-lg"></div>
                                    </div>
                                    <div className="h-64 bg-slate-800/50 rounded-lg border border-slate-700/50 relative overflow-hidden">
                                        {/* Mock Graph Nodes */}
                                        <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-cyan-500 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.5)]"></div>
                                        <div className="absolute top-1/3 left-1/2 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                                        <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.5)]"></div>
                                        {/* Lines */}
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                            <line x1="25%" y1="50%" x2="50%" y2="33%" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                                            <line x1="50%" y1="33%" x2="66%" y2="66%" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-4">Enterprise Grade Forensics</h2>
                            <p className="text-slate-400 max-w-md">Built for rigorous investigative standards. From evidence ingestion to courtroom-ready reporting.</p>
                        </div>
                        <button
                            onClick={() => navigate('/features')}
                            className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-2 group"
                        >
                            View all capabilities
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Feature 1 */}
                        <div className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1">
                            <div className="w-12 h-12 bg-cyan-900/30 rounded-xl flex items-center justify-center mb-6 border border-cyan-500/20 group-hover:border-cyan-500/50 transition-colors">
                                <Activity className="w-6 h-6 text-cyan-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Timeline Reconstruction</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Automatically extract EXIF data and timestamps to build a linear sequence of events from disparate files.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/30 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1">
                            <div className="w-12 h-12 bg-indigo-900/30 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:border-indigo-500/50 transition-colors">
                                <Network className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Provenance Graph</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Visualize chain of custody and file relationships with interactive node-link diagrams.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1">
                            <div className="w-12 h-12 bg-purple-900/30 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20 group-hover:border-purple-500/50 transition-colors">
                                <BrainCircuit className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">AI Verdicts</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Gemini-powered analysis synthesizes metadata into coherent forensic summaries and investigative leads.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-pink-500/30 hover:bg-slate-800/50 transition-all duration-300 hover:-translate-y-1">
                            <div className="w-12 h-12 bg-pink-900/30 rounded-xl flex items-center justify-center mb-6 border border-pink-500/20 group-hover:border-pink-500/50 transition-colors">
                                <FileSearch className="w-6 h-6 text-pink-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Legal Reporting</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                One-click export of signed, verifiable PDF reports complete with embedded evidence and methodology.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Workflow / How it Works */}
            <section className="py-24 bg-slate-900/30 relative border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-cyan-500 font-semibold tracking-wider uppercase text-sm">Workflow</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">From Chaos to Clarity</h2>
                        <p className="text-slate-400">A streamlined path to truth.</p>
                    </div>

                    <div className="relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {/* Step 1 */}
                            <div className="relative flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center z-10 shadow-xl mb-6 group hover:border-cyan-500/50 transition-colors">
                                    <Database className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">1. Ingest Evidence</h3>
                                <p className="text-sm text-slate-400">Securely upload mixed media. System automatically hashes and indexes files.</p>
                            </div>

                            {/* Step 2 */}
                            <div className="relative flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center z-10 shadow-xl mb-6 group hover:border-purple-500/50 transition-colors">
                                    <BrainCircuit className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">2. Analyze & Connect</h3>
                                <p className="text-sm text-slate-400">AI processes context. Algorithms map temporal relationships and anomalies.</p>
                            </div>

                            {/* Step 3 */}
                            <div className="relative flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center z-10 shadow-xl mb-6 group hover:border-emerald-500/50 transition-colors">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">3. Verify & Export</h3>
                                <p className="text-sm text-slate-400">Review findings, confirm verdict, and generate the final forensic package.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Security Section */}
            <section className="py-24 bg-slate-950 relative border-t border-slate-800">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-emerald-500 font-semibold tracking-wider uppercase text-sm">Security First</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">Fort Knox for your Evidence</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            We employ military-grade encryption and strict Zero-Knowledge protocols. Your data is yours alone.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {/* Card 1 */}
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:border-emerald-500/30 transition-colors group">
                            <div className="w-12 h-12 bg-emerald-900/20 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:bg-emerald-900/30 transition-colors">
                                <FileKey className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">AES-256 Encryption</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                All files are encrypted at rest. We manage keys with strict rotation policies to ensure long-term data integrity.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:border-emerald-500/30 transition-colors group">
                            <div className="w-12 h-12 bg-emerald-900/20 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:bg-emerald-900/30 transition-colors">
                                <EyeOff className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Zero-Knowledge</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Our AI pipeline is stateless. We analyze evidence in volatile memory and discard it immediately after verdict generation.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:border-emerald-500/30 transition-colors group">
                            <div className="w-12 h-12 bg-emerald-900/20 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:bg-emerald-900/30 transition-colors">
                                <Shield className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Compliance Ready</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Built to meet GDPR, CCPA, and SOC 2 Type II standards. Full audit logs available for every action.
                            </p>
                        </div>
                    </div>

                    <div className="text-center">
                        <button
                            onClick={() => navigate('/security')}
                            className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-2 mx-auto group"
                        >
                            Explore Security Architecture
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Trust & CTA */}
            <section className="py-32 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-slate-950 z-0"></div>
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <div className="mb-8 flex justify-center">
                        <Lock className="w-12 h-12 text-slate-500 mb-4" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">Trust is our currency.</h2>
                    <p className="text-xl text-slate-400 mb-12">
                        Evidex ensures complete data isolation. Every case is encrypted, every action logged, and every deletion permanent. Designed for privacy-first investigations.
                    </p>
                    <button
                        onClick={() => navigate(currentUser ? '/dashboard' : '/signup')}
                        className="px-10 py-5 bg-white text-slate-950 rounded-full font-bold text-lg hover:bg-cyan-50 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(34,211,238,0.4)]"
                    >
                        {currentUser ? 'Go to Dashboard' : 'Start Your First Case'}
                    </button>
                    <p className="mt-6 text-sm text-slate-500">
                        Professional credentials required for full access.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-800 bg-slate-950 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <Fingerprint className="w-5 h-5 text-cyan-500" />
                                <span className="font-bold text-white tracking-widest">EVIDEX</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Next-generation temporal forensics platform for digital investigators.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Platform</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li onClick={() => navigate('/features')} className="hover:text-cyan-400 cursor-pointer transition-colors">Features</li>
                                <li onClick={() => navigate('/security')} className="hover:text-cyan-400 cursor-pointer transition-colors">Security</li>
                                <li onClick={() => navigate('/roadmap')} className="hover:text-cyan-400 cursor-pointer transition-colors">Roadmap</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Resources</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li onClick={() => navigate('/resources')} className="hover:text-cyan-400 cursor-pointer transition-colors">Documentation</li>
                                <li onClick={() => navigate('/resources')} className="hover:text-cyan-400 cursor-pointer transition-colors">API Reference</li>
                                <li onClick={() => navigate('/resources')} className="hover:text-cyan-400 cursor-pointer transition-colors">Case Studies</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li onClick={() => navigate('/legal')} className="hover:text-cyan-400 cursor-pointer transition-colors">Privacy Policy</li>
                                <li onClick={() => navigate('/legal')} className="hover:text-cyan-400 cursor-pointer transition-colors">Terms of Service</li>
                                <li onClick={() => navigate('/legal')} className="hover:text-cyan-400 cursor-pointer transition-colors">Compliance</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-600">
                        <p>© 2026 Evidex Forensics. All rights reserved.</p>
                        <div className="flex gap-4 mt-4 md:mt-0">
                            <span>System Status: <span className="text-emerald-500">Operational</span></span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
