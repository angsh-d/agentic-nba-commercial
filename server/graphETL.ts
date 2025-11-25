import { graphService } from './graphService';
import { storage } from './storage';
import { NODE_TYPES, RELATIONSHIP_TYPES } from '@shared/graphSchema';

/**
 * ETL Pipeline to populate Knowledge Graph from PostgreSQL data
 * Extracts HCPs, patients, prescriptions, clinical events and builds relationships
 */

export class GraphETL {
  /**
   * Main ETL function - extract all data and populate graph
   */
  async populateKnowledgeGraph(): Promise<void> {
    console.log('[GraphETL] Starting knowledge graph population...');
    
    try {
      // Clear existing graph data
      await graphService.clearGraph();
      
      // Extract and load entities
      await this.loadHCPs();
      await this.loadPatients();
      await this.loadDrugs();
      await this.loadClinicalEvents();
      
      // Create relationships
      await this.createPrescriptionRelationships();
      await this.createPatientRelationships();
      await this.createEventRelationships();
      await this.createSwitchingRelationships();
      
      console.log('[GraphETL] Knowledge graph population completed');
    } catch (error) {
      console.error('[GraphETL] Error populating knowledge graph:', error);
      throw error;
    }
  }

  /**
   * Load HCPs as nodes
   */
  private async loadHCPs(): Promise<void> {
    const hcps = await storage.getAllHcps();
    console.log(`[GraphETL] Loading ${hcps.length} HCPs...`);
    
    for (const hcp of hcps) {
      await graphService.addNode(`hcp_${hcp.id}`, NODE_TYPES.HCP, {
        id: hcp.id,
        name: hcp.name,
        specialty: hcp.specialty,
        hospital: hcp.hospital,
        territory: hcp.territory,
        riskScore: hcp.switchRiskScore,
        riskTier: hcp.switchRiskTier,
      });
    }
  }

  /**
   * Load patients as nodes
   */
  private async loadPatients(): Promise<void> {
    const hcps = await storage.getAllHcps();
    let totalPatients = 0;

    for (const hcp of hcps) {
      const patients = await storage.getPatientsByHcp(hcp.id);
      totalPatients += patients.length;
      
      for (const patient of patients) {
        await graphService.addNode(`patient_${patient.id}`, NODE_TYPES.PATIENT, {
          id: patient.id,
          indication: patient.cancerType,
          cohort: patient.cohort,
          currentDrug: patient.currentDrug,
          switchedToDrug: patient.switchedToDrug,
          switchDate: patient.switchedDate,
        });

        // Create TREATS relationship
        await graphService.addRelationship(
          `hcp_${hcp.id}`,
          `patient_${patient.id}`,
          RELATIONSHIP_TYPES.TREATS,
          { since: patient.createdAt }
        );

        // Create indication node if not exists
        if (patient.cancerType) {
          const indicationId = `indication_${patient.cancerType.toLowerCase().replace(/\s+/g, '_')}`;
          await graphService.addNode(indicationId, NODE_TYPES.INDICATION, {
            name: patient.cancerType,
          });

          // Create HAS_INDICATION relationship
          await graphService.addRelationship(
            `patient_${patient.id}`,
            indicationId,
            RELATIONSHIP_TYPES.HAS_INDICATION
          );
        }

        // Create cohort node if exists
        if (patient.cohort) {
          const cohortId = `cohort_${patient.cohort.toLowerCase().replace(/\s+/g, '_')}`;
          await graphService.addNode(cohortId, NODE_TYPES.COHORT, {
            name: patient.cohort,
          });

          // Create BELONGS_TO relationship
          await graphService.addRelationship(
            `patient_${patient.id}`,
            cohortId,
            RELATIONSHIP_TYPES.BELONGS_TO
          );
        }
      }
    }
    
    console.log(`[GraphETL] Loaded ${totalPatients} patients`);
  }

  /**
   * Load drugs as nodes from prescription history
   */
  private async loadDrugs(): Promise<void> {
    const hcps = await storage.getAllHcps();
    const drugsSet = new Set<string>();

    for (const hcp of hcps) {
      const history = await storage.getPrescriptionHistory(hcp.id);
      
      for (const record of history) {
        if (!drugsSet.has(record.productName)) {
          drugsSet.add(record.productName);
          
          await graphService.addNode(`drug_${record.productName.toLowerCase().replace(/\s+/g, '_')}`, NODE_TYPES.DRUG, {
            name: record.productName,
            category: record.productCategory,
          });
        }
      }
    }
    
    console.log(`[GraphETL] Loaded ${drugsSet.size} drugs`);
  }

  /**
   * Load clinical events as nodes
   */
  private async loadClinicalEvents(): Promise<void> {
    const hcps = await storage.getAllHcps();
    let totalEvents = 0;

    for (const hcp of hcps) {
      const events = await storage.getClinicalEventsByHcp(hcp.id);
      totalEvents += events.length;
      
      for (const event of events) {
        const eventId = `event_${event.id}`;
        await graphService.addNode(eventId, NODE_TYPES.CLINICAL_EVENT, {
          id: event.id,
          name: event.eventTitle,
          date: event.eventDate,
          type: event.eventType,
          description: event.eventDescription,
          impact: event.impact,
          relatedDrug: event.relatedDrug,
        });

        // Create ATTENDED relationship
        await graphService.addRelationship(
          `hcp_${hcp.id}`,
          eventId,
          RELATIONSHIP_TYPES.ATTENDED,
          { attendedDate: event.eventDate }
        );
      }
    }
    
    console.log(`[GraphETL] Loaded ${totalEvents} clinical events`);
  }

  /**
   * Create prescription relationships
   */
  private async createPrescriptionRelationships(): Promise<void> {
    const hcps = await storage.getAllHcps();
    let relationshipCount = 0;

    for (const hcp of hcps) {
      const history = await storage.getPrescriptionHistory(hcp.id);
      
      for (const record of history) {
        const drugId = `drug_${record.productName.toLowerCase().replace(/\s+/g, '_')}`;
        
        await graphService.addRelationship(
          `hcp_${hcp.id}`,
          drugId,
          RELATIONSHIP_TYPES.PRESCRIBED,
          {
            month: record.month,
            quantity: record.prescriptionCount,
            category: record.productCategory,
          }
        );
        relationshipCount++;
      }
    }
    
    console.log(`[GraphETL] Created ${relationshipCount} prescription relationships`);
  }

  /**
   * Create patient treatment relationships
   */
  private async createPatientRelationships(): Promise<void> {
    const hcps = await storage.getAllHcps();
    let relationshipCount = 0;

    for (const hcp of hcps) {
      const patients = await storage.getPatientsByHcp(hcp.id);
      
      for (const patient of patients) {
        // Current drug relationship
        if (patient.currentDrug) {
          const currentDrugId = `drug_${patient.currentDrug.toLowerCase().replace(/\s+/g, '_')}`;
          await graphService.addRelationship(
            `patient_${patient.id}`,
            currentDrugId,
            RELATIONSHIP_TYPES.PRESCRIBED,
            { status: 'current', date: patient.switchedDate || patient.createdAt }
          );
          relationshipCount++;
        }

        // Switched-to drug relationship
        if (patient.switchedToDrug) {
          const switchedDrugId = `drug_${patient.switchedToDrug.toLowerCase().replace(/\s+/g, '_')}`;
          await graphService.addRelationship(
            `patient_${patient.id}`,
            switchedDrugId,
            RELATIONSHIP_TYPES.SWITCHED_TO,
            { status: 'switched', date: patient.switchedDate }
          );
          relationshipCount++;
        }
      }
    }
    
    console.log(`[GraphETL] Created ${relationshipCount} patient treatment relationships`);
  }

  /**
   * Create clinical event relationships (influenced by)
   */
  private async createEventRelationships(): Promise<void> {
    const hcps = await storage.getAllHcps();
    let relationshipCount = 0;

    for (const hcp of hcps) {
      const events = await storage.getClinicalEventsByHcp(hcp.id);
      const patients = await storage.getPatientsByHcp(hcp.id);
      
      // Link events to patient switches if timing suggests influence
      for (const patient of patients) {
        if (!patient.switchedDate) continue;
        
        const switchDate = new Date(patient.switchedDate);
        
        for (const event of events) {
          const eventDate = new Date(event.eventDate);
          
          // If event occurred within 90 days before switch, mark as potential influence
          const daysDiff = (switchDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysDiff > 0 && daysDiff <= 90) {
            await graphService.addRelationship(
              `patient_${patient.id}`,
              `event_${event.id}`,
              RELATIONSHIP_TYPES.INFLUENCED_BY,
              {
                daysBefore: Math.round(daysDiff),
                eventTitle: event.eventTitle,
              }
            );
            relationshipCount++;
          }
        }
      }
    }
    
    console.log(`[GraphETL] Created ${relationshipCount} event influence relationships`);
  }

  /**
   * Create switching relationships
   */
  private async createSwitchingRelationships(): Promise<void> {
    const hcps = await storage.getAllHcps();
    let relationshipCount = 0;

    for (const hcp of hcps) {
      const patients = await storage.getPatientsByHcp(hcp.id);
      
      for (const patient of patients) {
        if (patient.currentDrug && patient.switchedToDrug && patient.currentDrug !== patient.switchedToDrug) {
          const currentDrugId = `drug_${patient.currentDrug.toLowerCase().replace(/\s+/g, '_')}`;
          const switchedDrugId = `drug_${patient.switchedToDrug.toLowerCase().replace(/\s+/g, '_')}`;
          
          // SWITCHED_FROM relationship
          await graphService.addRelationship(
            `patient_${patient.id}`,
            currentDrugId,
            RELATIONSHIP_TYPES.SWITCHED_FROM,
            {
              switchDate: patient.switchedDate,
            }
          );

          // SWITCHED_TO relationship
          await graphService.addRelationship(
            `patient_${patient.id}`,
            switchedDrugId,
            RELATIONSHIP_TYPES.SWITCHED_TO,
            {
              switchDate: patient.switchedDate,
            }
          );
          
          relationshipCount += 2;
        }
      }
    }
    
    console.log(`[GraphETL] Created ${relationshipCount} switching relationships`);
  }

  /**
   * Run full ETL pipeline
   */
  async runFullETL(): Promise<any> {
    console.log('[GraphETL] Starting full ETL pipeline...');
    const startTime = Date.now();
    
    try {
      // Clear existing graph
      await graphService.clearGraph();
      console.log('[GraphETL] Cleared existing graph');
      
      // Load nodes
      await this.loadHCPs();
      await this.loadPatients();
      await this.loadDrugs();
      await this.loadClinicalEvents();
      
      // Create relationships
      await this.createPrescriptionRelationships();
      await this.createPatientRelationships();
      await this.createEventRelationships();
      await this.createSwitchingRelationships();
      
      const duration = Date.now() - startTime;
      const stats = await this.getStats();
      
      const result = {
        success: true,
        duration,
        message: `ETL pipeline completed in ${duration}ms`,
        timestamp: new Date().toISOString(),
        ...stats,
      };
      
      console.log('[GraphETL] ETL pipeline completed:', result);
      return result;
    } catch (error) {
      console.error('[GraphETL] ETL pipeline failed:', error);
      throw error;
    }
  }

  /**
   * Get ETL statistics
   */
  async getStats(): Promise<{
    nodes: number;
    relationships: number;
    nodeTypes: Record<string, number>;
  }> {
    const graph = graphService.getInMemoryGraph();
    if (!graph) {
      return { nodes: 0, relationships: 0, nodeTypes: {} };
    }

    const nodeTypes: Record<string, number> = {};
    graph.forEachNode((node, attrs) => {
      const type = attrs.type || 'unknown';
      nodeTypes[type] = (nodeTypes[type] || 0) + 1;
    });

    return {
      nodes: graph.order,
      relationships: graph.size,
      nodeTypes,
    };
  }
}

// Singleton instance
export const graphETL = new GraphETL();
