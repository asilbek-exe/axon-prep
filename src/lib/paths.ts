export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Public files are plain anchors, so Next does not prefix them for us. */
export function sitePath(path: string) {
  return path.startsWith("/") && !path.startsWith("//")
    ? `${basePath}${path}`
    : path;
}

/** Normalize browser URLs and Next pathnames to the workspace's route names. */
export function appPath(path: string, prefix = basePath) {
  const local =
    prefix && (path === prefix || path.startsWith(`${prefix}/`))
      ? path.slice(prefix.length)
      : path;
  return local.replace(/\/+$/, "") || "/";
}

/** Query parameters let browser-created questions work on static hosting. */
export function questionHref(id: string) {
  return `/questions/edit?id=${encodeURIComponent(id)}`;
}
