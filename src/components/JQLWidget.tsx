"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Terminal } from "lucide-react";

export default function JQLWidget({ jql }: { jql: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(jql);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden group">
            <CardHeader className="bg-slate-800/20 border-b border-slate-800/50 py-3 px-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                        Jira JQL Query
                    </CardTitle>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 gap-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all border border-slate-700/50"
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] font-bold">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">Copy SQL</span>
                        </>
                    )}
                </Button>
            </CardHeader>
            <CardContent className="p-4 bg-slate-950/50">
                <div className="relative group/code">
                    <pre className="text-xs font-mono text-slate-400 leading-relaxed whitespace-pre-wrap break-all bg-slate-900/50 p-3 rounded-md border border-slate-800 shadow-inner max-h-[150px] overflow-y-auto custom-scrollbar">
                        {jql}
                    </pre>
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/code:opacity-100 pointer-events-none transition-opacity rounded-md" />
                </div>
            </CardContent>
        </Card>
    );
}
