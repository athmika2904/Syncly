import Workspace from "../models/Workspace.js";

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
    const workspace = await Workspace.findOne({
      _id: req.params.workspaceId,
      owner: req.user.userId
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found"
      });
    }

    res.status(200).json({
      success: true,
      workspace
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};