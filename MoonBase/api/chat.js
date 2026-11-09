export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (!body) {
      let rawData = '';
      for await (const chunk of req) {
        rawData += chunk;
      }
      try {
        body = JSON.parse(rawData);
      } catch (e) {
        body = {};
      }
    }

    const { message, history = [], currentSol = 1, lunarTime = "06:00 LST" } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Server API key is missing in environment variables.' });
    }

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
    const triggerConsequence = (Math.random() < 0.34) || (history.length % 2 === 0);
    const activeCrisisText = triggerConsequence 
      ? `[ACTIVE COMPLICATION / 34% CONSEQUENCE EVENT]: ${currentEventData.consequence}`
      : `[PRIMARY SOL EVENT ACTIVE]: ${currentEventData.primary}`;

    const SYSTEM_INSTRUCTION = `
You are Alex Rivera, an isolated astronaut inside Lunar Outpost Alpha speaking with Mission Control over RF.

CURRENT MISSION STATE:
- Current Sol: ${currentSol} / 13
- Current Lunar Time: ${lunarTime}
- ACTIVE CRISIS: ${activeCrisisText}

STRICT RESPONSE FORMATTING RULES:
1. Keep replies extremely concise (1-2 short sentences max). Speak like a stressed astronaut over choppy radio.
2. Highlight critical hardware failures, warnings, or key alerts in red: <span class="text-red-500 font-bold">[RED_TERM]</span>.
3. For technical engineering/space jargon, wrap them in a magenta hover tooltip:
   <span class="group relative cursor-help text-fuchsia-500 underline decoration-dotted">TERM<span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-zinc-950 border border-fuchsia-500 text-fuchsia-300 text-[10px] p-1 rounded whitespace-nowrap z-50 shadow-md">Definition here</span></span>
4. Prepend or append messages with [SOL ${currentSol} :: ${lunarTime}].

JSON RESPONSE SCHEMA:
Strictly respond with valid JSON:
{
  "reply": "Alex's concise response with HTML markup...",
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

    const trimmedHistory = history.slice(-8);
    const formattedContents = trimmedHistory.map(item => ({
      role: item.role === 'model' || item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.parts?.[0]?.text || item.text || '' }]
    }));

    formattedContents.push({
      role: 'user',
      parts: [{ text: message || "[SYSTEM AUTOMATED PING]" }]
    });

    const models = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'];
    let lastError = null;
    let data = null;

    for (const model of models) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: formattedContents,
            generationConfig: {
              response_mime_type: "application/json",
              max_output_tokens: 150
            }
          })
        });

        clearTimeout(timeoutId);
        const json = await response.json();

        if (response.ok && json.candidates?.[0]?.content?.parts?.[0]?.text) {
          data = JSON.parse(json.candidates[0].content.parts[0].text);
          break;
        }

        lastError = json.error?.message || `Model ${model} returned status ${response.status}`;
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err.message;
      }
    }

    if (!data) throw new Error(lastError || 'All model endpoints unavailable.');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: `Transmission error: ${err.message}` });
  }
}
