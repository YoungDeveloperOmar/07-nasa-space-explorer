// js/script.js

const API_KEY = 'b3X4Ni5nhiHFRYIkAvovlboehYtMCsv0idYz2X6H'; // Replace with your own NASA API key if you have one
const APOD_URL = 'https://api.nasa.gov/planetary/apod';

// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

const gallery = document.getElementById('gallery');
const getImagesBtn = document.getElementById('getImagesBtn');
const factText = document.getElementById('factText');

const modal = document.getElementById('imageModal');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const closeModalBtn = document.getElementById('closeModalBtn');

// Random facts for the LevelUp section
const spaceFacts = [
  'One day on Venus is longer than one year on Venus.',
  'Neutron stars can spin at hundreds of times per second.',
  'Light from the Sun takes about 8 minutes to reach Earth.',
  'A day on Mercury lasts 59 Earth days.',
  'There are more stars in the universe than grains of sand on Earth.',
  'Jupiter is so large that all the other planets in the solar system could fit inside it.',
  'The footprints left on the Moon can last for millions of years.',
  'Saturn could float in water because its average density is lower than water.'
];

// Show a random fact every time the page loads
showRandomFact();

// Fetch data only when the user clicks the button
getImagesBtn.addEventListener('click', handleGetImages);

// Close modal interactions
closeModalBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal.classList.contains('show')) {
    closeModal();
  }
});

// Pick and display one random fact
function showRandomFact() {
  const randomIndex = Math.floor(Math.random() * spaceFacts.length);
  factText.textContent = spaceFacts[randomIndex];
}

// Main click handler
async function handleGetImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    renderPlaceholder('🗓️', 'Please choose both a start date and an end date.');
    return;
  }

  if (startDate > endDate) {
    renderPlaceholder('⚠️', 'Your start date must be earlier than or the same as your end date.');
    return;
  }

  renderPlaceholder('🔄', 'Loading space photos...');
  await fetchSpaceImages(startDate, endDate);
}

// Request APOD data from NASA
async function fetchSpaceImages(startDate, endDate) {
  try {
    const url = new URL(APOD_URL);
    url.searchParams.set('api_key', API_KEY);
    url.searchParams.set('start_date', startDate);
    url.searchParams.set('end_date', endDate);
    url.searchParams.set('thumbs', 'true');

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`NASA request failed with status ${response.status}`);
    }

    const data = await response.json();
    const items = Array.isArray(data) ? [...data].reverse() : [data];

    if (!items.length) {
      renderPlaceholder('🌌', 'No space images were found for that date range.');
      return;
    }

    renderGallery(items);
  } catch (error) {
    console.error('Error fetching APOD data:', error);
    renderPlaceholder('🚨', 'Something went wrong while loading the NASA images. Please try again.');
  }
}

// Render gallery cards
function renderGallery(items) {
  gallery.innerHTML = '';

  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'gallery-item';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open details for ${item.title}`);

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'gallery-image-wrapper';

    // Handle both image entries and video entries
    if (item.media_type === 'image') {
      const image = document.createElement('img');
      image.src = item.url;
      image.alt = item.title;
      image.loading = 'lazy';
      imageWrapper.appendChild(image);
    } else if (item.media_type === 'video') {
      if (item.thumbnail_url) {
        const thumbnail = document.createElement('img');
        thumbnail.src = item.thumbnail_url;
        thumbnail.alt = `${item.title} video thumbnail`;
        thumbnail.loading = 'lazy';
        imageWrapper.appendChild(thumbnail);
      } else {
        const videoPlaceholder = document.createElement('div');
        videoPlaceholder.className = 'video-placeholder';
        videoPlaceholder.textContent = '🎬 Video entry';
        imageWrapper.appendChild(videoPlaceholder);
      }

      const badge = document.createElement('span');
      badge.className = 'media-badge';
      badge.textContent = 'VIDEO';
      imageWrapper.appendChild(badge);
    } else {
      const unknownPlaceholder = document.createElement('div');
      unknownPlaceholder.className = 'video-placeholder';
      unknownPlaceholder.textContent = '✨ Space media';
      imageWrapper.appendChild(unknownPlaceholder);
    }

    const title = document.createElement('h3');
    title.textContent = item.title;

    const date = document.createElement('p');
    date.className = 'gallery-date';
    date.textContent = formatDate(item.date);

    const hint = document.createElement('p');
    hint.className = 'gallery-hint';
    hint.textContent = item.media_type === 'video'
      ? 'Click to open the video and full explanation.'
      : 'Click to view a larger image and full explanation.';

    card.appendChild(imageWrapper);
    card.appendChild(title);
    card.appendChild(date);
    card.appendChild(hint);

    card.addEventListener('click', () => openModal(item));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(item);
      }
    });

    gallery.appendChild(card);
  });
}

// Reusable placeholder / loading / error message
function renderPlaceholder(icon, message) {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">${icon}</div>
      <p>${message}</p>
    </div>
  `;
}

// Open the modal with full content
function openModal(item) {
  modalMedia.innerHTML = '';
  modalTitle.textContent = item.title;
  modalDate.textContent = formatDate(item.date);
  modalExplanation.textContent = item.explanation;

  if (item.media_type === 'video') {
    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'modal-video-wrapper';

    const iframe = document.createElement('iframe');
    iframe.src = getVideoEmbedUrl(item.url);
    iframe.title = item.title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;

    videoWrapper.appendChild(iframe);
    modalMedia.appendChild(videoWrapper);

    const videoLink = document.createElement('p');
    videoLink.className = 'video-link';

    const anchor = document.createElement('a');
    anchor.href = item.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = 'Open video in a new tab';

    videoLink.appendChild(anchor);
    modalMedia.appendChild(videoLink);
  } else {
    const image = document.createElement('img');
    image.src = item.hdurl || item.url;
    image.alt = item.title;
    modalMedia.appendChild(image);
  }

  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

// Close modal
function closeModal() {
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

// Turn API date text into a more readable date
function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Convert common video URLs into embeddable ones
function getVideoEmbedUrl(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes('youtube.com')) {
      const videoId = parsedUrl.searchParams.get('v');

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      if (parsedUrl.pathname.startsWith('/embed/')) {
        return url;
      }
    }

    if (parsedUrl.hostname.includes('youtu.be')) {
      const videoId = parsedUrl.pathname.replace('/', '');
      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (parsedUrl.hostname.includes('vimeo.com')) {
      const segments = parsedUrl.pathname.split('/').filter(Boolean);
      const videoId = segments[segments.length - 1];

      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    return url;
  } catch (error) {
    console.error('Unable to create embed URL:', error);
    return url;
  }
}