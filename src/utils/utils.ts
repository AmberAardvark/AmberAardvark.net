// Format the date to a string
function formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {year: 'numeric', month: 'short', day: 'numeric'};
  
    return new Date(date).toLocaleDateString(undefined, options);
  }
  // Capitalize the first letter
function capitalize(str:string): string {
  if ( typeof str !== 'string' || str.length === 0 ) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

  export { formatDate, capitalize };

// Utility function to handle URL construction with the base path
export function getRelativeUrl(path: string): string {
  let base = import.meta.env.BASE_URL;
  
  // Ensure base ends with a slash
  if (!base.endsWith("/")) {
    base += "/";
  }
  
  // Remove leading slash from path if present to avoid double slashes
  if (path.startsWith("/")) {
    path = path.slice(1);
  }
  
  return base + path;
}