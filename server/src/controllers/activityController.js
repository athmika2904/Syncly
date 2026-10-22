import Activity from "../models/Activity.js";
import WorkspaceMember from "../models/WorkspaceMember.js";

export const getWorkspaceActivity = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const membership = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: req.user.userId
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this workspace"
      });
    }

    const activities = await Activity.find({
      workspace: workspaceId
    })
      .populate("user", "name email")
      .populate("document", "title")
      .sort({ createdAt: -1 })
      .limit(20);

    const total = await Activity.countDocuments({
      workspace: workspaceId
    });

    res.status(200).json({
      success: true,
      total,
      activities
    });
  } catch (error) {
    console.error("Fetch workspace activity error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load workspace activity"
    });
  }
};