export function notFoundHandler(req, res) {
  res.status(404).json({
    ok: false,
    error: 'Route not found',
    path: req.originalUrl
  });
}

export function errorHandler(error, req, res, next) {
  console.error('[api]', error);
  const status = error.statusCode || error.status || 500;
  res.status(status).json({
    ok: false,
    error: error.message || 'Unexpected server error',
    ...(error.code ? { code: error.code } : {}),
    ...(error.conflict ? { conflict: error.conflict } : {}),
    ...(error.suggestions ? { suggestions: error.suggestions } : {})
  });
}
