
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { NewsArticle, ChatMessage, TimelineEvent, MissionBriefing, RippleResult, ChaosPuzzle } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateDailyHeadline = async (): Promise<NewsArticle | null> => {
  const ai = getClient();
  // Using a reliable Wikimedia URL for Gandhi
  const gandhiImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Gandhi_spinning.jpg/640px-Gandhi_spinning.jpg";

  if (!ai) {
    // Fallback if no API key - Matches the "The Bombay Chronicle" 1922 reference
    return {
      headline: "MAHATMA ARRESTED.",
      date: "SATURDAY, MARCH 11, 1922",
      content: "GREAT EXCITEMENT PREVAILS. Mahatma Gandhi was arrested at the Sabarmati Ashram on the charge of sedition. He made no resistance and asked the people to preserve perfect peace. The arrest was made by Mr. Healey, the Superintendent of Police, at 10:30 PM.",
      weather: "Tense Atmosphere",
      imageUrl: gandhiImage
    };
  }

  const prompt = `
    You are the editor of a 1920s mystical newspaper called "Timension".
    Generate a front-page headline and a short story (approx 60 words) focused on a key event in the Indian Independence movement during the 1920s (e.g., Non-Cooperation Movement, Chauri Chaura incident, Simon Commission protests).
    The date should be historically accurate for the event chosen.
    Also provide a "Weather of Time" forecast (e.g., "Winds of Swaraj, 32°C").
    
    IMPORTANT: 
    - Headline must be punchy, uppercase, and dramatic (e.g., "NATION WAKES UP").
    - Content should sound like a British-Indian dispatch from the era.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            date: { type: Type.STRING },
            content: { type: Type.STRING },
            weather: { type: Type.STRING },
          },
          required: ["headline", "date", "content", "weather"],
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    const article = JSON.parse(text) as NewsArticle;
    
    // Inject the requested vintage image since the text model doesn't generate images
    article.imageUrl = gandhiImage;
    
    return article;
  } catch (error) {
    console.error("Error generating headline:", error);
    return {
      headline: "MAHATMA ARRESTED.",
      date: "SATURDAY, MARCH 11, 1922",
      content: "GREAT EXCITEMENT PREVAILS. Mahatma Gandhi was arrested at the Sabarmati Ashram on the charge of sedition. He made no resistance and asked the people to preserve perfect peace. The arrest was made by Mr. Healey, the Superintendent of Police, at 10:30 PM.",
      weather: "Tense Atmosphere",
      imageUrl: gandhiImage
    };
  }
};

export const chatWithMentor = async (
  mentorName: string, 
  mentorEra: string, 
  history: ChatMessage[], 
  newMessage: string
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "The mentor is currently unavailable.";

  // Construct history for context
  // In a real app, we would use the chat history in the prompt or chat session
  const conversation = history.map(h => `${h.sender === 'user' ? 'Student' : mentorName}: ${h.text}`).join('\n');
  
  const prompt = `
    System: You are roleplaying as ${mentorName} from ${mentorEra}.
    You are speaking to a student from the future via a magical newspaper interface.
    Keep your responses concise (under 100 words), wise, and in character.
    Do not break character.
    
    Conversation History:
    ${conversation}
    
    Student: ${newMessage}
    
    ${mentorName}:
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "...";
  } catch (error) {
    console.error("Chat error:", error);
    return "The ink is smudged... I cannot hear you clearly.";
  }
};

export const exploreLocation = async (query: string): Promise<{ text: string; location?: { title: string; uri: string } } | null> => {
  const ai = getClient();
  if (!ai) return null;

  const prompt = `
    Describe the historical significance of "${query}". 
    Focus on a specific era if mentioned, or its general historical importance.
    Write in the style of a vintage travel guide entry.
    Keep it under 100 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      }
    });

    const text = response.text || "The archives are silent on this location.";
    
    // Safe extraction of grounding chunks
    // The chunks contain map data if the tool was used effectively
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as any[];
    
    let locationData = undefined;
    if (chunks && chunks.length > 0) {
        const mapChunk = chunks.find(c => c.maps);
        if (mapChunk && mapChunk.maps) {
            locationData = {
                title: mapChunk.maps.title,
                uri: mapChunk.maps.uri
            };
        }
    }

    return {
      text,
      location: locationData
    };
  } catch (error) {
    console.error("Map exploration error:", error);
    return { text: "The compass spins wildly... connection lost.", location: undefined };
  }
};

export const generateTimeline = async (topic: string): Promise<TimelineEvent[]> => {
  const ai = getClient();
  const fallback = [
     { year: "1920", title: "Dawn of Movement", description: "The call for Non-Cooperation echoes across the land." },
     { year: "1922", title: "Chauri Chaura", description: "A tragic turn leads Gandhi to withdraw the movement." },
     { year: "1930", title: "Salt March", description: "A pinch of salt shakes the foundations of an empire." }
  ];
  
  if (!ai) return fallback;

  const prompt = `
    Generate a historical timeline for the topic: "${topic}".
    Provide 4-6 key events sorted chronologically.
    Format strictly as a JSON array of objects with properties: 'year', 'title', 'description'.
    Keep titles punchy (newspaper style) and descriptions under 15 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    year: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ["year", "title", "description"]
            }
        }
      }
    });
    
    const text = response.text;
    if (!text) return fallback;
    return JSON.parse(text) as TimelineEvent[];
  } catch (e) {
    console.error("Timeline error:", e);
    return fallback;
  }
};

export const getMissionBriefing = async (year: string, title: string): Promise<MissionBriefing | null> => {
  const ai = getClient();
  
  // Fallback for demo purposes if key is missing or fails
  const fallback: MissionBriefing = {
    codename: "OPERATION CHRONOS",
    objective: "Observe the event without disrupting the timeline. Record key dialogue.",
    disguise: "Period-appropriate tunic or merchant robes.",
    passphrase: "The owl flies at midnight."
  };

  if (!ai) return fallback;

  const prompt = `
    Generate a secret time-travel mission dossier for the event: "${title}" in the year ${year}.
    The tone should be like a 1920s secret agent telegram.
    
    Return valid JSON with these fields:
    - codename: A cool 1-2 word operation name (e.g. OPERATION SANDSTORM)
    - objective: A 15-word specific mission goal.
    - disguise: Specific clothing recommendation to blend in.
    - passphrase: A short secret phrase to use with contacts.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            codename: { type: Type.STRING },
            objective: { type: Type.STRING },
            disguise: { type: Type.STRING },
            passphrase: { type: Type.STRING },
          },
          required: ["codename", "objective", "disguise", "passphrase"],
        }
      }
    });

    const text = response.text;
    if (!text) return fallback;
    return JSON.parse(text) as MissionBriefing;
  } catch (error) {
    console.error("Mission generation error:", error);
    return fallback;
  }
};

export const triggerTimeRipple = async (originalText: string, userText: string): Promise<RippleResult> => {
  const ai = getClient();
  
  if (!ai) {
    // Fallback for demo
    return {
      consequence: "The timeline shudders. Your words have slightly altered the mood of the era.",
      stabilityChange: -5,
      futureHeadline: "Small Shifts Detected in Archives"
    };
  }

  const prompt = `
    You are the "Time Ripple Engine". A time traveler just changed a speech bubble in a history comic.
    
    Original Dialogue: "${originalText}"
    User's New Dialogue: "${userText}"
    
    Analyze the potential "Butterfly Effect" of this change. 
    If the user says something modern or wildly incorrect, the stability drops more.
    If the user fits the era but changes the sentiment, stability drops slightly.
    
    Return JSON:
    - consequence: A 1-sentence description of how history shifts (e.g. "The librarian now trusts you, handing over the key early.").
    - stabilityChange: A negative integer between -5 (minor) and -50 (major paradox).
    - futureHeadline: A newspaper headline from the "new" future.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                consequence: { type: Type.STRING },
                stabilityChange: { type: Type.INTEGER },
                futureHeadline: { type: Type.STRING }
            },
            required: ["consequence", "stabilityChange", "futureHeadline"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as RippleResult;

  } catch (e) {
    console.error("Ripple engine failed", e);
    return {
      consequence: "Temporal interference prevented calculation.",
      stabilityChange: -10,
      futureHeadline: "Static on the Timeline"
    };
  }
}

export const generateChaosPuzzle = async (): Promise<ChaosPuzzle> => {
  const ai = getClient();
  
  const fallbacks: ChaosPuzzle[] = [
    {
        id: "chaos-1",
        headline: "NIKOLA TESLA ELECTRIFIES THE PYRAMIDS!",
        scenario: "Citizens of Ancient Egypt are confused as a mustachioed man installs a Wardenclyffe Tower atop the Great Sphinx.",
        misplacedFigure: "Nikola Tesla",
        currentEra: "Ancient Egypt (2500 BC)",
        correctEra: "Late 19th Century",
        challengeQuestion: "To restore Tesla to 1895, identify the key principle he is searching for, which doesn't exist here:",
        options: ["Limestone Cutting", "Alternating Current", "Papyrus Scrolls", "Chariot Engineering"],
        correctAnswerIndex: 1,
        restorationMessage: "ZAP! Tesla vanishes in a bolt of blue lightning, returning to his Colorado Springs lab."
    },
    {
        id: "chaos-2",
        headline: "EMPEROR NAPOLEON DUELS SHERIFF AT HIGH NOON!",
        scenario: "The Little Corporal is organizing outlaws into a 'Grande Armée' in a dusty Arizona saloon, demanding better artillery than six-shooters.",
        misplacedFigure: "Napoleon Bonaparte",
        currentEra: "Wild West (1880s)",
        correctEra: "Early 19th Century",
        challengeQuestion: "To send Napoleon back to 1815, remind him of his true military strategy:",
        options: ["Guerilla Warfare", "The Napoleonic Code & Artillery", "Trench Warfare", "Drone Strikes"],
        correctAnswerIndex: 1,
        restorationMessage: "Vive la France! Napoleon fades away, presumably to Waterloo."
    },
    {
        id: "chaos-3",
        headline: "BARD IN ORBIT: 'TO BE OR NOT TO BE' IN ZERO G!",
        scenario: "William Shakespeare is floating in the International Space Station, trying to dip a feather quill into a floating blob of ink.",
        misplacedFigure: "William Shakespeare",
        currentEra: "Space Age (2020s)",
        correctEra: "Elizabethan Era (1600s)",
        challengeQuestion: "Help the Bard return to the Globe Theatre by identifying his meter:",
        options: ["Free Verse", "Iambic Pentameter", "Haiku", "Binary Code"],
        correctAnswerIndex: 1,
        restorationMessage: "A curtain falls from nowhere. When it rises, the Bard is gone."
    },
    {
        id: "chaos-4",
        headline: "KHAN CONQUERS STOCK MARKET WITH HORSEBACK RAID!",
        scenario: "Genghis Khan gallops down Wall Street, confusing stock tickers for enemy signals and demanding tribute from terrified bankers.",
        misplacedFigure: "Genghis Khan",
        currentEra: "Roaring Twenties (1929)",
        correctEra: "13th Century",
        challengeQuestion: "To return the Khan to the steppes, remind him of his primary transport:",
        options: ["Steam Train", "Mongol Horse", "Model T Ford", "Armored Tank"],
        correctAnswerIndex: 1,
        restorationMessage: "Dust swirls, hoofbeats thunder, and the Khan rides back into the past."
    },
    {
        id: "chaos-5",
        headline: "DA VINCI REINVENTS THE IPHONE!",
        scenario: "Leonardo is dismantling a smartphone in a Silicon Valley coffee shop, sketching its circuits as 'magical anatomy'.",
        misplacedFigure: "Leonardo da Vinci",
        currentEra: "Information Age (2024)",
        correctEra: "Italian Renaissance",
        challengeQuestion: "To send Leonardo home, give him the tool he actually mastered:",
        options: ["3D Printer", "Paintbrush & Chisel", "Laser Cutter", "Microchip"],
        correctAnswerIndex: 1,
        restorationMessage: "The sketch glows golden, and Leonardo steps through the parchment back to Florence."
    }
  ];

  const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

  if (!ai) return randomFallback;

  const prompt = `
    Generate a fun, creative "Historical Chaos" puzzle where a famous historical figure is stuck in the wrong era.
    Examples: Napoleon in the Wild West, Shakespeare on the Moon, Genghis Khan on Wall Street.
    
    Return JSON:
    - headline: A sensational vintage newspaper headline about the anomaly.
    - scenario: A visual description of the chaos.
    - misplacedFigure: The name of the person.
    - currentEra: The wrong era they are currently in.
    - correctEra: The era they belong to.
    - challengeQuestion: A multiple choice question to help them get back (related to their actual achievements).
    - options: Array of 4 string answers.
    - correctAnswerIndex: 0-3.
    - restorationMessage: What happens when they get sent back (visual description).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            scenario: { type: Type.STRING },
            misplacedFigure: { type: Type.STRING },
            currentEra: { type: Type.STRING },
            correctEra: { type: Type.STRING },
            challengeQuestion: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.INTEGER },
            restorationMessage: { type: Type.STRING }
          },
          required: ["headline", "scenario", "misplacedFigure", "currentEra", "correctEra", "challengeQuestion", "options", "correctAnswerIndex", "restorationMessage"]
        }
      }
    });

    const text = response.text;
    if (!text) return randomFallback;
    return { ...JSON.parse(text), id: Date.now().toString() } as ChaosPuzzle;
  } catch (e) {
    console.error("Chaos gen failed", e);
    return randomFallback;
  }
}
