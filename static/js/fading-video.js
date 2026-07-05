const videos = [
  "/static/videos/bg-1.mp4",
  "/static/videos/bg-2.mp4",
  "/static/videos/bg-3.mp4"
];

let currentIndex = 0;
let activeVideo = document.getElementById("video-a");
let nextVideo = document.getElementById("video-b");

function fadeElement(videoIn, videoOut, duration = 1200) {
  const start = performance.now();

  function animate(now) {
    const progress = Math.min((now - start) / duration, 1);

    videoIn.style.opacity = progress;
    videoOut.style.opacity = 1 - progress;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      videoOut.pause();
      videoOut.style.opacity = 0;
    }
  }

  requestAnimationFrame(animate);
}

function playNextVideo() {
  currentIndex = (currentIndex + 1) % videos.length;

  nextVideo.src = videos[currentIndex];
  nextVideo.currentTime = 0;
  // Play returns a promise, so handle it to avoid unhandled rejections
  nextVideo.play().catch(e => console.log("Video play interrupted", e));

  fadeElement(nextVideo, activeVideo);

  const temp = activeVideo;
  activeVideo = nextVideo;
  nextVideo = temp;
}

// Initial play
activeVideo.src = videos[currentIndex];
activeVideo.style.opacity = 1;
activeVideo.play().catch(e => console.log("Video play interrupted", e));

activeVideo.addEventListener("ended", playNextVideo);
nextVideo.addEventListener("ended", playNextVideo);
