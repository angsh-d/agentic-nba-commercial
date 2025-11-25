/**
 * Knowledge Graph Schema for Smart Territory Intelligence Platform
 * 
 * Enhanced schema with comprehensive commercial intelligence entities:
 * - Core Clinical: HCP, Patient, Drug, Indication, ClinicalEvent, Protocol, Guideline
 * - Commercial: Territory, Account, Hospital, Representative, Competitor
 * - Market Access: Payer, Cohort
 * 
 * Supports multi-hop reasoning for switching patterns, market access barriers,
 * referral networks, competitive intelligence, and KOL influence.
 */

export const NODE_TYPES = {
  // Clinical entities
  HCP: 'HCP',
  PATIENT: 'Patient',
  DRUG: 'Drug',
  INDICATION: 'Indication',
  CLINICAL_EVENT: 'ClinicalEvent',
  PROTOCOL: 'Protocol',
  GUIDELINE: 'Guideline',
  
  // Commercial entities
  TERRITORY: 'Territory',
  ACCOUNT: 'Account',
  HOSPITAL: 'Hospital',
  REPRESENTATIVE: 'Representative',
  COMPETITOR: 'Competitor',
  
  // Market access entities
  PAYER: 'Payer',
  COHORT: 'Cohort',
  ACCESS_EVENT: 'AccessEvent',
  PAYER_COMMUNICATION: 'PayerCommunication',
  
  // Field intelligence entities
  CALL_NOTE: 'CallNote',
  
  // AI & Signals entities
  DETECTED_SIGNAL: 'DetectedSignal',
  SIGNAL_CORRELATION: 'SignalCorrelation',
  AI_INSIGHT: 'AIInsight',
  NBA: 'NBA',
  AGENT_SESSION: 'AgentSession',
} as const;

export const RELATIONSHIP_TYPES = {
  // Clinical relationships
  PRESCRIBED: 'PRESCRIBED',
  TREATS: 'TREATS',
  HAS_INDICATION: 'HAS_INDICATION',
  SWITCHED_FROM: 'SWITCHED_FROM',
  SWITCHED_TO: 'SWITCHED_TO',
  
  // Event & education relationships
  ATTENDED: 'ATTENDED',
  PRESENTED_AT: 'PRESENTED_AT',
  INFLUENCED_BY: 'INFLUENCED_BY',
  FEATURED_DRUG: 'FEATURED_DRUG',
  FOLLOWS_PROTOCOL: 'FOLLOWS_PROTOCOL',
  CITES_GUIDELINE: 'CITES_GUIDELINE',
  
  // Market access relationships
  DENIED_BY: 'DENIED_BY',
  ACCESS_ISSUE: 'ACCESS_ISSUE',
  COVERED_BY: 'COVERED_BY',
  COVERS: 'COVERS',
  FORMULARY_TIER: 'FORMULARY_TIER',
  HAD_ACCESS_EVENT: 'HAD_ACCESS_EVENT',
  TRIGGERED_BY: 'TRIGGERED_BY',
  
  // Network & affiliation relationships
  REFERS_TO: 'REFERS_TO',
  AFFILIATED_WITH: 'AFFILIATED_WITH',
  WORKS_AT: 'WORKS_AT',
  MANAGES: 'MANAGES',
  ASSIGNED_TO: 'ASSIGNED_TO',
  
  // Competitive relationships
  COMPETES_WITH: 'COMPETES_WITH',
  MANUFACTURED_BY: 'MANUFACTURED_BY',
  
  // Cohort relationships
  BELONGS_TO: 'BELONGS_TO',
  
  // Territory relationships
  IN_TERRITORY: 'IN_TERRITORY',
  CONTRACTED_WITH: 'CONTRACTED_WITH',
  
  // Field intelligence relationships
  DOCUMENTED_IN: 'DOCUMENTED_IN',
  VISITED_BY: 'VISITED_BY',
  
  // AI & Signal relationships
  DETECTED_FOR: 'DETECTED_FOR',
  CORRELATED_WITH: 'CORRELATED_WITH',
  HAS_INSIGHT: 'HAS_INSIGHT',
  RECOMMENDED_FOR: 'RECOMMENDED_FOR',
  GENERATED_BY: 'GENERATED_BY',
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
  // === SWITCHING INTELLIGENCE PATTERNS ===
  
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
      MATCH (p:Patient)-[:HAS_INDICATION]->(i:Indication)
      MATCH (p)<-[:TREATS]-(hcp:HCP {id: $hcpId})
      MATCH (p)-[:SWITCHED_FROM]->(oldDrug:Drug)
      MATCH (p)-[:SWITCHED_TO]->(newDrug:Drug)
      WHERE oldDrug.manufacturer = $ourCompany
      RETURN p.id, i.name, oldDrug.name, newDrug.name, p.switchDate, p.switchReason
      ORDER BY p.switchDate DESC
    `,
    description: 'Trace patient-level switching patterns from our drugs to competitors',
  },
  
  COHORT_SWITCHING_PATTERN: {
    pattern: `
      MATCH (cohort:Cohort {name: $cohortName})<-[:BELONGS_TO]-(p:Patient)
      MATCH (p)-[:SWITCHED_FROM]->(oldDrug:Drug)
      MATCH (p)-[:SWITCHED_TO]->(newDrug:Drug)
      MATCH (p)<-[:TREATS]-(hcp:HCP)
      WHERE oldDrug.manufacturer = $ourCompany
      RETURN hcp.id, hcp.name, cohort.name, 
             oldDrug.name, newDrug.name, 
             count(p) as patientCount,
             collect(p.switchDate) as switchDates
      ORDER BY patientCount DESC
    `,
    description: 'Analyze switching patterns within patient cohorts',
  },
  
  // === MARKET ACCESS PATTERNS ===
  
  ACCESS_BARRIER_CHAIN: {
    pattern: `
      MATCH (p:Patient)<-[:TREATS]-(hcp:HCP {id: $hcpId})
      MATCH (p)-[:COVERED_BY]->(payer:Payer)
      MATCH (p)-[:DENIED_BY]->(payer)
      MATCH (p)-[:SWITCHED_TO]->(altDrug:Drug)
      WHERE p.deniedDrug = $ourDrug
      RETURN p.id, payer.name, payer.tier, p.deniedDrug, altDrug.name, 
             p.denialDate, p.switchDate
      ORDER BY p.denialDate DESC
    `,
    description: 'Identify access barriers (PA denials) leading to switches',
  },
  
  FORMULARY_COVERAGE_GAP: {
    pattern: `
      MATCH (hcp:HCP {id: $hcpId})-[:TREATS]->(p:Patient)-[:COVERED_BY]->(payer:Payer)
      MATCH (ourDrug:Drug {name: $ourDrug})
      WHERE NOT (payer)-[:COVERS]->(ourDrug)
      WITH payer, count(p) as patientCount
      MATCH (payer)-[:COVERS]->(competitorDrug:Drug)
      WHERE competitorDrug.indication = $indication
      RETURN payer.name, payer.tier, patientCount, 
             collect(competitorDrug.name) as coveredCompetitors
      ORDER BY patientCount DESC
    `,
    description: 'Find payers not covering our drug but covering competitors (market access choke points)',
  },
  
  ACCOUNT_PAYER_FRICTION: {
    pattern: `
      MATCH (account:Account {id: $accountId})-[:CONTRACTED_WITH]->(payer:Payer)
      MATCH (account)<-[:AFFILIATED_WITH]-(hcp:HCP)
      MATCH (hcp)-[:TREATS]->(p:Patient)-[:COVERED_BY]->(payer)
      MATCH (p)-[:ACCESS_ISSUE]->(deniedDrug:Drug)
      WHERE deniedDrug.manufacturer = $ourCompany
      WITH payer, hcp, count(p) as deniedCount
      RETURN payer.name, payer.tier, hcp.id, hcp.name, 
             deniedCount, account.name
      ORDER BY deniedCount DESC
    `,
    description: 'Identify account-level payer friction (contract exists but high denial rates)',
  },
  
  // === REFERRAL & INFLUENCE PATTERNS ===
  
  KOL_REFERRAL_CASCADE: {
    pattern: `
      MATCH (kol:HCP {id: $kolId})-[:REFERS_TO*1..2]->(hcp:HCP)
      MATCH (hcp)-[:PRESCRIBED]->(drug:Drug)
      WITH kol, hcp, drug, count(*) as rxCount
      RETURN kol.name as kolName, 
             hcp.id, hcp.name, hcp.specialty,
             drug.name, drug.manufacturer, 
             rxCount,
             length((kol)-[:REFERS_TO*]->(hcp)) as degreeOfSeparation
      ORDER BY rxCount DESC
    `,
    description: 'Map KOL referral networks and their prescribing influence (1-2 hops)',
  },
  
  HCP_NETWORK: {
    pattern: `
      MATCH (hcp:HCP {id: $hcpId})-[r]-(connected)
      RETURN hcp, type(r) as relationship, connected
      LIMIT $limit
    `,
    description: 'Get all entities connected to an HCP (patients, drugs, events, payers)',
  },
  
  ACCOUNT_HCP_ECOSYSTEM: {
    pattern: `
      MATCH (account:Account {id: $accountId})<-[:AFFILIATED_WITH]-(hcp:HCP)
      MATCH (hcp)-[:PRESCRIBED]->(drug:Drug)
      WITH account, hcp, drug, count(*) as rxCount
      RETURN account.name, hcp.id, hcp.name, hcp.specialty,
             drug.name, drug.manufacturer, rxCount
      ORDER BY rxCount DESC
    `,
    description: 'Map HCP prescribing behavior within a specific account (hospital/clinic)',
  },
  
  // === COMPETITIVE INTELLIGENCE PATTERNS ===
  
  COMPETITIVE_SHARE_EROSION: {
    pattern: `
      MATCH (hcp:HCP {id: $hcpId})-[:PRESCRIBED]->(ourDrug:Drug)
      WHERE ourDrug.manufacturer = $ourCompany
      MATCH (hcp)-[:PRESCRIBED]->(compDrug:Drug)-[:COMPETES_WITH]->(ourDrug)
      WITH hcp, ourDrug, compDrug, count(*) as rxCount
      RETURN hcp.id, hcp.name, 
             ourDrug.name, 
             compDrug.name, compDrug.manufacturer,
             rxCount
      ORDER BY rxCount DESC
    `,
    description: 'Identify competitive drugs gaining share against our products',
  },
  
  EVENT_COMPETITOR_MESSAGING: {
    pattern: `
      MATCH (event:ClinicalEvent)-[:FEATURED_DRUG]->(compDrug:Drug)
      MATCH (event)<-[:ATTENDED]-(hcp:HCP)
      WHERE compDrug.manufacturer <> $ourCompany
      MATCH (hcp)-[:PRESCRIBED]->(compDrug)
      RETURN event.name, event.date, event.topic,
             compDrug.name, compDrug.manufacturer,
             collect(hcp.name) as attendedHCPs,
             count(hcp) as hcpCount
      ORDER BY event.date DESC
    `,
    description: 'Track competitor product messaging at clinical events and subsequent adoption',
  },
  
  // === TERRITORY & PLANNING PATTERNS ===
  
  TERRITORY_OPPORTUNITY_MAP: {
    pattern: `
      MATCH (territory:Territory {id: $territoryId})-[:ASSIGNED_TO]->(rep:Representative)
      MATCH (territory)<-[:IN_TERRITORY]-(account:Account)<-[:AFFILIATED_WITH]-(hcp:HCP)
      MATCH (hcp)-[:TREATS]->(p:Patient)-[:HAS_INDICATION]->(i:Indication)
      WHERE i.name = $indication
      WITH territory, rep, account, hcp, count(p) as patientVolume
      OPTIONAL MATCH (hcp)-[:PRESCRIBED]->(ourDrug:Drug {manufacturer: $ourCompany})
      WITH territory, rep, account, hcp, patientVolume, count(ourDrug) as ourRxCount
      RETURN territory.name, rep.name, account.name, 
             hcp.id, hcp.name, patientVolume, ourRxCount,
             (patientVolume - ourRxCount) as untappedOpportunity
      ORDER BY untappedOpportunity DESC
    `,
    description: 'Identify high-opportunity HCPs in territory (high patient volume, low share)',
  },
};

// === NODE PROPERTY INTERFACES ===

/**
 * Enhanced property interfaces documenting expected attributes per node type.
 * These guide ETL pipeline and support efficient Neo4j queries.
 */

export interface HCPProperties {
  id: string;
  name: string;
  specialty: string;
  npi?: string;
  tier?: 'A' | 'B' | 'C';
  isKOL?: boolean;
  referralVolume?: number;
  prescriptionVolume?: number;
  channelPreference?: 'inPerson' | 'virtual' | 'email';
}

export interface DrugProperties {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  indication?: string;
  launchDate?: string;
  competitorDrugs?: string[];
}

export interface PatientProperties {
  id: string;
  indication?: string;
  currentDrug?: string;
  switchDate?: string;
  switchReason?: string;
  deniedDrug?: string;
  denialDate?: string;
  cohort?: string;
}

export interface PayerProperties {
  id: string;
  name: string;
  type: 'commercial' | 'medicare' | 'medicaid';
  tier?: 'tier1' | 'tier2' | 'tier3';
  livesUnderManagement?: number;
  coverageRestrictions?: string;
}

export interface AccountProperties {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'practice';
  bedCount?: number;
  patientVolume?: number;
  oncologyFocus?: boolean;
}

export interface TerritoryProperties {
  id: string;
  name: string;
  region: string;
  accountCount?: number;
  hcpCount?: number;
}

export interface RepresentativeProperties {
  id: string;
  name: string;
  email?: string;
  yearsExperience?: number;
  quota?: number;
}

export interface ClinicalEventProperties {
  id: string;
  name: string;
  date: string;
  type: 'conference' | 'webinar' | 'dinner' | 'advisory_board';
  topic?: string;
  sponsor?: string;
  attendeeCount?: number;
}

export interface ProtocolProperties {
  id: string;
  name: string;
  version: string;
  publishedDate: string;
  drugRecommendations?: string[];
}

export interface GuidelineProperties {
  id: string;
  name: string;
  organization: string;
  version: string;
  publishedDate: string;
  recommendedDrugs?: string[];
}

export interface CompetitorProperties {
  id: string;
  name: string;
  marketShare?: number;
  focusIndications?: string[];
}

export interface IndicationProperties {
  id: string;
  name: string;
  prevalence?: number;
}

export interface CohortProperties {
  id: string;
  name: string;
  description?: string;
  patientCount?: number;
}

export interface AccessEventProperties {
  id: string;
  patientId: number;
  hcpId: number;
  payerId?: number;
  eventType: string;
  eventDate: string;
  drugName: string;
  denialReason?: string;
  denialCode?: string;
  copayAmount?: number;
  lagDays?: number;
  switchedToDrug?: string;
  impact: string;
}

export interface CallNoteProperties {
  id: string;
  hcpId: number;
  repName: string;
  visitDate: string;
  noteType: string;
  noteText: string;
  keyTopics?: string[];
  sentiment?: string;
}

export interface DetectedSignalProperties {
  id: string;
  hcpId: number;
  signalType: string;
  signalStrength: number;
  signalSource: string;
  signalDescription: string;
  detectedAt: string;
  contextData?: Record<string, any>;
}

export interface PayerCommunicationProperties {
  id: string;
  payerName: string;
  documentType: string;
  documentTitle: string;
  receivedDate: string;
  effectiveDate?: string;
  products?: string[];
  keyChanges?: string[];
}

export interface AIInsightProperties {
  id: string;
  hcpId: number;
  insightType: string;
  confidenceScore: number;
  narrative: string;
  keySignals?: string[];
  generatedAt: string;
}

export interface NBAProperties {
  id: string;
  hcpId: number;
  action: string;
  actionType: string;
  priority: string;
  reason: string;
  aiInsight: string;
  status: string;
  generatedAt: string;
}

export interface AgentSessionProperties {
  id: string;
  goalDescription: string;
  goalType: string;
  status: string;
  currentPhase?: string;
  confidenceScore?: number;
  startedAt: string;
  completedAt?: string;
}
