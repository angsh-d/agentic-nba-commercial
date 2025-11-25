import { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { 
  X, 
  Search, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut,
  Filter,
  Network,
  Loader2
} from 'lucide-react';

interface GraphNode {
  id: string;
  name: string;
  type: string;
  val?: number;
  color?: string;
  properties?: Record<string, any>;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  properties?: Record<string, any>;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface KnowledgeGraphModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hcpId?: number;
  title?: string;
}

const NODE_COLORS: Record<string, string> = {
  HCP: '#3b82f6',
  Patient: '#10b981',
  Drug: '#f59e0b',
  ClinicalEvent: '#8b5cf6',
  Payer: '#ef4444',
  Indication: '#06b6d4',
  Cohort: '#ec4899',
  webinar: '#8b5cf6',
  adverse_event: '#dc2626',
  conference: '#7c3aed',
  publication: '#6366f1',
};

const NODE_TYPE_LABELS: Record<string, string> = {
  HCP: 'Healthcare Providers',
  Patient: 'Patients',
  Drug: 'Drugs',
  ClinicalEvent: 'Clinical Events',
  Payer: 'Payers',
  Indication: 'Indications',
  Cohort: 'Patient Cohorts',
  webinar: 'Webinars',
  adverse_event: 'Adverse Events',
  conference: 'Conferences',
  publication: 'Publications',
};

export function KnowledgeGraphModal({ 
  open, 
  onOpenChange, 
  hcpId,
  title = "Knowledge Graph Explorer"
}: KnowledgeGraphModalProps) {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fgRef = useRef<any>();

  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = hcpId 
        ? `/api/graph/hcp/${hcpId}/network?limit=100`
        : '/api/graph/full?limit=200';
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch graph data');
      
      const data = await response.json();
      
      const nodes: GraphNode[] = (data.nodes || []).map((node: any) => ({
        id: node.id,
        name: node.label || node.name || node.type || node.id,
        type: node.type || 'unknown',
        val: 10,
        color: NODE_COLORS[node.type] || '#64748b',
        properties: node.properties || {},
      }));
      
      const links: GraphLink[] = (data.edges || []).map((edge: any) => ({
        source: edge.source || edge.from,
        target: edge.target || edge.to,
        type: edge.type || 'CONNECTED',
        properties: edge.properties || {},
      }));
      
      setGraphData({ nodes, links });
    } catch (error) {
      console.error('Error fetching graph:', error);
    } finally {
      setLoading(false);
    }
  }, [hcpId]);

  useEffect(() => {
    if (open) {
      fetchGraphData();
    }
  }, [open, fetchGraphData]);

  // Filter nodes based on search and active filters
  const filteredNodes = graphData.nodes.filter(node => {
    const matchesSearch = searchTerm === '' || 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = activeFilters.size === 0 || activeFilters.has(node.type);
    
    return matchesSearch && matchesFilter;
  });

  const filteredLinks = graphData.links.filter(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    
    return filteredNodes.some(n => n.id === sourceId) && 
           filteredNodes.some(n => n.id === targetId);
  });

  const filteredData = {
    nodes: filteredNodes,
    links: filteredLinks
  };

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setActiveFilters(new Set());
    setSearchTerm('');
  };

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
    fgRef.current?.centerAt(node.x, node.y, 1000);
    fgRef.current?.zoom(2, 1000);
  }, []);

  const handleZoomIn = () => {
    const currentZoom = fgRef.current?.zoom() || 1;
    fgRef.current?.zoom(currentZoom * 1.2, 300);
  };

  const handleZoomOut = () => {
    const currentZoom = fgRef.current?.zoom() || 1;
    fgRef.current?.zoom(currentZoom / 1.2, 300);
  };

  const handleZoomFit = () => {
    fgRef.current?.zoomToFit(400, 50);
  };

  const nodeTypes = Array.from(new Set(graphData.nodes.map(n => n.type)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${isFullscreen ? 'max-w-full h-screen' : 'max-w-7xl h-[90vh]'} p-0 gap-0 transition-all`}
        data-testid="modal-knowledge-graph"
      >
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
        </VisuallyHidden>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <Network className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
                <p className="text-sm text-slate-500">
                  {filteredData.nodes.length} entities · {filteredData.links.length} relationships
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                data-testid="button-toggle-fullscreen"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                data-testid="button-close-graph-modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 border-r border-slate-200 bg-slate-50 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search entities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-graph"
                  />
                </div>

                {/* Filters */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Filter className="h-4 w-4" />
                      Entity Types
                    </div>
                    {activeFilters.size > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-6 text-xs"
                        data-testid="button-clear-filters"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {nodeTypes.map(type => {
                      const count = graphData.nodes.filter(n => n.type === type).length;
                      const isActive = activeFilters.has(type);
                      return (
                        <Badge
                          key={type}
                          variant={isActive ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          style={{
                            backgroundColor: isActive ? NODE_COLORS[type] : 'transparent',
                            borderColor: NODE_COLORS[type],
                            color: isActive ? 'white' : NODE_COLORS[type],
                          }}
                          onClick={() => toggleFilter(type)}
                          data-testid={`filter-${type.toLowerCase()}`}
                        >
                          {NODE_TYPE_LABELS[type] || type} ({count})
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Controls */}
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-3">View Controls</div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                      data-testid="button-zoom-in-graph"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomOut}
                      data-testid="button-zoom-out-graph"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomFit}
                      data-testid="button-fit-graph"
                    >
                      Fit
                    </Button>
                  </div>
                </div>

                {/* Selected Node Details */}
                {selectedNode && (
                  <Card className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: selectedNode.color }}
                        />
                        <span className="text-xs text-slate-500 uppercase tracking-wide">
                          {selectedNode.type}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setSelectedNode(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <h4 className="font-medium text-slate-900 mb-2">{selectedNode.name}</h4>
                    <div className="space-y-1 text-xs">
                      {Object.entries(selectedNode.properties || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-slate-500">{key}:</span>
                          <span className="text-slate-700 font-medium">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Legend */}
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-3">Legend</div>
                  <div className="space-y-2 text-xs">
                    {Object.entries(NODE_TYPE_LABELS).map(([type, label]) => (
                      <div key={type} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: NODE_COLORS[type] }}
                        />
                        <span className="text-slate-600">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Graph Canvas */}
            <div className="flex-1 bg-white relative">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm">Loading knowledge graph...</p>
                  </div>
                </div>
              ) : filteredData.nodes.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <Network className="h-16 w-16 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium mb-1">No entities found</p>
                    <p className="text-sm">Try adjusting your filters or search</p>
                  </div>
                </div>
              ) : (
                <ForceGraph2D
                  ref={fgRef}
                  graphData={filteredData}
                  nodeLabel="name"
                  nodeColor="color"
                  nodeVal="val"
                  linkDirectionalArrowLength={3.5}
                  linkDirectionalArrowRelPos={1}
                  linkColor={() => '#cbd5e1'}
                  linkWidth={1.5}
                  linkLabel={(link: any) => link.type}
                  onNodeClick={handleNodeClick}
                  nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.name;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px system-ui`;
                    
                    // Draw node circle
                    ctx.fillStyle = node.color;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI);
                    ctx.fill();
                    
                    // Draw white border
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2 / globalScale;
                    ctx.stroke();
                    
                    // Draw label
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#1e293b';
                    ctx.fillText(label, node.x, node.y + node.val + fontSize + 2);
                  }}
                  cooldownTicks={100}
                  d3AlphaDecay={0.02}
                  d3VelocityDecay={0.3}
                  enableNodeDrag={true}
                  enableZoomInteraction={true}
                  enablePanInteraction={true}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
