document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('submit-form');

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
});
