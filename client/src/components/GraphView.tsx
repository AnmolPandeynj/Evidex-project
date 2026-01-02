import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import cytoscape from 'cytoscape';

interface GraphViewProps {
    events: any[];
    relations: any[];
}

export interface GraphViewHandle {
    getGraphImage: () => string | null;
}

export const GraphView = forwardRef<GraphViewHandle, GraphViewProps>(({ events, relations }, ref) => {
    // Guard Clause
    if (!events || !Array.isArray(events)) return <div className="text-slate-500 text-center p-10">No graph data.</div>;

    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);

    const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);
    const [selectedEdgeData, setSelectedEdgeData] = useState<any | null>(null); // New state for edge selection
    const [hoveredNodeData, setHoveredNodeData] = useState<any | null>(null);
    const [overlayPosition, setOverlayPosition] = useState<{ top: number, left: number } | null>(null);
    const [isCyReady, setCyReady] = useState(false);

    // Expose export function to parent
    useImperativeHandle(ref, () => ({
        getGraphImage: () => {
            if (!cyRef.current) return null;

            // 1. Save original styles (conceptually, we just know what they are, but let's be robust)
            // Actually, we can just apply a new stylesheet or bypass current style
            // Simplest way: batch update style for export

            const cy = cyRef.current;

            // Switch to Dark Text for White Paper
            cy.batch(() => {
                cy.style()
                    .selector('node')
                    .style({
                        'color': '#1e293b', // Slate 800 (Dark)
                        'border-color': '#0e7490' // Cyan 700 (Darker border)
                    })
                    .selector('edge')
                    .style({
                        'color': '#475569', // Slate 600 (Professional dark grey)
                        'line-color': '#cbd5e1', // Slate 300 (Subtle connection lines)
                        'target-arrow-color': '#cbd5e1',
                        'text-background-color': '#ffffff', // White background for label
                        'text-background-opacity': 1, // Ensure it covers the line
                        'text-background-padding': '2px' // tighter padding
                    })
                    .update();
            });

            // 2. Generate Image
            const png = cy.png({
                full: true,
                scale: 2,
                bg: '#ffffff' // Force white background for PDF
            });

            // 3. Revert Styles (Dark Mode)
            cy.batch(() => {
                cy.style()
                    .selector('node')
                    .style({
                        'color': '#cbd5e1', // Back to Slate 300
                        'border-color': '#0891b2' // Back to Cyan 600
                    })
                    .selector('edge')
                    .style({
                        'color': '#94a3b8', // Back to Slate 400
                        'line-color': '#334155', // Back to Slate 700
                        'target-arrow-color': '#334155',
                        'text-background-color': '#0f172a', // Back to Dark Slate
                        'text-background-opacity': 1,
                        'text-background-padding': '3px'
                    })
                    .update();
            });

            return png;
        }
    }));

    // Calculate position for the floating overlay (Now based on HOVER)
    useEffect(() => {
        const updatePosition = () => {
            if (containerRef.current && hoveredNodeData) {
                const rect = containerRef.current.getBoundingClientRect();
                // Position to the left of the container with a fixed gap and width
                const imageWidth = 320;
                const gap = 24;

                // Calculate position relative to viewport
                const top = rect.top + 20; // Slight offset from top of graph
                const left = rect.left - imageWidth - gap;

                setOverlayPosition({ top, left });
            }
        };

        if (hoveredNodeData) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition);
        }

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, [hoveredNodeData]); // Depend on hoveredNodeData

    // Update position for explanation tooltip on scroll/resize
    useEffect(() => {
        const updateEdgeTooltipPosition = () => {
            if (selectedEdgeData?.anchorElement && containerRef.current) {
                const anchorRect = selectedEdgeData.anchorElement.getBoundingClientRect();
                const containerRect = containerRef.current.getBoundingClientRect();

                const tooltipWidth = 320;
                const gap = 24;

                // Recalculate position
                const baseLeft = containerRect.left;

                // We need to update state, but carefully to avoid infinite loops if we depend on selectedEdgeData
                // Ideally we'd set a separate 'position' state, but let's just update the specific fields
                setSelectedEdgeData((prev: any) => {
                    if (!prev) return null;
                    const newTop = anchorRect.top;
                    const newLeft = baseLeft - tooltipWidth - gap;

                    // Only update if changed significantly to prevent thrashing
                    if (Math.abs(prev.top - newTop) < 1 && Math.abs(prev.left - newLeft) < 1) return prev;

                    return {
                        ...prev,
                        top: newTop,
                        left: newLeft
                    };
                });
            }
        };

        if (selectedEdgeData?.anchorElement) {
            window.addEventListener('resize', updateEdgeTooltipPosition);
            window.addEventListener('scroll', updateEdgeTooltipPosition, { capture: true }); // Capture needed for scrolling divs
            // Also update immediately in case layout shifted
            updateEdgeTooltipPosition();
        }

        return () => {
            window.removeEventListener('resize', updateEdgeTooltipPosition);
            window.removeEventListener('scroll', updateEdgeTooltipPosition, { capture: true });
        };
    }, [selectedEdgeData?.anchorElement]); // Re-bind when anchor changes

    // 1. Initialize Cytoscape Instance (Runs First)
    useEffect(() => {
        if (!containerRef.current) return;

        cyRef.current = cytoscape({
            container: containerRef.current,
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#06b6d4', // Cyan 500
                        'label': 'data(label)',
                        'color': '#cbd5e1', // Slate 300 (Brighter for visibility)
                        'font-size': 11,
                        'text-valign': 'bottom',
                        'text-margin-y': 6,
                        'width': 20,
                        'height': 20,
                        'border-width': 2,
                        'border-color': '#0891b2',
                        'overlay-opacity': 0
                    }
                },
                {
                    selector: ':selected',
                    style: {
                        'background-color': '#a855f7', // Purple 500
                        'border-color': '#ec4899', // Pink 500
                        'color': '#f8fafc',
                        'width': 25,
                        'height': 25,
                        'border-width': 3,
                        // 'shadow-blur': 10,
                        // 'shadow-color': '#a855f7'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#334155', // Slate 700
                        'target-arrow-color': '#334155',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'label': 'data(label)',
                        'font-size': 9,
                        'color': '#94a3b8', // Slightly brighter edge text too
                        'text-background-opacity': 1,
                        'text-background-color': '#0f172a',
                        'text-background-shape': 'roundrectangle',
                        'text-background-padding': '3px',
                        'overlay-padding': '15px',
                        'overlay-opacity': 0 // Keep overlay invisible but clickable
                    }
                },
                {
                    selector: 'edge:active',
                    style: {
                        'overlay-opacity': 0.2, // Show overlay when clicked/active
                        'overlay-color': '#06b6d4',
                    }
                }
            ]
        });

        // Click Handler -> Side Panel Details
        cyRef.current.on('tap', 'node', (evt) => {
            const node = evt.target;
            const connectedEdges = node.connectedEdges();

            const connections = connectedEdges.map((edge: cytoscape.EdgeSingular) => {
                const isSource = edge.source().id() === node.id();
                const otherNode = isSource ? edge.target() : edge.source();
                return {
                    type: edge.data('label'),
                    direction: isSource ? 'Outbound' : 'Inbound',
                    targetLabel: otherNode.data('label'),
                    explanation: edge.data('explanation'), // Pass explanation here
                    targetImage: otherNode.data('imageUrl'), // Pass target image for preview
                    fullData: edge.data() // Store full edge data for click simulation
                };
            });

            setSelectedNodeData({
                ...node.data(),
                connections
            });
        });

        cyRef.current.on('tap', (evt: any) => {
            if (evt.target === cyRef.current) {
                setSelectedNodeData(null);
                setSelectedEdgeData(null);
            }
        });

        // Edge Click Handler -> Connection Explanation
        cyRef.current.on('tap', 'edge', (evt) => {
            const edge = evt.target;
            const data = edge.data();

            // Calculate screen position for the popover
            // We can use the midpoint of the edge or the click event position
            const renderedPosition = evt.renderedPosition;
            const containerRect = containerRef.current?.getBoundingClientRect();

            if (containerRect) {
                setSelectedEdgeData({
                    ...data,
                    top: containerRect.top + renderedPosition.y,
                    left: containerRect.left + renderedPosition.x
                });
            }
        });

        // Hover Handlers -> Floating Image Preview
        cyRef.current.on('mouseover', 'node, edge', (evt) => {
            const element = evt.target;

            if (element.isNode()) {
                setHoveredNodeData(element.data());
            }

            // Optional: visual feedback on hover
            containerRef.current!.style.cursor = 'pointer';
        });

        cyRef.current.on('mouseout', 'node, edge', () => {
            setHoveredNodeData(null);
            containerRef.current!.style.cursor = 'default';
        });

        // Signal that Cytoscape is ready for data
        setCyReady(true);

        return () => {
            if (cyRef.current) {
                cyRef.current.destroy();
                cyRef.current = null;
                setCyReady(false);
            }
        };
    }, []);

    // 2. Update Data (Runs only after isCyReady is true)
    useEffect(() => {
        const cy = cyRef.current;
        if (!cy || cy.destroyed() || !isCyReady) return;

        // Build elements with rich data
        // Build elements with rich data
        const nodes = events.map((e, idx) => {
            // Extract filename from URL/path
            let basename = e.source_file.split(/[\\/]/).pop() || e.source_file;

            // Strip timestamp prefix (13 digits followed by optional - or _)
            const match = basename.match(/^\d{13}[-_]?(.+)$/);
            if (match && match[1]) basename = match[1];

            return {
                data: {
                    id: `e${idx}`,
                    label: basename.length > 25 ? basename.substring(0, 22) + '...' : basename,
                    fullLabel: basename,
                    description: e.description,
                    explanation: e.explanation,
                    timestamp: new Date(e.timestamp).toLocaleString(),
                    confidence: e.confidence,
                    // Ensure we have a valid absolute URL for the image
                    imageUrl: (e.source_file.startsWith('http') || e.source_file.startsWith('blob:'))
                        ? e.source_file
                        : `http://localhost:5000/uploads/${e.source_file}`
                }
            };
        });

        const edges = relations.map((r, idx) => ({
            data: {
                id: `r${idx}`,
                source: `e${r.from_event_index}`,
                target: `e${r.to_event_index}`,
                label: r.type,
                explanation: r.explanation
            }
        }));

        let layout: cytoscape.Layouts | undefined;

        cy.batch(() => {
            cy.elements().remove();
            cy.add([...nodes, ...edges]);

            layout = cy.layout({
                name: 'cose',
                animate: true,
                animationDuration: 500,
                fit: true,
                padding: 30,
                nodeDimensionsIncludeLabels: true
            });
            layout.run();
        });

        return () => {
            if (layout) layout.stop();
        };
    }, [events, relations, isCyReady]);

    return (
        <div className="w-full h-full relative">
            <div ref={containerRef} className="w-full h-full bg-slate-900/50 backdrop-blur-sm" />

            {/* Legend - Bottom Right */}
            <div className="absolute bottom-2 right-2 flex gap-2 pointer-events-none">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/80 rounded border border-slate-700/50">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    <span className="text-[10px] text-slate-400">Event</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/80 rounded border border-slate-700/50">
                    <div className="w-8 h-px bg-slate-600"></div>
                    <span className="text-[10px] text-slate-400">Relation</span>
                </div>
            </div>

            {/* AI Disclaimer Badge */}
            <div className="absolute top-2 left-2 pointer-events-none opacity-60 hover:opacity-100 transition-opacity z-10">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/40 backdrop-blur-md rounded-full border border-slate-700/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                    <span className="text-[10px] text-slate-400 font-mono tracking-wide">
                        AI-GENERATED • VERIFICATION RECOMMENDED
                    </span>
                </div>
            </div>

            {/* Existing Node Details Modal (Inside container) - Driven by SELECTED (Click) */}
            {selectedNodeData && (
                <div className="absolute top-4 left-4 right-4 bottom-14 bg-slate-900/95 border border-cyan-900/50 rounded-xl p-4 shadow-2xl backdrop-blur-md overflow-y-auto z-10 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-start mb-3">
                        <div className="w-full">
                            <h3 className="text-cyan-400 font-bold text-lg leading-tight truncate pr-2">{selectedNodeData.fullLabel}</h3>
                            <span className="text-xs text-slate-500 font-mono">{selectedNodeData.timestamp}</span>
                        </div>
                        <button
                            onClick={() => setSelectedNodeData(null)}
                            className="p-1 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition flex-shrink-0"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Description */}
                        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                            <p className="text-sm text-slate-300 mb-2">{selectedNodeData.description}</p>

                            {/* Confidence Bar */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] uppercase font-bold text-slate-600">Confidence</span>
                                <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                                        style={{ width: `${selectedNodeData.confidence * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-cyan-500 font-mono">{(selectedNodeData.confidence * 100).toFixed(0)}%</span>
                            </div>

                            <p className="text-xs text-slate-500 italic border-t border-slate-800 pt-2">
                                AI: {selectedNodeData.explanation}
                            </p>
                        </div>

                        {/* Connections */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Connections</h4>
                            {selectedNodeData.connections && selectedNodeData.connections.length > 0 ? (
                                <ul className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                    {selectedNodeData.connections.map((conn: any, i: number) => (
                                        <li
                                            key={i}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Calculate position relative to viewport
                                                const rect = (e.currentTarget as HTMLLIElement).getBoundingClientRect();
                                                const containerRect = containerRef.current?.getBoundingClientRect();

                                                const tooltipWidth = 320;
                                                const gap = 24;

                                                // Default to list item position if container is missing (unlikely)
                                                const baseLeft = containerRect ? containerRect.left : rect.left;

                                                setSelectedEdgeData({
                                                    ...conn.fullData,
                                                    label: conn.type,
                                                    explanation: conn.explanation,
                                                    targetImage: conn.targetImage,
                                                    anchorElement: e.currentTarget, // Store reference for scroll updates
                                                    top: rect.top, // Use list item position for VERTICAL alignment
                                                    left: baseLeft - tooltipWidth - gap // Use container position for HORIZONTAL alignment
                                                });
                                            }}
                                            className="text-xs flex items-center justify-between bg-slate-800/30 p-2 rounded border border-slate-800/50 hover:bg-slate-700/50 cursor-pointer transition-colors group/item"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${conn.direction === 'Outbound' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'}`}>
                                                    {conn.direction === 'Outbound' ? '→' : '←'} {conn.type}
                                                </span>
                                                <span className="text-slate-300 truncate max-w-[150px] group-hover/item:text-cyan-300 transition-colors">{conn.targetLabel}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-slate-600 italic">No direct connections.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* FLOATING IMAGE PREVIEW (Portal to Body) - Driven by HOVERED */}
            {hoveredNodeData && hoveredNodeData.imageUrl && overlayPosition && createPortal(
                <div
                    className="fixed z-[9999] pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        top: overlayPosition.top,
                        left: overlayPosition.left,
                        width: '320px',
                    }}
                >
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.25)] p-1.5 transition-all">
                        {/* Image Container with Glow */}
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                            <img
                                src={hoveredNodeData.imageUrl}
                                alt="Evidence Preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                            {/* Inner vignette/shine */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60"></div>

                            {/* Floating Badge */}
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-cyan-300">
                                EVIDENCE
                            </div>
                        </div>

                        {/* Footer info - Concise on hover */}
                        <div className="pt-2 px-1 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                                {hoveredNodeData.fullLabel}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* FLOATING CONNECTION EXPLANATION (Portal to Body) - Driven by EDGE CLICK */}
            {selectedEdgeData && createPortal(
                <div
                    className="fixed z-[9999] animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        top: selectedEdgeData.top,
                        left: selectedEdgeData.left,
                        width: '320px'
                    }}
                >
                    <div className="bg-slate-900/95 backdrop-blur-xl border border-blue-500/50 rounded-xl shadow-2xl p-4 overflow-hidden">
                        <div className="flex justify-between items-start gap-4 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-blue-900/50 text-blue-400 border border-blue-800">
                                {selectedEdgeData.label}
                            </span>
                            <button
                                onClick={() => setSelectedEdgeData(null)}
                                className="text-slate-500 hover:text-white transition"
                            >
                                ✕
                            </button>
                        </div>

                        {selectedEdgeData.targetImage && (
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800 mb-3">
                                <img
                                    src={selectedEdgeData.targetImage}
                                    alt="Target Event"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-[9px] font-mono text-cyan-300">
                                    LINKED EVENT
                                </div>
                            </div>
                        )}

                        <p className="text-sm text-slate-300 leading-relaxed font-light">
                            {selectedEdgeData.explanation || "No explanation provided by AI."}
                        </p>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
});

GraphView.displayName = 'GraphView';
