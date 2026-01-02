import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Map,
    ArrowLeft,
    Milestone,
    Smartphone,
    Users,
    Database,
    Zap,
    Clock
} from 'lucide-react';

const RoadmapPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const milestones = [
        {
            quarter: "Q1 2026",
            title: "Core Platform Launch",
            status: "completed",
            items: ["Timeline Reconstruction", "Provenance Graph", "Basic PDF Reports", "Gemini AI Integration"]
        },
        {
            quarter: "Q2 2026",
            title: "Advanced Forensics",
            status: "current",
            items: ["Deepfake Detection Module", "Audio Transcript Analysis", "Geospatial Heatmaps", "Batch Processing API"]
        },
        {
            quarter: "Q3 2026",
            title: "Mobile & Field",
            status: "upcoming",
            items: ["iOS & Android Investigator App", "Offline Mode Sync", "Field Evidence Capture", "QR Code Evidence Tagging"]
        },
        {
            quarter: "Q4 2026",
            title: "Enterprise Suite",
            status: "upcoming",
            items: ["Team Collaboration", "Role-Based Access Control (RBAC)", "On-Premise Deployment", "Custom LLM Fine-Tuning"]
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30 selection:text-amber-100">

            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate('/')}
                    >
                        <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-lg shadow-lg shadow-amber-500/20">
                            <Map className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold tracking-tight text-white leading-none font-display">
                                EVIDEX
                            </h1>
                            <span className="text-[10px] font-mono text-amber-400 tracking-wider">PRODUCT ROADMAP</span>
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
                {/* Background Glow */}
                <div className="absolute top-20 right-0 w-[800px] h-[800px] bg-amber-900/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

                <div className="max-w-4xl mx-auto text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/30 border border-amber-500/30 text-amber-400 text-xs font-mono mb-6 uppercase tracking-wider">
                        <Milestone className="w-3 h-3" />
                        Future Vision
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Building the future of <br /> <span className="text-amber-400">digital truth.</span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
                        Evidex is evolving rapidly. Here is our strategic outlook for the next generation of forensic tools and features.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-slate-800 md:left-1/2 md:-ml-[1px]"></div>

                    <div className="space-y-12">
                        {milestones.map((milestone, index) => (
                            <div key={index} className={`relative flex flex-col md:flex-row gap-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''} group`}>

                                {/* Icon Point */}
                                <div className="absolute left-0.5 md:left-1/2 md:-ml-3 mt-1.5 z-10">
                                    <div className={`w-10 h-10 rounded-full border-4 border-slate-950 flex items-center justify-center shadow-lg transition-colors ${milestone.status === 'completed' ? 'bg-emerald-500' :
                                            milestone.status === 'current' ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'
                                        }`}>
                                        {milestone.status === 'completed' && <Clock className="w-4 h-4 text-white" />}
                                        {milestone.status === 'current' && <Zap className="w-4 h-4 text-white" />}
                                        {milestone.status === 'upcoming' && <Milestone className="w-4 h-4 text-slate-400" />}
                                    </div>
                                </div>

                                {/* Spacer for Timeline alignment */}
                                <div className="flex-1 hidden md:block"></div>

                                {/* Content Card */}
                                <div className="flex-1 ml-12 md:ml-0">
                                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl hover:border-slate-700 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${milestone.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    milestone.status === 'current' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'
                                                }`}>
                                                {milestone.quarter}
                                            </span>
                                            {milestone.status === 'current' && (
                                                <span className="text-[10px] text-amber-500 font-mono animate-pulse">IN PROGRESS</span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-4">{milestone.title}</h3>
                                        <ul className="space-y-2">
                                            {milestone.items.map((item, i) => (
                                                <li key={i} className={`text-sm flex items-start gap-2 ${milestone.status === 'upcoming' ? 'text-slate-500' : 'text-slate-300'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${milestone.status === 'completed' ? 'bg-emerald-500' :
                                                            milestone.status === 'current' ? 'bg-amber-500' : 'bg-slate-700'
                                                        }`}></div>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RoadmapPage;
