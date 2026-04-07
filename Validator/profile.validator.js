import { z } from "zod";

export const validateProfileData = (data) => {
    const profileSchema = z.object({
        name: z.string().min(2).max(100),
    });

    return profileSchema.safeParse(data);
};

export const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, "Current password is required")
            .min(6, "Current password must be at least 6 characters"),
        updatedPassword: z
            .string()
            .min(1, "Updated password is required")
            .min(6, "Updated password must be at least 6 characters"),
        confirmUpdatedPassword: z
            .string()
            .min(1, "Confirm updated password is required"),
    })
    .refine((data) => data.updatedPassword === data.confirmUpdatedPassword, {
        message: "Updated password and confirm updated password must match",
        path: ["confirmUpdatedPassword"],
    })
    .refine((data) => data.currentPassword !== data.updatedPassword, {
        message: "Updated password must be different from current password",
        path: ["updatedPassword"],
    });

export const validateChangePasswordInput = (req, res, next) => {
    const parsed = changePasswordSchema.safeParse(req.body);

    if (!parsed.success) {
        const errors = [...new Set(parsed.error.issues.map((issue) => issue.message))];
        errors.forEach((message) => req.flash("error", message));
        return res.redirect('/login/profile/change-password');
    }

    req.body = parsed.data;
    return next();
};
