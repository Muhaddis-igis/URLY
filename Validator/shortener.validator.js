import { email, z } from "zod";

const dashboardShortlinkSchema = z.object({
	url: z
		.string()
		.trim()
		.min(1, "Destination URL is required")
		.max(255, "Destination URL must be 255 characters or fewer")
		.url("Please enter a valid URL"),
	shortcode: z
		.string()
		.trim()
        .toLowerCase()
		.min(1, "Shortcode is required")
		.min(3, "Shortcode must be at least 3 characters")
		.max(30, "Shortcode must be 30 characters or fewer")
		.regex(/^[A-Za-z0-9_-]+$/, "Shortcode can only contain letters, numbers, hyphens, and underscores")
});
export const tokenSchema = z.object({
	token: z.string().length(8, "Invalid verification token"),
	email: z.string().email("Invalid emailaddress")
})

const validate = (schema, redirectPath) => (req, res, next) => {
	const parsed = schema.safeParse(req.body);

	if (!parsed.success) {
		const uniqueErrors = [...new Set(parsed.error.issues.map((issue) => issue.message))];
		uniqueErrors.forEach((message) => req.flash("error", message));
		const targetPath = typeof redirectPath === "function" ? redirectPath(req) : redirectPath;
		return res.redirect(targetPath);
	}

	req.body = parsed.data;
	next();
};
export const validateId = (id)=>{return z.coerce.number().int().safeParse(id)};
export const validateDashboardShortlinkInput = validate(dashboardShortlinkSchema, "/login/dashboard");
export const validateEditShortlinkInput = validate(
	dashboardShortlinkSchema,
	(req) => `/login/dashboard/edit/${encodeURIComponent(req.params.id)}`
);

