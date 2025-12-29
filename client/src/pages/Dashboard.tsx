import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '../components/FileUpload';
import { TimelineView } from '../components/TimelineView';
import { GraphView } from '../components/GraphView';
import { uploadBundle, getCase } from '../services/api';
import { AlertTriangle, Fingerprint, Shield, Zap, Search, LogOut, Loader2 } from 'lucide-react'; // Added LogOut
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext'; // Import useAuth

export default function Dashboard() { // Renamed App to Dashboard
    const [caseData, setCaseData] = useState<any>(null);
    const [error, setError] = useState<string>('');
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const { logout, currentUser } = useAuth(); // Use auth
    const [loadingCase, setLoadingCase] = useState(true);
    const navigate = useNavigate();

    // RESTORE SESSION: Fetch case if ID exists in local storage
    useEffect(() => {
        const restoreSession = async () => {
            const storedCaseId = localStorage.getItem('active_case_id');
            if (storedCaseId && currentUser) {
                try {
                    console.log("Restoring session for case:", storedCaseId);
                    const restoredCase = await getCase(storedCaseId);
                    setCaseData(restoredCase);
                } catch (err) {
                    console.warn("Failed to restore session:", err);
                    localStorage.removeItem('active_case_id'); // Clear invalid ID
                }
            }
            setLoadingCase(false);
        };
        restoreSession();
    }, [currentUser]);

    const handleUpload = async (files: File[], metadata: any) => {
        try {
            setError('');
            setCaseData(null);
            const result = await uploadBundle(files, metadata);
            if (result.success) {
                setCaseData(result.case);
                // PERSIST: Save ID to local storage
                localStorage.setItem('active_case_id', result.caseId);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Upload failed. Check backend connection.");
        }
    };

    const graphRef = useRef<any>(null); // Use a ref to access GraphView methods

    const handleExportPdf = async () => {
        console.log("Exporting PDF (Renderer Level)...");
        if (!caseData) return;
        setGeneratingPdf(true);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let yOffset = 20;

            const checkPageBreak = (heightNeeded: number) => {
                if (yOffset + heightNeeded > pageHeight - 20) {
                    doc.addPage();
                    yOffset = 20;
                    return true;
                }
                return false;
            };

            // -- HEADER --
            doc.setFillColor(15, 23, 42); // slate-950
            doc.rect(0, 0, pageWidth, 20, 'F');
            doc.setTextColor(6, 182, 212); // cyan-500
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("EVIDEX", 14, 13);
            doc.setTextColor(148, 163, 184); // slate-400
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("FORENSIC REPORT", 45, 13);

            doc.setTextColor(0, 0, 0);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
            yOffset = 40;

            // -- 1. CASE SUMMARY --
            if (caseData.timeline?.summary?.short) {
                checkPageBreak(50);
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text("1. Case Summary", 14, yOffset);
                yOffset += 10;

                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                const splitText = doc.splitTextToSize(caseData.timeline.summary.short, pageWidth - 28);
                doc.text(splitText, 14, yOffset);
                yOffset += (splitText.length * 5) + 15;
            }

            // -- 2. PROVENANCE GRAPH (Renderer Export) --
            checkPageBreak(100);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("2. Provenance Graph", 14, yOffset);
            yOffset += 10;

            if (graphRef.current) {
                const graphImage = graphRef.current.getGraphImage();
                if (graphImage) {
                    const imgProps = doc.getImageProperties(graphImage);
                    const pdfWidth = pageWidth - 28;
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                    checkPageBreak(pdfHeight);
                    doc.addImage(graphImage, 'PNG', 14, yOffset, pdfWidth, pdfHeight);
                    yOffset += pdfHeight + 20;
                }
            }

            // -- 3. CHRONOLOGICAL TIMELINE (Grouped by Chains) --
            checkPageBreak(50);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("3. Chronological Timeline", 14, yOffset);
            yOffset += 10;

            // --- Helper: Group Events Logic (Duplicated from TimelineView for PDF) ---
            const n = caseData.timeline.events.length;
            const adj = Array.from({ length: n }, () => [] as number[]);

            if (caseData.timeline.relations) {
                caseData.timeline.relations.forEach((r: any) => {
                    adj[r.from_event_index].push(r.to_event_index);
                    adj[r.to_event_index].push(r.from_event_index);
                });
            }

            const visited = new Set<number>();
            const chains: any[][] = [];
            const isolated: any[] = [];
            const allEvents = caseData.timeline.events;

            for (let i = 0; i < n; i++) {
                if (!visited.has(i)) {
                    const component: number[] = [];
                    const stack = [i];
                    visited.add(i);

                    while (stack.length > 0) {
                        const u = stack.pop()!;
                        component.push(u);
                        for (const v of adj[u]) {
                            if (!visited.has(v)) {
                                visited.add(v);
                                stack.push(v);
                            }
                        }
                    }

                    const componentEvents = component.map(idx => allEvents[idx]);
                    componentEvents.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                    if (componentEvents.length > 1) {
                        chains.push(componentEvents);
                    } else {
                        isolated.push(componentEvents[0]);
                    }
                }
            }

            chains.sort((a, b) => new Date(a[0].timestamp).getTime() - new Date(b[0].timestamp).getTime());
            isolated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());


            // --- Helper: Render a Group ---
            // We'll define a function to render a list of events to the PDF
            const renderEventGroup = (groupEvents: any[], groupTitle: string, groupSummary: string, isIsolated: boolean = false) => {
                // Group Header
                checkPageBreak(30);
                yOffset += 5;

                // Title
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(isIsolated ? 100 : 0, isIsolated ? 100 : 150, isIsolated ? 100 : 200); // Muted for isolated, Cyan-tint for chains
                if (!isIsolated) doc.setTextColor(6, 182, 212); // Cyan-500
                doc.text(groupTitle, 14, yOffset);
                yOffset += 6;

                // Summary
                doc.setFontSize(9);
                doc.setFont("helvetica", "italic");
                doc.setTextColor(100, 116, 139); // Slate-500
                const splitSummary = doc.splitTextToSize(groupSummary, pageWidth - 28);
                doc.text(splitSummary, 14, yOffset);
                yOffset += (splitSummary.length * 4) + 10;

                // Render Events
                groupEvents.forEach((event: any) => {
                    // Prepare Text
                    const dateStr = new Date(event.timestamp).toLocaleString();
                    const desc = event.description || "Evidence Event";
                    const conf = `Confidence: ${(event.confidence * 100).toFixed(0)}%`;

                    // Calculate Heights
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "bold");
                    const splitDesc = doc.splitTextToSize(desc, pageWidth - 50);
                    const descHeight = splitDesc.length * 5;
                    const totalEventHeight = 15 + descHeight + 10;

                    checkPageBreak(totalEventHeight);

                    // Draw Spine (only slightly different visual for isolated vs chains)
                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.5);
                    doc.line(20, yOffset, 20, yOffset + totalEventHeight - 5);

                    // Dot
                    if (isIsolated) {
                        doc.setFillColor(148, 163, 184); // Slate dot
                    } else {
                        doc.setFillColor(6, 182, 212); // Cyan dot
                    }
                    doc.circle(20, yOffset + 5, 2, 'F');

                    // Content
                    // Date
                    doc.setFontSize(10);
                    doc.setTextColor(100, 100, 100);
                    doc.setFont("helvetica", "normal");
                    doc.text(dateStr, 28, yOffset + 5);

                    // Description (Wrapped)
                    doc.setFontSize(11);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont("helvetica", "bold");
                    doc.text(splitDesc, 28, yOffset + 12);

                    // Confidence
                    doc.setFontSize(9);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(isIsolated ? 100 : 6, isIsolated ? 100 : 182, isIsolated ? 100 : 212);
                    doc.text(conf, 28, yOffset + 12 + descHeight + 2);

                    yOffset += totalEventHeight;
                });

                yOffset += 10; // Space after group
            };

            // Render Chains
            chains.forEach((chain, idx) => {
                const start = new Date(chain[0].timestamp).toLocaleDateString();
                const end = new Date(chain[chain.length - 1].timestamp).toLocaleDateString();
                const summary = `Detected sequence of ${chain.length} linked events spanning from ${start} to ${end}.`;
                renderEventGroup(chain, `Event Chain ${idx + 1}`, summary);
            });

            // Render Isolated
            if (isolated.length > 0) {
                renderEventGroup(
                    isolated,
                    "Unconnected Events",
                    "These events appear isolated and do not have strong provenance links to the main event chains.",
                    true
                );
            }

            // -- 4. CONCLUSION & FINDINGS (New Section) --
            checkPageBreak(60);
            yOffset += 10; // Extra Gap
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text("4. Conclusion and AI Findings", 14, yOffset);
            yOffset += 10;

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(50, 50, 50);

            // Use detailed summary if available, otherwise fallback to short
            const detailedText = caseData.timeline.summary.detailed || caseData.timeline.summary.short || "No conclusion available.";
            const splitConclusion = doc.splitTextToSize(detailedText, pageWidth - 28);

            doc.text(splitConclusion, 14, yOffset);
            yOffset += (splitConclusion.length * 5) + 10;

            // Footer / Disclaimer
            checkPageBreak(20);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text("This report was automatically generated by ChainBuilder AI using Google Gemini models.", 14, yOffset + 10);

            doc.save(`evidex_report_${Date.now()}.pdf`);

        } catch (e) {
            console.error("PDF Export Error:", e);
            alert("Failed to generate PDF. See console for details.");
        } finally {
            setGeneratingPdf(false);
        }
    };

    return (
        <div className="min-h-screen text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-100 bg-slate-950">

            {/* Navbar */}
            <nav className="fixed w-full z-50 transition-all duration-300 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20">
                            <Fingerprint className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold tracking-tight text-white leading-none">
                                EVIDEX
                            </h1>
                            <span className="text-[10px] font-mono text-cyan-400 tracking-wider">TEMPORAL FORENSICS</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/cases')}
                            className="text-sm font-medium text-slate-400 hover:text-white transition-colors mr-2"
                        >
                            My Archive
                        </button>

                        {/* User Info & Logout */}
                        <div className="flex items-center gap-4 border-r border-slate-800 pr-4 mr-1">
                            <span className="text-sm text-slate-400 hidden sm:block">
                                {currentUser?.email}
                            </span>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('active_case_id');
                                    logout();
                                }}
                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>

                        {caseData && (
                            <button
                                onClick={handleExportPdf}
                                disabled={generatingPdf}
                                className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-cyan-400 rounded-md text-sm font-medium transition flex items-center gap-2 backdrop-blur-sm"
                            >
                                <Shield className="w-4 h-4" />
                                {generatingPdf ? "Generating..." : "Export Report"}
                            </button>
                        )}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-mono text-slate-400">SYSTEM SECURE</span>
                        </div>
                    </div>
                </div>
            </nav >

            <main className="pt-24 pb-12 max-w-7xl mx-auto px-6 space-y-16">

                {/* Hero / Upload Section */}
                <section className={`transition-all duration-700 ${caseData ? '' : 'min-h-[70vh] flex flex-col justify-center'}`}>
                    {loadingCase ? (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                            <p className="text-slate-400 font-mono text-sm">Restoring Session...</p>
                        </div>
                    ) : (
                        <>
                            <div className="text-center space-y-6 mb-12">
                                <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight">
                                    Reconstruct the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-normal">Truth</span>
                                </h2>
                                <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                                    Upload mixed media evidence. Our AI extracts metadata, OCR text, and reconstructs the chain of custody with verified provenance.
                                </p>
                            </div>

                            <div className="max-w-2xl mx-auto w-full relative group">
                                {/* Glow effect */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
                                <div className="relative">
                                    <FileUpload onUploadComplete={handleUpload} />
                                </div>

                                {error && (
                                    <div className="mt-6 p-4 bg-red-950/30 border border-red-900/50 rounded-xl flex items-center gap-4 text-red-300 animate-in fade-in slide-in-from-top-2">
                                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </section>

                {/* Results Section */}
                {caseData && (
                    <section className="animate-in fade-in slide-in-from-bottom-12 duration-1000 space-y-8">

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Timeline Column */}
                            <div className="lg:col-span-2 flex flex-col gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                        <Search className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white">Chronological Timeline</h3>
                                </div>

                                <div id="timeline-export-container" className="glass-card rounded-2xl p-2 overflow-hidden min-h-[500px]">
                                    <TimelineView events={caseData.timeline.events} relations={caseData.timeline.relations} />
                                </div>
                            </div>

                            {/* Graph Column */}
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                        <Zap className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white">Provenance Graph</h3>
                                </div>

                                <div id="graph-export-container" className="glass-card rounded-2xl p-1 h-[400px]">
                                    <GraphView ref={graphRef} events={caseData.timeline.events} relations={caseData.timeline.relations} />
                                </div>

                                <div className="glass-panel p-6 rounded-2xl">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">AI Case Summary</h4>
                                    <p className="text-slate-300 leading-relaxed text-sm">
                                        {caseData.timeline.summary.short}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </section>
                )}
            </main>
        </div >
    );
}
