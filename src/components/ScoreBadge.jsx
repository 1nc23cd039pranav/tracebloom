import { getScoreBgColor, getScoreTextColor, getScoreLabel } from '../utils/scoreCalculator'

export default function ScoreBadge({ score }) {
  const bgColor = getScoreBgColor(score)
  const textColor = getScoreTextColor(score)
  const label = getScoreLabel(score)

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${bgColor} ${textColor} text-sm font-semibold`}>
      <span className="text-lg">●</span>
      <span>{score}</span>
      <span className="text-xs font-medium">{label}</span>
    </div>
  )
}
