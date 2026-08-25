/**
 * Repository pattern — the single seam between services and Mongoose.
 *
 * Services never touch a Model directly, so swapping the persistence layer
 * (or adding caching / read replicas) means changing this file only.
 */
export class BaseRepository {
  constructor(model) {
    if (!model) throw new Error('BaseRepository requires a Mongoose model');
    this.model = model;
  }

  create(payload) {
    return this.model.create(payload);
  }

  insertMany(payloads) {
    return this.model.insertMany(payloads);
  }

  findById(id, { populate = [], select, lean = false } = {}) {
    let q = this.model.findById(id);
    if (select) q = q.select(select);
    populate.forEach((p) => { q = q.populate(p); });
    return lean ? q.lean() : q;
  }

  findOne(filter = {}, { populate = [], select, lean = false } = {}) {
    let q = this.model.findOne(filter);
    if (select) q = q.select(select);
    populate.forEach((p) => { q = q.populate(p); });
    return lean ? q.lean() : q;
  }

  find(filter = {}, { populate = [], select, sort = '-createdAt', skip = 0, limit = 0, lean = false } = {}) {
    let q = this.model.find(filter).sort(sort);
    if (skip) q = q.skip(skip);
    if (limit) q = q.limit(limit);
    if (select) q = q.select(select);
    populate.forEach((p) => { q = q.populate(p); });
    return lean ? q.lean() : q;
  }

  /** Convenience: one round-trip page plus its total, in the shape `paginated()` expects. */
  async paginate(filter = {}, { page = 1, limit = 12, skip = 0, sort = '-createdAt', populate = [], select, lean = true } = {}) {
    const [items, total] = await Promise.all([
      this.find(filter, { populate, select, sort, skip, limit, lean }),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  updateById(id, update, options = {}) {
    return this.model.findByIdAndUpdate(id, update, { new: true, runValidators: true, ...options });
  }

  updateOne(filter, update, options = {}) {
    return this.model.findOneAndUpdate(filter, update, { new: true, runValidators: true, ...options });
  }

  updateMany(filter, update) {
    return this.model.updateMany(filter, update);
  }

  deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  deleteMany(filter) {
    return this.model.deleteMany(filter);
  }

  count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  exists(filter) {
    return this.model.exists(filter);
  }

  aggregate(pipeline) {
    return this.model.aggregate(pipeline);
  }

  distinct(field, filter = {}) {
    return this.model.distinct(field, filter);
  }
}
