export function getContentType(ext) {

    const types = {
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "text/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        "gif": "image/giv",
        ".svg": "image/svg+xml"
    }

    return types[ext.toLowerCase()] || "text/html"
}