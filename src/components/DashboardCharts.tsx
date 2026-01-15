"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Cell, PieChart, Pie, LabelList
} from 'recharts';

export function AuthorChart({ data }: { data: any[] }) {
    const COLORS = ['#60a5fa', '#34d399', '#a78bfa', '#f472b6', '#fbbf24'];

    // 데이터 개수(인원수)에 따라 높이 동적 계산 (이름이 모두 잘 보일 수 있도록 인당 25px로 소폭 확대)
    const dynamicHeight = Math.max(150, data.length * 24);

    return (
        <div style={{ height: `${dynamicHeight}px` }} className="w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} hide />
                    <YAxis
                        dataKey="author_display"
                        type="category"
                        stroke="#94a3b8"
                        fontSize={10}
                        width={140}
                        tick={{ fill: '#94a3b8' }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: any, name: any, props: any) => {
                            const mm = props.payload.mm;
                            return [`${value}h (${mm} MM)`, "투입량"];
                        }}
                    />
                    <Bar dataKey="hours" fill="#60a5fa" radius={[0, 2, 2, 0]} barSize={10}>
                        <LabelList
                            dataKey="mm"
                            position="right"
                            formatter={(v: any) => `${v} mm`}
                            style={{ fill: '#94a3b8', fontSize: '9px', fontWeight: 'bold' }}
                            offset={8}
                        />
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function DailyChart({ data }: { data: any[] }) {
    return (
        <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ left: 0, right: 10, top: 30, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.5} />
                    <XAxis
                        dataKey="month"
                        stroke="#94a3b8"
                        fontSize={11}
                        padding={{ left: 20, right: 20 }}
                        tickFormatter={(value, index) => {
                            if (!value) return "";
                            const [year, month] = value.split('-');
                            // 첫 번째 항목이거나 연도가 바뀐 경우에만 연도 표시
                            if (index === 0) return value;
                            const prevValue = data[index - 1]?.month;
                            if (prevValue && prevValue.split('-')[0] !== year) {
                                return value;
                            }
                            return month; // 동일 연도면 월만 표시
                        }}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} width={40} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: any, name: any, props: any) => {
                            const mm = props.payload.mm;
                            return [`${value}h (${mm} MM)`, "투입량"];
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="hours"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    >
                        <LabelList
                            dataKey="mm"
                            position="top"
                            formatter={(v: any) => `${v} mm`}
                            style={{ fill: '#f1f5f9', fontSize: '11px', fontWeight: 'bold' }}
                            offset={12}
                        />
                    </Line>
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
