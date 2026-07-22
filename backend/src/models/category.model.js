const serializeCategory = (category) => ({
  id: category.id,
  name: category.name,
  description: category.description,
  createdAt: category.created_at,
  updatedAt: category.updated_at,
});

export { serializeCategory };
