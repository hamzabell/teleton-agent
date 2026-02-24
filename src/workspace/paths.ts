// src/workspace/paths.ts

import { join } from "path";
import { homedir } from "os";

/**
 * Root directory for Teleton (agent CANNOT access this directly)
 * Configurable via TELETON_HOME env var (default: ~/.teleton)
 */
export function getTeletonRoot(): string {
  return process.env.TELETON_HOME || join(homedir(), ".teleton");
}

export const TELETON_ROOT = getTeletonRoot(); // Fallback for legacy code

/**
 * Workspace directory - ONLY location agent can access
 */
export function getWorkspaceRoot(): string {
  return join(getTeletonRoot(), "workspace");
}

export const WORKSPACE_ROOT = getWorkspaceRoot(); // Fallback for legacy code

/**
 * Workspace subdirectories
 */
export const WORKSPACE_PATHS = {
  get SOUL() { return join(getWorkspaceRoot(), "SOUL.md"); },
  get MEMORY() { return join(getWorkspaceRoot(), "MEMORY.md"); },
  get IDENTITY() { return join(getWorkspaceRoot(), "IDENTITY.md"); },
  get USER() { return join(getWorkspaceRoot(), "USER.md"); },
  get STRATEGY() { return join(getWorkspaceRoot(), "STRATEGY.md"); },
  get SECURITY() { return join(getWorkspaceRoot(), "SECURITY.md"); },

  get MEMORY_DIR() { return join(getWorkspaceRoot(), "memory"); },
  get DOWNLOADS_DIR() { return join(getWorkspaceRoot(), "downloads"); },
  get UPLOADS_DIR() { return join(getWorkspaceRoot(), "uploads"); },
  get TEMP_DIR() { return join(getWorkspaceRoot(), "temp"); },
  get MEMES_DIR() { return join(getWorkspaceRoot(), "memes"); },
  get PLUGINS_DIR() { return join(getTeletonRoot(), "plugins"); },
};

/**
 * Allowed file extensions for different operations
 */
export const ALLOWED_EXTENSIONS = {
  // Images
  images: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"],
  // Audio
  audio: [".mp3", ".ogg", ".wav", ".m4a", ".opus"],
  // Video
  video: [".mp4", ".mov", ".avi", ".webm", ".mkv"],
  // Documents
  documents: [".md", ".txt", ".json", ".csv", ".pdf", ".yaml", ".yml"],
  // Code (for workspace files)
  code: [".ts", ".js", ".py", ".sh", ".sql"],
  // Stickers
  stickers: [".webp", ".tgs"],
  // All media
  media: [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".mp3",
    ".ogg",
    ".wav",
    ".m4a",
    ".opus",
    ".mp4",
    ".mov",
    ".avi",
    ".webm",
    ".mkv",
  ],
} as const;

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10 MB
  audio: 50 * 1024 * 1024, // 50 MB
  video: 100 * 1024 * 1024, // 100 MB
  document: 50 * 1024 * 1024, // 50 MB
  total_workspace: 500 * 1024 * 1024, // 500 MB total
} as const;
