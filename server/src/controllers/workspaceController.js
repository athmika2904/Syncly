import Workspace from "../models/Workspace.js";
import WorkspaceMember from "../models/WorkspaceMember.js";
import User from "../models/User.js";
export const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Workspace name is required"
      });
    }

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user.userId
    });
     await WorkspaceMember.create({
      workspace: workspace._id,
      user: req.user.userId,
      role: "owner"
    });

    res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      workspace
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      owner: req.user.userId
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      workspaces
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
export const getWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found"
      });
    }

    let membership = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: req.user.userId
    });

    if (!membership && workspace.owner.toString() === req.user.userId) {
      membership = await WorkspaceMember.create({
        workspace: workspaceId,
        user: req.user.userId,
        role: "owner"
      });
    }

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this workspace"
      });
    }

    res.status(200).json({
      success: true,
      workspace,
      role: membership.role
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
 export const addMember = async (req, res) => {
  try {
    const { email } = req.body;
    const { workspaceId } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      owner: req.user.userId
    });

    if (!workspace) {
      return res.status(403).json({
        success: false,
        message: "Only the workspace owner can add members"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const existingMember = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: user._id
    });

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: "User is already a member"
      });
    }

    const member = await WorkspaceMember.create({
      workspace: workspaceId,
      user: user._id,
      role: "member"
    });

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
export const getMembers = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found"
      });
    }

    let membership = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: req.user.userId
    });

    if (!membership && workspace.owner.toString() === req.user.userId) {
      membership = await WorkspaceMember.create({
        workspace: workspaceId,
        user: req.user.userId,
        role: "owner"
      });
    }

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this workspace"
      });
    }

    const members = await WorkspaceMember.find({
      workspace: workspaceId
    })
      .populate("user", "name email")
      .sort({ role: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};