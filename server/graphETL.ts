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
      await this.loadPayers();
      
      // Create relationships
      await this.createPrescriptionRelationships();
      await this.createPatientRelationships();
      await this.createEventRelationships();
      await this.createSwitchingRelationships();
      // NOTE: createAccessEventRelationships() removed - it created incorrect ACCESS_ISSUE→Payer edges
      // Access barriers are handled by createAccessDenialRelationships() if needed
      
      console.log('[GraphETL] Knowledge graph population completed');
    } catch (error) {
      console.error('[GraphETL] Error populating knowledge graph:', error);
      throw error;
    }
  }

  /**
   * Load HCPs as nodes with enhanced commercial properties
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
        // Enhanced properties for commercial intelligence
        tier: hcp.id === 1 ? 'A' : 'B', // Demo: Dr. Smith is tier A (KOL)
        isKOL: hcp.id === 1, // Demo: Dr. Smith is a KOL
        referralVolume: hcp.id === 1 ? 45 : 18,
        prescriptionVolume: hcp.id === 1 ? 120 : 85,
        channelPreference: hcp.id === 1 ? 'inPerson' : 'virtual',
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
        // Determine switch reason and denied drug based on demo personas
        let switchReason = null;
        let deniedDrug = null;
        
        if (patient.switchedToDrug && patient.switchedDate) {
          // For Dr. Sarah Smith's patients (hcp 1): safety/efficacy switches
          if (hcp.id === 1) {
            switchReason = patient.id % 2 === 0 ? 'safety_concern' : 'efficacy_failure';
            deniedDrug = null; // No access issues for Dr. Smith's switches
          }
          // For Dr. Michael Chen's patients (hcp 2): access barrier switches
          else if (hcp.id === 2) {
            switchReason = 'access_barrier';
            deniedDrug = "Onco-Pro"; // Our drug they were denied (they switched to Onco-Rival)
          }
          // For other HCPs: mixed reasons
          else {
            switchReason = patient.id % 3 === 0 ? 'access_barrier' : 'clinical_reason';
            deniedDrug = switchReason === 'access_barrier' ? "Onco-Pro" : null;
          }
        }
        
        await graphService.addNode(`patient_${patient.id}`, NODE_TYPES.PATIENT, {
          id: patient.id,
          indication: patient.cancerType,
          cohort: patient.cohort,
          currentDrug: patient.currentDrug,
          switchedToDrug: patient.switchedToDrug,
          switchDate: patient.switchedDate,
          switchReason,
          deniedDrug,
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
   * Load drugs as nodes with enhanced properties (manufacturer, competitors, indication)
   */
  private async loadDrugs(): Promise<void> {
    const hcps = await storage.getAllHcps();
    const drugsSet = new Set<string>();

    for (const hcp of hcps) {
      const history = await storage.getPrescriptionHistory(hcp.id);
      
      for (const record of history) {
        if (!drugsSet.has(record.productName)) {
          drugsSet.add(record.productName);
          
          // Enhanced drug properties for competitive intelligence
          const isOurDrug = record.productName === 'Onco-Pro';
          const manufacturer = isOurDrug ? 'Our Company' : 'BioPharma Rival';
          const indication = record.productCategory === 'Immunotherapy' ? 'RCC' : 'Bladder Cancer';
          
          await graphService.addNode(`drug_${record.productName.toLowerCase().replace(/\s+/g, '_')}`, NODE_TYPES.DRUG, {
            name: record.productName,
            category: record.productCategory,
            manufacturer,
            indication,
            firstPrescriptionDate: isOurDrug ? '2023-05-15' : '2024-02-10',
            competitorDrugs: isOurDrug ? ['Onco-Rival'] : ['Onco-Pro'],
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
        
        // Determine event topic based on event type and description
        let topic = 'general';
        if (event.eventType === 'conference') {
          topic = event.eventDescription?.toLowerCase().includes('immuno') ? 'immunotherapy' : 'oncology';
        } else if (event.eventType === 'workshop') {
          topic = 'clinical_practice';
        } else if (event.eventType === 'publication') {
          topic = 'research';
        }
        
        await graphService.addNode(eventId, NODE_TYPES.CLINICAL_EVENT, {
          id: event.id,
          name: event.eventTitle,
          date: event.eventDate,
          type: event.eventType,
          description: event.eventDescription,
          impact: event.impact,
          relatedDrug: event.relatedDrug,
          topic,
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
        // If patient has a switchedDate and switchedToDrug, they switched drugs
        if (patient.switchedDate && patient.switchedToDrug) {
          // In our data model: currentDrug == switchedToDrug (both are the drug they're on now)
          // We infer they switched FROM "Onco-Pro" (our company drug) TO competitor
          const previousDrug = "Onco-Pro"; // Our company's drug they switched away from
          const previousDrugId = `drug_${previousDrug.toLowerCase().replace(/\s+/g, '_')}`;
          const currentDrugId = `drug_${patient.currentDrug.toLowerCase().replace(/\s+/g, '_')}`;
          
          // Only create switching relationships if they actually changed drugs
          if (previousDrug !== patient.currentDrug) {
            // SWITCHED_FROM relationship
            await graphService.addRelationship(
              `patient_${patient.id}`,
              previousDrugId,
              RELATIONSHIP_TYPES.SWITCHED_FROM,
              {
                switchDate: patient.switchedDate,
              }
            );

            // SWITCHED_TO relationship  
            await graphService.addRelationship(
              `patient_${patient.id}`,
              currentDrugId,
              RELATIONSHIP_TYPES.SWITCHED_TO,
              {
                switchDate: patient.switchedDate,
              }
            );
            
            relationshipCount += 2;
          }
        }
      }
    }
    
    console.log(`[GraphETL] Created ${relationshipCount} switching relationships`);
  }

  /**
   * Load payers as nodes with enhanced market access properties
   */
  private async loadPayers(): Promise<void> {
    const payers = await storage.getAllPayers();
    console.log(`[GraphETL] Loading ${payers.length} payers...`);
    
    for (const payer of payers) {
      // Enhanced payer properties for market access intelligence
      const payerTier = payer.id === 1 ? 'tier1' : (payer.id === 2 ? 'tier2' : 'tier3');
      const livesUnderManagement = payer.id === 1 ? 5000000 : (payer.id === 2 ? 2500000 : 800000);
      
      await graphService.addNode(`payer_${payer.id}`, NODE_TYPES.PAYER, {
        id: payer.id,
        name: payer.name,
        type: payer.payerType === 'Government' ? 'medicare' : 'commercial',
        payerType: payer.payerType,
        tier: payerTier,
        denialRate: payer.denialRate,
        livesUnderManagement,
        coverageRestrictions: payer.policies,
        policies: payer.policies,
      });
    }
  }

  /**
   * Create access event relationships (PA denials, copay increases, etc.)
   */
  private async createAccessEventRelationships(): Promise<void> {
    const hcps = await storage.getAllHcps();
    let relationshipCount = 0;

    for (const hcp of hcps) {
      const accessEvents = await storage.getAccessEventsByHcp(hcp.id);
      
      for (const event of accessEvents) {
        // Create ACCESS_ISSUE relationship between Patient and Payer
        await graphService.addRelationship(
          `patient_${event.patientId}`,
          `payer_${event.payerId}`,
          RELATIONSHIP_TYPES.ACCESS_ISSUE,
          {
            eventType: event.eventType,
            eventDate: event.eventDate,
            impact: event.impact,
            drugName: event.drugName,
            denialReason: event.denialReason,
            copayAmount: event.copayAmount,
            expectedCopay: event.expectedCopay,
            lagDays: event.lagDays,
            switchedToDrug: event.switchedToDrug,
            switchDate: event.switchDate,
          }
        );
        relationshipCount++;
      }
    }
    
    console.log(`[GraphETL] Created ${relationshipCount} access event relationships`);
  }

  /**
   * Load territories as nodes with enhanced commercial properties
   */
  private async loadTerritories(): Promise<void> {
    // Demo data: Create 2 territories
    const territories = [
      { id: 'northeast', name: 'Northeast Territory', region: 'Northeast', accountCount: 15, hcpCount: 45 },
      { id: 'southwest', name: 'Southwest Territory', region: 'Southwest', accountCount: 12, hcpCount: 38 },
    ];

    for (const territory of territories) {
      await graphService.addNode(`territory_${territory.id}`, NODE_TYPES.TERRITORY, territory);
    }
    console.log(`[GraphETL] Loaded ${territories.length} territories`);
  }

  /**
   * Load accounts (hospitals/clinics) as nodes
   */
  private async loadAccounts(): Promise<void> {
    // Demo data: Create accounts from HCP data
    const hcps = await storage.getAllHcps();
    const accountsSet = new Set<string>();
    const accounts: any[] = [];

    for (const hcp of hcps) {
      if (hcp.hospital && !accountsSet.has(hcp.hospital)) {
        accountsSet.add(hcp.hospital);
        accounts.push({
          id: hcp.hospital.toLowerCase().replace(/\s+/g, '_'),
          name: hcp.hospital,
          type: 'hospital',
          oncologyFocus: true,
        });
      }
    }

    for (const account of accounts) {
      await graphService.addNode(`account_${account.id}`, NODE_TYPES.ACCOUNT, account);
    }
    console.log(`[GraphETL] Loaded ${accounts.length} accounts`);
  }

  /**
   * Load sales representatives as nodes
   */
  private async loadRepresentatives(): Promise<void> {
    const representatives = [
      { id: 'rep1', name: 'Jennifer Martinez', yearsExperience: 5, quota: 850000 },
      { id: 'rep2', name: 'Robert Johnson', yearsExperience: 8, quota: 920000 },
    ];

    for (const rep of representatives) {
      await graphService.addNode(`rep_${rep.id}`, NODE_TYPES.REPRESENTATIVE, rep);
    }
    console.log(`[GraphETL] Loaded ${representatives.length} representatives`);
  }

  /**
   * Load competitor companies as nodes
   */
  private async loadCompetitors(): Promise<void> {
    const competitors = [
      { id: 'biopharma_rival', name: 'BioPharma Rival', marketShare: 0.35, focusIndications: ['RCC', 'Bladder Cancer'] },
      { id: 'oncology_solutions', name: 'Oncology Solutions Inc', marketShare: 0.22, focusIndications: ['Prostate Cancer', 'RCC'] },
    ];

    for (const competitor of competitors) {
      await graphService.addNode(`competitor_${competitor.id}`, NODE_TYPES.COMPETITOR, competitor);
    }
    console.log(`[GraphETL] Loaded ${competitors.length} competitors`);
  }

  /**
   * Load clinical protocols as nodes
   */
  private async loadProtocols(): Promise<void> {
    const protocols = [
      { id: 'nccn_rcc_2025', name: 'NCCN RCC Guidelines', version: '2.2025', publishedDate: '2025-03-01', drugRecommendations: ['Onco-Pro', 'Onco-Rival'] },
      { id: 'esmo_bladder_2024', name: 'ESMO Bladder Cancer Protocol', version: '1.2024', publishedDate: '2024-11-15', drugRecommendations: ['Onco-Rival'] },
    ];

    for (const protocol of protocols) {
      await graphService.addNode(`protocol_${protocol.id}`, NODE_TYPES.PROTOCOL, protocol);
    }
    console.log(`[GraphETL] Loaded ${protocols.length} protocols`);
  }

  /**
   * Load clinical guidelines as nodes
   */
  private async loadGuidelines(): Promise<void> {
    const guidelines = [
      { id: 'nccn_kidney_2025', name: 'NCCN Kidney Cancer Guideline', organization: 'NCCN', version: '2.2025', publishedDate: '2025-02-01' },
      { id: 'asco_io_combo_2024', name: 'ASCO IO Combination Therapy Guideline', organization: 'ASCO', version: '3.2024', publishedDate: '2024-12-01' },
    ];

    for (const guideline of guidelines) {
      await graphService.addNode(`guideline_${guideline.id}`, NODE_TYPES.GUIDELINE, guideline);
    }
    console.log(`[GraphETL] Loaded ${guidelines.length} guidelines`);
  }

  /**
   * Create HCP referral network relationships
   */
  private async createReferralRelationships(): Promise<void> {
    // Demo: Create a multi-hop referral network for KOL cascade queries
    // Dr. Sarah Smith (HCP 1) is a KOL who refers to other oncologists
    await graphService.addRelationship('hcp_1', 'hcp_2', RELATIONSHIP_TYPES.REFERS_TO, { referralVolume: 12, primaryIndication: 'RCC', referralType: 'complex_cases' });
    await graphService.addRelationship('hcp_1', 'hcp_3', RELATIONSHIP_TYPES.REFERS_TO, { referralVolume: 8, primaryIndication: 'Bladder Cancer', referralType: 'second_opinion' });
    
    // Dr. Michael Chen (HCP 2) also makes some referrals
    await graphService.addRelationship('hcp_2', 'hcp_3', RELATIONSHIP_TYPES.REFERS_TO, { referralVolume: 5, primaryIndication: 'Prostate Cancer', referralType: 'specialty_consult' });
    
    // HCP 3 refers back to Dr. Smith for advanced immunotherapy (creates a network)
    await graphService.addRelationship('hcp_3', 'hcp_1', RELATIONSHIP_TYPES.REFERS_TO, { referralVolume: 3, primaryIndication: 'RCC', referralType: 'immunotherapy_expert' });
    
    console.log('[GraphETL] Created 4 referral relationships for multi-hop cascades');
  }

  /**
   * Create HCP-Account affiliation relationships
   */
  private async createAffiliationRelationships(): Promise<void> {
    const hcps = await storage.getAllHcps();
    let relationshipCount = 0;

    for (const hcp of hcps) {
      if (hcp.hospital) {
        const accountId = `account_${hcp.hospital.toLowerCase().replace(/\s+/g, '_')}`;
        await graphService.addRelationship(`hcp_${hcp.id}`, accountId, RELATIONSHIP_TYPES.AFFILIATED_WITH, { isPrimary: true });
        relationshipCount++;
      }
    }
    console.log(`[GraphETL] Created ${relationshipCount} affiliation relationships`);
  }

  /**
   * Create payer coverage relationships (formulary)
   */
  private async createCoverageRelationships(): Promise<void> {
    // Create payer-drug coverage relationships using actual payer IDs from storage
    const payers = await storage.getAllPayers();
    
    if (payers.length === 0) {
      console.warn('[GraphETL] No payers found, skipping coverage relationships');
      return;
    }

    // Create coverage for each payer and drug combination
    const coverages = [];
    for (const payer of payers) {
      const payerId = `payer_${payer.id}`;
      
      // Our drug (Onco-Pro) has variable coverage based on payer
      coverages.push({
        payerId,
        drugId: 'drug_onco-pro',
        tier: payer.id === 1 ? 'tier2' : (payer.id === 2 ? 'tier3' : 'tier3'),
        priorAuthRequired: payer.id !== 1,
      });
      
      // Competitor drug (Onco-Rival) generally has better coverage
      coverages.push({
        payerId,
        drugId: 'drug_onco-rival',
        tier: payer.id === 1 ? 'tier1' : 'tier2',
        priorAuthRequired: false,
      });
    }

    for (const coverage of coverages) {
      await graphService.addRelationship(
        coverage.payerId, 
        coverage.drugId, 
        RELATIONSHIP_TYPES.COVERS, 
        { 
          tier: coverage.tier,
          priorAuthRequired: coverage.priorAuthRequired,
        }
      );
    }
    
    console.log(`[GraphETL] Created ${coverages.length} coverage relationships`);
  }

  /**
   * Create competitive drug relationships
   */
  private async createCompetitorRelationships(): Promise<void> {
    // Demo: Mark competitive relationships
    await graphService.addRelationship('drug_onco-pro', 'drug_onco-rival', RELATIONSHIP_TYPES.COMPETES_WITH, { indication: 'RCC', marketSegment: 'Immunotherapy' });
    await graphService.addRelationship('drug_onco-rival', 'competitor_biopharma_rival', RELATIONSHIP_TYPES.MANUFACTURED_BY);
    
    // Link second competitor (Oncology Solutions Inc) - also competes in RCC/Prostate space
    await graphService.addRelationship('drug_onco-pro', 'competitor_oncology_solutions', RELATIONSHIP_TYPES.COMPETES_WITH, { indication: 'RCC', marketSegment: 'Targeted Therapy' });
    
    console.log('[GraphETL] Created 3 competitor relationships');
  }

  /**
   * Create event-drug feature relationships and protocol citations
   */
  private async createEducationRelationships(): Promise<void> {
    const hcps = await storage.getAllHcps();
    let relationshipCount = 0;

    for (const hcp of hcps) {
      const events = await storage.getClinicalEventsByHcp(hcp.id);
      
      for (const event of events) {
        // Link events to featured drugs if mentioned
        if (event.relatedDrug) {
          const drugId = `drug_${event.relatedDrug.toLowerCase().replace(/\s+/g, '_')}`;
          await graphService.addRelationship(`event_${event.id}`, drugId, RELATIONSHIP_TYPES.FEATURED_DRUG, { prominenceLevel: 'high' });
          relationshipCount++;
        }
      }
    }
    console.log(`[GraphETL] Created ${relationshipCount} education relationships`);
  }

  /**
   * Create territory assignment relationships and account-payer contracts
   */
  private async createTerritoryRelationships(): Promise<void> {
    const payers = await storage.getAllPayers(); // Get actual payers with real IDs
    
    // Demo: Assign reps to territories
    await graphService.addRelationship('territory_northeast', 'rep_rep1', RELATIONSHIP_TYPES.ASSIGNED_TO);
    await graphService.addRelationship('territory_southwest', 'rep_rep2', RELATIONSHIP_TYPES.ASSIGNED_TO);
    
    // Assign accounts to territories
    await graphService.addRelationship('account_city_general_hospital', 'territory_northeast', RELATIONSHIP_TYPES.IN_TERRITORY);
    await graphService.addRelationship('account_riverside_medical_center', 'territory_northeast', RELATIONSHIP_TYPES.IN_TERRITORY);
    
    // Assign HCPs to territories
    await graphService.addRelationship('hcp_1', 'territory_northeast', RELATIONSHIP_TYPES.IN_TERRITORY);
    await graphService.addRelationship('hcp_2', 'territory_northeast', RELATIONSHIP_TYPES.IN_TERRITORY);
    await graphService.addRelationship('hcp_3', 'territory_southwest', RELATIONSHIP_TYPES.IN_TERRITORY);
    
    // Create account-payer contracts (CONTRACTED_WITH relationships) using actual payer IDs
    // Match payers by name/type for robust selection independent of ordering
    let contractCount = 7; // Territory + account + HCP assignments
    
    if (payers.length >= 2) {
      // Find payers by business keys (type/name) instead of positional index
      const commercialPayers = payers.filter(p => p.payerType !== 'Government');
      const governmentPayers = payers.filter(p => p.payerType === 'Government');
      
      // Create contracts using first available payer of each type
      const preferredPayer = commercialPayers[0] || payers[0];
      const standardPayer = commercialPayers[1] || governmentPayers[0] || payers[1];
      const altPayer = governmentPayers[0] || payers[payers.length - 1];
      
      await graphService.addRelationship('account_city_general_hospital', `payer_${preferredPayer.id}`, RELATIONSHIP_TYPES.CONTRACTED_WITH, { contractType: 'preferred', effectiveDate: '2024-01-01', payerName: preferredPayer.name });
      await graphService.addRelationship('account_city_general_hospital', `payer_${standardPayer.id}`, RELATIONSHIP_TYPES.CONTRACTED_WITH, { contractType: 'standard', effectiveDate: '2023-06-01', payerName: standardPayer.name });
      await graphService.addRelationship('account_riverside_medical_center', `payer_${preferredPayer.id}`, RELATIONSHIP_TYPES.CONTRACTED_WITH, { contractType: 'preferred', effectiveDate: '2024-03-01', payerName: preferredPayer.name });
      await graphService.addRelationship('account_riverside_medical_center', `payer_${altPayer.id}`, RELATIONSHIP_TYPES.CONTRACTED_WITH, { contractType: 'standard', effectiveDate: '2023-11-01', payerName: altPayer.name });
      contractCount += 4;
    } else {
      console.warn('[GraphETL] Insufficient payers for account-payer contracts');
    }
    
    console.log(`[GraphETL] Created ${contractCount} territory and contract relationships`);
  }

  /**
   * Create patient-payer coverage relationships
   */
  private async createPatientPayerRelationships(): Promise<void> {
    const hcps = await storage.getAllHcps();
    const payers = await storage.getAllPayers(); // Get actual payers with real IDs
    let relationshipCount = 0;

    if (payers.length === 0) {
      console.warn('[GraphETL] No payers found, skipping patient-payer relationships');
      return;
    }

    for (const hcp of hcps) {
      const patients = await storage.getPatientsByHcp(hcp.id);
      
      for (const patient of patients) {
        // Assign patients to payers using actual payer IDs from storage
        const payerIndex = patient.id % payers.length;
        const payer = payers[payerIndex];
        const payerId = `payer_${payer.id}`;
        
        await graphService.addRelationship(
          `patient_${patient.id}`, 
          payerId, 
          RELATIONSHIP_TYPES.COVERED_BY, 
          { 
            enrollmentDate: '2023-01-01',
            payerName: payer.name,
            tier: payer.payerType === 'Government' ? 'medicare' : 'commercial',
          }
        );
        relationshipCount++;
      }
    }
    
    console.log(`[GraphETL] Created ${relationshipCount} patient-payer coverage relationships`);
  }

  /**
   * Create HCP-Hospital WORKS_AT relationships and create Hospital nodes
   */
  private async createHospitalRelationships(): Promise<void> {
    const hcps = await storage.getAllHcps();
    const hospitalsSet = new Set<string>();
    let relationshipCount = 0;

    for (const hcp of hcps) {
      if (hcp.hospital) {
        const hospitalId = `hospital_${hcp.hospital.toLowerCase().replace(/\s+/g, '_')}`;
        
        // Create hospital node if not exists
        if (!hospitalsSet.has(hcp.hospital)) {
          hospitalsSet.add(hcp.hospital);
          await graphService.addNode(hospitalId, NODE_TYPES.HOSPITAL, {
            id: hcp.hospital.toLowerCase().replace(/\s+/g, '_'),
            name: hcp.hospital,
            type: 'hospital',
            bedCount: 450,
            oncologyFocus: true,
          });
        }
        
        // Create WORKS_AT relationship
        await graphService.addRelationship(`hcp_${hcp.id}`, hospitalId, RELATIONSHIP_TYPES.WORKS_AT, { isPrimary: true });
        relationshipCount++;
      }
    }
    
    console.log(`[GraphETL] Created ${hospitalsSet.size} hospitals and ${relationshipCount} WORKS_AT relationships`);
  }

  /**
   * Create guideline citation and protocol following relationships
   */
  private async createGuidelineProtocolRelationships(): Promise<void> {
    // Link events to guidelines/protocols they cite
    await graphService.addRelationship('event_1', 'guideline_nccn_kidney_2025', RELATIONSHIP_TYPES.CITES_GUIDELINE, { citationType: 'featured' });
    await graphService.addRelationship('event_4', 'guideline_asco_io_combo_2024', RELATIONSHIP_TYPES.CITES_GUIDELINE, { citationType: 'referenced' });
    
    // Link HCPs to protocols they follow
    await graphService.addRelationship('hcp_1', 'protocol_nccn_rcc_2025', RELATIONSHIP_TYPES.FOLLOWS_PROTOCOL, { adherenceLevel: 'high' });
    await graphService.addRelationship('hcp_2', 'protocol_esmo_bladder_2024', RELATIONSHIP_TYPES.FOLLOWS_PROTOCOL, { adherenceLevel: 'moderate' });
    
    console.log('[GraphETL] Created 4 guideline/protocol relationships');
  }

  /**
   * Create manufacturer relationships for all drugs
   */
  private async createDrugManufacturerRelationships(): Promise<void> {
    // Link our drug to our company (create as competitor node for consistency)
    await graphService.addNode('competitor_our_company', NODE_TYPES.COMPETITOR, {
      id: 'our_company',
      name: 'Our Company',
      marketShare: 0.43,
      focusIndications: ['RCC', 'Bladder Cancer', 'Prostate Cancer'],
    });
    
    await graphService.addRelationship('drug_onco-pro', 'competitor_our_company', RELATIONSHIP_TYPES.MANUFACTURED_BY);
    
    console.log('[GraphETL] Created 1 additional manufacturer relationship');
  }

  /**
   * Create patient→drug DENIED_BY relationships for access barrier chains
   */
  private async createAccessDenialRelationships(): Promise<void> {
    const hcps = await storage.getAllHcps();
    const payers = await storage.getAllPayers(); // Get actual payers with real IDs
    let relationshipCount = 0;

    if (payers.length === 0) {
      console.warn('[GraphETL] No payers found, skipping access denial relationships');
      return;
    }

    for (const hcp of hcps) {
      const patients = await storage.getPatientsByHcp(hcp.id);
      
      for (const patient of patients) {
        // Create DENIED_BY and ACCESS_ISSUE edges for patients who had access barriers
        // These are patients whose switchReason was 'access_barrier'
        if (patient.switchedToDrug && patient.switchedDate) {
          // For Dr. Michael Chen's patients (hcp 2): all had access barriers
          if (hcp.id === 2 && patient.currentDrug) {
            const deniedDrug = "Onco-Pro"; // Our drug they were denied (they switched to competitor)
            const deniedDrugId = `drug_${deniedDrug.toLowerCase().replace(/\s+/g, '_')}`;
            const payerIndex = patient.id % payers.length;
            const payer = payers[payerIndex];
            const payerNodeId = `payer_${payer.id}`;
            
            // Patient -[:ACCESS_ISSUE]-> Drug (our drug they were denied)
            await graphService.addRelationship(
              `patient_${patient.id}`,
              deniedDrugId,
              RELATIONSHIP_TYPES.ACCESS_ISSUE,
              {
                denialReason: 'prior_authorization_denied',
                denialDate: patient.switchedDate,
                appealAttempts: patient.id % 2,
              }
            );
            
            // Patient -[:DENIED_BY]-> Payer (who denied our drug)
            await graphService.addRelationship(
              `patient_${patient.id}`,
              payerNodeId,
              RELATIONSHIP_TYPES.DENIED_BY,
              {
                deniedDrug: deniedDrug, // "Onco-Pro" (our drug)
                denialReason: 'prior_authorization_denied',
                denialDate: patient.switchedDate,
              }
            );
            relationshipCount += 2;
          }
          // For other HCPs: 1/3 had access barriers
          else if (hcp.id !== 1 && patient.id % 3 === 0 && patient.currentDrug) {
            const deniedDrug = "Onco-Pro"; // Our drug they were denied
            const deniedDrugId = `drug_${deniedDrug.toLowerCase().replace(/\s+/g, '_')}`;
            const payerIndex = patient.id % payers.length;
            const payer = payers[payerIndex];
            const payerNodeId = `payer_${payer.id}`;
            
            // Patient -[:ACCESS_ISSUE]-> Drug (our drug they were denied)
            await graphService.addRelationship(
              `patient_${patient.id}`,
              deniedDrugId,
              RELATIONSHIP_TYPES.ACCESS_ISSUE,
              {
                denialReason: 'formulary_tier_restriction',
                denialDate: patient.switchedDate,
                appealAttempts: 1,
              }
            );
            
            // Patient -[:DENIED_BY]-> Payer (who denied our drug)
            await graphService.addRelationship(
              `patient_${patient.id}`,
              payerNodeId,
              RELATIONSHIP_TYPES.DENIED_BY,
              {
                deniedDrug: deniedDrug, // "Onco-Pro" (our drug)
                denialReason: 'formulary_tier_restriction',
                denialDate: patient.switchedDate,
              }
            );
            relationshipCount += 2;
          }
        }
      }
    }
    
    console.log(`[GraphETL] Created ${relationshipCount} access denial relationships`);
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
      
      // Load core clinical nodes
      await this.loadHCPs();
      await this.loadPatients();
      await this.loadDrugs();
      await this.loadClinicalEvents();
      await this.loadPayers();
      
      // Load enhanced commercial nodes
      await this.loadTerritories();
      await this.loadAccounts();
      await this.loadRepresentatives();
      await this.loadCompetitors();
      await this.loadProtocols();
      await this.loadGuidelines();
      
      // Load field intelligence & AI nodes
      await this.loadAccessEvents();
      await this.loadCallNotes();
      await this.loadDetectedSignals();
      await this.loadPayerCommunications();
      await this.loadNBAsAndInsights();
      
      // Create core relationships
      await this.createPrescriptionRelationships();
      await this.createPatientRelationships();
      await this.createEventRelationships();
      await this.createSwitchingRelationships();
      // NOTE: createAccessEventRelationships() removed - it created incorrect ACCESS_ISSUE→Payer edges
      // Access barriers are handled by createAccessDenialRelationships() below
      
      // Create enhanced commercial relationships
      await this.createReferralRelationships();
      await this.createAffiliationRelationships();
      await this.createCoverageRelationships();
      await this.createCompetitorRelationships();
      await this.createEducationRelationships();
      await this.createTerritoryRelationships();
      await this.createPatientPayerRelationships();
      await this.createHospitalRelationships();
      await this.createGuidelineProtocolRelationships();
      await this.createDrugManufacturerRelationships();
      await this.createAccessDenialRelationships();
      
      // Run integrity check to detect orphaned nodes
      await this.checkDataIntegrity();
      
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

  /**
   * Load access events as nodes with detailed barrier metadata
   */
  private async loadAccessEvents(): Promise<void> {
    const hcps = await storage.getAllHcps();
    let totalEvents = 0;

    for (const hcp of hcps) {
      const accessEvents = await storage.getAccessEventsByHcp(hcp.id);
      totalEvents += accessEvents.length;
      
      for (const event of accessEvents) {
        const eventId = `access_event_${event.id}`;
        
        await graphService.addNode(eventId, NODE_TYPES.ACCESS_EVENT, {
          id: event.id,
          patientId: event.patientId,
          hcpId: event.hcpId,
          payerId: event.payerId,
          eventType: event.eventType,
          eventDate: event.eventDate?.toISOString() || new Date().toISOString(),
          drugName: event.drugName,
          denialReason: event.denialReason,
          denialCode: event.denialCode,
          copayAmount: event.copayAmount,
          lagDays: event.lagDays,
          switchedToDrug: event.switchedToDrug,
          impact: event.impact,
        });

        // Create HAD_ACCESS_EVENT relationship from Patient
        await graphService.addRelationship(
          `patient_${event.patientId}`,
          eventId,
          RELATIONSHIP_TYPES.HAD_ACCESS_EVENT,
          { date: event.eventDate }
        );

        // Create TRIGGERED_BY relationship from Payer if payer exists
        if (event.payerId) {
          const payers = await storage.getAllPayers();
          const payer = payers.find(p => p.id === event.payerId);
          if (payer) {
            const payerId = `payer_${payer.id}`; // Match loadPayers() format
            await graphService.addRelationship(
              eventId,
              payerId,
              RELATIONSHIP_TYPES.TRIGGERED_BY,
              { reason: event.denialReason }
            );
          }
        }
      }
    }
    
    console.log(`[GraphETL] Loaded ${totalEvents} access events`);
  }

  /**
   * Load call notes as nodes with field rep intelligence
   */
  private async loadCallNotes(): Promise<void> {
    const hcps = await storage.getAllHcps();
    let totalNotes = 0;

    for (const hcp of hcps) {
      const callNotes = await storage.getCallNotesByHcp(hcp.id);
      totalNotes += callNotes.length;
      
      for (const note of callNotes) {
        const noteId = `call_note_${note.id}`;
        
        await graphService.addNode(noteId, NODE_TYPES.CALL_NOTE, {
          id: note.id,
          hcpId: note.hcpId,
          repName: note.repName,
          visitDate: note.visitDate?.toISOString() || new Date().toISOString(),
          noteType: note.noteType,
          noteText: note.noteText,
          keyTopics: note.keyTopics,
          sentiment: note.sentiment,
        });

        // Create DOCUMENTED_IN relationship from HCP
        await graphService.addRelationship(
          `hcp_${hcp.id}`,
          noteId,
          RELATIONSHIP_TYPES.DOCUMENTED_IN,
          { 
            date: note.visitDate,
            sentiment: note.sentiment,
            noteType: note.noteType 
          }
        );
      }
    }
    
    console.log(`[GraphETL] Loaded ${totalNotes} call notes`);
  }

  /**
   * Load detected signals as nodes with AI agent observations
   */
  private async loadDetectedSignals(): Promise<void> {
    const hcps = await storage.getAllHcps();
    let totalSignals = 0;

    for (const hcp of hcps) {
      const signals = await storage.getDetectedSignals(hcp.id);
      totalSignals += signals.length;
      
      for (const signal of signals) {
        const signalId = `signal_${signal.id}`;
        
        await graphService.addNode(signalId, NODE_TYPES.DETECTED_SIGNAL, {
          id: signal.id,
          hcpId: signal.hcpId,
          signalType: signal.signalType,
          signalStrength: signal.signalStrength,
          signalSource: signal.signalSource,
          signalDescription: signal.signalDescription,
          detectedAt: signal.detectedAt?.toISOString() || new Date().toISOString(),
          contextData: signal.contextData,
        });

        // Create DETECTED_FOR relationship from HCP
        await graphService.addRelationship(
          signalId,
          `hcp_${hcp.id}`,
          RELATIONSHIP_TYPES.DETECTED_FOR,
          { 
            strength: signal.signalStrength,
            source: signal.signalSource,
            date: signal.detectedAt 
          }
        );
      }
    }
    
    console.log(`[GraphETL] Loaded ${totalSignals} detected signals`);
  }

  /**
   * Load payer communications as nodes with policy documents
   */
  private async loadPayerCommunications(): Promise<void> {
    const payers = await storage.getAllPayers();
    let totalComms = 0;

    // Get all payer communications (they're not HCP-specific)
    const allComms = await storage.getPayerCommunicationsByHcp(1); // Get sample to load
    
    for (const comm of allComms) {
      const commId = `payer_comm_${comm.id}`;
      
      await graphService.addNode(commId, NODE_TYPES.PAYER_COMMUNICATION, {
        id: comm.id,
        payerName: comm.payerName,
        documentType: comm.documentType,
        documentTitle: comm.documentTitle,
        receivedDate: comm.receivedDate?.toISOString() || new Date().toISOString(),
        effectiveDate: comm.effectiveDate?.toISOString(),
        products: comm.products,
        keyChanges: comm.keyChanges,
      });

      // Link to relevant payer
      const payer = payers.find(p => p.name === comm.payerName);
      if (payer) {
        const payerId = `payer_${payer.id}`; // Match loadPayers() format
        await graphService.addRelationship(
          payerId,
          commId,
          RELATIONSHIP_TYPES.TRIGGERED_BY,
          { 
            effectiveDate: comm.effectiveDate,
            documentType: comm.documentType 
          }
        );
      } else {
        console.warn(`[GraphETL] WARNING: PayerCommunication "${comm.documentTitle}" references unknown payer "${comm.payerName}" - node will be orphaned`);
      }
      totalComms++;
    }
    
    console.log(`[GraphETL] Loaded ${totalComms} payer communications`);
  }

  /**
   * Load NBAs and AI Insights as nodes
   */
  private async loadNBAsAndInsights(): Promise<void> {
    const hcps = await storage.getAllHcps();
    let totalNBAs = 0;
    let totalInsights = 0;

    for (const hcp of hcps) {
      // Load NBAs
      const nbas = await storage.getNbasByHcp(hcp.id);
      for (const nba of nbas) {
        const nbaId = `nba_${nba.id}`;
        
        await graphService.addNode(nbaId, NODE_TYPES.NBA, {
          id: nba.id,
          hcpId: nba.hcpId,
          action: nba.action,
          actionType: nba.actionType,
          priority: nba.priority,
          reason: nba.reason,
          aiInsight: nba.aiInsight,
          status: nba.status,
          generatedAt: nba.generatedAt?.toISOString() || new Date().toISOString(),
        });

        // Create RECOMMENDED_FOR relationship
        await graphService.addRelationship(
          nbaId,
          `hcp_${hcp.id}`,
          RELATIONSHIP_TYPES.RECOMMENDED_FOR,
          { 
            priority: nba.priority,
            status: nba.status,
            date: nba.generatedAt 
          }
        );
        totalNBAs++;
      }

      // Load AI Insights
      const insights = await storage.getAiInsights(hcp.id);
      for (const insight of insights) {
        const insightId = `insight_${insight.id}`;
        
        await graphService.addNode(insightId, NODE_TYPES.AI_INSIGHT, {
          id: insight.id,
          hcpId: insight.hcpId,
          insightType: insight.insightType,
          confidenceScore: insight.confidenceScore,
          narrative: insight.narrative,
          keySignals: insight.keySignals,
          generatedAt: insight.generatedAt?.toISOString() || new Date().toISOString(),
        });

        // Create HAS_INSIGHT relationship
        await graphService.addRelationship(
          `hcp_${hcp.id}`,
          insightId,
          RELATIONSHIP_TYPES.HAS_INSIGHT,
          { 
            confidence: insight.confidenceScore,
            type: insight.insightType,
            date: insight.generatedAt 
          }
        );
        totalInsights++;
      }
    }
    
    console.log(`[GraphETL] Loaded ${totalNBAs} NBAs and ${totalInsights} AI insights`);
  }

  /**
   * Check data integrity after ETL - report orphaned nodes by type
   */
  private async checkDataIntegrity(): Promise<void> {
    console.log('[GraphETL] Running data integrity checks...');
    
    try {
      // Query Neo4j directly for orphaned nodes (nodes with degree 0)
      const query = `
        MATCH (n)
        WHERE NOT (n)--()
        RETURN labels(n)[0] as type, id(n) as nodeId
        ORDER BY type
      `;
      
      const result = await graphService.runQuery(query);
      
      if (result.length === 0) {
        console.log('[GraphETL] ✅ Data integrity check passed - no orphaned nodes detected');
        return;
      }

      const orphanedByType: Record<string, number> = {};
      let totalOrphans = 0;

      result.forEach((record: any) => {
        // Extract fields from Neo4j record using .get() method
        const type = record.get ? record.get('type') : (record.type || 'unknown');
        orphanedByType[type] = (orphanedByType[type] || 0) + 1;
        totalOrphans++;
      });

      console.warn(`[GraphETL] ⚠️  Found ${totalOrphans} orphaned nodes (no relationships):`);
      Object.entries(orphanedByType).forEach(([type, count]) => {
        console.warn(`  - ${type}: ${count} orphaned`);
      });
    } catch (error) {
      console.error('[GraphETL] Failed to run integrity check:', error);
    }
  }
}

// Singleton instance
export const graphETL = new GraphETL();
