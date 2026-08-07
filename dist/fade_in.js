document.addEventListener("DOMContentLoaded", function () {
  const body = document.querySelector("body");
  body.classList.remove("opacity-0");
  body.classList.add("opacity-100");

  // Show images as soon as they load instead of adding sequential delays
  const photos = document.querySelectorAll("img");
  photos.forEach((photo) => {
    // If the image is already loaded (cached), show immediately
    if (photo.complete && photo.naturalWidth > 0) {
      photo.classList.remove("opacity-0");
      photo.classList.add("opacity-100");
    } else {
      // Show image as soon as it finishes loading
      photo.addEventListener("load", function () {
        photo.classList.remove("opacity-0");
        photo.classList.add("opacity-100");
      });
      // Also show on error so broken images aren't invisible
      photo.addEventListener("error", function () {
        photo.classList.remove("opacity-0");
        photo.classList.add("opacity-100");
      });
    }
  });
});
