export const calculateScore = (inputs) => {
  const {
    soilType = 'loamy',
    fertilizerType = 'organic',
    seedQuality = 'high',
    irrigationType = 'drip',
    aiAdopted = false
  } = inputs

  const soilScores = {
    loamy: 25,
    silt: 20,
    clay: 15,
    sandy: 10
  }

  const fertilizerScores = {
    organic: 30,
    mixed: 20,
    chemical: 10
  }

  const seedScores = {
    high: 25,
    medium: 15,
    low: 5
  }

  const irrigationScores = {
    drip: 10,
    flood: 7,
    rainfed: 4
  }

  const soilPoints = soilScores[soilType] || 0
  const fertilizerPoints = fertilizerScores[fertilizerType] || 0
  const seedPoints = seedScores[seedQuality] || 0
  const irrigationPoints = irrigationScores[irrigationType] || 0
  const aiPoints = aiAdopted ? 10 : 0

  const total = soilPoints + fertilizerPoints + seedPoints + irrigationPoints + aiPoints

  return {
    total,
    breakdown: {
      soil: soilPoints,
      fertilizer: fertilizerPoints,
      seed: seedPoints,
      irrigation: irrigationPoints,
      aiAdoption: aiPoints
    }
  }
}

export const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Average'
  return 'Poor'
}

export const getScoreColor = (score) => {
  if (score >= 80) return 'green'
  if (score >= 60) return 'amber'
  if (score >= 40) return 'orange'
  return 'red'
}

export const getScoreBgColor = (score) => {
  if (score >= 80) return 'bg-green-100'
  if (score >= 60) return 'bg-yellow-100'
  if (score >= 40) return 'bg-orange-100'
  return 'bg-red-100'
}

export const getScoreTextColor = (score) => {
  if (score >= 80) return 'text-green-800'
  if (score >= 60) return 'text-yellow-800'
  if (score >= 40) return 'text-orange-800'
  return 'text-red-800'
}
