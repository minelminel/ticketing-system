export function formatTimestamp(ts) {
  if (!ts) {
    return ``;
  }
  const dateTime = new Date(ts);
  // return `${dateTime.toDateString()} ${dateTime.toLocaleTimeString()}`;
  return dateTime.toLocaleString();
}
