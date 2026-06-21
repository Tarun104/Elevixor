const SERVICE_EMAIL_RECIPIENT = 'elevixor1042@gmail.com';

function encodeText(text) {
  return encodeURIComponent(text || '');
}

function getServiceTitle(form) {
  const cardHeader = form.closest('.form-card')?.querySelector('h1');
  if (cardHeader && cardHeader.textContent.trim()) {
    return cardHeader.textContent.trim();
  }
  if (document.title) {
    return document.title.replace(/\s*-\s*Elevixor\s*$/i, '').trim();
  }
  return 'Service Inquiry';
}

function getFormValues(form) {
  const values = {};
  form.querySelectorAll('input, select, textarea').forEach((field) => {
    if (!field.name) return;
    if (field.type === 'checkbox') {
      values[field.name] = field.checked ? 'Yes' : 'No';
      return;
    }
    values[field.name] = field.value.trim();
  });
  return values;
}

function buildEmailBody(form, serviceTitle, values) {
  const lines = [];
  lines.push(`Service: ${serviceTitle}`);
  lines.push('');
  Object.keys(values).forEach((key) => {
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (char) => char.toUpperCase());
    lines.push(`${label}: ${values[key]}`);
  });
  lines.push('');
  lines.push('---');
  lines.push('Sent from Elevixor service inquiry form');
  return lines.join('\n');
}

function openGmailCompose(to, subject, body) {
  const baseUrl = 'https://mail.google.com/mail/?view=cm&fs=1';
  const params = [
    `to=${encodeText(to)}`,
    `su=${encodeText(subject)}`,
    `body=${encodeText(body)}`
  ].join('&');
  window.open(`${baseUrl}&${params}`, '_blank');
}

function openMailto(to, subject, body) {
  const mailtoLink = `mailto:${encodeText(to)}?subject=${encodeText(subject)}&body=${encodeText(body)}`;
  window.location.href = mailtoLink;
}

function validateForm(form) {
  let valid = true;
  form.querySelectorAll('[required]').forEach((field) => {
    if (!field.value.trim()) {
      valid = false;
      field.style.borderColor = '#ef4444';
    } else {
      field.style.borderColor = '';
    }
  });
  return valid;
}

function handleEmailFormSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateForm(form)) {
    const errorMessage = form.querySelector('.message.error');
    const successMessage = form.querySelector('.message.success');
    if (errorMessage) {
      errorMessage.textContent = 'Please fill in all required fields before sending.';
      errorMessage.classList.add('show');
    }
    if (successMessage) {
      successMessage.classList.remove('show');
    }
    return;
  }

  const serviceTitle = getServiceTitle(form);
  const values = getFormValues(form);
  const subject = `Elevixor Inquiry: ${serviceTitle}`;
  const body = buildEmailBody(form, serviceTitle, values);

  openGmailCompose(SERVICE_EMAIL_RECIPIENT, subject, body);
  openMailto(SERVICE_EMAIL_RECIPIENT, subject, body);
}

document.addEventListener('DOMContentLoaded', () => {
  const forms = Array.from(document.querySelectorAll('.form-card form, form[data-email-submit]'));
  forms.forEach((form) => {
    if (form.dataset.emailHandlerAttached === 'true') return;
    form.addEventListener('submit', handleEmailFormSubmit);
    form.dataset.emailHandlerAttached = 'true';
  });
});
