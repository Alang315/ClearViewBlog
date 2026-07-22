export function serializeUser(user) {
  return {
    _id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role ?? null,
    profilePic: user.profilePic ?? null,
  };
}