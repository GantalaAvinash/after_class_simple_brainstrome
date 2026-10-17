import { requireValue } from "./errors.js";
import { normaliseUpdates } from "./validation.js";
import { orderResponse } from "./orders.js";
import { randomUUID } from "node:crypto";

export async function transaction(client, work) {
  requireValue(
    client?.startSession,
    "Database writes are temporarily unavailable.",
    503,
  );
  const session = client.startSession();
  try {
    return await session.withTransaction(() => work(session));
  } finally {
    await session.endSession();
  }
}

export async function applyGeneralUpdates(db, client, updates, username) {
  return transaction(client, async (session) => {
    const lessons = db.collection("lesson");
    for (const update of updates) {
      requireValue(
        await lessons.findOne(
          { _id: update.lessonId, deleted: { $ne: true } },
          { session },
        ),
        "Lesson not found.",
        404,
      );
    }
    for (const update of updates) {
      const result = await lessons.updateOne(
        { _id: update.lessonId },
        {
          $set: { ...update.changes, updatedAt: new Date() },
          $inc: { revision: 1 },
        },
        { session },
      );
      requireValue(
        result.matchedCount === 1,
        "A lesson changed during the update. Please retry.",
        409,
      );
    }
    const result = {
      lessons: await lessons
        .find(
          { _id: { $in: updates.map((update) => update.lessonId) } },
          { session },
        )
        .toArray(),
    };
    if (username)
      await db
        .collection("adminAudit")
        .insertOne(
          {
            _id: randomUUID(),
            username,
            action: "bulk-update",
            lessonId: updates[0].lessonId,
            occurredAt: new Date(),
            result,
          },
          { session },
        );
    return result;
  });
}

export async function updateLessons(db, client, body, username) {
  const { updates, orderId } = normaliseUpdates(body);
  if (orderId) return confirmOrder(db, client, orderId, updates);
  return applyGeneralUpdates(db, client, updates, username);
}

function checkTargets(order, updates) {
  requireValue(
    updates.length === order.items.length,
    "Checkout must update every ordered lesson exactly once.",
  );
  for (const item of order.items) {
    const update = updates.find((entry) =>
      entry.lessonId.equals(item.lessonId),
    );
    requireValue(
      update &&
        Object.keys(update.changes).length === 1 &&
        update.changes.space === item.spaceAfter,
      "Checkout space updates must match the saved order.",
    );
  }
}

export async function confirmOrder(db, client, orderId, updates) {
  return transaction(client, async (session) => {
    const orders = db.collection("order");
    const lessons = db.collection("lesson");
    const order = await orders.findOne({ _id: orderId }, { session });
    requireValue(order, "Order not found.", 404);
    checkTargets(order, updates);
    if (order.status !== "confirmed") {
      requireValue(
        order.status === "pending",
        "This order cannot be confirmed.",
        409,
      );
      for (const item of order.items) {
        // Compare-and-set prevents a stale browser from overwriting another purchase.
        const result = await lessons.updateOne(
          {
            _id: item.lessonId,
            space: item.spaceBefore,
            price: item.unitPrice,
            deleted: { $ne: true },
          },
          {
            $set: { space: item.spaceAfter, updatedAt: new Date() },
            $inc: { revision: 1 },
          },
          { session },
        );
        requireValue(
          result.matchedCount === 1,
          "Availability or lesson details changed. Please refresh your basket and try again.",
          409,
        );
      }
      const result = await orders.updateOne(
        { _id: orderId, status: "pending" },
        {
          $set: { status: "confirmed", confirmedAt: new Date() },
        },
        { session },
      );
      requireValue(
        result.matchedCount === 1,
        "The order changed during checkout. Please retry.",
        409,
      );
    }
    return {
      ...orderResponse({ ...order, status: "confirmed" }),
      lessons: await lessons
        .find(
          { _id: { $in: order.items.map((item) => item.lessonId) } },
          { session },
        )
        .toArray(),
    };
  });
}

export function registerUpdateRoute(app, db, client, guard) {
  app.put(
    "/lessons",
    async (req, res, next) => {
      // An order ID never grants arbitrary edit permission: confirmOrder checks
      // the complete, saved set of absolute space targets before writing.
      if (req.body?.orderId !== undefined) return next();
      await guard(req, res, next);
    },
    async (req, res) =>
      res.json(await updateLessons(db, client, req.body, req.admin?.username)),
  );
}
