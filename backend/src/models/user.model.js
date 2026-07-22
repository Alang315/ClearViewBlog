export function serializeUser(user) {
  return {
    _id: user.id,
    fullName: user.fullName,
    email: user.email,
    profilePic: user.profilePic ?? null,
  };
}