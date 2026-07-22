import { db } from "../lib/db.js";
import cloudinary from "../lib/cloudinary.js";
import { getSafeString } from "../lib/utils.js";
import { serializePublication } from "../models/publication.model.js";

const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const parseImagePayload = (image) => {
  if (!image || typeof image !== "object") {
    throw new Error("Featured image is required");
  }

  const { data, mimeType, fileName } = image;

  if (typeof data !== "string" || !data.trim()) {
    throw new Error("Featured image data is required");
  }

  if (typeof mimeType !== "string" || !ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
    throw new Error("Featured image must be JPG, PNG, or WebP");
  }

  if (typeof fileName !== "string" || !fileName.trim()) {
    throw new Error("Featured image file name is required");
  }

  let buffer;

  try {
    buffer = Buffer.from(data, "base64");
  } catch (error) {
    throw new Error("Featured image data is invalid");
  }

  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Featured image must be smaller than 2 MB");
  }

  return { data, mimeType, fileName };
};

const uploadImageToCloudinary = async ({ data, mimeType }) => {
  const uploadData = `data:${mimeType};base64,${data}`;
  const response = await cloudinary.uploader.upload(uploadData, {
    folder: "clearview-blog/publications",
    use_filename: true,
    unique_filename: false,
    overwrite: false,
    resource_type: "image",
  });

  return {
    url: response.secure_url,
  };
};

const validateCategoryIds = async (categoryIds) => {
  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    throw new Error("At least one category must be selected");
  }

  const ids = categoryIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (ids.length !== categoryIds.length) {
    throw new Error("Category IDs must be valid numbers");
  }

  const placeholders = ids.map(() => "?").join(",");
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS count FROM categories WHERE id IN (${placeholders}) AND archived = FALSE`,
    ids,
  );

  if (!rows.length || rows[0].count !== ids.length) {
    throw new Error("One or more selected categories do not exist");
  }

  return ids;
};

const getPostCategories = async (postIds) => {
  if (!postIds.length) {
    return {};
  }

  const placeholders = postIds.map(() => "?").join(",");
  const [rows] = await db.execute(
    `
      SELECT
        pc.post_id,
        c.id,
        c.name
      FROM post_categories AS pc
      INNER JOIN categories AS c
        ON c.id = pc.category_id
        AND c.archived = FALSE
      WHERE pc.post_id IN (${placeholders})
        AND pc.archived = FALSE
    `,
    postIds,
  );

  return rows.reduce((map, row) => {
    map[row.post_id] = map[row.post_id] || [];
    map[row.post_id].push({ id: row.id, name: row.name });
    return map;
  }, {});
};

const getRelatedPosts = async (publicationId, categoryIds, userId) => {
  if (!categoryIds.length) {
    return [];
  }

  const userLikeJoin = userId
    ? `
      LEFT JOIN post_likes AS ul
        ON ul.post_id = p.id
        AND ul.user_id = ?
        AND ul.archived = FALSE
    `
    : "";

  const userLikeSelect = userId
    ? "MAX(ul.id) IS NOT NULL AS liked_by_current_user"
    : "FALSE AS liked_by_current_user";

  const params = userId ? [userId, publicationId, publicationId] : [publicationId, publicationId];

  const [rows] = await db.execute(
    `
      SELECT
        p.id,
        p.title,
        p.excerpt,
        p.featured_image_url,
        p.created_at,
        p.updated_at,
        u.full_name AS author,
        COUNT(DISTINCT pl.id) AS likes_count,
        ${userLikeSelect},
        COUNT(DISTINCT pc.category_id) AS shared_category_count
      FROM post_categories AS current_pc
      INNER JOIN categories AS c_current
        ON c_current.id = current_pc.category_id
        AND c_current.archived = FALSE
      INNER JOIN post_categories AS pc
        ON pc.category_id = current_pc.category_id
        AND pc.archived = FALSE
      INNER JOIN categories AS c_related
        ON c_related.id = pc.category_id
        AND c_related.archived = FALSE
      INNER JOIN posts AS p
        ON p.id = pc.post_id
        AND p.archived = FALSE
      INNER JOIN users AS u
        ON u.id = p.author_id
        AND u.archived = FALSE
      LEFT JOIN post_likes AS pl
        ON pl.post_id = p.id
        AND pl.archived = FALSE
      ${userLikeJoin}
      WHERE current_pc.post_id = ?
        AND current_pc.archived = FALSE
        AND p.id != ?
      GROUP BY p.id
      ORDER BY shared_category_count DESC, p.created_at DESC, p.id ASC
      LIMIT 4
    `,
    params,
  );

  if (!rows.length) {
    return [];
  }

  const relatedIds = rows.map((row) => row.id);
  const categoriesByPost = await getPostCategories(relatedIds);

  return rows.map((publication) =>
    serializePublication({
      ...publication,
      categories: categoriesByPost[publication.id] || [],
    }),
  );
};

const parseInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const buildPublicationFilters = (query) => {
  const filters = {
    page: parseInteger(query.page, 1),
    limit: parseInteger(query.limit, 10),
    search: getSafeString(query.search),
    categoryId: query.category ? Number(query.category) : null,
    sortBy: getSafeString(query.sortBy).toLowerCase(),
    sortOrder: getSafeString(query.sortOrder).toLowerCase(),
  };

  if (filters.categoryId && !Number.isInteger(filters.categoryId)) {
    throw new Error("Category filter must be a valid category ID");
  }

  if (!["date", "title"].includes(filters.sortBy)) {
    filters.sortBy = "date";
  }

  if (!["asc", "desc"].includes(filters.sortOrder)) {
    filters.sortOrder = "desc";
  }

  return filters;
};

const getPublications = async (req, res) => {
  try {
    const filters = buildPublicationFilters(req.query);
    const offset = (filters.page - 1) * filters.limit;
    const currentUserId = req.user?._id;
    const includeUserLike = Boolean(currentUserId);

    const whereClauses = ["p.archived = FALSE"];
    const params = [];

    if (filters.search) {
      whereClauses.push("LOWER(p.title) LIKE ?");
      params.push(`%${filters.search.toLowerCase()}%`);
    }

    if (filters.categoryId) {
      whereClauses.push(
        "EXISTS (SELECT 1 FROM post_categories pc JOIN categories c ON c.id = pc.category_id AND c.archived = FALSE WHERE pc.post_id = p.id AND pc.archived = FALSE AND c.id = ?)",
      );
      params.push(filters.categoryId);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [countRows] = await db.execute(
      `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM posts AS p
      ${whereSql}
    `,
      params,
    );

    const total = countRows[0]?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / filters.limit));
    const sortMap = {
      date: "p.created_at",
      title: "p.title",
    };
    const sortColumn = sortMap[filters.sortBy] || "p.created_at";

    const userLikeJoin = includeUserLike
      ? `
      LEFT JOIN post_likes AS ul
        ON ul.post_id = p.id
        AND ul.user_id = ?
        AND ul.archived = FALSE
    `
      : "";

    const userLikeSelect = includeUserLike
      ? "MAX(ul.id) IS NOT NULL AS liked_by_current_user"
      : "FALSE AS liked_by_current_user";

    const queryParams = includeUserLike ? [currentUserId, ...params] : [...params];

    const [posts] = await db.execute(
      `
      SELECT
        p.id,
        p.title,
        p.excerpt,
        p.featured_image_url,
        p.created_at,
        p.updated_at,
        u.full_name AS author,
        COUNT(DISTINCT pl.id) AS likes_count,
        ${userLikeSelect}
      FROM posts AS p
      INNER JOIN users AS u
        ON u.id = p.author_id
        AND u.archived = FALSE
      LEFT JOIN post_likes AS pl
        ON pl.post_id = p.id
        AND pl.archived = FALSE
      ${userLikeJoin}
      ${whereSql}
      GROUP BY p.id
      ORDER BY ${sortColumn} ${filters.sortOrder.toUpperCase()}
      LIMIT ?
      OFFSET ?
    `,
      [...queryParams, filters.limit, offset],
    );

    const postIds = posts.map((post) => post.id);
    const categoriesByPost = await getPostCategories(postIds);

    const result = posts.map((publication) =>
      serializePublication({
        ...publication,
        categories: categoriesByPost[publication.id] || [],
      }),
    );

    return res.status(200).json({
      publications: result,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching publications:", error);
    return res.status(400).json({ message: error.message || "Unable to fetch publications" });
  }
};

const getPublicationById = async (req, res) => {
  try {
    const publicationId = Number(req.params.id);

    if (!Number.isInteger(publicationId) || publicationId <= 0) {
      return res.status(400).json({ message: "Publication ID must be a positive number" });
    }

    const currentUserId = req.user?._id;
    const includeUserLike = Boolean(currentUserId);

    const userLikeJoin = includeUserLike
      ? `
      LEFT JOIN post_likes AS ul
        ON ul.post_id = p.id
        AND ul.user_id = ?
        AND ul.archived = FALSE
    `
      : "";

    const userLikeSelect = includeUserLike
      ? "MAX(ul.id) IS NOT NULL AS liked_by_current_user"
      : "FALSE AS liked_by_current_user";

    const queryParams = includeUserLike ? [currentUserId, publicationId] : [publicationId];

    const [rows] = await db.execute(
      `
      SELECT
        p.id,
        p.title,
        p.excerpt,
        p.content,
        p.featured_image_url,
        p.created_at,
        p.updated_at,
        u.full_name AS author,
        COUNT(DISTINCT pl.id) AS likes_count,
        ${userLikeSelect}
      FROM posts AS p
      INNER JOIN users AS u
        ON u.id = p.author_id
        AND u.archived = FALSE
      LEFT JOIN post_likes AS pl
        ON pl.post_id = p.id
        AND pl.archived = FALSE
      ${userLikeJoin}
      WHERE p.id = ?
        AND p.archived = FALSE
      GROUP BY p.id
    `,
      queryParams,
    );

    const publication = rows[0];

    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    const categoriesByPost = await getPostCategories([publication.id]);
    const categories = categoriesByPost[publication.id] || [];
    const relatedPosts = await getRelatedPosts(publication.id, categories.map((category) => category.id), currentUserId);

    return res.status(200).json({
      publication: serializePublication({
        ...publication,
        categories,
      }, { includeContent: true }),
      relatedPosts,
    });
  } catch (error) {
    console.error("Error fetching publication by ID:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createPublication = async (req, res) => {
  let uploadedImage = null;
  let connection = null;

  try {
    const title = getSafeString(req.body.title);
    const excerpt = getSafeString(req.body.excerpt);
    const content = getSafeString(req.body.content);
    const categoryIds = await validateCategoryIds(req.body.categoryIds);

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!excerpt) {
      return res.status(400).json({ message: "Excerpt is required" });
    }

    if (excerpt.length > 160) {
      return res.status(400).json({ message: "Excerpt cannot exceed 160 characters" });
    }

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    if (!req.body.featuredImage) {
      return res.status(400).json({ message: "Featured image is required" });
    }

    const imagePayload = parseImagePayload(req.body.featuredImage);
    uploadedImage = await uploadImageToCloudinary(imagePayload);

    const authorId = req.user?._id;

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [insertResult] = await connection.execute(
      `
      INSERT INTO posts (
        author_id,
        title,
        excerpt,
        content,
        featured_image_url,
        created_at,
        updated_at,
        archived
      ) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), FALSE)
    `,
      [authorId, title, excerpt, content, uploadedImage.url],
    );

    const postId = insertResult.insertId;

    for (const categoryId of categoryIds) {
      await connection.execute(
        `
        INSERT INTO post_categories (
          post_id,
          category_id,
          created_at,
          updated_at,
          archived
        ) VALUES (?, ?, NOW(), NOW(), FALSE)
      `,
        [postId, categoryId],
      );
    }

    await connection.commit();

    const [rows] = await db.execute(
      `SELECT id, title, excerpt, content, featured_image_url, created_at, updated_at FROM posts WHERE id = ? LIMIT 1`,
      [postId],
    );

    return res.status(201).json({ publication: serializePublication({ ...rows[0], categories: [] }) });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    if (uploadedImage?.url) {
      console.error("Uploaded image was not persisted cleanly", uploadedImage.url);
    }

    if (error.message.includes("Category IDs")) {
      return res.status(400).json({ message: error.message });
    }

    if (error.message.includes("already exists") || error.message.includes("duplicate")) {
      return res.status(409).json({ message: "A publication with the same title already exists" });
    }

    console.error("Error creating publication:", error);
    return res.status(500).json({ message: "Unable to create publication" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const updatePublication = async (req, res) => {
  let newImage = null;
  let connection = null;

  try {
    const publicationId = Number(req.params.id);

    if (!Number.isInteger(publicationId) || publicationId <= 0) {
      return res.status(400).json({ message: "Publication ID must be a positive number" });
    }

    const title = getSafeString(req.body.title);
    const excerpt = getSafeString(req.body.excerpt);
    const content = getSafeString(req.body.content);
    const categoryIds = await validateCategoryIds(req.body.categoryIds);

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!excerpt) {
      return res.status(400).json({ message: "Excerpt is required" });
    }

    if (excerpt.length > 160) {
      return res.status(400).json({ message: "Excerpt cannot exceed 160 characters" });
    }

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const [rows] = await db.execute(
      `SELECT id, title, featured_image_url FROM posts WHERE id = ? AND archived = FALSE LIMIT 1`,
      [publicationId],
    );

    const existing = rows[0];

    if (!existing) {
      return res.status(404).json({ message: "Publication not found" });
    }

    const shouldReplaceImage = Boolean(req.body.featuredImage);

    if (shouldReplaceImage) {
      const imagePayload = parseImagePayload(req.body.featuredImage);
      newImage = await uploadImageToCloudinary(imagePayload);
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      `
      UPDATE posts
      SET title = ?,
          excerpt = ?,
          content = ?,
          featured_image_url = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
      [
        title,
        excerpt,
        content,
        shouldReplaceImage ? newImage.url : existing.featured_image_url,
        publicationId,
      ],
    );

    await connection.execute(
      `
      UPDATE post_categories
      SET archived = TRUE,
          updated_at = NOW()
      WHERE post_id = ?
        AND archived = FALSE
    `,
      [publicationId],
    );

    for (const categoryId of categoryIds) {
      await connection.execute(
        `
        INSERT INTO post_categories (
          post_id,
          category_id,
          created_at,
          updated_at,
          archived
        ) VALUES (?, ?, NOW(), NOW(), FALSE)
      `,
        [publicationId, categoryId],
      );
    }

    await connection.commit();

    return res.status(200).json({ message: "Publication updated successfully" });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    if (error.message.includes("Category IDs")) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Error updating publication:", error);
    return res.status(500).json({ message: "Unable to update publication" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const deletePublication = async (req, res) => {
  let connection = null;

  try {
    const publicationId = Number(req.params.id);

    if (!Number.isInteger(publicationId) || publicationId <= 0) {
      return res.status(400).json({ message: "Publication ID must be a positive number" });
    }

    const [rows] = await db.execute(
      `SELECT id FROM posts WHERE id = ? AND archived = FALSE LIMIT 1`,
      [publicationId],
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Publication not found" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      `
      UPDATE post_categories
      SET archived = TRUE,
          updated_at = NOW()
      WHERE post_id = ?
        AND archived = FALSE
    `,
      [publicationId],
    );

    await connection.execute(
      `
      UPDATE posts
      SET archived = TRUE,
          updated_at = NOW()
      WHERE id = ?
    `,
      [publicationId],
    );

    await connection.commit();

    return res.status(204).send();
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Error deleting publication:", error);
    return res.status(500).json({ message: "Unable to delete publication" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export {
  getPublications,
  getPublicationById,
  createPublication,
  updatePublication,
  deletePublication,
};
