const englishPatterns = [
  /\b(i\s+want\s+to\s+die|want\s+to\s+die|wanna\s+die)\b/i,
  /\b(i\s+should\s+die|wish\s+i\s+was\s+dead|wish\s+i\s+were\s+dead)\b/i,
  /\b(i\s+will\s+die|i'?m\s+going\s+to\s+die|going\s+to\s+die)\b/i,
  /\b(kill\s+myself|end\s+my\s+life|take\s+my\s+life)\b/i,
  /\b(no\s+reason\s+to\s+live|do\s+not\s+want\s+to\s+live|don't\s+want\s+to\s+live)\b/i,
  /\b(suicide|suicidal|self\s*harm|hurt\s+myself)\b/i,
  /\bdie\b/i,
];

const hindiPatterns = [
  /मरना|मर जाऊं|मर जाऊँ|मरना चाहता|मरना चाहती|मर जाना/i,
  /मरूंगा|मरूंगी|मरूं|मरूँ|मौत/i,
  /जान देना|अपनी जान|खुदकुशी|आत्महत्या/i,
  /जीना नहीं|जीना नही|नहीं जीना|नही जीना/i,
  /खुद को मार|अपने आप को मार/i,
];

const hinglishPatterns = [
  /\b(marna|marna\s+hai|mar\s+ja(?:u|oo|un|unga|ungi)|mar\s+jana)\b/i,
  /\b(maru|marun|marunga|marungi|maut)\b/i,
  /\b(main|mai|mein|mujhe|muje)\s+(marna|mar\s+jana|mar\s+jaana|mar\s+jaun|mar\s+jaoon)\b/i,
  /\b(jeena\s+nahi|jeena\s+nhi|nahi\s+jeena|nhi\s+jeena)\b/i,
  /\b(apni\s+jaan\s+de(?:na|dunga|dungi)|jaan\s+de\s+d(?:u|oo|unga|ungi))\b/i,
  /\b(khudkushi|aatmahatya|suicide\s+kar(?:na|unga|ungi)?|khud\s+ko\s+maar)\b/i,
];

const crisisPatterns = [
  ...englishPatterns.map((pattern) => ({ language: "english", pattern })),
  ...hindiPatterns.map((pattern) => ({ language: "hindi", pattern })),
  ...hinglishPatterns.map((pattern) => ({ language: "hinglish", pattern })),
];

const normalizeText = (text = "") =>
  text
    .toString()
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();

export const detectCrisis = (text = "") => {
  const normalized = normalizeText(text);

  if (!normalized) {
    return {
      isCrisis: false,
      language: null,
      matchedText: null,
    };
  }

  for (const { language, pattern } of crisisPatterns) {
    const match = normalized.match(pattern);

    if (match) {
      return {
        isCrisis: true,
        language,
        matchedText: match[0],
      };
    }
  }

  return {
    isCrisis: false,
    language: null,
    matchedText: null,
  };
};

export const crisisFallbackReply =
  "I'm really sorry you're feeling this way. You are not alone. If you might hurt yourself or feel in immediate danger, please call your local emergency number now or reach out to someone you trust right away. In India, you can contact KIRAN at 1800-599-0019 for mental health support.";
