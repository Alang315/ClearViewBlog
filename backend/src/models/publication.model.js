const serializePublication = (publication) => ({
  id: publication.id,
  title: publication.title,
  excerpt: publication.excerpt,
  content: publication.content,
  featuredImageUrl: publication.featured_image_url,
  createdAt: publication.created_at,
  updatedAt: publication.updated_at,
  author: publication.author,
  likesCount: Number(publication.likes_count ?? 0),
  categories: publication.categories || [],
});

export { serializePublication };
