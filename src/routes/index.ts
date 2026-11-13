import { Router } from "express";
import { asyncHandler } from "../utils/async-handler";
import { authenticate } from "../middleware/authenticate";
import { requireAdmin } from "../middleware/authorize";
import * as auth from "../controllers/auth.controller";
import * as notes from "../controllers/note.controller";
import * as adminUsers from "../controllers/admin-user.controller";
import * as aggregation from "../controllers/aggregation.controller";
import * as posts from "../controllers/post.controller";

const router = Router();

router.post("/auth/register", asyncHandler(auth.register));
router.post("/auth/login", asyncHandler(auth.login));
router.get("/auth/me", authenticate, asyncHandler(auth.me));

// Posts are public content, so read endpoints are intentionally unauthenticated.
router.get("/posts", asyncHandler(posts.listPublicPosts));
router.get("/users/:id/posts", asyncHandler(aggregation.getUserPosts));

router.use(authenticate);
router.post("/notes", asyncHandler(notes.createNote));
router.get("/notes", asyncHandler(notes.listMyNotes));
router.get("/notes/:id", asyncHandler(notes.getMyNote));
router.put("/notes/:id", asyncHandler(notes.updateMyNote));
router.delete("/notes/:id", asyncHandler(notes.deleteMyNote));

router.post("/posts", asyncHandler(posts.createPost));

router.use("/admin", requireAdmin);
router.post("/admin/users", asyncHandler(adminUsers.createUser));
router.get("/admin/users", asyncHandler(adminUsers.listUsers));
router.get("/admin/users/interests", asyncHandler(aggregation.usersGroupedByInterest));
router.get("/admin/users/:id", asyncHandler(adminUsers.getUser));
router.put("/admin/users/:id", asyncHandler(adminUsers.updateUser));
router.delete("/admin/users/:id", asyncHandler(adminUsers.deleteUser));
router.get("/admin/notes", asyncHandler(notes.adminListNotes));

export default router;
