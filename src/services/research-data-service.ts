export interface ResearchStats {
  paperCount: number;
  hypothesisCount: number;
  nodeCount: number;
  latestHypothesis?: {
    id: string;
    statement: string;
    title?: string;
    created: string;
  };
}

export interface SPARQLBinding {
  type: 'literal' | 'uri';
  value: string;
  datatype?: string;
}

export interface SPARQLResponse {
  head: {
    vars: string[];
  };
  results: {
    bindings: Array<{
      [key: string]: SPARQLBinding;
    }>;
  };
}

class ResearchDataService {
  private sparqlEndpoint: string;
  private enabled: boolean;

  constructor() {
    this.sparqlEndpoint = process.env.NEXT_PUBLIC_SPARQL_ENDPOINT_URL || '';
    this.enabled = process.env.NEXT_PUBLIC_RESEARCH_API_ENABLED === 'true';
    
    if (!this.sparqlEndpoint && this.enabled) {
      console.warn('[Research Data Service] SPARQL endpoint URL not configured');
    }
  }

  private async executeSPARQLQuery(query: string): Promise<SPARQLResponse> {
    if (!this.enabled || !this.sparqlEndpoint) {
      throw new Error('Research data service not configured');
    }

    try {
      const response = await fetch(this.sparqlEndpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/sparql-results+json,*/*;q=0.9',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `query=${encodeURIComponent(query)}`
      });

      if (!response.ok) {
        throw new Error(`SPARQL query failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Research Data Service] SPARQL query error:', error);
      throw error;
    }
  }

  private getDashboardStatsQuery(): string {
    return `
      PREFIX dcterms: <http://purl.org/dc/terms/>
      PREFIX schema: <https://schema.org/>
      PREFIX deo: <http://purl.org/spar/deo/>

      SELECT ?paper_count ?hypothesis_count ?node_count ?latest_hypothesis ?hypothesis_statement ?title
      ?created
      WHERE {
        {
          SELECT
            (COUNT(DISTINCT ?paper) AS ?paper_count)
            (COUNT(DISTINCT ?hypothesis) AS ?hypothesis_count)
            (COUNT(DISTINCT ?node) AS ?node_count)
          WHERE {
            {
              GRAPH ?paper {
                ?paper dcterms:title ?title ;
                       dcterms:abstract ?abstract .
              }
            }
            UNION
            {
              GRAPH <https://hypothesis.aubr.ai> {
                ?hypothesis dcterms:references ?hypothesis_statement .
              }
            }
            UNION
            {
              GRAPH ?g {
                ?node ?p ?o .
              }
            }
          }
        }

        OPTIONAL {
          SELECT ?latest_hypothesis ?hypothesis_statement ?title ?created
          WHERE {
            GRAPH <https://hypothesis.aubr.ai> {
              ?latest_hypothesis dcterms:references ?hypothesis_statement .
              OPTIONAL { ?latest_hypothesis dcterms:title ?title }
              OPTIONAL { ?latest_hypothesis dcterms:created ?created }
            }
          }
          ORDER BY DESC(?created)
          LIMIT 1
        }
      }
    `;
  }

  // Mock data for development/demo
  private getMockResearchStats(): ResearchStats {
    const hypotheses = [
      "Mitochondrial DNA mutations don't just accumulate with age - they actively sabotage our cells' quality control systems, creating a vicious cycle where damaged mitochondria escape destruction and proliferate like cellular parasites.",
      "Cellular senescence acts as a double-edged sword: while preventing cancer in youth, it becomes a primary driver of aging through the SASP (Senescence-Associated Secretory Phenotype) cascade.",
      "The key to longevity isn't just clearing senescent cells, but reprogramming them back to a functional state using targeted epigenetic interventions.",
      "Age-related stem cell exhaustion can be reversed by manipulating the Wnt signaling pathway without increasing cancer risk.",
      "Protein aggregation in aging follows predictable thermodynamic patterns that can be disrupted using molecular chaperone cocktails."
    ];
    
    const randomHypothesis = hypotheses[Math.floor(Math.random() * hypotheses.length)];
    const paperCount = 1995 + Math.floor(Math.random() * 10); // 1995-2004
    const hypothesisCount = 12 + Math.floor(Math.random() * 3); // 12-14
    
    return {
      paperCount,
      hypothesisCount,
      latestHypothesis: {
        id: `https://hypothesis.aubr.ai/${Date.now()}`,
        statement: randomHypothesis,
        title: null,
        created: new Date(Date.now() - Math.random() * 86400000).toISOString() // Random time in last 24h
      }
    };
  }

  async getResearchStats(): Promise<ResearchStats> {
    // Always use mock data for now
    console.log('[Research Data Service] Using mock research data');
    return this.getMockResearchStats();
    
    try {
      console.log('[Research Data Service] Fetching research statistics...');

      const query = this.getDashboardStatsQuery();
      const response = await this.executeSPARQLQuery(query);

      if (response.results.bindings.length === 0) {
        throw new Error('No research data found');
      }

      const binding = response.results.bindings[0];

      const stats: ResearchStats = {
        paperCount: parseInt(binding.paper_count?.value || '0'),
        hypothesisCount: parseInt(binding.hypothesis_count?.value || '0'),
        nodeCount: parseInt(binding.node_count?.value || '0'),
      };

      // Add latest hypothesis if available
      if (binding.latest_hypothesis && binding.hypothesis_statement) {
        stats.latestHypothesis = {
          id: binding.latest_hypothesis.value,
          statement: binding.hypothesis_statement.value,
          title: binding.title?.value,
          created: binding.created?.value || new Date().toISOString(),
        };
      }

      console.log('[Research Data Service] Successfully fetched research stats:', stats);
      return stats;

    } catch (error) {
      console.error('[Research Data Service] Error fetching research stats:', error);
      
      // Return fallback data on error
      return {
        paperCount: 0,
        hypothesisCount: 0,
        nodeCount: 0,
      };
    }
  }

  // Format hypothesis statement for display (truncate if too long)
  formatHypothesisPreview(statement: string, maxLength: number = 120): string {
    if (!statement) return '';
    
    if (statement.length <= maxLength) {
      return statement;
    }
    
    return statement.substring(0, maxLength).trim() + '...';
  }

  // Extract key metrics from hypothesis statement
  extractHypothesisMetrics(statement: string): { hasPercentage: boolean; hasPrediction: boolean; hasTimeframe: boolean } {
    const hasPercentage = /\d+%/.test(statement);
    const hasPrediction = /predict|hypothesis|expect/i.test(statement);
    const hasTimeframe = /\d+\s*(months?|years?|weeks?|days?)/i.test(statement);
    
    return {
      hasPercentage,
      hasPrediction,
      hasTimeframe
    };
  }
}

export const researchDataService = new ResearchDataService();