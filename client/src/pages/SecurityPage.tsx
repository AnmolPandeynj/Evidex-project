import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    Lock,
    Fingerprint,
    Server,
    FileKey,
    EyeOff,
    ArrowLeft,
    CheckCircle2
} from 'lucide-react';

const SecurityPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-100">

            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate('/')}
                    >
                        <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-lg shadow-lg shadow-emerald-500/20">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold tracking-tight text-white leading-none font-display">
                                EVIDEX
                            </h1>
                            <span className="text-[10px] font-mono text-emerald-400 tracking-wider">SECURITY CENTER</span>
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

            <main className="pt-32 pb-24 px-6 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

                <div className="max-w-4xl mx-auto text-center mb-24">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-6 uppercase tracking-wider">
                        <Lock className="w-3 h-3" />
                        Zero Knowledge Architecture
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Your evidence is <span className="text-emerald-400">yours alone.</span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
                        We employ military-grade encryption and strict data isolation protocols. Evidence data is never used to train our base AI models without explicit consent.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Card 1 */}
                    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-emerald-500/30 transition-colors group">
                        <div className="w-12 h-12 bg-emerald-900/20 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:bg-emerald-900/30 transition-colors">
                            <FileKey className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-3">AES-256 Encryption</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            All files are encrypted at rest using AES-256 and in transit via TLS 1.3. Your case data is cryptographically isolated from other tenants.
                        </p>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-xs text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Encrypted uploads</span>
                            </li>
                            <li className="flex items-center gap-2 text-xs text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Secure key management</span>
                            </li>
                        </ul>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-emerald-500/30 transition-colors group">
                        <div className="w-12 h-12 bg-emerald-900/20 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:bg-emerald-900/30 transition-colors">
                            <EyeOff className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-3">Privacy First AI</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            Our AI processing pipeline is stateless. Evidence sent for analysis is processed in volatile memory and immediately discarded after verdict generation.
                        </p>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-xs text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>No model training on user data</span>
                            </li>
                            <li className="flex items-center gap-2 text-xs text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Ephemeral processing containers</span>
                            </li>
                        </ul>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-emerald-500/30 transition-colors group">
                        <div className="w-12 h-12 bg-emerald-900/20 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:bg-emerald-900/30 transition-colors">
                            <Server className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-3">Data Sovereignty</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            You retain full ownership of your data. Delete a case, and it is cryptographically shredded from our servers instantly and permanently.
                        </p>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-xs text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Instant hard delete</span>
                            </li>
                            <li className="flex items-center gap-2 text-xs text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Exportable audit logs</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto mt-24 bg-slate-900 border border-slate-800 rounded-2xl p-8 flex items-start gap-6">
                    <Fingerprint className="w-10 h-10 text-slate-500 shrink-0" />
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Compliance & Certifications</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-4">
                            Evidex is designed to comply with GDPR, CCPA, and strict chain-of-custody standards required by legal frameworks. We conduct regular penetration testing and security audits.
                        </p>
                        <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">Download Security Whitepaper &rarr;</button>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default SecurityPage;
