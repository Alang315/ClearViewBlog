const serializePublication = (publication, options = {}) => {
  const result = {
    id: publication.id,
    title: publication.title,
    excerpt: publication.excerpt,
    featuredImageUrl: publication.featured_image_url,
    createdAt: publication.created_at,
    updatedAt: publication.updated_at,
    author: publication.author,
    likesCount: Number(publication.likes_count ?? 0),
    categories: publication.categories || [],
    likedByCurrentUser: Boolean(publication.liked_by_current_user),
  };

  if (options.includeContent) {
    result.content = publication.content;
  }

  return result;
};

export { serializePublication };
