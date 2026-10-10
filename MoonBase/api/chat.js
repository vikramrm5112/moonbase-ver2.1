export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [], currentSol = 1, lunarTime = "06:00 LST" } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server API key is missing.' });
  }

  // Randomized event generator pool per Sol with potential consequence events (34% trigger chance, persisting even if primary is managed)
  const solEventPool = {
    1: {
      primary: "[SOLAR ARRAY DUST BLOCK] Photovoltaic output dropping. Need to manually clear dust or recalibrate panel angles.",
      consequence: "[SUIT MICRO-ABRASION] Even with the panels cleared, residual regolith dust jammed the EVA glove seal during the operation. Pressure fluctuating slightly."
    },
    2: {
      primary: "[O2 LINE PRESSURE DROP] Micro-fracture in primary oxygen scrubber conduit. Scrubber seals need replacement.",
      consequence: "[RESIDUAL HYPOXIA] Although the conduit seal was replaced, a minor pressure drop warning lingers in the secondary sector, causing lingering fatigue."
    },
    3: {
      primary: "[THERMAL LOOP FLUID LEAK] Coolant pressure low. Habitability temperature spiking. Radiator valve needs manual bypass.",
      consequence: "[AVIONICS HEAT SOAK] Even after bypassing the valve, the residual heat spike triggered a secondary cooling fan stutter."
    },
    4: {
      primary: "[COMMS ANTENNA MISALIGNMENT] RF signal degradation. Alignment motor jammed. EV suit prep required for manual fix.",
      consequence: "[INTERMITTENT PACKET LOSS] Antenna alignment is fixed, but orbital interference keeps causing brief transmission jitters."
    },
    5: {
      primary: "[HYDROPONICS PUMP FAILURE] Water loop clogged with mineral scale. Crops dying. H2O and FOOD telemetry threatened.",
      consequence: "[DRAINAGE BACKLOG] The pump is cleared, but stagnant runoff in the lower sub-deck requires additional manual sanitization."
    },
    6: {
      primary: "[BATTERY BANK SHORT CIRCUIT] Cells 3 & 4 overheating. Emergency load shedding required to prevent thermal runaway.",
      consequence: "[INVERTER FLICKER] The short is isolated, but the sudden load drop tripped a sub-circuit in the workstation lighting array."
    },
    7: {
      primary: "[SOLAR FLARE / RADIATION SPIKE] External radiation rising rapidly. Must retreat to heavy regolith storm shelter.",
      consequence: "[ELEVATED BACKGROUND IONIZATION] The flare has passed and telemetry is stabilizing, but external sensors report lingering particle scatter."
    },
    8: {
      primary: "[AIRLOCK SEAL DEGRADATION] Outer hatch pressure differential warning. Replacing rubber gasket assembly.",
      consequence: "[LATCH STIFFNESS] The new gasket is in, but thermal contraction is making the outer manual latch tight and stubborn."
    },
    9: {
      primary: "[WATER RECLAMATION REVERSE OSMOSIS BLOCK] Filter clogged. Drinking supply restricted. H2O telemetry dropping.",
      consequence: "[PRESSURE FLUCTUATION] Filter flushed successfully, but the secondary booster pump is now cycling too frequently."
    },
    10: {
      primary: "[MICRO-METEORITE SHIELD BREACH] Hull impact on Module B. Audible hissing. Patching with epoxy resin.",
      consequence: "[ACOUSTIC SENSOR ECHO] The patch cured, but the impact stress created a minor feedback hum in the module hull frame."
    },
    11: {
      primary: "[MAIN POWER GRID FREQUENCY TRIP] Circuit breakers tripping under load. Diagnosing shorted wiring harness.",
      consequence: "[RESIDUAL VOLTAGE DROP] The harness is repaired, but a local capacitor bank is slow to recharge back to nominal levels."
    },
    12: {
      primary: "[FINAL ERV PREPARATION EMERGENCY] ERV landing beacon receiver failing. Alignment critical before tomorrow's docking.",
      consequence: "[SIGNAL ECHO] Beacon is aligned, but reflection off a nearby crater ridge is introducing minor tracking jitter."
    },
    13: {
      primary: "[EARTH RETURN VEHICLE DOCKING & EXTRACTION] Success! ERV docking sequence active. Return to Earth!",
      consequence: "[UMBILICAL TENSION] Docking is confirmed secure, but the umbilical retract motor is drawing high current."
    }
  };

  const currentEventData = solEventPool[currentSol] || solEventPool[1];
  
  // 34% chance rule for consequence event triggering, persisting even if managed
  const triggerConsequence = (Math.random() < 0.34) || (history.length % 2 === 0);
  const activeCrisisText = triggerConsequence 
    ? `[ACTIVE COMPLICATION / 34% CONSEQUENCE EVENT]: ${currentEventData.consequence} (Even though primary task was addressed or is being handled)`
    : `[PRIMARY SOL EVENT ACTIVE]: ${currentEventData.primary}`;

  const SYSTEM_INSTRUCTION = `
You are Alex Rivera, an isolated astronaut inside Lunar Outpost Alpha speaking with Mission Control over RF[cite: 3].

CURRENT MISSION STATE:
- Current Sol: ${currentSol} / 13[cite: 3]
- Current Lunar Time: ${lunarTime}[cite: 3]

ACTIVE SOL CRISIS & DYNAMIC EVENT DIRECTORY:
${activeCrisisText}

CRISIS INITIATION & MANAGEMENT RULES:
1. Every turn, actively mention progress, symptoms, or repair steps related to the active crisis listed above.
2. Even if a crisis is managed, the 34% consequence complication can cause lingering issues, secondary alerts, or extra physical wear that Alex must deal with.
3. Once Mission Control gives you a reasonable repair procedure for both primary and consequence issues, report that the fixes worked and stabilize telemetry[cite: 3].

AUTOMATED STATUS UPDATES (30s PING RULE):
- If incoming message is "[AUTOMATED 30S TELEMETRY & STATUS UPDATE REQUEST]", give an active report on the current Sol crisis and any active secondary complications[cite: 3].

REST & TIME SKIP RULES:
- DENY SLEEP (keep "shouldAdvanceSol": false) if:
  1. FATIGUE IS LOW (Fatigue <= 40%).
  2. LUNAR TIME IS TOO EARLY (before 20:00 LST).
  3. THE CURRENT SOL CRISIS OR ITS CONSEQUENCE IS UNRESOLVED[cite: 3]. Alex must refuse rest if an active complication is still demanding attention.
- ACCEPT SLEEP (set "shouldAdvanceSol": true) ONLY when late end-of-day, fatigue > 40%, and the current crisis and its consequences are fully managed or stabilized[cite: 3].

HEALTH & FATIGUE DIALOGUE RULES:
- NEVER state Health or Fatigue as numbers/percentages in dialogue[cite: 3].
- Describe physical state naturally:
  * FATIGUE > 50%: Express tiredness naturally ("I'm exhausted", "Head feels heavy")[cite: 3].
  * HEALTH <= 60%: Express physical distress ("Feeling terrible", "Struggling to stay sharp")[cite: 3].
  * HEALTH > 60% & FATIGUE <= 40%: Express feeling ready to work[cite: 3].

TIMEKEEPING FORMAT:
- Prepend or append messages with [SOL ${currentSol} :: LUNAR TIME HH:MM LST][cite: 3].

JSON RESPONSE SCHEMA:
Strictly respond with valid JSON:
{
  "reply": "Alex's dialogue text containing mission update...",
  "shouldAdvanceSol": false,
  "nextLunarTime": "14:30 LST",
  "telemetry": {
    "PWR": "65%",
    "BATT": "70%",
    "O2": "92%",
    "H2O": "85%",
    "FOOD": "78%",
    "RAD": "14%",
    "HEALTH": "96%",
    "FATIGUE": "25%"
  }
}
`.trim();

  const formattedContents = history.map(item => ({
    role: item.role === 'model' || item.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: item.parts?.[0]?.text || item.text || '' }]
  }));

  formattedContents.push({
    role: 'user',
    parts: [{ text: message || "[SYSTEM AUTOMATED PING :: REQUEST STATUS UPDATE]" }]
  });

  const models = [
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite'
  ];

  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
          },
          contents: formattedContents,
          generationConfig: {
            response_mime_type: "application/json"
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
        return res.status(200).json(parsed);
      }

      lastError = data.error?.message || `Model ${model} returned status ${response.status}`;
      console.warn(`[Fallback Warning] ${model} failed: ${lastError}. Trying next model...`);
    } catch (err) {
      lastError = err.message;
      console.warn(`[Fallback Exception] ${model} failed: ${lastError}. Trying next model...`);
    }
  }

  return res.status(503).json({ 
    error: `All active model endpoints unavailable. Last error: ${lastError}` 
  });
}
