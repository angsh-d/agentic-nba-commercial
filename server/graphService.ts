import neo4j, { Driver, Session } from 'neo4j-driver';
import Graph from 'graphology';
import { NODE_TYPES, RELATIONSHIP_TYPES, KnowledgeGraph, COMMON_PATTERNS } from '@shared/graphSchema';

/**
 * Graph Service for Knowledge Graph operations
 * Supports both Neo4j/Memgraph and in-memory graphology
 */

class GraphService {
  private driver: Driver | null = null;
  private inMemoryGraph: Graph | null = null;
  private useInMemory: boolean;

  constructor() {
    // Check if graph database credentials are available
    const graphDbUrl = process.env.NEO4J_URI || process.env.MEMGRAPH_URI;
    const username = process.env.NEO4J_USERNAME || 'memgraph';
    const password = process.env.NEO4J_PASSWORD || '';

    if (graphDbUrl && username) {
      try {
        this.driver = neo4j.driver(
          graphDbUrl,
          neo4j.auth.basic(username, password)
        );
        this.useInMemory = false;
        console.log('[GraphService] Connected to graph database at', graphDbUrl);
        
        // Verify connectivity asynchronously (don't block constructor)
        this.verifyConnection().catch(error => {
          console.warn('[GraphService] Connection verification failed, falling back to in-memory mode', error);
          this.driver?.close();
          this.driver = null;
          this.inMemoryGraph = new Graph();
          this.useInMemory = true;
        });
      } catch (error) {
        console.warn('[GraphService] Failed to connect to graph database, using in-memory mode', error);
        this.inMemoryGraph = new Graph();
        this.useInMemory = true;
      }
    } else {
      console.log('[GraphService] No graph database configured, using in-memory mode');
      this.inMemoryGraph = new Graph();
      this.useInMemory = true;
    }
  }

  /**
   * Verify Neo4j connection on startup
   */
  private async verifyConnection(): Promise<void> {
    if (!this.driver) return;
    
    try {
      await this.driver.verifyConnectivity();
      console.log('[GraphService] Neo4j connection verified successfully');
    } catch (error) {
      console.error('[GraphService] Neo4j connection verification failed:', error);
      throw error;
    }
  }

  /**
   * Sanitize properties for Neo4j - convert nested objects to JSON strings
   */
  private sanitizePropertiesForNeo4j(properties: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) {
        continue; // Skip null/undefined
      } else if (value instanceof Date) {
        // Convert Date objects to ISO strings for Neo4j
        sanitized[key] = value.toISOString();
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Convert nested objects to JSON strings
        sanitized[key] = JSON.stringify(value);
      } else if (Array.isArray(value)) {
        // Check if array contains primitives only
        const isPrimitive = value.every(item => 
          typeof item === 'string' || 
          typeof item === 'number' || 
          typeof item === 'boolean'
        );
        sanitized[key] = isPrimitive ? value : JSON.stringify(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Add a node to the knowledge graph
   */
  async addNode(id: string, type: string, properties: Record<string, any>): Promise<void> {
    if (this.useInMemory) {
      if (!this.inMemoryGraph!.hasNode(id)) {
        this.inMemoryGraph!.addNode(id, { type, ...properties });
      } else {
        this.inMemoryGraph!.updateNode(id, (attrs) => ({ ...attrs, ...properties }));
      }
    } else {
      const session = this.driver!.session();
      try {
        const sanitizedProps = this.sanitizePropertiesForNeo4j(properties);
        
        // Exclude 'id' from SET clause since it's already in MERGE
        const { id: _, ...propsWithoutId } = sanitizedProps;
        
        // Build SET clause dynamically for each property (excluding id)
        const setClause = Object.keys(propsWithoutId).length > 0
          ? 'SET ' + Object.keys(propsWithoutId).map(key => `n.${key} = $${key}`).join(', ')
          : '';
        
        const query = `MERGE (n:${type} {id: $id}) ${setClause}`;
        const params = { id, ...propsWithoutId };
        
        // Flatten properties directly into params to avoid nested objects
        await session.run(query, params);
      } finally {
        await session.close();
      }
    }
  }

  /**
   * Add a relationship between two nodes
   */
  async addRelationship(
    fromId: string,
    toId: string,
    type: string,
    properties?: Record<string, any>
  ): Promise<void> {
    if (this.useInMemory) {
      if (!this.inMemoryGraph!.hasEdge(fromId, toId)) {
        this.inMemoryGraph!.addEdge(fromId, toId, { type, ...(properties || {}) });
      }
    } else {
      const session = this.driver!.session();
      try {
        const sanitizedProps = properties ? this.sanitizePropertiesForNeo4j(properties) : {};
        
        // Build SET clause dynamically for each property
        const setClause = Object.keys(sanitizedProps).length > 0
          ? 'SET ' + Object.keys(sanitizedProps).map(key => `r.${key} = $${key}`).join(', ')
          : '';
        
        const query = `MATCH (from {id: $fromId}), (to {id: $toId})
                       MERGE (from)-[r:${type}]->(to)
                       ${setClause}`;
        // Flatten properties directly into params to avoid nested objects
        await session.run(query, { fromId, toId, ...sanitizedProps });
      } finally {
        await session.close();
      }
    }
  }

  /**
   * Execute a Cypher query (for Neo4j/Memgraph)
   */
  async runQuery(cypher: string, params?: Record<string, any>): Promise<any[]> {
    if (this.useInMemory) {
      // For in-memory mode, return empty results or implement basic query logic
      console.warn('[GraphService] Cypher queries not supported in in-memory mode');
      return [];
    }

    const session = this.driver!.session();
    try {
      const result = await session.run(cypher, params || {});
      return result.records.map((record) => record.toObject());
    } finally {
      await session.close();
    }
  }

  /**
   * Find influencing clinical events for HCP switches
   */
  async findInfluencingEvents(hcpId: number, competitorDrug: string): Promise<any[]> {
    if (this.useInMemory) {
      return this.findInfluencingEventsInMemory(`hcp_${hcpId}`, competitorDrug);
    }

    return this.runQuery(COMMON_PATTERNS.INFLUENCING_EVENTS.pattern, {
      hcpId: `hcp_${hcpId}`,
      competitorDrug,
    });
  }

  /**
   * Trace patient switching paths
   */
  async findPatientSwitchingPaths(hcpId: number, ourCompany: string): Promise<any[]> {
    if (this.useInMemory) {
      return this.findPatientSwitchingPathsInMemory(`hcp_${hcpId}`, ourCompany);
    }

    return this.runQuery(COMMON_PATTERNS.PATIENT_SWITCHING_PATH.pattern, {
      hcpId: `hcp_${hcpId}`,
      ourCompany,
    });
  }

  /**
   * Get HCP network (all connected entities) with edges
   */
  async getHCPNetwork(hcpId: number, limit: number = 50): Promise<{ nodes: any[]; edges: any[] }> {
    if (this.useInMemory) {
      // In-memory mode uses "hcp_" prefix for HCP node IDs
      return this.getHCPNetworkInMemory(`hcp_${hcpId}`, limit);
    }

    const results = await this.runQuery(COMMON_PATTERNS.HCP_NETWORK.pattern, {
      hcpId: `hcp_${hcpId}`,
      limit,
    });
    
    // Transform results into nodes and edges
    const nodeMap = new Map<string, any>();
    const edges: any[] = [];
    
    for (const record of results) {
      const hcp = record.hcp;
      const connected = record.connected;
      const relationshipType = record.relationship;
      
      // Add HCP node if not already in map
      if (hcp && hcp.properties && hcp.properties.id) {
        const graphId = hcp.properties.id;
        if (!nodeMap.has(graphId)) {
          nodeMap.set(graphId, {
            id: this.stripIdPrefix(graphId), // Return canonical numeric ID
            graphId, // Keep internal graph ID for reference
            type: 'HCP',
            label: hcp.properties.name || graphId,
            ...hcp.properties,
          });
        }
      }
      
      // Add connected node if not already in map
      if (connected && connected.properties && connected.properties.id) {
        const graphId = connected.properties.id;
        if (!nodeMap.has(graphId)) {
          const connectedType = connected.labels?.[0] || 'Unknown';
          nodeMap.set(graphId, {
            id: this.stripIdPrefix(graphId), // Return canonical numeric ID
            graphId, // Keep internal graph ID for reference
            type: connectedType,
            label: connected.properties.name || graphId,
            ...connected.properties,
          });
        }
      }
      
      // Add edge with canonical IDs
      if (hcp && connected && relationshipType) {
        const sourceGraphId = hcp.properties?.id || '';
        const targetGraphId = connected.properties?.id || '';
        edges.push({
          source: this.stripIdPrefix(sourceGraphId), // Return canonical numeric IDs
          target: this.stripIdPrefix(targetGraphId),
          type: relationshipType,
          label: relationshipType,
        });
      }
    }
    
    return { nodes: Array.from(nodeMap.values()), edges };
  }

  /**
   * Find access barrier chains (PA denials → switches)
   */
  async findAccessBarriers(hcpId: number, ourCompany: string): Promise<any[]> {
    if (this.useInMemory) {
      return this.findAccessBarriersInMemory(`hcp_${hcpId}`, ourCompany);
    }

    return this.runQuery(COMMON_PATTERNS.ACCESS_BARRIER_CHAIN.pattern, {
      hcpId: `hcp_${hcpId}`,
      ourCompany,
    });
  }

  /**
   * Get the in-memory graph for visualization
   */
  getInMemoryGraph(): Graph | null {
    return this.inMemoryGraph;
  }

  /**
   * In-memory query implementations
   */
  private findInfluencingEventsInMemory(hcpId: string, competitorDrug: string): any[] {
    if (!this.inMemoryGraph) return [];
    
    const results: any[] = [];
    const hcpNode = this.inMemoryGraph.hasNode(hcpId) ? hcpId : null;
    
    if (!hcpNode) return [];

    // Find clinical events connected to HCP
    this.inMemoryGraph.forEachNeighbor(hcpId, (neighbor, attrs) => {
      const neighborAttrs = this.inMemoryGraph!.getNodeAttributes(neighbor);
      if (neighborAttrs.type === NODE_TYPES.CLINICAL_EVENT) {
        results.push({
          eventName: neighborAttrs.name,
          eventDate: neighborAttrs.date,
          topic: neighborAttrs.topic,
        });
      }
    });

    return results;
  }

  private findPatientSwitchingPathsInMemory(hcpId: string, ourCompany: string): any[] {
    if (!this.inMemoryGraph) return [];
    
    const results: any[] = [];
    
    // Find patients connected to HCP
    this.inMemoryGraph.forEachNeighbor(hcpId, (patientId, attrs) => {
      const patientAttrs = this.inMemoryGraph!.getNodeAttributes(patientId);
      if (patientAttrs.type === NODE_TYPES.PATIENT && patientAttrs.switchedFrom) {
        results.push({
          patientId,
          switchedFrom: patientAttrs.switchedFrom,
          switchedTo: patientAttrs.switchedTo,
          switchDate: patientAttrs.switchDate,
          switchReason: patientAttrs.switchReason,
        });
      }
    });

    return results;
  }

  /**
   * Strip graph ID prefix to get canonical ID
   * Removes only the entity type prefix (e.g., "hcp_", "patient_", "cohort_")
   * Preserves the rest of the ID (e.g., "cv_risk", "bladder_cancer")
   */
  private stripIdPrefix(graphId: string): string {
    // Remove only the leading type token: hcp_1 → 1, cohort_cv_risk → cv_risk
    return graphId.replace(/^[^_]+_/, '');
  }

  private getHCPNetworkInMemory(hcpId: string, limit: number): { nodes: any[]; edges: any[] } {
    if (!this.inMemoryGraph || !this.inMemoryGraph.hasNode(hcpId)) {
      return { nodes: [], edges: [] };
    }
    
    const nodes: any[] = [];
    const edges: any[] = [];
    const visitedNodes = new Set<string>();
    const visitedEdges = new Set<string>();

    // Add the HCP node itself
    const hcpAttrs = this.inMemoryGraph.getNodeAttributes(hcpId);
    nodes.push({
      id: this.stripIdPrefix(hcpId), // Return canonical numeric ID
      graphId: hcpId, // Keep internal graph ID for reference
      type: hcpAttrs.type,
      label: hcpAttrs.name || hcpId,
      ...hcpAttrs,
    });
    visitedNodes.add(hcpId);

    // Use a queue for multi-hop traversal (BFS)
    const queue: string[] = [hcpId];
    let depth = 0;
    const maxDepth = 2; // Go up to 2 hops deep

    while (queue.length > 0 && depth < maxDepth && nodes.length < limit) {
      const levelSize = queue.length;
      
      for (let i = 0; i < levelSize && nodes.length < limit; i++) {
        const currentNode = queue.shift()!;
        
        // Traverse all edges from this node
        this.inMemoryGraph.forEachEdge(currentNode, (edge, edgeAttrs, source, target) => {
          if (nodes.length >= limit) return;
          
          const edgeKey = `${source}-${target}`;
          const neighbor = source === currentNode ? target : source;
          
          // Add neighbor node if not visited
          if (!visitedNodes.has(neighbor)) {
            const neighborAttrs = this.inMemoryGraph!.getNodeAttributes(neighbor);
            nodes.push({
              id: this.stripIdPrefix(neighbor), // Return canonical numeric ID
              graphId: neighbor, // Keep internal graph ID for reference
              type: neighborAttrs.type,
              label: neighborAttrs.name || neighbor,
              ...neighborAttrs,
            });
            visitedNodes.add(neighbor);
            
            // Add to queue for next level traversal
            if (depth < maxDepth - 1) {
              queue.push(neighbor);
            }
          }
          
          // Add edge if not visited
          if (!visitedEdges.has(edgeKey)) {
            edges.push({
              source: this.stripIdPrefix(source), // Return canonical numeric IDs
              target: this.stripIdPrefix(target),
              type: edgeAttrs?.type || 'CONNECTED',
              label: edgeAttrs?.type || 'CONNECTED',
            });
            visitedEdges.add(edgeKey);
          }
        });
      }
      
      depth++;
    }

    return { nodes, edges };
  }

  private findAccessBarriersInMemory(hcpId: string, ourCompany: string): any[] {
    if (!this.inMemoryGraph) return [];
    
    const results: any[] = [];
    
    // Find patients with access barriers
    this.inMemoryGraph.forEachNeighbor(hcpId, (patientId, attrs) => {
      const patientAttrs = this.inMemoryGraph!.getNodeAttributes(patientId);
      if (patientAttrs.type === NODE_TYPES.PATIENT && patientAttrs.deniedBy) {
        results.push({
          patientId,
          payer: patientAttrs.deniedBy,
          deniedDrug: patientAttrs.deniedDrug,
          alternativeDrug: patientAttrs.alternativeDrug,
          denialDate: patientAttrs.denialDate,
        });
      }
    });

    return results;
  }

  /**
   * Get the full knowledge graph (all nodes and relationships)
   */
  async getFullGraph(limit: number = 200): Promise<{ nodes: any[]; edges: any[] }> {
    if (this.useInMemory) {
      return this.getFullGraphInMemory(limit);
    } else {
      const session = this.driver!.session();
      try {
        // Sanitize and cap limit to prevent injection and unbounded queries
        const safeLimit = Math.max(1, Math.min(500, Math.floor(Number(limit)) || 200));
        console.log('[GraphService] Querying Neo4j for full graph, limit:', safeLimit);
        
        const result = await session.run(
          `MATCH (n)
           OPTIONAL MATCH (n)-[r]->(m)
           RETURN n, labels(n) as nLabels, r, m, labels(m) as mLabels
           LIMIT ${safeLimit}`
        );

        console.log('[GraphService] Neo4j returned', result.records.length, 'records');
        
        const nodesMap = new Map();
        const edges: any[] = [];

        result.records.forEach(record => {
          const node = record.get('n');
          const nLabels = record.get('nLabels');
          if (node && !nodesMap.has(node.identity.toString())) {
            nodesMap.set(node.identity.toString(), {
              id: node.identity.toString(),
              type: nLabels && nLabels.length > 0 ? nLabels[0] : 'Unknown',
              label: node.properties.name || node.properties.id || node.identity.toString(),
              ...node.properties
            });
          }

          const relatedNode = record.get('m');
          const mLabels = record.get('mLabels');
          if (relatedNode && !nodesMap.has(relatedNode.identity.toString())) {
            nodesMap.set(relatedNode.identity.toString(), {
              id: relatedNode.identity.toString(),
              type: mLabels && mLabels.length > 0 ? mLabels[0] : 'Unknown',
              label: relatedNode.properties.name || relatedNode.properties.id || relatedNode.identity.toString(),
              ...relatedNode.properties
            });
          }

          const rel = record.get('r');
          if (rel) {
            edges.push({
              source: node.identity.toString(),
              target: relatedNode.identity.toString(),
              type: rel.type,
              ...rel.properties
            });
          }
        });

        return {
          nodes: Array.from(nodesMap.values()),
          edges
        };
      } finally {
        await session.close();
      }
    }
  }

  private getFullGraphInMemory(limit: number = 200): { nodes: any[]; edges: any[] } {
    if (!this.inMemoryGraph) {
      return { nodes: [], edges: [] };
    }

    const nodes: any[] = [];
    const edges: any[] = [];
    let nodeCount = 0;

    // Get all nodes
    this.inMemoryGraph.forEachNode((nodeId, attributes) => {
      if (nodeCount >= limit) return;
      const { id: _, ...restAttributes } = attributes;
      nodes.push({
        id: nodeId,
        ...restAttributes
      });
      nodeCount++;
    });

    // Get all edges
    this.inMemoryGraph.forEachEdge((edgeId, attributes, source, target) => {
      edges.push({
        source,
        target,
        ...attributes
      });
    });

    return { nodes, edges };
  }

  /**
   * Clear all data from the graph
   */
  async clearGraph(): Promise<void> {
    if (this.useInMemory) {
      this.inMemoryGraph = new Graph();
    } else {
      const session = this.driver!.session();
      try {
        await session.run('MATCH (n) DETACH DELETE n');
      } finally {
        await session.close();
      }
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
    }
  }
}

// Singleton instance
export const graphService = new GraphService();
