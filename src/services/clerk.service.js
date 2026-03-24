const { clerkClient } = require("@clerk/clerk-sdk-node");
const User = require("../models/User.model");

/**
 * Get Clerk user object by clerkId
 */
const getClerkUser = async (clerkId) => {
  try {
    return await clerkClient.users.getUser(clerkId);
  } catch (err) {
    throw new Error(`Clerk user not found: ${err.message}`);
  }
};

/**
 * Ban a user in Clerk (blocks sign-in)
 */
const banUser = async (clerkId) => {
  return await clerkClient.users.banUser(clerkId);
};

/**
 * Unban a user in Clerk
 */
const unbanUser = async (clerkId) => {
  return await clerkClient.users.unbanUser(clerkId);
};

/**
 * Delete user from Clerk AND MongoDB
 */
const deleteUser = async (clerkId) => {
  await clerkClient.users.deleteUser(clerkId);
  await User.findOneAndDelete({ clerkId });
};

/**
 * Sync Clerk user metadata → MongoDB
 * Useful when Clerk profile changes but webhook missed
 */
const syncUserFromClerk = async (clerkId) => {
  const clerkUser = await clerkClient.users.getUser(clerkId);

  return await User.findOneAndUpdate(
    { clerkId },
    {
      email: clerkUser.emailAddresses[0]?.emailAddress,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      profileImage: clerkUser.imageUrl,
    },
    { new: true, upsert: true }
  );
};

/**
 * Update Clerk user's public metadata (visible on JWT)
 */
const setUserMetadata = async (clerkId, metadata) => {
  return await clerkClient.users.updateUser(clerkId, {
    publicMetadata: metadata,
  });
};

/**
 * List all users in Clerk (admin use only)
 */
const listClerkUsers = async ({ limit = 20, offset = 0 } = {}) => {
  return await clerkClient.users.getUserList({ limit, offset });
};

module.exports = {
  getClerkUser,
  banUser,
  unbanUser,
  deleteUser,
  syncUserFromClerk,
  setUserMetadata,
  listClerkUsers,
};
