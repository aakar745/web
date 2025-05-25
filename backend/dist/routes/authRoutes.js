"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/**
 * @route POST /api/auth/register
 * @desc Register a new user
 */
router.post('/register', authController_1.register);
/**
 * @route POST /api/auth/login
 * @desc Login a user
 */
router.post('/login', authController_1.login);
/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 */
router.get('/me', authMiddleware_1.protect, authController_1.getMe);
/**
 * @route GET /api/auth/users
 * @desc Get all users (Admin only)
 */
router.get('/users', authMiddleware_1.protect, authMiddleware_1.adminOnly, authController_1.getAllUsers);
/**
 * @route PUT /api/auth/users/:id
 * @desc Update user (Admin only)
 */
router.put('/users/:id', authMiddleware_1.protect, authMiddleware_1.adminOnly, authController_1.updateUser);
/**
 * @route PUT /api/auth/users/:id/password
 * @desc Update user password (Admin only)
 */
router.put('/users/:id/password', authMiddleware_1.protect, authMiddleware_1.adminOnly, authController_1.updatePassword);
/**
 * @route DELETE /api/auth/users/:id
 * @desc Delete user (Admin only)
 */
router.delete('/users/:id', authMiddleware_1.protect, authMiddleware_1.adminOnly, authController_1.deleteUser);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map