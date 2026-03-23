import axios from 'axios';

export interface FDADrugInfo {
  brand_name?: string;
  generic_name?: string;
  indications_and_usage?: string;
  dosage_and_administration?: string;
  adverse_reactions?: string;
  warnings?: string;
}

export const fetchDrugInfoFromFDA = async (medicineName: string): Promise<FDADrugInfo | null> => {
  try {
    // We call our own API proxy to avoid CORS issues
    const response = await axios.get(`/api/fda/drug?query=${encodeURIComponent(medicineName)}`);
    const result = response.data.results?.[0];
    
    if (!result) return null;

    return {
      brand_name: result.openfda?.brand_name?.[0],
      generic_name: result.openfda?.generic_name?.[0],
      indications_and_usage: result.indications_and_usage?.[0],
      dosage_and_administration: result.dosage_and_administration?.[0],
      adverse_reactions: result.adverse_reactions?.[0],
      warnings: result.warnings?.[0],
    };
  } catch (error) {
    console.error("OpenFDA fetch error:", error);
    return null;
  }
};
