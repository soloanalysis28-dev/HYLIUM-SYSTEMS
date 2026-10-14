import React, { useState } from 'react';
import { LogisticsApiProvider, OutboundWebhook } from '../types/depot';
import { 
  Globe, 
  Send, 
  CheckCircle2, 
  RefreshCw, 
  Code2, 
  Key, 
  ShieldCheck, 
  Radio, 
  Layers, 
  FileCode,
  Zap
} from 'lucide-react';

interface LogisticsApiGatewayProps {
  providers: LogisticsApiProvider[];
  webhooks: OutboundWebhook[];
  onTriggerWebhook: (webhook: OutboundWebhook) => void;
}

export const LogisticsApiGateway: React.FC<LogisticsApiGatewayProps> = ({
  providers,
  webhooks,
  onTriggerWebhook
}) => {
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providers[0]?.id || 'maersk-rest');
  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState<number>(0);
  const [apiBearerToken, setApiBearerToken] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXBvdG1hc3Rlci1tYXJpdGltZSIsInNjb3BlcyI6WyJldmVudHMucmVhZCIsImV2ZW50cy53cml0ZSJdfQ');
  const [customContainerId, setCustomContainerId] = useState('MSKU7192844');
  
  // Execution Output State
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    status: number;
    statusText: string;
    durationMs: number;
    headers: Record<string, string>;
    body: any;
    isEdi?: boolean;
  } | null>(null);

  // Webhook Test State
  const [webhookUrl, setWebhookUrl] = useState('https://logistics.enterprise-client.com/api/v1/container-feed');
  const [webhookEvent, setWebhookEvent] = useState<'container.gate_in' | 'customs.status_change' | 'reefer.temp_alarm'>('container.gate_in');

  const currentProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];
  const currentEndpoint = currentProvider.sampleEndpoints[selectedEndpointIndex] || currentProvider.sampleEndpoints[0];

  const handleExecuteApiCall = () => {
    setIsExecuting(true);
    setExecutionResult(null);

    setTimeout(() => {
      const isEdi = currentProvider.id === 'edifact-port';
      const timestamp = new Date().toISOString();
      const duration = Math.floor(65 + Math.random() * 95);

      if (isEdi) {
        setExecutionResult({
          status: 200,
          statusText: 'OK (AS2 MDN Verified)',
          durationMs: duration,
          headers: {
            'content-type': 'application/edifact; charset=ISO-8859-1',
            'as2-version': '1.2',
            'as2-mdn-status': 'processed/error:none',
            'x-transaction-id': `EDI-${Math.floor(10000000 + Math.random() * 90000000)}`
          },
          body: `UNB+UNOA:2+DEPOTMASTER+PORTAUTH+${new Date().toISOString().slice(2, 10).replace(/-/g, '')}:1430++CODECO'\nUNH+1+CODECO:D:95B:UN:SMDG20'\nBGM+34+EIR-USNWK-8819+9'\nEQD+CN+${customContainerId}+40HC:::+2+2+5'\nMEA+AAE+G+KGM:28450'\nSEL+SL-884920+CA'\nDTM+7:${timestamp}:203'\nCNT+16:1'\nUNT+8+1'\nUNZ+1+CODECO'`,
          isEdi: true
        });
      } else {
        setExecutionResult({
          status: 200,
          statusText: 'OK',
          durationMs: duration,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'x-dcsa-api-version': '2.2.0',
            'x-request-id': `req_${Math.floor(10000000 + Math.random() * 90000000)}`,
            'ratelimit-remaining': '4982'
          },
          body: {
            apiVersion: '2.2.0',
            carrierBookingReference: 'BK-MAE-88491',
            equipmentReference: customContainerId,
            eventType: 'TRANSPORT_CALL',
            eventClassifierCode: 'ACT',
            eventDateTime: timestamp,
            facilityTypeCode: 'DEPO',
            facilityCode: 'USNWK-DP01',
            transportCall: {
              modeOfTransport: 'ROAD',
              carrierServiceCode: 'FEEDER-NORTH',
              unLocationCode: 'USNWK',
              facilityName: 'DepotMaster Newark Maritime Stacks'
            },
            equipmentEvent: {
              equipmentEventTypeCode: 'LOAD',
              emptyIndicatorCode: 'LADEN',
              sealNumber: 'SL-884920',
              grossWeightKg: 28450
            }
          },
          isEdi: false
        });
      }
      setIsExecuting(false);
    }, 400);
  };

  const handleSendTestWebhook = () => {
    const newWhk: OutboundWebhook = {
      id: `WHK-${Math.floor(1000 + Math.random() * 9000)}`,
      event: webhookEvent,
      targetUrl: webhookUrl,
      status: 'Delivered (200)',
      timestamp: new Date().toISOString(),
      responseMs: Math.floor(45 + Math.random() * 60),
      payloadSummary: `Dispatched event ${webhookEvent} for ${customContainerId} with valid HMAC-SHA256 signature.`
    };
    onTriggerWebhook(newWhk);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400" />
            <span>Logistics APIs & UN/EDIFACT Interchange Gateway</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            DCSA v2.2 standard REST endpoints & EDIFACT COARRI/CODECO pipelines for Maersk, MSC, CMA CGM, and Port Authorities.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <Zap className="w-3.5 h-3.5" />
          <span>Active Connections: 4/4 Carrier Nodes</span>
        </div>
      </div>

      {/* Provider Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {providers.map((p) => {
          const isSelected = selectedProviderId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                setSelectedProviderId(p.id);
                setSelectedEndpointIndex(0);
                setExecutionResult(null);
              }}
              className={`p-3 rounded-lg border text-left transition-colors ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/10 text-white'
                  : 'border-slate-800 bg-slate-900 hover:bg-slate-800/80 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-white truncate">{p.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-[11px] font-mono text-slate-400 truncate">{p.standard}</div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Latency: {p.latencyMs}ms</span>
                <span className="text-amber-400 font-medium">{p.authMethod}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive API Request & Response Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: API Request Builder */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              API Request Console: {currentProvider.name}
            </span>
            <span className="text-xs font-mono text-slate-400">{currentProvider.baseUrl}</span>
          </div>

          {/* Endpoint Selector */}
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Select Endpoint</label>
            <div className="space-y-1.5">
              {currentProvider.sampleEndpoints.map((ep, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedEndpointIndex(idx)}
                  className={`w-full p-2 rounded text-left text-xs font-mono flex items-center justify-between transition-colors border ${
                    selectedEndpointIndex === idx
                      ? 'border-amber-500 bg-slate-950 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      ep.method === 'GET' ? 'bg-blue-900/60 text-blue-300' : 'bg-emerald-900/60 text-emerald-300'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="font-semibold">{ep.path}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate ml-2">{ep.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Container ID Input */}
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Equipment Reference (ISO Container ID)</label>
            <input
              type="text"
              value={customContainerId}
              onChange={(e) => setCustomContainerId(e.target.value.toUpperCase())}
              className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-amber-400 uppercase font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Auth Token */}
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Authorization Bearer Token / API Key</label>
            <div className="relative">
              <input
                type="password"
                value={apiBearerToken}
                onChange={(e) => setApiBearerToken(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-slate-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            onClick={handleExecuteApiCall}
            disabled={isExecuting}
            className="w-full py-2.5 px-4 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow"
          >
            {isExecuting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Execute API Request ({currentEndpoint.method})</span>
          </button>
        </div>

        {/* Right: API Response Viewer */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Carrier Response Payload
              </span>
              {executionResult && (
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-emerald-400 font-bold">
                    HTTP {executionResult.status} {executionResult.statusText}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{executionResult.durationMs}ms</span>
                </div>
              )}
            </div>

            {executionResult ? (
              <div className="space-y-2 mt-2">
                <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-slate-400 overflow-x-auto">
                  <div className="text-slate-500 mb-1">// Response Headers</div>
                  {Object.entries(executionResult.headers).map(([k, v]) => (
                    <div key={k}><strong className="text-slate-300">{k}:</strong> {v}</div>
                  ))}
                </div>

                <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono text-slate-200 max-h-[260px] overflow-y-auto">
                  {executionResult.isEdi ? (
                    <pre className="whitespace-pre-wrap font-mono text-emerald-400 text-xs">
                      {executionResult.body}
                    </pre>
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-amber-300 text-xs">
                      {JSON.stringify(executionResult.body, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs">
                <Code2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p>Click "Execute API Request" to transmit query to the logistics carrier gateway.</p>
              </div>
            )}
          </div>

          <div className="p-2 bg-slate-950/80 rounded border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>DCSA Standard Specification: v2.2</span>
            <span>TLS 1.3 AES-256 GCM</span>
          </div>
        </div>
      </div>

      {/* Outbound Webhook Subscriptions & Trigger Station */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Outbound Webhook Delivery & Client Dispatcher
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated push events emitted when containers gate in, gate out, fail reefer thresholds, or trigger customs holds.
            </p>
          </div>
        </div>

        {/* Webhook Test Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Event Type</label>
            <select
              value={webhookEvent}
              onChange={(e) => setWebhookEvent(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="container.gate_in">container.gate_in</option>
              <option value="customs.status_change">customs.status_change</option>
              <option value="reefer.temp_alarm">reefer.temp_alarm</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-400 font-medium mb-1">Subscriber Webhook URL</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSendTestWebhook}
              className="w-full py-1.5 px-3 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Webhook</span>
            </button>
          </div>
        </div>

        {/* Webhooks Delivery Log */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">Recent Webhook Deliveries:</span>
          {webhooks.map((whk) => (
            <div
              key={whk.id}
              className="p-2.5 bg-slate-950 rounded border border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">{whk.status}</span>
                <span className="text-slate-600">·</span>
                <span className="text-amber-400 font-semibold">{whk.event}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300 truncate max-w-sm">{whk.targetUrl}</span>
              </div>

              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                <span>{whk.responseMs}ms</span>
                <span className="text-slate-600">·</span>
                <span>{new Date(whk.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
