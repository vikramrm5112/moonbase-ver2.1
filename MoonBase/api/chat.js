export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [], currentSol = 1, lunarTime = "06:00 LST" } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server API key is missing.' });
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
      consequence: "[PRESSURE FLUCTUATION] Filter flushed successfully, but the secondary booster pump is now cycling too
