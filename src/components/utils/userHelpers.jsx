/**
 * User helper utilities for the Financial Approvals System
 */

/**
 * Get the display name of a user object
 */
export function getUserDisplayName(user) {
  if (!user) return 'غير محدد';
  return user.display_name || user.full_name || user.name || user.email || 'غير محدد';
}

/**
 * Get user initials for avatar
 */
export function getUserInitials(user) {
  const name = getUserDisplayName(user);
  if (!name || name === 'غير محدد') return '؟';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return parts[0].charAt(0) + parts[1].charAt(0);
  }
  return name.charAt(0);
}

/**
 * Check if a user has a specific permission via their permission groups
 */
export function userHasPermission(user, allUsers, permissionGroups, permissionKey) {
  if (!user) return false;
  if (user.role === 'admin') return true;

  const userData = allUsers?.find(u => u.id === user.id || u.email === user.email);
  const groupIds = userData?.permission_group_ids || [];

  return groupIds.some(groupId => {
    const group = permissionGroups?.find(g => g.id === groupId && g.is_active);
    return group?.permissions?.[permissionKey] === true;
  });
}

/**
 * Find a user by email from a list
 */
export function findUserByEmail(users, email) {
  if (!email || !users?.length) return null;
  return users.find(u => u.email === email) || null;
}

/**
 * Find a user by id from a list
 */
export function findUserById(users, id) {
  if (!id || !users?.length) return null;
  return users.find(u => u.id === id) || null;
}

/**
 * Get avatar color class based on user email (deterministic)
 */
export function getUserAvatarColor(email) {
  if (!email) return 'bg-gray-400';
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
    'bg-indigo-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500'
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}