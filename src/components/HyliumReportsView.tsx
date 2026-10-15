import React from 'react';
import { FileText, Download, CheckCircle2, Clock, Printer } from 'lucide-react';

interface HyliumReportsViewProps {
  isDark: boolean;
}

export const HyliumReportsView: React.FC<HyliumReportsViewProps> = ({ isDark }) => {
  const cardBg = isDark ? '#13212b' : '#ffffff';
  const cardBorder = isDark ? '#1c2d3a' : '#edf2f0';
  const textPrimary = isDark ? '#ffffff' : '#18242a';
  const textMuted = isDark ? '#728997' : '#7f908e';

  const reports = [
    { id: 'REP-1049', title: 'Daily Depot Intake & Interchange Audit (EIR)', date: '14 Oct 2026', items: '128 orders', status: 'Ready to review' },
    { id: 'REP-1048', title: 'Cold Chain Reefer Telemetry & Variance Log', date: '14 Oct 2026', items: '54 units', status: 'Ready to review' },
    { id: 'REP-1047', title: 'Carrier Demurrage Settlement & Dwell Billing', date: '13 Oct 2026', items: '$4,830 settled', status: 'Completed' },
    { id: 'REP-1046', title: 'HazMat IMO Class 3/8 Storage Compliance', date: '13 Oct 2026', items: '24 containers', status: 'Completed' },
    { id: 'REP-1045', title: 'Gate Out Turnaround Time & Dwell Metrics', date: '12 Oct 2026', items: '96 dispatches', status: 'Completed' }
  ];

  return (
    <div className="space-y-5">
      <div 
        className="p-6 rounded-2xl shadow-xs space-y-4"
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: isDark ? '#1c2e3c' : '#edf2f0' }}>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-sans" style={{ color: textPrimary }}>
              Operational Reports & Audit Documentation
            </h3>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: textMuted }}>
              24 certified EIR interchange receipts, customs logs, and cold-chain logs ready for review.
            </p>
          </div>

          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs"
            style={{ 
              backgroundColor: isDark ? '#163b39' : '#e2f6f2',
              color: isDark ? '#23cca8' : '#159880'
            }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All Archive (.ZIP)</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {reports.map((rep) => (
            <div 
              key={rep.id}
              className="p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 transition-colors border"
              style={{
                backgroundColor: isDark ? '#0f1a21' : '#f8faf9',
                borderColor: isDark ? '#1a2b36' : '#e6ebe9'
              }}
            >
              <div className="flex items-center gap-3.5">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isDark ? '#281c3c' : '#f4effc',
                    color: isDark ? '#a878f5' : '#8855db'
                  }}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: textPrimary }}>
                    {rep.title}
                  </div>
                  <div className="text-xs mt-0.5 font-mono" style={{ color: textMuted }}>
                    {rep.id} · Generated {rep.date} · {rep.items}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span 
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{
                    backgroundColor: rep.status.includes('Ready') 
                      ? (isDark ? '#35291b' : '#fef3e7')
                      : (isDark ? '#163836' : '#e4f6f2'),
                    color: rep.status.includes('Ready')
                      ? (isDark ? '#f6a125' : '#e59020')
                      : (isDark ? '#23cba7' : '#149987')
                  }}
                >
                  {rep.status}
                </span>

                <button 
                  onClick={() => window.print()}
                  className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  style={{ color: textMuted }}
                  title="Print Report"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
