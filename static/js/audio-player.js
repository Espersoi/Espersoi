const formatAudioTime = (value) => {
  if (!Number.isFinite(value) || value < 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

document.addEventListener("DOMContentLoaded", () => {
  const players = document.querySelectorAll(".js-audio-player");

  players.forEach((player) => {
    const audio = player.querySelector(".js-audio-element");
    const playButton = player.querySelector(".js-audio-play");
    const playIcon = player.querySelector(".js-audio-play-icon");
    const rewindButton = player.querySelector(".js-audio-rewind");
    const forwardButton = player.querySelector(".js-audio-forward");
    const seekButton = player.querySelector(".js-audio-seek");
    const volumeSlider = player.querySelector(".js-audio-volume");
    const currentTime = player.querySelector(".js-audio-current");
    const durationTime = player.querySelector(".js-audio-duration");
    const trackTitle = player.querySelector(".js-audio-track-title");
    const postLink = player.querySelector(".js-audio-post-link");
    const playlistButtons = Array.from(player.querySelectorAll(".js-audio-track"));
    const source = audio?.getAttribute("src") || audio?.querySelector("source")?.getAttribute("src");

    if (!audio || !playButton || !playIcon || !seekButton || !volumeSlider || !currentTime || !durationTime || !source) {
      return;
    }

    let currentTrackIndex = Math.max(playlistButtons.findIndex((button) => button.classList.contains("is-active")), 0);

    const updatePlaylistUi = () => {
      playlistButtons.forEach((button, index) => {
        button.classList.toggle("is-active", index === currentTrackIndex);
      });
    };

    const loadTrack = async (index, shouldAutoplay = false) => {
      if (!playlistButtons.length) {
        return;
      }

      const nextIndex = clamp(index, 0, playlistButtons.length - 1);
      const trackButton = playlistButtons[nextIndex];
      const nextSource = trackButton.dataset.audioSrc;

      currentTrackIndex = nextIndex;
      updatePlaylistUi();

      if (trackTitle && trackButton.dataset.trackTitle) {
        trackTitle.textContent = trackButton.dataset.trackTitle;
      }

      if (postLink && trackButton.dataset.postTitle && trackButton.dataset.postUrl) {
        postLink.textContent = trackButton.dataset.postTitle;
        postLink.setAttribute("href", trackButton.dataset.postUrl);
      }

      if (nextSource && audio.getAttribute("src") !== nextSource) {
        audio.setAttribute("src", nextSource);
        const sourceElement = audio.querySelector("source");
        if (sourceElement) {
          sourceElement.setAttribute("src", nextSource);
        }
        audio.load();
      }

      audio.currentTime = 0;
      syncProgress();

      if (shouldAutoplay) {
        try {
          await audio.play();
        } catch (error) {
          console.error("Unable to start playlist track", error);
        }
      } else {
        syncPlayState();
      }
    };

    audio.load();
    audio.volume = Number(volumeSlider.value);

    const syncProgress = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      const progress = duration > 0 ? (current / duration) * 100 : 0;

      player.style.setProperty("--track-progress", `${progress}%`);
      currentTime.textContent = formatAudioTime(current);
      durationTime.textContent = duration > 0 ? formatAudioTime(duration) : "00:00";
    };

    const syncPlayState = () => {
      const isPaused = audio.paused;
      playIcon.textContent = isPaused ? "play_arrow" : "pause";
      playButton.setAttribute("aria-label", isPaused ? "Lire le morceau" : "Mettre en pause");
    };

    playButton.addEventListener("click", async () => {
      try {
        if (audio.paused) {
          await audio.play();
        } else {
          audio.pause();
        }
      } catch (error) {
        console.error("Unable to toggle audio playback", error);
      }
    });

    rewindButton?.addEventListener("click", () => {
      audio.currentTime = Math.max(audio.currentTime - 10, 0);
      syncProgress();
    });

    forwardButton?.addEventListener("click", () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : audio.currentTime + 10;
      audio.currentTime = Math.min(audio.currentTime + 10, duration);
      syncProgress();
    });

    seekButton.addEventListener("click", (event) => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      if (duration <= 0) {
        return;
      }

      const rect = seekButton.getBoundingClientRect();
      const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      audio.currentTime = duration * ratio;
      syncProgress();
    });

    volumeSlider.addEventListener("input", () => {
      const value = clamp(Number(volumeSlider.value), 0, 1);
      audio.volume = value;
    });

    playlistButtons.forEach((button, index) => {
      button.addEventListener("click", async () => {
        const shouldAutoplay = !audio.paused;
        await loadTrack(index, shouldAutoplay);
      });
    });

    audio.addEventListener("loadedmetadata", syncProgress);
    audio.addEventListener("durationchange", syncProgress);
    audio.addEventListener("timeupdate", syncProgress);
    audio.addEventListener("play", syncPlayState);
    audio.addEventListener("pause", syncPlayState);
    audio.addEventListener("ended", async () => {
      if (playlistButtons.length && currentTrackIndex < playlistButtons.length - 1) {
        await loadTrack(currentTrackIndex + 1, true);
        return;
      }

      audio.currentTime = 0;
      syncProgress();
      syncPlayState();
    });

    updatePlaylistUi();
    syncProgress();
    syncPlayState();
  });
});