import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

/**
 * Generates a strictly increasing unique numericId backed by an atomic Counter document.
 * Runs counter increments outside active transactions so concurrent writes never abort a session.
 */
export async function getNextNumericId(Model, key, minOffset = 0, session = null) {
  const maxDocQuery = Model.findOne({}, { numericId: 1 })
    .sort({ numericId: -1 })
    .lean();
  if (session) maxDocQuery.session(session);
  const maxDoc = await maxDocQuery;
  const floorVal = Math.max(minOffset, Number(maxDoc?.numericId) || 0);

  let counter;
  try {
    counter = await Counter.findOneAndUpdate(
      { _id: key },
      { $inc: { seq: 1 } },
      { upsert: true, new: true },
    );
  } catch (err) {
    if (err?.code === 11000) {
      counter = await Counter.findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { new: true },
      );
    } else {
      throw err;
    }
  }

  if (!counter || counter.seq <= floorVal) {
    const bumped = await Counter.findOneAndUpdate(
      { _id: key, seq: { $lt: floorVal + 1 } },
      { $set: { seq: floorVal + 1 } },
      { new: true },
    );
    if (bumped) {
      return bumped.seq;
    }
    const next = await Counter.findOneAndUpdate(
      { _id: key },
      { $inc: { seq: 1 } },
      { new: true },
    );
    return next.seq;
  }

  return counter.seq;
}

