import { Router } from "express";
import userRoutes from "./user/user.routes";
import employeeRoutes from "./employee/employee.routes";
import employeeDashboardRoutes from "./employee/employeeDashboard.routes";
import appointmentRoutes from "./appointment/appointment.routes";
import visitorRoutes from "./visitor/visitor.routes";
import subscriptionRoutes from "./subscription/subscription.routes";
import userSubscriptionRoutes from "./userSubscription/userSubscription.routes";
import uploadRoutes from "./upload/upload.routes";
import approvalLinkRoutes from "./approvalLink/approvalLink.routes";
import appointmentBookingLinkRoutes from "./appointmentBookingLink/appointmentBookingLink.routes";
import settingsRoutes from "./settings/settings.routes";
import safeinProfileRoutes from "./safeinProfile/safeinProfile.routes";
import notificationRoutes from "./notification/notification.routes";
import specialVisitorBookingRoutes from "./specialVisitorBooking.routes";
import spotPassRoutes from "./spotPass/spotPass.routes";
import chatRoutes from "./chat.routes";

const router = Router();

router.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Public routes (no authentication required)
// router.use("/inquiries", inquiryRoutes); // Removed
router.use("/", approvalLinkRoutes);
router.use("/appointment-links", appointmentBookingLinkRoutes);

// Protected routes (authentication required)
router.use("/users", userRoutes);
router.use("/employees", employeeRoutes);
router.use("/employee", employeeDashboardRoutes); // Employee dashboard routes (singular path as expected by frontend)
router.use("/appointments", appointmentRoutes);
router.use("/visitors", visitorRoutes);
router.use("/subscription-plans", subscriptionRoutes);
router.use("/user-subscriptions", userSubscriptionRoutes);
router.use("/upload", uploadRoutes);
router.use("/settings", settingsRoutes);
router.use("/safein-profile", safeinProfileRoutes);
router.use("/notifications", notificationRoutes);
router.use("/special-bookings", specialVisitorBookingRoutes);
router.use("/spot-passes", spotPassRoutes);
router.use("/chats", chatRoutes);

export default router;
