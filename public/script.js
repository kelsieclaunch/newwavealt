document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('submit-form');

  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);

      try {
        const res = await fetch('/submit', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          alert('Submission received! Thank you.');
          form.reset();
        } else {
          alert('Something went wrong. Please try again.');
        }
      } catch (err) {
        console.error('Error submitting form:', err);
        alert('Something went wrong. Please try again.');
      }
    });
  }

  // Lightbox

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const closeBtn = document.getElementById('lightboxClose');

  const items = Array.from(document.querySelectorAll('.gallery-item'));
  const images = items.map(item => item.getAttribute('data-full'));

  const lightboxCaptionLink = document.getElementById('lightboxCaptionLink');

  const captions = items.map(item => {
    const linkEl = item.querySelector('.overlay-text');
    const textEl = item.querySelector('.overlay-text h6');

    return {
      text: textEl ? textEl.textContent : '',
      link: linkEl ? linkEl.href : null
    };
  });



  

  let currentIndex = 0;

  if (lightbox && lightboxImg && closeBtn) {
    document.querySelectorAll('.expand-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const item = btn.closest('.gallery-item');
        const imgSrc = item.getAttribute('data-full');

        currentIndex = images.indexOf(imgSrc);

        showImage(currentIndex);
        lightbox.classList.add('active');

        item.classList.remove('active');

      });
    });

    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const isMobile = window.matchMedia('(max-width: 950px)').matches;

        if (!isMobile) return; // desktop still uses hover

        // prevent expand button / link clicks from toggling
        if (e.target.closest('.expand-btn') || e.target.closest('a')) return;

        item.classList.toggle('active');
      });
    });

    closeBtn.addEventListener('click', () => {
      lightbox.classList.remove('active');
    });

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('active');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        lightbox.classList.remove('active');
      }
    });

    document.addEventListener('click', (e) => {
      const isMobile = window.matchMedia('(max-width: 950px)').matches;
      if (!isMobile) return;

      document.querySelectorAll('.gallery-item.active').forEach(item => {
        if (!item.contains(e.target)) {
          item.classList.remove('active');
        }
      });
    });

  }

  // nav

  function showImage(index) {
    currentIndex = (index + images.length) % images.length;

    lightboxImg.src = images[currentIndex];

    const caption = captions[currentIndex];

    lightboxCaptionLink.textContent = caption.text;


    if (caption.link) {
      lightboxCaptionLink.href = caption.link;
      lightboxCaptionLink.style.pointerEvents = 'auto';
    } else {
      lightboxCaptionLink.removeAttribute('href');
      lightboxCaptionLink.style.pointerEvents = 'none';
    }
  }

  const nextBtn = document.getElementById('lightboxNext');
  const prevBtn = document.getElementById('lightboxPrev');

  if (nextBtn && prevBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showImage(currentIndex + 1);
    });

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showImage(currentIndex - 1);
    });
  }

  // keyboard controls

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;

    if (e.key === 'Escape') {
      lightbox.classList.remove('active');
    }

    if (e.key === 'ArrowRight') {
      showImage(currentIndex + 1);
    }

    if (e.key === 'ArrowLeft') {
      showImage(currentIndex - 1);
    }
  });

  // swipe on mobile
  
  let touchStartX = 0;
  let touchEndX = 0;

  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;

    const minSwipeDistance = 50; 

    if (Math.abs(swipeDistance) < minSwipeDistance) return;

    if (swipeDistance < 0) {
      // swipe left next
      showImage(currentIndex + 1);
    } else {
      // swipe right prev
      showImage(currentIndex - 1);
    }
  }



});





