import { z } from "zod";

const loginSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.email("Please enter a valid email address"),
	password: z
		.string()
		.min(1, "Password is required")
		.min(6, "Password must be at least 6 characters")
		.max(128, "Password is too long")
});

const signupSchema = loginSchema.extend({
	name: z
		.string()
		.trim()
		.min(2, "Name must be at least 2 characters")
		.max(50, "Name must be 50 characters or fewer")
		.regex(/^[A-Za-z\s'-]+$/, "Name can only contain letters, spaces, apostrophes, and hyphens")
});

const forgotPasswordSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.email("Please enter a valid email address")
});

const resetPasswordSchema = z
	.object({
		token: z.string().trim().min(1, "Invalid or expired password reset link"),
		email: z
			.string()
			.trim()
			.min(1, "Email is required")
			.email("Please enter a valid email address"),
		password: z
			.string()
			.min(1, "Password is required")
			.min(6, "Password must be at least 6 characters")
			.max(128, "Password is too long"),
		confirmPassword: z
			.string()
			.min(1, "Please confirm your new password")
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Password and confirm password must match",
		path: ["confirmPassword"]
	});

const validate = (schema, redirectPath) => (req, res, next) => {
	const parsed = schema.safeParse(req.body);

	if (!parsed.success) {
		const uniqueErrors = [...new Set(parsed.error.issues.map((issue) => issue.message))];
		uniqueErrors.forEach((message) => req.flash("error", message));
		return res.redirect(redirectPath);
	}

	req.body = parsed.data;
	next();
};


export const validateLoginInput = validate(loginSchema, "/login");
export const validateSignupInput = validate(signupSchema, "/signup");
export const validateForgotPasswordInput = validate(forgotPasswordSchema, "/forgot-password");
export const validateResetPasswordInput = validate(resetPasswordSchema, "/reset-password");
