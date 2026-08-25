/** Uniform success envelope — every controller answers through these helpers. */
export const ok = (res, data, message = 'OK', meta) =>
  res.status(200).json({ success: true, message, data, ...(meta ? { meta } : {}) });

export const created = (res, data, message = 'Created') =>
  res.status(201).json({ success: true, message, data });

export const noContent = (res) => res.status(204).send();

export const paginated = (res, { items, total, page, limit }, message = 'OK') =>
  res.status(200).json({
    success: true,
    message,
    data: items,
    meta: {
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
