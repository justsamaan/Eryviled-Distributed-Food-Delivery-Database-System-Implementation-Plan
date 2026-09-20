const POSITIVE_WORDS = ['delicious', 'tasty', 'great', 'fast', 'excellent', 'fresh', 'recommend', 'best', 'amazing', 'good', 'favorite'];
const NEGATIVE_WORDS = ['slow', 'cold', 'bad', 'terrible', 'wrong', 'missing', 'expensive', 'disappointed', 'rude', 'burned', 'spicy', 'salty'];

function analyzeText(text) {
  if (!text) return { label: 'NEUTRAL', score: 0, themes: [] };

  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  let posCount = 0;
  let negCount = 0;
  const foundThemes = [];

  words.forEach(word => {
    if (POSITIVE_WORDS.includes(word)) {
      posCount++;
      foundThemes.push(word);
    } else if (NEGATIVE_WORDS.includes(word)) {
      negCount++;
      foundThemes.push(word);
    }
  });

  const total = words.length;
  let score = 0;
  if (total > 0) {
    score = (posCount - negCount) / total;
  }

  let label = 'NEUTRAL';
  if (score > 0.05) label = 'POSITIVE';
  else if (score < -0.05) label = 'NEGATIVE';

  return {
    label,
    score: Number(score.toFixed(2)),
    themes: foundThemes
  };
}

module.exports = { analyzeText };
