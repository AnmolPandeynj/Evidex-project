import React, { useMemo } from 'react';
import { Clock, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface Event {
    timestamp: string;
    confidence: number;
    description: string;
    explanation: string;
    source_file: string;
}

interface Relation {
    from_event_index: number;
    to_event_index: number;
    type: string;
    explanation: string;
}

interface TimelineViewProps {
    events: Event[];
    relations: Relation[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ events, relations }) => {

    // Guard against missing data
    if (!events || !Array.isArray(events)) {
        return <div className="text-slate-500 text-center p-8">No timeline data available.</div>;
    }

    // Group events into chains
    const groupedChains = useMemo(() => {
        const n = events.length;
        const adj: number[][] = Array.from({ length: n }, () => []);

        // Build Graph
        if (relations) {
            relations.forEach(r => {
                // Undirected for grouping purposes
                adj[r.from_event_index].push(r.to_event_index);
                adj[r.to_event_index].push(r.from_event_index);
            });
        }

        const visited = new Set<number>();
        const chains: Event[][] = [];
        const isolated: Event[] = [];

        // DFS to find components
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

                // Map indices to events
                const componentEvents = component.map(idx => events[idx]);

                // Sort by time within component
                componentEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                if (componentEvents.length > 1) {
                    chains.push(componentEvents);
                } else {
                    isolated.push(componentEvents[0]);
                }
            }
        }

        // Sort chains by the timestamp of their FIRST event
        chains.sort((a, b) => new Date(a[0].timestamp).getTime() - new Date(b[0].timestamp).getTime());

        // Sort isolated events
        isolated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return { chains, isolated };
    }, [events, relations]);

    const renderTimelineGroup = (groupEvents: Event[], title: string, summary: string, icon: React.ReactNode, isIsolated: boolean = false) => (
        <div className="mb-12 last:mb-0">
            {/* Header */}
            <div className="mb-6 flex items-start gap-4">
                <div className={`p-3 rounded-xl border ${isIsolated ? 'bg-slate-900/50 border-slate-800' : 'bg-cyan-950/30 border-cyan-900/50'} shadow-lg`}>
                    {icon}
                </div>
                <div>
                    <h3 className={`text-xl font-bold ${isIsolated ? 'text-slate-300' : 'text-cyan-400'}`}>{title}</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-2xl">{summary}</p>
                </div>
            </div>

            {/* Timeline Spine Container */}
            <div className="relative pl-4 md:pl-0">
                {/* Spine Line - Only applied mainly to this block */}
                <div className="absolute left-9 md:left-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-slate-800 via-cyan-900/30 to-slate-800 -translate-x-1/2 hidden md:block"></div>
                {/* Mobile Spine */}
                <div className="absolute left-9 top-4 bottom-4 w-0.5 bg-gray-800 -translate-x-1/2 md:hidden"></div>

                <div className="space-y-8">
                    {groupEvents.map((event, idx) => (
                        <div key={idx} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
                            {/* Icon separating line */}
                            <div className="absolute left-9 w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.3)] shrink-0 md:order-1 md:-translate-x-1/2 flex items-center justify-center translate-x-1/2 md:left-1/2 z-10 pb-0.5">
                                <Clock className={`w-5 h-5 ${isIsolated ? 'text-slate-500' : 'text-cyan-400'}`} />
                            </div>

                            {/* Card content */}
                            <div className="w-[calc(100%-4rem)] ml-16 md:ml-0 md:w-[calc(50%-2.5rem)] p-5 glass-card rounded-xl border-slate-700/50 shadow-lg transition duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                                <div className="flex items-center justify-between space-x-2 mb-3 border-b border-slate-800/50 pb-2">
                                    <div className="font-bold text-slate-200 text-sm tracking-wide">{new Date(event.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
                                    <div className={`px-2 py-0.5 rounded-full border text-[10px] font-mono ${isIsolated ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-cyan-950/30 border-cyan-900/50 text-cyan-400'}`}>
                                        {(event.confidence * 100).toFixed(0)}% MATCH
                                    </div>
                                </div>

                                <h4 className={`text-lg font-bold text-transparent bg-clip-text ${isIsolated ? 'bg-gradient-to-r from-slate-400 to-slate-500' : 'bg-gradient-to-r from-cyan-400 to-purple-400'} mb-3 leading-tight`}>{event.description || "Evidence Event detected"}</h4>

                                {/* Image and Source */}
                                <div className="mb-3 rounded-lg overflow-hidden border border-slate-700/50 relative group/img h-40 bg-slate-900/50">
                                    <img
                                        src={(event.source_file.startsWith('http') || event.source_file.startsWith('blob:')) ? event.source_file : `http://localhost:5000/uploads/${event.source_file}`}
                                        alt="Evidence"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://placehold.co/600x400/1e293b/ef4444?text=Image+Not+Found";
                                        }}
                                        className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition duration-500"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 to-transparent p-2">
                                        <p className="text-[10px] text-slate-400 truncate font-mono">
                                            SRC: {(() => {
                                                let name = event.source_file.split(/[\\/]/).pop() || event.source_file;
                                                const match = name.match(/^\d{13}[-_]?(.+)$/);
                                                return match ? match[1] : name;
                                            })()}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-400 leading-relaxed border-l-2 border-slate-700 pl-3 italic whitespace-pre-wrap font-mono">
                                    {event.explanation}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full h-[600px] overflow-y-auto pr-4 custom-scrollbar p-6">
            {groupedChains.chains.map((chain, idx) => {
                const start = new Date(chain[0].timestamp).toLocaleDateString();
                const end = new Date(chain[chain.length - 1].timestamp).toLocaleDateString();
                const summary = `Detected sequence of ${chain.length} linked events spanning from ${start} to ${end}.`;

                return (
                    <div key={`chain-${idx}`}>
                        {renderTimelineGroup(chain, `Event Chain ${idx + 1}`, summary, <LinkIcon className="w-6 h-6 text-cyan-400" />)}
                        {/* Visual Separator between chains */}
                        {idx < groupedChains.chains.length - 1 && (
                            <div className="flex justify-center my-8">
                                <div className="h-2 w-2 rounded-full bg-slate-800"></div>
                                <div className="h-2 w-2 rounded-full bg-slate-800 mx-2"></div>
                                <div className="h-2 w-2 rounded-full bg-slate-800"></div>
                            </div>
                        )}
                    </div>
                );
            })}

            {groupedChains.isolated.length > 0 && (
                <>
                    {groupedChains.chains.length > 0 && <div className="border-t border-slate-800 my-10 relative">
                        <div className="absolute left-1/2 -top-3 -translate-x-1/2 px-4 bg-slate-950 text-slate-500 text-xs uppercase tracking-widest font-bold">Unlinked Findings</div>
                    </div>}
                    {renderTimelineGroup(
                        groupedChains.isolated,
                        "Unconnected Events",
                        "These events appear isolated and do not have strong provenance links to the main event chains.",
                        <AlertCircle className="w-6 h-6 text-slate-400" />,
                        true // isIsolated
                    )}
                </>
            )}
        </div>
    );
};
