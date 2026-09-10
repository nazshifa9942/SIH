/**
 * Safely formats a date string, number, or Date instance into a localized string.
 * Returns defaultText if the date is invalid, null, or undefined.
 */
export function formatDateSafely(dateInput, defaultText = 'N/A', options = {}) {
  if (!dateInput) return defaultText;

  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return defaultText;
    }
    return d.toLocaleDateString('en-US', options);
  } catch {
    return defaultText;
  }
}

/**
 * Safely formats a date into ISO date string (YYYY-MM-DD) for HTML inputs.
 */
export function formatDateISO(dateInput) {
  if (!dateInput) return '';

  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return '';
    }
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/**
 * Safely formats a date string, number, or Date instance into localized time string.
 */
export function formatTimeSafely(dateInput, defaultText = 'N/A', options = {}) {
  if (!dateInput) return defaultText;

  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return defaultText;
    }
    return d.toLocaleTimeString('en-US', options);
  } catch {
    return defaultText;
  }
}
