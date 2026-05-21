export type ReviewCriterion = {
  id: string
  label: string
  completed: boolean
}

export type ReviewStatus = {
  phaseId: number
  phaseName: string
  onTrack: boolean
  missingCount: number
  criteria: ReviewCriterion[]
  missing: { id: string; label: string }[]
}

export type ReviewAnalysisItem = {
  id: string
  label: string
  met: boolean
  feedback: string
}

export type ReviewAnalysis = {
  summary: string
  items: ReviewAnalysisItem[]
  source?: string
}
