import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '../components/FileUpload';
import { TimelineView } from '../components/TimelineView';
import { GraphView } from '../components/GraphView';
import { analyzeEvidence, saveCase, getCase, deleteCase, deleteAccount } from '../services/api';
import { AlertTriangle, Fingerprint, Shield, Zap, Search, LogOut, Loader2, Settings, PlusCircle, CheckCircle2, Lightbulb, FolderOpen, Calendar, FileText, Trash2, KeyRound, AlertOctagon } from 'lucide-react'; // Added icons
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext'; // Import useAuth

export default function Dashboard() { // Renamed App to Dashboard
    const [caseData, setCaseData] = useState<any>(null);
    const [error, setError] = useState<string>('');
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const { logout, currentUser, resetPassword } = useAuth(); // Use auth
    const [loadingCase, setLoadingCase] = useState(true);
    const [showSettings, setShowSettings] = useState(false); // State for settings dropdown
    const [stagedFiles, setStagedFiles] = useState<File[]>([]); // New: Hold files for Phase 2 Save
    const [isDraft, setIsDraft] = useState(false); // New: Track if case is unsaved

    const handleDeleteAccount = async () => {
        if (window.confirm("CRITICAL WARNING: Are you sure you want to DELETE YOUR ACCOUNT? This will permanently delete ALL your cases, uploaded evidence, and user data. This action CANNOT be undone.")) {
            try {
                // Second confirmation for safety
                if (window.confirm("Please confirm again: DELETE EVERYTHING?")) {
                    setLoadingCase(true);
                    await deleteAccount();
                    await logout();
                    navigate('/login');
                }
            } catch (error) {
                console.error("Account deletion failed:", error);
                alert("Failed to delete account. Please try again.");
                setLoadingCase(false);
            }
        }
    };

    const handlePasswordReset = async () => {
        if (currentUser?.email) {
            try {
                await resetPassword(currentUser.email);
                alert(`Password reset email sent to ${currentUser.email}`);
            } catch (error) {
                console.error("Password reset failed:", error);
                alert("Failed to send password reset email.");
            }
        }
    };
    const [showPdfSettings, setShowPdfSettings] = useState(false);
    const [includePdfImages, setIncludePdfImages] = useState(true);
    const [pdfImageScale, setPdfImageScale] = useState<number>(1.0); // 1.0 = 100%
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
            setStagedFiles([]);
            setIsDraft(false);

            // Phase 1: Transient Analysis
            const result = await analyzeEvidence(files, metadata);

            if (result.success) {
                // INJECT LOCAL PREVIEWS: Map filenames to local Object URLs
                const localTimeline = result.analysis;

                // Create map of filename -> Blob URL
                const urlMap = new Map();
                const normalize = (name: string) => name.toLowerCase().trim();

                files.forEach(f => {
                    urlMap.set(f.name, URL.createObjectURL(f));
                    urlMap.set(normalize(f.name), URL.createObjectURL(f));
                });

                // Update events with local URLs for preview
                if (localTimeline.events) {
                    localTimeline.events = localTimeline.events.map((evt: any) => {
                        const originalName = evt.source_file;
                        // 1. Exact Match
                        if (urlMap.has(originalName)) return { ...evt, source_file: urlMap.get(originalName) };

                        // 2. Normalized Match
                        if (urlMap.has(normalize(originalName))) return { ...evt, source_file: urlMap.get(normalize(originalName)) };

                        // 3. Fallback: Try to find a file that 'contains' the source_file (if AI shortened it)
                        const partialMatch = files.find(f => f.name.includes(originalName) || originalName.includes(f.name));
                        if (partialMatch) return { ...evt, source_file: URL.createObjectURL(partialMatch) };

                        return evt;
                    });
                }

                setCaseData({ timeline: localTimeline }); // Show preview with local blobs
                setStagedFiles(files); // Keep files ready for saving
                setIsDraft(true); // Mark as draft/unsaved
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Analysis failed. Check your file count or backend connection.");
        }
    };

    const handleSaveCase = async () => {
        if (!caseData || !stagedFiles.length) return;

        try {
            setLoadingCase(true); // Show saving indicator (reuse loading state or new one)
            const result = await saveCase(stagedFiles, caseData.timeline);

            if (result.success) {
                setCaseData(result.case); // Update with full DB object
                localStorage.setItem('active_case_id', result.caseId);
                setStagedFiles([]); // Clear staged files
                setIsDraft(false); // No longer draft
                alert("Case saved securely to the cloud.");
            }
        } catch (err: any) {
            console.error("Save failed:", err);
            alert(`Failed to save case: ${err.response?.data?.error || "Unknown Error"}`);
        } finally {
            setLoadingCase(false);
        }
    };


    const handleNewCase = () => {
        if (caseData && !window.confirm("Start a new analysis? Current progress is saved in your archive.")) {
            return;
        }
        setCaseData(null);
        localStorage.removeItem('active_case_id');
        setError('');
    };

    const handleDeleteCase = async () => {
        if (!caseData || !caseData._id) return;

        if (window.confirm("ARE YOU SURE you want to delete this case? This action is PERMANENT and cannot be undone.")) {
            try {
                setLoadingCase(true);
                await deleteCase(caseData._id);
                setCaseData(null);
                localStorage.removeItem('active_case_id');
                setLoadingCase(false); // Fix: Stop loading indicator
                window.alert("Case deleted successfully.");
            } catch (err) {
                console.error("Delete failed:", err);
                window.alert("Failed to delete case.");
                setLoadingCase(false);
            }
        }
    };

    const graphRef = useRef<any>(null); // Use a ref to access GraphView methods

    const handleExportPdf = async (includeVerdict: boolean = false) => {
        console.log("Exporting PDF (Renderer Level)... Verdict:", includeVerdict);
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
            const renderEventGroup = async (groupEvents: any[], groupTitle: string, groupSummary: string, isIsolated: boolean = false) => {
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
                for (const event of groupEvents) {
                    // Prepare Text
                    const dateStr = new Date(event.timestamp).toLocaleString();
                    const desc = event.description || "Evidence Event";
                    const conf = `Confidence: ${(event.confidence * 100).toFixed(0)}%`;
                    const refFile = `Ref: ${event.source_file}`;

                    // Calculate Heights
                    doc.setFontSize(10);
                    doc.setFont("helvetica", "bold");
                    const splitDesc = doc.splitTextToSize(desc, pageWidth - 50);
                    const descHeight = splitDesc.length * 5;

                    // Base height without image
                    let totalEventHeight = 25 + descHeight + 5;

                    // Check for image to embed
                    let imgData: any = null;
                    let imgHeight = 0;
                    let imgWidth = 0;

                    // Always try to load if enabled (we'll validate MIME type)
                    if (includePdfImages) {
                        try {
                            const imageUrl = (event.source_file.startsWith('http') || event.source_file.startsWith('blob:'))
                                ? event.source_file
                                : `http://localhost:5000/uploads/${event.source_file}`;

                            // Helper to load image as Base64 (Robust for Blobs and URLs)
                            const getImageData = async (url: string): Promise<{ data: string, width: number, height: number, format: string } | null> => {
                                // console.log(`[PDF] Fetching image: ${url}`);
                                const response = await fetch(url, { mode: 'cors' }); // Ensure CORS
                                if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

                                const blob = await response.blob();
                                if (blob.size === 0) throw new Error("Empty blob returned");

                                // VALIDATE MIME TYPE
                                if (!blob.type.startsWith('image/')) {
                                    // Not an image (e.g. PDF, doc), skip silently
                                    return null;
                                }

                                // Detect Format
                                let format = 'JPEG';
                                if (blob.type === 'image/png') format = 'PNG';
                                else if (blob.type === 'image/webp') format = 'JPEG';

                                return new Promise((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        const base64data = reader.result as string;

                                        const img = new Image();
                                        img.onload = () => {
                                            resolve({ data: base64data, width: img.width, height: img.height, format });
                                        };
                                        img.onerror = () => reject(new Error("Failed to load Base64 into Image object"));
                                        img.src = base64data;
                                    };
                                    reader.onerror = reject;
                                    reader.readAsDataURL(blob);
                                });
                            };

                            const imgInfo = await getImageData(imageUrl);

                            if (imgInfo) {
                                // Calc dimensions relative to page width and user preference
                                const maxAvailableWidth = (pageWidth - 50); // full width minus margins
                                const targetWidth = maxAvailableWidth * pdfImageScale;

                                // Calculate aspect ratio
                                const aspectRatio = imgInfo.width / imgInfo.height;

                                imgWidth = targetWidth;
                                imgHeight = imgWidth / aspectRatio;

                                totalEventHeight += imgHeight + 5;

                                // Store for rendering loop
                                imgData = imgInfo;
                            }

                        } catch (err: any) {
                            // Suppress errors for non-images or network issues to ensure PDF still generates
                            console.warn("Skipping PDF image:", event.source_file);
                        }
                    }

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

                    // Reference Filename
                    doc.setTextColor(100, 116, 139); // Slate-500
                    doc.setFont("helvetica", "italic");
                    doc.text(refFile, 60, yOffset + 12 + descHeight + 2);

                    let currentY = yOffset + 12 + descHeight + 8;

                    // Embed Image if available
                    if (imgData && imgHeight > 0) {
                        // Border
                        doc.setDrawColor(226, 232, 240); // Slate-200
                        doc.setFillColor(248, 250, 252); // Slate-50
                        doc.rect(28, currentY, imgWidth + 2, imgHeight + 2, 'FD');

                        // Image (Pass the Base64 data and format)
                        doc.addImage((imgData as any).data, (imgData as any).format, 29, currentY + 1, imgWidth, imgHeight);
                        currentY += imgHeight + 5;
                    }

                    yOffset += totalEventHeight;
                }

                yOffset += 10; // Space after group
            };

            // Render Chains
            for (let idx = 0; idx < chains.length; idx++) {
                const chain = chains[idx];
                const start = new Date(chain[0].timestamp).toLocaleDateString();
                const end = new Date(chain[chain.length - 1].timestamp).toLocaleDateString();
                const summary = `Detected sequence of ${chain.length} linked events spanning from ${start} to ${end}.`;
                await renderEventGroup(chain, `Event Chain ${idx + 1}`, summary);
            }

            // Render Isolated
            if (isolated.length > 0) {
                await renderEventGroup(
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

            // -- 5. FINAL VERDICT (CONDITIONAL) --
            if (includeVerdict && caseData.timeline.verdict) {
                checkPageBreak(100); // Ensure enough space or break
                yOffset += 10;

                // Header Bar
                doc.setFillColor(147, 51, 234); // Purple-600
                doc.rect(14, yOffset, pageWidth - 28, 1, 'F');
                yOffset += 10;

                doc.setFontSize(16);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(147, 51, 234); // Purple-600
                doc.text("5. FINAL VERDICT", 14, yOffset);
                yOffset += 12;

                // Verdict Title
                doc.setFontSize(12);
                doc.setTextColor(15, 23, 42); // Slate-950
                doc.text(caseData.timeline.verdict.title, 14, yOffset);
                yOffset += 8;

                // Verdict Description
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(71, 85, 105); // Slate-600
                const splitDesc = doc.splitTextToSize(caseData.timeline.verdict.description, pageWidth - 28);
                doc.text(splitDesc, 14, yOffset);
                yOffset += (splitDesc.length * 5) + 10;

                // Findings
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.setTextColor(88, 28, 135); // Purple-900
                doc.text("Key Findings:", 14, yOffset);
                yOffset += 6;

                doc.setFont("helvetica", "normal");
                doc.setTextColor(50, 50, 50);
                const findings = caseData.timeline.verdict.findings || [];
                findings.forEach((finding: string) => {
                    checkPageBreak(10);
                    doc.setFillColor(168, 85, 247); // Purple-500
                    doc.circle(18, yOffset - 1, 1.5, 'F');
                    const splitFinding = doc.splitTextToSize(finding, pageWidth - 35);
                    doc.text(splitFinding, 22, yOffset);
                    yOffset += (splitFinding.length * 5) + 4;
                });
                yOffset += 6;

                // Recommendation
                checkPageBreak(40);
                // Box background
                doc.setFillColor(243, 244, 246); // Gray-100 (light background)
                const recText = `RECOMMENDATION: ${caseData.timeline.verdict.recommendation}`;
                const splitRec = doc.splitTextToSize(recText, pageWidth - 38);
                const recHeight = (splitRec.length * 5) + 20;

                doc.setDrawColor(168, 85, 247); // Purple-500 border
                doc.setLineWidth(0.5);
                doc.roundedRect(14, yOffset, pageWidth - 28, recHeight, 3, 3, 'FD');

                yOffset += 10;
                doc.setFont("helvetica", "italic");
                doc.setTextColor(88, 28, 135); // Purple-900
                doc.text(splitRec, 19, yOffset);
                yOffset += (splitRec.length * 5) + 15;
            }

            // Footer / Disclaimer
            checkPageBreak(20);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text("This report was automatically generated by ChainBuilder AI using Google Gemini models.", 14, yOffset + 10);

            doc.save(`evidex_report_${includeVerdict ? 'full' : 'standard'}_${Date.now()}.pdf`);

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
                    <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate('/')}
                    >
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

                    {/* New Analysis Button (Desktop) */}
                    <div className="hidden md:flex ml-6">
                        <button
                            onClick={handleNewCase}
                            className="group relative px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium hover:text-white hover:border-pink-500/70 transition-all duration-300 flex items-center gap-2 overflow-hidden shadow-[0_0_10px_rgba(236,72,153,0)] hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <PlusCircle className="w-3.5 h-3.5 text-pink-500 group-hover:text-pink-400" />
                            <span className="relative z-10">New Analysis</span>
                            <div className="absolute inset-0 ring-1 ring-inset ring-pink-500/50 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>
                    </div>

                    <div className="flex-1" /> {/* Spacer to push right items */}

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/cases')}
                            className="text-sm font-medium text-slate-400 hover:text-white transition-colors mr-2"
                        >
                            My Archive
                        </button>

                        {caseData && (
                            <button
                                onClick={() => handleExportPdf(false)}
                                disabled={generatingPdf}
                                className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-cyan-400 rounded-md text-sm font-medium transition flex items-center gap-2 backdrop-blur-sm"
                            >
                                <Shield className="w-4 h-4" />
                                {generatingPdf ? "Generating..." : "Export Report"}
                            </button>
                        )}


                        <div className="relative mr-2">
                            <button
                                onClick={() => setShowPdfSettings(!showPdfSettings)}
                                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                title="Report Settings"
                            >
                                <Settings className="w-4 h-4" />
                            </button>

                            {/* Dropdown */}
                            {showPdfSettings && (
                                <div className="absolute top-12 right-0 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                                        <Settings className="w-4 h-4 text-cyan-500" />
                                        <h4 className="text-sm font-semibold text-white">Forensic PDF Options</h4>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-slate-300">Include Evidence Images</span>
                                            <span className="text-[10px] text-slate-500">Embed full resolution images in report</span>
                                        </div>
                                        <button
                                            onClick={() => setIncludePdfImages(!includePdfImages)}
                                            className={`w-10 h-5 rounded-full relative transition-colors ${includePdfImages ? 'bg-cyan-600' : 'bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${includePdfImages ? 'left-6' : 'left-1'}`}></div>
                                        </button>
                                    </div>

                                    {/* Image Size Slider */}
                                    {includePdfImages && (
                                        <div className="mt-4 pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-slate-400">Image Size</span>
                                                <span className="text-xs font-mono text-cyan-400">{(pdfImageScale * 100).toFixed(0)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.2"
                                                max="1.0"
                                                step="0.1"
                                                value={pdfImageScale}
                                                onChange={(e) => setPdfImageScale(parseFloat(e.target.value))}
                                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-mono text-slate-400">SYSTEM SECURE</span>
                        </div>

                        {/* User Profile & Settings */}
                        <div className="flex items-center gap-4 pl-6 ml-4 border-l border-slate-800/50 relative group">

                            {/* User Info Block (Hidden on mobile) */}
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                                    {currentUser?.email}
                                </div>
                                <div className="flex justify-end mt-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/30 border border-cyan-900/50 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                                        Investigator
                                    </span>
                                </div>
                            </div>

                            {/* Settings Dropdown Trigger (Avatar) */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className={`relative w-10 h-10 rounded-full transition-all duration-300 ${showSettings
                                        ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-950 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                        : 'hover:ring-2 hover:ring-slate-700 hover:ring-offset-1 hover:ring-offset-slate-950'
                                        }`}
                                >
                                    {/* Gradient Avatar */}
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                        {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                {showSettings && (
                                    <div className="absolute right-0 top-full mt-3 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right ring-1 ring-white/5">

                                        {/* Header */}
                                        <div className="p-4 border-b border-white/5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/50">
                                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                                <div className="p-1 rounded bg-purple-500/10 border border-purple-500/20">
                                                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                                                </div>
                                                Account & Security
                                            </h3>
                                        </div>

                                        {/* Options */}
                                        <div className="p-2 space-y-1">
                                            <button
                                                onClick={handlePasswordReset}
                                                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group border border-transparent hover:border-white/5"
                                            >
                                                <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors shadow-sm">
                                                    <KeyRound className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <div className="font-medium group-hover:text-purple-200 transition-colors">Change Password</div>
                                                    <div className="text-[11px] text-slate-500 group-hover:text-slate-400">Send reset link to email</div>
                                                </div>
                                            </button>

                                            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-1 mx-4"></div>

                                            <button
                                                onClick={handleDeleteAccount}
                                                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all group border border-transparent hover:border-red-500/10"
                                            >
                                                <div className="p-2 rounded-lg bg-red-950/30 text-red-500 group-hover:bg-red-500/20 group-hover:text-red-400 transition-colors shadow-sm">
                                                    <AlertOctagon className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <div className="font-medium">Delete Account</div>
                                                    <div className="text-[11px] text-red-500/60 group-hover:text-red-400/80">Permanently wipe all data</div>
                                                </div>
                                            </button>
                                        </div>

                                        {/* Footer (Sign Out) */}
                                        <div className="p-2 border-t border-white/5 bg-slate-950/50">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await logout();
                                                        navigate('/');
                                                    } catch { /* ignore */ }
                                                }}
                                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                            >
                                                <LogOut className="w-3.5 h-3.5" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Backdrop to close settings when clicking outside */}
                                {showSettings && (
                                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowSettings(false)}></div>
                                )}
                            </div>
                        </div>
                    </div>
                </div >
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

                        {/* Case Metadata Header */}
                        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden shadow-2xl shadow-purple-900/20 group">

                            {/* Dynamic Background Glows */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-1000"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-600/20 rounded-full blur-[80px] -ml-10 -mb-10 pointer-events-none opacity-40"></div>

                            {/* Left Section: Icon & Info */}
                            <div className="flex items-center gap-6 z-10 w-full md:w-auto">
                                {/* Icon Box */}
                                <div className="relative flex-shrink-0">
                                    <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl blur opacity-40 group-hover:opacity-70 transition duration-500"></div>
                                    <div className="relative p-4 bg-slate-950 border border-slate-800 rounded-xl shadow-inner flex items-center justify-center">
                                        <FolderOpen className="w-8 h-8 text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-3xl font-bold text-white tracking-tight leading-none">
                                            CASE <span className="text-cyan-400">#{caseData._id?.slice(-6).toUpperCase() || "UNKNOWN"}</span>
                                        </h2>
                                        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-[10px] font-mono text-cyan-500/80 tracking-wide">
                                            <Shield className="w-3 h-3" />
                                            SHA-256 VERIFIED
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-medium text-slate-400 mt-1">
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/30 border border-slate-800/50">
                                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                            {caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : "Unsaved Draft"}
                                        </div>
                                        {isDraft && (
                                            <button
                                                onClick={handleSaveCase}
                                                className="cursor-pointer px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold transition-all duration-300 shadow-lg shadow-emerald-900/50 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 flex items-center gap-2 animate-pulse hover:animate-none"
                                            >
                                                <Shield className="w-3 h-3" />
                                                SAVE CASE TO CLOUD
                                            </button>
                                        )}

                                        <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/30 border border-slate-800/50">
                                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                                            <span className="text-slate-200">{caseData.files?.length || 0}</span> Evidence Files
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Section: Status Indicator & Actions */}
                            <div className="flex items-center gap-6 z-10 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800/50 pt-4 md:pt-0 pl-0 md:pl-8 md:border-l md:border-slate-800/50">

                                <button
                                    onClick={handleDeleteCase}
                                    className="group/del flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/30 border border-red-900/50 hover:bg-red-900/40 hover:border-red-500/50 transition-all duration-300"
                                    title="Delete Case Permanently"
                                >
                                    <Trash2 className="w-4 h-4 text-red-500 group-hover/del:text-red-400 transition-colors" />
                                    <span className="text-xs font-medium text-red-400 group-hover/del:text-red-300 hidden sm:block">Delete</span>
                                </button>

                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Current Status</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">Analysis Active</span>
                                    </div>
                                </div>
                                <div className="relative flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/40"></span>
                                </div>
                            </div>
                        </div>

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
                                    <TimelineView events={caseData.timeline?.events || []} relations={caseData.timeline?.relations || []} />
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
                                    <GraphView ref={graphRef} events={caseData.timeline?.events || []} relations={caseData.timeline?.relations || []} />
                                </div>

                                <div className="glass-panel p-6 rounded-2xl">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">AI Case Summary</h4>
                                    <p className="text-slate-300 leading-relaxed text-sm">
                                        {caseData.timeline?.summary?.short || "No summary available."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* FINAL VERDICT SECTION */}
                        {caseData.timeline?.verdict && (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-950 border border-purple-500/20 shadow-2xl shadow-purple-900/10">
                                    {/* Ornamental glow & Tech lines */}
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/5 rounded-full blur-[80px]" />
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-50" />
                                    <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-50" />

                                    <div className="p-8 relative z-10 flex flex-col md:flex-row gap-8">

                                        {/* Left: Conclusion */}
                                        <div className="flex-1 space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/30 ring-1 ring-white/10">
                                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-light text-white tracking-tight">Final Verdict</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                                        <p className="text-[10px] font-mono text-purple-300 uppercase tracking-widest">AI FORENSIC ANALYSIS COMPLETED</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pl-4 border-l-2 border-purple-500/30 relative">
                                                {/* Decorative corner */}
                                                <div className="absolute -top-1 -left-[5px] w-2 h-2 rounded-full bg-purple-500" />
                                                <h4 className="text-xl font-medium text-purple-100 mb-3">{caseData.timeline.verdict.title}</h4>
                                                <p className="text-slate-300 leading-relaxed text-sm">
                                                    {caseData.timeline.verdict.description}
                                                </p>
                                            </div>

                                            <div className="space-y-4 pt-2">
                                                <h5 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    <Search className="w-3 h-3" /> Key Findings
                                                </h5>
                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {caseData.timeline.verdict.findings?.map((finding: string, i: number) => (
                                                        <li key={i} className="group flex items-start gap-3 text-sm text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors">
                                                            <div className="min-w-[6px] h-[6px] rounded-full bg-purple-500 mt-1.5 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.6)] transition-shadow" />
                                                            <span className="leading-snug">{finding}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Right: Recommendation/Action */}
                                        <div className="md:w-80 flex-shrink-0">
                                            <div className="h-full bg-gradient-to-b from-slate-900/80 to-slate-900/40 border border-purple-500/20 rounded-2xl p-6 flex flex-col relative overflow-hidden group hover:border-purple-500/40 transition-colors">
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                                <div className="relative z-10 flex items-center gap-3 mb-5">
                                                    <Lightbulb className="w-5 h-5 text-amber-400" />
                                                    <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Recommendation</h4>
                                                </div>

                                                <p className="relative z-10 text-slate-400 text-sm leading-relaxed flex-1 italic">
                                                    "{caseData.timeline.verdict.recommendation}"
                                                </p>

                                                <div className="relative z-10 mt-8 pt-6 border-t border-white/5">
                                                    <button
                                                        onClick={() => handleExportPdf(true)}
                                                        disabled={generatingPdf}
                                                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-900/40 hover:shadow-purple-700/60 uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95 transform"
                                                    >
                                                        {generatingPdf ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                Generating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                Generate Full Report
                                                                <Zap className="w-3 h-3" />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )}


                    </section >
                )}
            </main >
        </div >
    );
}
