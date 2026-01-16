exports.success = (res, data = {}, message = 'Success', status = 200) => {
  return res.status(status).json({ success: true, message, data });
};

exports.error = (res, message = 'Error', status = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(status).json(payload);
};