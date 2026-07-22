import { db } from "../lib/db.js";
import { getSafeString } from "../lib/utils.js";
import { serializeCategory } from "../models/category.model.js";

const parseInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const getCategories = async (req, res) => {
  try {
    const page = parseInteger(req.query.page, 1);
    const limit = parseInteger(req.query.limit, 10);
    const search = getSafeString(req.query.search).toLowerCase();
    const sortOrder = getSafeString(req.query.sortOrder).toLowerCase() === "oldest" ? "ASC" : "DESC";
    const offset = (page - 1) * limit;

    const whereClauses = ["archived = FALSE"];
    const params = [];

    if (search) {
      whereClauses.push("(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [countRows] = await db.execute(`SELECT COUNT(*) AS total FROM categories ${whereSql}`, params);
    const total = countRows[0]?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const [rows] = await db.execute(
      `
      SELECT id, name, description, created_at, updated_at
      FROM categories
      ${whereSql}
      ORDER BY created_at ${sortOrder}
      LIMIT ?
      OFFSET ?
    `,
      [...params, limit, offset],
    );

    return res.status(200).json({
      categories: rows.map(serializeCategory),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ message: "Unable to fetch categories" });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ message: "Category ID must be a positive number" });
    }

    const [rows] = await db.execute(
      `SELECT id, name, description, created_at, updated_at FROM categories WHERE id = ? AND archived = FALSE LIMIT 1`,
      [categoryId],
    );

    const category = rows[0];

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({ category: serializeCategory(category) });
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createCategory = async (req, res) => {
  try {
    const name = getSafeString(req.body.name);
    const description = getSafeString(req.body.description);

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    if (description.length > 160) {
      return res.status(400).json({ message: "Description cannot exceed 160 characters" });
    }

    const [existing] = await db.execute(
      `SELECT id FROM categories WHERE LOWER(name) = ? LIMIT 1`,
      [name.toLowerCase()],
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "Category name already exists" });
    }

    const [result] = await db.execute(
      `
      INSERT INTO categories (
        name,
        description,
        created_at,
        updated_at,
        archived
      ) VALUES (?, ?, NOW(), NOW(), FALSE)
    `,
      [name, description || null],
    );

    const [rows] = await db.execute(
      `SELECT id, name, description, created_at, updated_at FROM categories WHERE id = ? LIMIT 1`,
      [result.insertId],
    );

    return res.status(201).json({ category: serializeCategory(rows[0]) });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({ message: "Unable to create category" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const name = getSafeString(req.body.name);
    const description = getSafeString(req.body.description);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ message: "Category ID must be a positive number" });
    }

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    if (description.length > 160) {
      return res.status(400).json({ message: "Description cannot exceed 160 characters" });
    }

    const [existingCategory] = await db.execute(
      `SELECT id, name FROM categories WHERE id = ? AND archived = FALSE LIMIT 1`,
      [categoryId],
    );

    if (!existingCategory.length) {
      return res.status(404).json({ message: "Category not found" });
    }

    const [duplicateName] = await db.execute(
      `SELECT id FROM categories WHERE LOWER(name) = ? AND id != ? LIMIT 1`,
      [name.toLowerCase(), categoryId],
    );

    if (duplicateName.length) {
      return res.status(409).json({ message: "Category name already exists" });
    }

    await db.execute(
      `
      UPDATE categories
      SET name = ?,
          description = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
      [name, description || null, categoryId],
    );

    const [rows] = await db.execute(
      `SELECT id, name, description, created_at, updated_at FROM categories WHERE id = ? LIMIT 1`,
      [categoryId],
    );

    return res.status(200).json({ category: serializeCategory(rows[0]) });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ message: "Unable to update category" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({ message: "Category ID must be a positive number" });
    }

    const [usageRows] = await db.execute(
      `
      SELECT COUNT(*) AS count
      FROM post_categories AS pc
      INNER JOIN posts AS p
        ON p.id = pc.post_id
        AND p.archived = FALSE
      WHERE pc.category_id = ?
        AND pc.archived = FALSE
    `,
      [categoryId],
    );

    if (usageRows[0].count > 0) {
      return res.status(409).json({
        message: `This category cannot be deleted because it is assigned to ${usageRows[0].count} publication(s).`,
      });
    }

    const [result] = await db.execute(
      `
      UPDATE categories
      SET archived = TRUE,
          updated_at = NOW()
      WHERE id = ?
        AND archived = FALSE
    `,
      [categoryId],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ message: "Unable to delete category" });
  }
};

export {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
