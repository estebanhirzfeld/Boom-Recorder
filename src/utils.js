const $startRecording = document.querySelector("#startRecording");
const $pauseRecording = document.querySelector("#pauseRecording");
const $resumeRecording = document.querySelector("#resumeRecording");
const $stopRecording = document.querySelector("#stopRecording");
const $replayRecording = document.querySelector("#replayRecording");
const $deleteRecording = document.querySelector("#deleteRecording");
const $counter = document.querySelector("#counter");
const $countdownTimer = document.querySelector("#countdownTimer");
const $timerContainer = document.querySelector("#timerContainer");
const $recorderControls = document.querySelector("#recorderControls");
const $recorderBox = document.querySelector("#recorderBox");

let mediaRecorder;
let secondsCounter = 0;
let counterInterval;
let isPaused = false;

const swapControls = () => {
  $recorderControls.classList.toggle("hidden");
  $recorderBox.classList.toggle("hidden");
};

const startCountdown = () => {
  return new Promise((resolve, reject) => {
    swapControls();
    let count = 3;
    $timerContainer.classList.remove("hidden");

    const countdownInterval = setInterval(() => {
      $countdownTimer.textContent = `Starting in ${count}`;
      count--;
      if (count == -1) {
        clearInterval(countdownInterval);
        $timerContainer.classList.add("hidden");
        count = 3;
        resolve();
      }
    }, 1000);
  });
};

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
};

const updateCounterUI = (seconds) => {
  $counter.textContent = formatTime(seconds);
};

const startCounter = () => {
  counterInterval = setInterval(() => {
    if (!isPaused) {
      secondsCounter++;
      updateCounterUI(secondsCounter);
    }
  }, 1000);
};

const pauseCounter = () => {
  if (!isPaused) {
    isPaused = true;
    clearInterval(counterInterval);
    pauseStartTime = Date.now();
  }
};

const resumeCounter = () => {
  if (isPaused) {
    isPaused = false;
    const pauseDuration = Math.floor((Date.now() - pauseStartTime) / 1000);
    pauseStartTime = Date.now() - pauseDuration * 1000;
    startCounter();
  }
};

const stopCounter = () => {
  clearInterval(counterInterval);
  secondsCounter = 0;
  updateCounterUI(secondsCounter);
  isPaused = false;
};

const downloadVideo = (data) => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(data);
  link.download = mediaRecorder.stream.id;
  link.click();
};

const getMicStream = async () => {
  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channels: 2,
      echoCancellation: false,
      noiseSuppression: false,
    },
  });
  return micStream;
};

const getScreenStream = async () => {
  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: { ideal: 30 } },
    audio: {
      channels: 2,
      echoCancellation: false,
      noiseSuppression: false,
    },
  });
  return screenStream;
};

const getMediarecorder = (stream) => {
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: "video/webm;codecs=vp8,opus",
  });
  return mediaRecorder;
};

const startRecording = async (mic = true) => {
  const screenStream = await getScreenStream();
  const [video] = screenStream.getVideoTracks();
  let combinedStream;

  if (mic) {
    const micStream = await getMicStream();
    combinedStream = new MediaStream([
      ...screenStream.getVideoTracks(),
      // ...screenStream.getAudioTracks(),
      ...micStream.getAudioTracks(),
    ]);
  } else {
    combinedStream = screenStream;
  }

  mediaRecorder = getMediarecorder(combinedStream);
  mediaRecorder.start();

  video.addEventListener("ended", () => {
    stopRecording();
  });

  mediaRecorder.addEventListener("start", () => {
    stopCounter();
    startCounter();
    $pauseRecording.classList.remove("hidden");
    $resumeRecording.classList.add("hidden");
  });

  mediaRecorder.addEventListener("pause", () => {
    pauseCounter();
    $pauseRecording.classList.add("hidden");
    $resumeRecording.classList.remove("hidden");
  });

  mediaRecorder.addEventListener("resume", () => {
    resumeCounter();
    $resumeRecording.classList.add("hidden");
    $pauseRecording.classList.remove("hidden");
  });

  mediaRecorder.addEventListener("stop", () => {
    stopCounter();
  });
};

const stopRecording = () => {
  const [video] = mediaRecorder.stream.getVideoTracks();
  const [audio] = mediaRecorder.stream.getAudioTracks();

  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    video.stop();
    audio.stop();
    mediaRecorder.stop();
  }
};

const stopAndSave = () => {
  stopRecording();
  mediaRecorder.addEventListener("dataavailable", (e) => {
    downloadVideo(e.data);
  });
  swapControls()
};

const pauseRecording = () => {
  mediaRecorder.pause();
};

const resumeRecording = () => {
  mediaRecorder.resume();
};

const deleteRecording = () => {
  pauseRecording();
  if (confirm("Are you sure you want to Delete recording?")) {
    stopRecording();
    swapControls();
  } else {
    resumeRecording();
  }
};

const replayRecording = async () => {
  pauseRecording();
  if (confirm("Are you sure you want to Restart Recording?")) {
    await stopRecording();
    swapControls();
    startCountdown().then(() => startRecording().catch(() => swapControls()));
  } else {
    resumeRecording();
  }
};

const initializeRecording = () => {
  $startRecording.addEventListener("click", async (event) => {
    event.preventDefault();
    startCountdown().then(() => startRecording().catch(() => swapControls()));
  });

  $stopRecording.addEventListener("click", stopAndSave);
  $pauseRecording.addEventListener("click", pauseRecording);
  $resumeRecording.addEventListener("click", resumeRecording);
  $replayRecording.addEventListener("click", replayRecording);
  $deleteRecording.addEventListener("click", deleteRecording);
};

initializeRecording();
