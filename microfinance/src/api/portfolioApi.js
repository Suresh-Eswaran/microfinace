import api from './api';

export const portfolioApi = {
  par:                () => api.get('/portfolio/par'),
  parSegmented:       () => api.get('/portfolio/par-segmented'),
  vintage:            () => api.get('/portfolio/vintage'),
  collectionEfficiency:()=> api.get('/portfolio/collection-efficiency'),
  yieldCost:          () => api.get('/portfolio/yield-cost'),
  officerProductivity:() => api.get('/portfolio/officers-productivity'),
  delinquencyHeatmap: () => api.get('/portfolio/delinquency-heatmap'),
  productProfitability:()=> api.get('/portfolio/product-profitability'),
  clv:                () => api.get('/portfolio/clv'),
  earlyWarning:       () => api.get('/portfolio/early-warning'),
};

export const analyticsApi = {
  anomalies:    () => api.get('/analytics/anomalies'),
  forecast:     () => api.get('/analytics/forecast'),
  benchmarks:   () => api.get('/analytics/benchmarks'),
  bottlenecks:  () => api.get('/analytics/bottlenecks'),
  weeklyInsights:()=> api.get('/analytics/weekly-insights'),
  riskRanking:  () => api.get('/analytics/risk-ranking'),
  strategic:    () => api.get('/analytics/strategic'),
};
