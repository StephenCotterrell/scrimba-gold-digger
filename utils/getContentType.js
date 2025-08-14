export function getContentType(ext) {

    const types = {
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        "gif": "image/gif",
        ".svg": "image/svg+xml",
        ".pdf": "application/pdf"
    }

    return types[ext.toLowerCase()] || "text/html"
}