import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import { razorpay } from "../server.js";
import AppError from "../utils/error.util.js";
import crypto from "crypto";

export const getRazorpayApiKey = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Razorpay API key",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

// export const buySubsription = async (req, res, next) => {
//   try {
//     const { id } = req.user;
//     const user = await User.findById(id);

//     if (!user) {
//       return next(new AppError("Unauthorized, Please Login!!🚫"));
//     }

//     if (user.role === "ADMIN") {
//       return next(new AppError("ADMIN Cannot Purchase a Subscription", 400));
//     }

//     const subscription = await razorpay.subscriptions.create({
//       plan_id: process.env.RAZORPAY_PLAN_ID,
//       customer_notify: 1,
//       total_count: 12,//gpt
//     });
//     user.subscription.id = subscription.id;
//     user.subscription.status = subscription.status;

//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "Subscribed Successfully",
//       subscription_id: subscription.id,
//     });
//   } catch (e) {
//     return next(new AppError(e.message, 500));
//   }
// };

export const buySubsription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);

    if (!user) {
      return next(new AppError("Unauthorized, Please Login!!❌", 401));
    }

    if (user.role === "ADMIN") {
      return next(new AppError("ADMIN Cannot Purchase a Subscription", 400));
    }

    const plan_id = process.env.RAZORPAY_PLAN_ID;
    if (!plan_id) {
      return next(new AppError("Plan ID is missing in the environment variables", 400));
    }

    // Create the Razorpay subscription with total_count
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan_id,
      customer_notify: 1,
      total_count: 12,  // Set the total number of billing cycles (e.g., 12 for a year)
    });

    // Log Razorpay response
    // console.log("Razorpay Subscription Response:", subscription);

    if (!subscription || !subscription.id) {
      return next(new AppError("Failed to create subscription, Razorpay did not return a valid ID", 400));
    }

    if (!user.subscription) {
      user.subscription = {};  // Initialize if not already
    }

    user.subscription.id = subscription.id;
    user.subscription.status = subscription.status;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Subscribed Successfully ✔",
      subscription_id: subscription.id,
    });
  } catch (e) {
    console.error("Error during subscription purchase:", e);
    return next(new AppError(e.message || "Something went wrong during subscription purchase.", 500));
  }
};


// export const verifySubscription = async (req, res, next) => {
//   try {
//     const { id } = req.user; // Assuming you have middleware to authenticate and set req.user
//     const {
//       razorpay_payment_id,
//       razorpay_signature,
//       razorpay_subscription_id,
//     } = req.body;

//     const user = await User.findById(id);

//     if (!user) {
//       return next(new AppError("Unauthorized, Please Login!! ❌", 401)); // 401 for unauthorized
//     }

//     //  Get the subscription ID correctly.  If it's nested, access it appropriately.
//     const subscriptionId = user.subscription?.id; // Use optional chaining

//     if (!subscriptionId) {
//       return next(new AppError("Subscription ID not found for user.", 400)); // Handle missing subscription ID
//     }


//     const generatedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_SECRET)
//       .update(`${razorpay_payment_id}|${razorpay_subscription_id}`) // Use razorpay_subscription_id here!
//       .digest("hex");

//     if (generatedSignature !== razorpay_signature) {
//       return next(new AppError("Payment not verified, please try again", 400)); // 400 for bad request
//     }

//     // Store payment details (important for record-keeping)
//     await Payment.create({
//       razorpay_payment_id,
//       razorpay_signature,
//       razorpay_subscription_id,
//       user: id, // Link the payment to the user (if applicable)
//     });

//     // Update user's subscription status
//     user.subscription.status = "active";
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "Payment verified successfully ✔",
//     });
//   } catch (error) {
//     console.error("Payment Verification Error:", error); // Log the full error for debugging
//     return next(new AppError(error.message, 500)); // Pass the error to your error handling middleware
//   }
// };

export const verifySubscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const {
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return next(new AppError("Unauthorized, Please Login!! ❌"));
    }

    const subscriptionId = user.subscription.id;

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(`${razorpay_payment_id}|${subscriptionId}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return next(new AppError("Payment not verified, please try again", 500));
    }

    await Payment.create({
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
    });

    user.subscription.status = "active";
    await user.save();

    res.status(200).json({
      success: true,
      message: "Payment verified successfully ✔",
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

export const cancleSubscription = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);

    if (!user) {
      return next(new AppError("Unauthorized, Please Login!!❌"));
    }

    if (user.role === "ADMIN") {
      return next(new AppError("ADMIN Cannot Purchase a Subscription", 400));
    }

    const subscriptionId = user.subscription.id;

    const subscription = await razorpay.subscriptions.cancel(subscriptionId);

    user.subscription.status = subscription.status;
    await user.save();
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

// export const allPayments = async (req, res, next) => {
//   try {
//     const { count } = req.query;
//     const subscriptions = await razorpay.subscriptions.all({
//       count: count || 10,
//     });

//     res.status(200).json({
//       success: true,
//       message: "All Payments 💰",
//       subscriptions,
//     });
//   } catch (e) {
//     return next(new AppError(e.message, 500));
//   }
// };

export const allPayments = async (req, res, next) => {
  //chatGpt
  try {
    const count = Number(req.query.count) || 10; // Ensure count is a valid number
    const subscriptions = await razorpay.subscriptions.all({
      count,
    });

    // Log the subscriptions response for debugging
    // console.log('Subscriptions:', subscriptions);

    res.status(200).json({
      success: true,
      message: "All Payments 💰",
      subscriptions,
    });
  } catch (e) {
    console.error('Error fetching subscriptions:', e);
    return next(new AppError("Failed to fetch subscriptions", 500));
  }
};

