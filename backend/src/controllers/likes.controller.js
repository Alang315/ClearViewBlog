import { db } from "../lib/db.js";
import { serializeLikeStatus } from "../models/like.model.js";

const validatePostExists = async (postId) => {
  const [rows] = await db.execute(
    `SELECT id FROM posts WHERE id = ? AND archived = FALSE LIMIT 1`,
    [postId],
  );

  return rows.length > 0;
};

const createLike = async (req, res) => {
  try {
    const postId = Number(req.params.postId);

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: "Post ID must be a positive number" });
    }

    if (!req.user || req.user.role === "admin") {
      return res.status(403).json({ message: "Administrator accounts cannot react to publications." });
    }

    const postExists = await validatePostExists(postId);

    if (!postExists) {
      return res.status(404).json({ message: "Publication not found" });
    }

    const [existingRows] = await db.execute(
      `
        SELECT id, archived
        FROM post_likes
        WHERE post_id = ?
          AND user_id = ?
        LIMIT 1
      `,
      [postId, req.user._id],
    );

    if (existingRows.length > 0) {
      const existingLike = existingRows[0];

      if (existingLike.archived) {
        await db.execute(
          `
            UPDATE post_likes
            SET archived = FALSE,
                updated_at = NOW()
            WHERE id = ?
          `,
          [existingLike.id],
        );
      }
    } else {
      await db.execute(
        `
          INSERT INTO post_likes (
            post_id,
            user_id,
            created_at,
            updated_at,
            archived
          ) VALUES (?, ?, NOW(), NOW(), FALSE)
        `,
        [postId, req.user._id],
      );
    }

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS likes_count FROM post_likes WHERE post_id = ? AND archived = FALSE`,
      [postId],
    );

    return res.status(200).json(
      serializeLikeStatus({
        postId,
        liked_by_current_user: true,
        likes_count: countRows[0]?.likes_count ?? 0,
      }),
    );
  } catch (error) {
    console.error("Error creating like:", error);
    return res.status(500).json({ message: "Unable to react to publication" });
  }
};

const removeLike = async (req, res) => {
  try {
    const postId = Number(req.params.postId);

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ message: "Post ID must be a positive number" });
    }

    if (!req.user || req.user.role === "admin") {
      return res.status(403).json({ message: "Administrator accounts cannot react to publications." });
    }

    const postExists = await validatePostExists(postId);

    if (!postExists) {
      return res.status(404).json({ message: "Publication not found" });
    }

    await db.execute(
      `
        UPDATE post_likes
        SET archived = TRUE,
            updated_at = NOW()
        WHERE post_id = ?
          AND user_id = ?
          AND archived = FALSE
      `,
      [postId, req.user._id],
    );

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS likes_count FROM post_likes WHERE post_id = ? AND archived = FALSE`,
      [postId],
    );

    return res.status(200).json(
      serializeLikeStatus({
        postId,
        liked_by_current_user: false,
        likes_count: countRows[0]?.likes_count ?? 0,
      }),
    );
  } catch (error) {
    console.error("Error removing like:", error);
    return res.status(500).json({ message: "Unable to remove reaction" });
  }
};

export { createLike, removeLike };
