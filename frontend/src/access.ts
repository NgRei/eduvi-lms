/**
 * @see https://umijs.org/docs/max/access#access
 * */
export default function access(
  initialState: { currentUser?: API.CurrentUser } | undefined,
) {
  const { currentUser } = initialState ?? {};
  return {
    canAdmin: currentUser && currentUser.access === 'admin',
    canInstructor: currentUser && (currentUser.access === 'instructor' || currentUser.access === 'admin'),
    canStudent: currentUser && (currentUser.access === 'student' || currentUser.access === 'instructor' || currentUser.access === 'admin'),
  };
}
