try {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: messageText, history, currentSol, lunarTime: currentLunarTime })
  });

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const rawText = await response.text();
    throw new Error(`Server returned non-JSON response (${response.status}): ${rawText.slice(0, 100)}`);
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Transmission failed.');

  loadingDiv.innerText = data.reply;
  if (data.nextLunarTime) currentLunarTime = data.nextLunarTime;
  if (data.shouldAdvanceSol) {
    currentSol += 1;
    currentLunarTime = "06:00 LST";
    appendMessage('SYSTEM', `--- ADVANCING TO SOL ${currentSol} ---`, 'bot');
  }
  updateSolTracker();
  if (data.telemetry) updateTelemetryUI(data.telemetry);

  history.push({ role: 'user', parts: [{ text: messageText }] });
  history.push({ role: 'model', parts: [{ text: data.reply }] });
} catch (err) {
  loadingDiv.innerText = 'ERROR: ' + err.message;
  loadingDiv.classList.add('text-red-600');
}
