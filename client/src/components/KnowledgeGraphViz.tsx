import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Network, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface Node {
  id: string;
  type: string;
  label: string;
  x?: number;
  y?: number;
}

interface Edge {
  from: string;
  to: string;
  type: string;
}

interface KnowledgeGraphVizProps {
  hcpId: number;
  height?: number;
}

export function KnowledgeGraphViz({ hcpId, height = 400 }: KnowledgeGraphVizProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Fetch graph data from API
  const fetchGraphData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/graph/hcp/${hcpId}/network?limit=50`);
      if (!response.ok) throw new Error('Failed to fetch graph data');
      
      const data = await response.json();
      
      // API now returns { nodes: [], edges: [] }
      const graphNodes: Node[] = (data.nodes || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        label: item.label || item.name || item.type || item.id,
      }));
      
      const graphEdges: Edge[] = (data.edges || []).map((item: any) => ({
        from: item.from,
        to: item.to,
        type: item.type || 'CONNECTED',
      }));
      
      setNodes(graphNodes);
      setEdges(graphEdges);
    } catch (err: any) {
      setError(err.message || 'Failed to load graph');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, [hcpId]);

  // Simple force-directed layout
  useEffect(() => {
    if (nodes.length === 0) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Initialize positions if not set
    const positionedNodes = nodes.map((node, i) => ({
      ...node,
      x: node.x || (width / 2 + Math.cos(i * 2 * Math.PI / nodes.length) * 150),
      y: node.y || (height / 2 + Math.sin(i * 2 * Math.PI / nodes.length) * 150),
    }));
    
    // Draw function
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      
      // Apply zoom and pan
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);
      
      // Draw edges
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      edges.forEach(edge => {
        const from = positionedNodes.find(n => n.id?.toString() === edge.source?.toString());
        const to = positionedNodes.find(n => n.id?.toString() === edge.target?.toString());
        if (from && to && from.x && from.y && to.x && to.y) {
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        }
      });
      
      // Draw nodes
      positionedNodes.forEach(node => {
        if (!node.x || !node.y) return;
        
        // Color by type
        const colors: Record<string, string> = {
          HCP: '#3b82f6',
          PATIENT: '#10b981',
          DRUG: '#f59e0b',
          CLINICAL_EVENT: '#8b5cf6',
          PAYER: '#ef4444',
        };
        
        ctx.fillStyle = colors[node.type] || '#6b7280';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw label
        ctx.fillStyle = '#1e293b';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(node.label.substring(0, 20), node.x, node.y + 20);
      });
      
      ctx.restore();
    };
    
    draw();
    setNodes(positionedNodes);
  }, [nodes.length, edges, zoom, pan]);

  if (loading) {
    return (
      <Card className="p-8 flex items-center justify-center" style={{ height }}>
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading knowledge graph...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 flex items-center justify-center" style={{ height }}>
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Network className="h-8 w-8" />
          <p className="text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchGraphData}
            data-testid="button-retry-graph"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-slate-600" />
          <h3 className="font-medium text-slate-900">Knowledge Graph Explorer</h3>
          <span className="text-sm text-slate-500">
            {nodes.length} entities
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(z => Math.min(z + 0.2, 3))}
            data-testid="button-zoom-in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
            data-testid="button-zoom-out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            data-testid="button-reset-view"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="relative bg-slate-50" style={{ height }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={height}
          className="w-full h-full cursor-move"
          data-testid="canvas-knowledge-graph"
        />
        
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-slate-500">
              <Network className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No graph data available</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-slate-600">HCP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-slate-600">Patient</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-slate-600">Drug</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-slate-600">Clinical Event</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-slate-600">Payer</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
