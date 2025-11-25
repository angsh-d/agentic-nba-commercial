/**
 * Knowledge Graph Schema for Smart Territory Intelligence Platform
 * 
 * Entities: HCP, Drug, Patient, ClinicalEvent, Payer, Indication, Cohort
 * Relationships: PRESCRIBED, TREATS, ATTENDED, SWITCHED_FROM, DENIED_BY, etc.
 */

export const NODE_TYPES = {
  HCP: 'HCP',
  DRUG: 'Drug',
  PATIENT: 'Patient',
  CLINICAL_EVENT: 'ClinicalEvent',
  PAYER: 'Payer',
  INDICATION: 'Indication',
  COHORT: 'Cohort',
} as const;

export const RELATIONSHIP_TYPES = {
  PRESCRIBED: 'PRESCRIBED',
  TREATS: 'TREATS',
  ATTENDED: 'ATTENDED',
  SWITCHED_FROM: 'SWITCHED_FROM',
  SWITCHED_TO: 'SWITCHED_TO',
  DENIED_BY: 'DENIED_BY',
  ACCESS_ISSUE: 'ACCESS_ISSUE',
  HAS_INDICATION: 'HAS_INDICATION',
  BELONGS_TO: 'BELONGS_TO',
  INFLUENCED_BY: 'INFLUENCED_BY',
  PRESENTED_AT: 'PRESENTED_AT',
} as const;

export interface GraphNode {
  id: string;
  type: keyof typeof NODE_TYPES;
  properties: Record<string, any>;
}

export interface GraphRelationship {
  type: keyof typeof RELATIONSHIP_TYPES;
  from: string;
  to: string;
  properties?: Record<string, any>;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

// Multi-hop query patterns
export interface MultiHopQuery {
  pattern: string;
  params?: Record<string, any>;
  description: string;
}

export const COMMON_PATTERNS: Record<string, MultiHopQuery> = {
  INFLUENCING_EVENTS: {
    pattern: `
      MATCH (hcp:HCP {id: $hcpId})-[:PRESCRIBED]->(drug:Drug)
      WHERE drug.name CONTAINS $competitorDrug
      MATCH (hcp)-[:ATTENDED]->(event:ClinicalEvent)
      WHERE event.date < drug.firstPrescriptionDate
      RETURN event.name, event.date, event.topic, drug.name, drug.firstPrescriptionDate
      ORDER BY event.date DESC
    `,
    description: 'Find clinical events that influenced switches to competitor drugs',
  },
  PATIENT_SWITCHING_PATH: {
    pattern: `
      MATCH path = (p:Patient)-[:HAS_INDICATION]->(i:Indication)
                   -[:TREATED_WITH]->(:Drug)<-[:PRESCRIBED]-(hcp:HCP {id: $hcpId})
      MATCH (p)-[:SWITCHED_FROM]->(oldDrug:Drug)
      MATCH (p)-[:SWITCHED_TO]->(newDrug:Drug)
      WHERE oldDrug.manufacturer = $ourCompany
      RETURN p.id, i.name, oldDrug.name, newDrug.name, p.switchDate, p.switchReason
      ORDER BY p.switchDate DESC
    `,
    description: 'Trace patient-level switching patterns from our drugs to competitors',
  },
  HCP_NETWORK: {
    pattern: `
      MATCH (hcp:HCP {id: $hcpId})-[r]-(connected)
      RETURN hcp, type(r) as relationship, connected
      LIMIT $limit
    `,
    description: 'Get all entities connected to an HCP (patients, drugs, events, payers)',
  },
  ACCESS_BARRIER_CHAIN: {
    pattern: `
      MATCH (p:Patient)-[:TREATS]-(hcp:HCP {id: $hcpId})
      MATCH (p)-[:DENIED_BY]->(payer:Payer)-[:DENIED]-(drug:Drug)
      MATCH (p)-[:SWITCHED_TO]->(altDrug:Drug)
      WHERE drug.manufacturer = $ourCompany
      RETURN p.id, payer.name, drug.name, altDrug.name, p.denialDate, p.switchDate
      ORDER BY p.denialDate DESC
    `,
    description: 'Identify access barriers (PA denials) leading to switches',
  },
  COHORT_SWITCHING_PATTERN: {
    pattern: `
      MATCH (cohort:Cohort {name: $cohortName})<-[:BELONGS_TO]-(p:Patient)
      MATCH (p)-[:SWITCHED_FROM]->(oldDrug:Drug)
      MATCH (p)-[:SWITCHED_TO]->(newDrug:Drug)
      MATCH (p)-[:TREATS]-(hcp:HCP)
      WHERE oldDrug.manufacturer = $ourCompany
      RETURN hcp.id, hcp.name, cohort.name, 
             oldDrug.name, newDrug.name, 
             count(p) as patientCount,
             collect(p.switchDate) as switchDates
      ORDER BY patientCount DESC
    `,
    description: 'Analyze switching patterns within patient cohorts',
  },
};
