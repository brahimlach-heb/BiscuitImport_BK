exports.success = (res, data = {}, message = 'Success', status = 200) => {
  return res.status(status).json({ success: true, message, data });
};

exports.created = (res, data = {}, message = 'Created', status = 201) => {
  return res.status(status).json({ success: true, message, data });
};

exports.notFound = (res, message = 'Not found', status = 404) => {
  return res.status(status).json({ success: false, message });
};

exports.error = (res, message = 'Error', status = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(status).json(payload);
};