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
        await session.run(
          `MERGE (n:${type} {id: $id}) 
           SET n += $properties`,
          { id, properties }
        );
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
        await session.run(
          `MATCH (from {id: $fromId}), (to {id: $toId})
           MERGE (from)-[r:${type}]->(to)
           SET r += $properties`,
          { fromId, toId, properties: properties || {} }
        );
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
      return this.findInfluencingEventsInMemory(hcpId.toString(), competitorDrug);
    }

    return this.runQuery(COMMON_PATTERNS.INFLUENCING_EVENTS.pattern, {
      hcpId: hcpId.toString(),
      competitorDrug,
    });
  }

  /**
   * Trace patient switching paths
   */
  async findPatientSwitchingPaths(hcpId: number, ourCompany: string): Promise<any[]> {
    if (this.useInMemory) {
      return this.findPatientSwitchingPathsInMemory(hcpId.toString(), ourCompany);
    }

    return this.runQuery(COMMON_PATTERNS.PATIENT_SWITCHING_PATH.pattern, {
      hcpId: hcpId.toString(),
      ourCompany,
    });
  }

  /**
   * Get HCP network (all connected entities)
   */
  async getHCPNetwork(hcpId: number, limit: number = 50): Promise<any[]> {
    if (this.useInMemory) {
      return this.getHCPNetworkInMemory(hcpId.toString(), limit);
    }

    return this.runQuery(COMMON_PATTERNS.HCP_NETWORK.pattern, {
      hcpId: hcpId.toString(),
      limit,
    });
  }

  /**
   * Find access barrier chains (PA denials → switches)
   */
  async findAccessBarriers(hcpId: number, ourCompany: string): Promise<any[]> {
    if (this.useInMemory) {
      return this.findAccessBarriersInMemory(hcpId.toString(), ourCompany);
    }

    return this.runQuery(COMMON_PATTERNS.ACCESS_BARRIER_CHAIN.pattern, {
      hcpId: hcpId.toString(),
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

  private getHCPNetworkInMemory(hcpId: string, limit: number): any[] {
    if (!this.inMemoryGraph || !this.inMemoryGraph.hasNode(hcpId)) return [];
    
    const results: any[] = [];
    let count = 0;

    this.inMemoryGraph.forEachNeighbor(hcpId, (neighbor, attrs) => {
      if (count >= limit) return;
      const neighborAttrs = this.inMemoryGraph!.getNodeAttributes(neighbor);
      results.push({
        id: neighbor,
        type: neighborAttrs.type,
        ...neighborAttrs,
      });
      count++;
    });

    return results;
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
