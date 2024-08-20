export const analyzePlayer = (player, allPlayers, budget, teamSize) => {
  const yahooAvg = player.Y_AVG;
  const espnAvg = player.ESPN_AVG;

  // Calculate average of Yahoo and ESPN values
  const avgValue = (yahooAvg + espnAvg) / 2;

  return {
    ...player,
    avgPlatformValue: avgValue,
  };
};

export const calculateRemainingBudget = (totalBudget, draftedPlayers) => {
  const spentBudget = Object.values(draftedPlayers).reduce((sum, info) => sum + info.price, 0);
  return totalBudget - spentBudget;
};