export function formatTimestamp(ts) {
  if (!ts) {
    return ``;
  }
  const dateTime = new Date(ts);
  // return `${dateTime.toDateString()} ${dateTime.toLocaleTimeString()}`;
  return dateTime.toLocaleString();
}

export function copyToClipboard(text) {
  // https://stackoverflow.com/a/33928558/12641958
  if (window.clipboardData && window.clipboardData.setData) {
    // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
    window.clipboardData.setData('Text', text);
    return true;
  } else if (
    document.queryCommandSupported &&
    document.queryCommandSupported('copy')
  ) {
    var textarea = document.createElement('textarea');
    textarea.textContent = text;
    textarea.style.position = 'fixed'; // Prevent scrolling to bottom of page in Microsoft Edge.
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy'); // Security exception may be thrown by some browsers.
      return true;
    } catch (ex) {
      console.warn('Copy to clipboard failed.', ex);
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

export function formatSnakeCase(str) {
  // example_of_text  ->  Example Of Text
  return str
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ');
}

/**
 * Convenience functions for getting & setting localStorage
 */
export const getLocalStorage = (key) => {
  console.log(`getLocalStorage: getting key=${key}`);
  const value = window.localStorage.getItem(key);
  if (value === null) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    console.debug(error);
    return value;
  }
};

export const setLocalStorage = (key, val) => {
  console.log(`setLocalStorage: saving key=${key} val=${val}`);
  window.localStorage.setItem(key, JSON.stringify(val));
  return true;
};

export const removeLocalStorage = (key) => {
  console.log(`removeLocalStorage: deleting key=${key}`);
  window.localStorage.removeItem(key);
  return true;
};
