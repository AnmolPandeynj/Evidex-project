import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Scale,
    ArrowLeft,
    Shield,
    FileText,
    Lock,
    Globe,
    CheckCircle2
} from 'lucide-react';

const LegalPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const documents = [
        {
            title: "Privacy Policy",
            icon: <Lock className="w-5 h-5 text-slate-400" />,
            updated: "Jan 1, 2026",
            description: "How we collect, use, and protect your personal and investigative data."
        },
        {
            title: "Terms of Service",
            icon: <FileText className="w-5 h-5 text-slate-400" />,
            updated: "Dec 15, 2025",
            description: "The rules and agreements governing your use of the Evidex platform."
        },
        {
            title: "Compliance & GDPR",
            icon: <Globe className="w-5 h-5 text-slate-400" />,
            updated: "Jan 1, 2026",
            description: "Our adherence to international data protection standards."
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-slate-700 selection:text-white">

            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate('/')}
                    >
                        <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                            <Scale className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold tracking-tight text-white leading-none font-display">
                                EVIDEX
                            </h1>
                            <span className="text-[10px] font-mono text-slate-400 tracking-wider">LEGAL</span>
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

                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2">Legal Center</h1>
                    <p className="text-slate-400 mb-12">Transparency and trust are the foundation of our platform.</p>

                    <div className="space-y-4">
                        {documents.map((doc, index) => (
                            <div key={index} className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer group flex gap-6 items-start">
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg group-hover:border-slate-700 transition-colors">
                                    {doc.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">{doc.title}</h3>
                                        <span className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">Updated {doc.updated}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        {doc.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 pt-16 border-t border-slate-800">
                        <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-500" />
                            Certifications
                        </h3>
                        <div className="flex gap-4 opacity-70 grayscale hover:grayscale-0 transition-all">
                            <div className="px-4 py-2 border border-slate-700 rounded text-xs font-mono text-slate-400">SOC 2 Type II</div>
                            <div className="px-4 py-2 border border-slate-700 rounded text-xs font-mono text-slate-400">ISO 27001</div>
                            <div className="px-4 py-2 border border-slate-700 rounded text-xs font-mono text-slate-400">HIPAA</div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default LegalPage;
