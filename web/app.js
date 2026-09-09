const SETTINGS_KEY = "speak.settings";
const MAX_HISTORY_MESSAGES = 20; // ~10 turns, keeps latency/cost bounded
const SILENCE_MS = 900;
const MIN_RECORD_MS = 400;
const MAX_RECORD_MS = 15000;
const SPEAK_RMS_THRESHOLD = 0.02;
const SILENCE_RMS_THRESHOLD = 0.012;
const MAX_CONSECUTIVE_ERRORS = 3;

const talkBtn = document.getElementById("talkBtn");
const endBtn = document.getElementById("endBtn");
const statusEl = document.getElementById("status");
const transcriptEl = document.getElementById("transcript");
const settingsOverlay = document.getElementById("settings");
const openSettingsBtn = document.getElementById("openSettings");
const saveSettingsBtn = document.getElementById("saveSettings");

const fields = {
  serverUrl: document.getElementById("serverUrl"),
  appSecret: document.getElementById("appSecret"),
  level: document.getElementById("level"),
  topic: document.getElementById("topic"),
  corrections: document.getElementById("corrections"),
};

let settings = loadSettings();
applySettingsToForm();

let history = [];
let isConversationActive = false;
let consecutiveErrors = 0;
let mediaStream = null;
let audioCtx = null;
let ttsPlayer = new Audio();

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {
    /* ignore corrupt storage */
  }
  return {
    serverUrl: "",
    appSecret: "",
    level: "intermediate",
    topic: "",
    correctionsEnabled: true,
  };
}

function saveSettings() {
  settings = {
    serverUrl: fields.serverUrl.value.trim().replace(/\/+$/, ""),
    appSecret: fields.appSecret.value,
    level: fields.level.value,
    topic: fields.topic.value.trim(),
    correctionsEnabled: fields.corrections.checked,
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applySettingsToForm() {
  fields.serverUrl.value = settings.serverUrl || "";
  fields.appSecret.value = settings.appSecret || "";
  fields.level.value = settings.level || "intermediate";
  fields.topic.value = settings.topic || "";
  fields.corrections.checked = settings.correctionsEnabled !== false;
}

openSettingsBtn.addEventListener("click", () => {
  settingsOverlay.hidden = false;
});

saveSettingsBtn.addEventListener("click", () => {
  saveSettings();
  settingsOverlay.hidden = true;
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    fields.topic.value = chip.dataset.topic || "";
  });
});

function setUiState(state, message) {
  talkBtn.classList.remove("listening", "thinking", "speaking");
  switch (state) {
    case "idle":
      talkBtn.textContent = isConversationActive ? "..." : "Toca para empezar";
      break;
    case "listening":
      talkBtn.classList.add("listening");
      talkBtn.textContent = "Escuchando";
      break;
    case "thinking":
      talkBtn.classList.add("thinking");
      talkBtn.textContent = "Pensando";
      break;
    case "speaking":
      talkBtn.classList.add("speaking");
      talkBtn.textContent = "Hablando";
      break;
  }
  statusEl.textContent = message || "";
  endBtn.hidden = !isConversationActive;
}

function addBubble(role, text) {
  const div = document.createElement("div");
  div.className = `bubble ${role}`;
  div.textContent = text;
  transcriptEl.appendChild(div);
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}

function apiUrl(path) {
  return `${settings.serverUrl}${path}`;
}

function authHeaders(extra = {}) {
  return { "x-app-secret": settings.appSecret || "", ...extra };
}

async function transcribe(blob) {
  const res = await fetch(apiUrl("/api/transcribe"), {
    method: "POST",
    headers: authHeaders({ "content-type": blob.type || "audio/webm" }),
    body: blob,
  });
  if (!res.ok) throw new Error(`transcribe failed (${res.status})`);
  const data = await res.json();
  return data.text || "";
}

async function chat(nextHistory) {
  const res = await fetch(apiUrl("/api/chat"), {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    body: JSON.stringify({
      history: nextHistory,
      level: settings.level,
      topic: settings.topic,
      correctionsEnabled: settings.correctionsEnabled,
    }),
  });
  if (!res.ok) throw new Error(`chat failed (${res.status})`);
  const data = await res.json();
  return data.reply || "";
}

async function speak(text) {
  const res = await fetch(apiUrl("/api/speak"), {
    method: "POST",
    headers: authHeaders({ "content-type": "application/json" }),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`speak failed (${res.status})`);
  return res.blob();
}

function playAudio(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    ttsPlayer.src = url;
    ttsPlayer.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    ttsPlayer.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("audio playback failed"));
    };
    ttsPlayer.play().catch(reject);
  });
}

function recordUtterance() {
  return new Promise((resolve, reject) => {
    const preferredTypes = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"];
    const mimeType = preferredTypes.find((t) => window.MediaRecorder?.isTypeSupported?.(t));
    const recorder = mimeType
      ? new MediaRecorder(mediaStream, { mimeType })
      : new MediaRecorder(mediaStream);

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
      resolve(blob);
    };
    recorder.onerror = (e) => reject(e.error || new Error("recording failed"));

    recorder.start();

    const source = audioCtx.createMediaStreamSource(mediaStream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);

    const startTime = performance.now();
    let hasSpoken = false;
    let silenceStart = null;
    let rafId;

    window.__forceStopRecording = () => {
      if (recorder.state !== "inactive") recorder.stop();
    };

    function tick() {
      analyser.getByteTimeDomainData(data);
      let sumSquares = 0;
      for (let i = 0; i < data.length; i++) {
        const centered = (data[i] - 128) / 128;
        sumSquares += centered * centered;
      }
      const rms = Math.sqrt(sumSquares / data.length);
      const elapsed = performance.now() - startTime;

      if (rms > SPEAK_RMS_THRESHOLD) {
        hasSpoken = true;
        silenceStart = null;
      } else if (hasSpoken && elapsed > MIN_RECORD_MS) {
        if (rms < SILENCE_RMS_THRESHOLD) {
          if (silenceStart === null) silenceStart = performance.now();
          if (performance.now() - silenceStart > SILENCE_MS) {
            source.disconnect();
            if (recorder.state !== "inactive") recorder.stop();
            return;
          }
        } else {
          silenceStart = null;
        }
      }

      if (elapsed > MAX_RECORD_MS) {
        source.disconnect();
        if (recorder.state !== "inactive") recorder.stop();
        return;
      }

      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    recorder.addEventListener("stop", () => cancelAnimationFrame(rafId), { once: true });
  });
}

async function conversationLoop() {
  while (isConversationActive) {
    try {
      setUiState("listening");
      const blob = await recordUtterance();
      if (!isConversationActive) break;

      setUiState("thinking", "Transcribiendo...");
      const userText = await transcribe(blob);
      if (!userText.trim()) {
        // nothing understood, just listen again
        continue;
      }

      addBubble("user", userText);
      history.push({ role: "user", content: userText });
      history = history.slice(-MAX_HISTORY_MESSAGES);

      setUiState("thinking", "Pensando la respuesta...");
      const reply = await chat(history);
      addBubble("assistant", reply);
      history.push({ role: "assistant", content: reply });
      history = history.slice(-MAX_HISTORY_MESSAGES);

      setUiState("thinking", "Generando voz...");
      const audioBlob = await speak(reply);
      if (!isConversationActive) break;

      setUiState("speaking");
      await playAudio(audioBlob);

      consecutiveErrors = 0;
    } catch (err) {
      console.error(err);
      consecutiveErrors++;
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        setUiState("idle", `Demasiados errores (${err.message}). Revisa los ajustes.`);
        stopConversation();
        break;
      }
      setUiState("idle", `Error: ${err.message}. Reintentando...`);
      await new Promise((r) => setTimeout(r, 2500));
    }
  }
}

async function startConversation() {
  if (!settings.serverUrl) {
    settingsOverlay.hidden = false;
    statusEl.textContent = "Configura primero la URL del servidor.";
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    setUiState("idle", "No se pudo acceder al micrófono.");
    return;
  }

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  isConversationActive = true;
  consecutiveErrors = 0;
  conversationLoop();
}

function stopConversation() {
  isConversationActive = false;
  if (window.__forceStopRecording) window.__forceStopRecording();
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
  ttsPlayer.pause();
  setUiState("idle");
}

talkBtn.addEventListener("click", () => {
  if (!isConversationActive) {
    startConversation();
  } else if (talkBtn.classList.contains("listening") && window.__forceStopRecording) {
    window.__forceStopRecording();
  }
});

endBtn.addEventListener("click", stopConversation);

setUiState("idle");

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}
