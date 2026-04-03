chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeProfile') {
    handleProfileAnalysis(request.profileData)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

async function handleProfileAnalysis(profileData) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['geminiApiKey'], async (result) => {
      const apiKey = result.geminiApiKey;
      if (!apiKey) {
        return reject(new Error('API Key not found. Please click the extension icon and enter your Gemini API Key.'));
      }

      // Safe extraction to just stringify
      const pd = profileData || {};

      const prompt = `You are an expert career counselor, mentor, and AI profiler. Analyze the following LinkedIn profile data.
Your goal is to provide highly specific, actionable advice on how they can better align their current experience with their implied or stated career goals.

Profile Data:
- Name/Headline: ${pd.headline || 'Unknown'}
- About/Bio: ${pd.about || 'Not provided'}
- Recent Experience: ${pd.experience || 'Not provided'}

Instructions:
1. Examine what their current experience/trajectory is.
2. Examine what their goals/trajectory seem to be based on their bio or headline.
3. Suggest 3 to 5 highly specific, actionable steps they can take to reach their goals from their current standing. For example, if they state they want to go into fusion as a chemical engineer, suggest finding a lab dealing with tungsten oxides used in fusion reactor walls.
4. The advice MUST be tailored to their specific industry, major, and goals.
5. Start off with a brief, encouraging summary of where they stand.

Format Requirement:
Output your response entirely in valid HTML (using tags like <h3>, <p>, <ul>, <li>, <strong>). DO NOT wrap your output in markdown blocks like \`\`\`html or \`\`\`. Start directly with the HTML content. Keep it clean and easily embeddable inside a website.`;

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`API Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        if (data.candidates && data.candidates.length > 0) {
          let text = data.candidates[0].content.parts[0].text;
          // Strip any possible markdown formatting the model might still produce
          text = text.replace(/```html/gi, '').replace(/```/g, '').trim();
          resolve(text);
        } else {
          throw new Error('No valid response received from the AI model.');
        }
      } catch (err) {
        reject(err);
      }
    });
  });
}
