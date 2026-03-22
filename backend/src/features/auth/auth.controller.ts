import { Request, Response, NextFunction } from "express";

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
}
