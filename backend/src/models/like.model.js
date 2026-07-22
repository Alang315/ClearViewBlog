const serializeLikeStatus = ({ postId, liked_by_current_user, likes_count }) => ({
  postId: Number(postId),
  likedByCurrentUser: Boolean(liked_by_current_user),
  likesCount: Number(likes_count ?? 0),
});

export { serializeLikeStatus };
