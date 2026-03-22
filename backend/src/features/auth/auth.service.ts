import prisma from "../../lib/prisma";

// Use when you need fields beyond what the session provides (e.g. role, plan, stripeCustomerId).
// req.user from requireSession is faster but only contains session-stored fields.
export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
