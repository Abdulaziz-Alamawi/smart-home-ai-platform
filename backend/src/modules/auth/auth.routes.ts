import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { authController } from "./auth.controller";
import { loginSchema, refreshSchema, registerSchema } from "./auth.schema";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               fullName: { type: string }
 *     responses:
 *       201: { description: User registered with tokens }
 *       409: { description: Email already registered }
 */
router.post("/register", validate(registerSchema), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate and receive access + refresh tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Authenticated }
 *       401: { description: Invalid credentials }
 */
router.post("/login", validate(loginSchema), authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token and issue a new access token
 *     responses:
 *       200: { description: New token pair }
 */
router.post("/refresh", validate(refreshSchema), authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke a refresh token
 *     responses:
 *       200: { description: Logged out }
 */
router.post("/logout", validate(refreshSchema), authController.logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the current authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user }
 *       401: { description: Unauthorized }
 */
router.get("/me", authenticate, authController.me);

export default router;
