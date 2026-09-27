import type { ToolPermission, ToolDefinition } from "./types";

/**
 * OPEX AI Tool Authorization & Permission Layer
 *
 * Enforces strict capability boundaries for tool and function calling.
 * High-impact operations mandate application-level confirmation and explicit permission grants.
 */

export interface ToolExecutionContext {
  callerUserId: string;
  targetUserId?: string;
  grantedPermissions: Set<ToolPermission>;
  confirmedByUser?: boolean;
}

export class ToolPermissionGuard {
  private static registeredTools: Map<string, ToolDefinition> = new Map([
    [
      "generate_caption",
      {
        name: "generate_caption",
        description: "Generate post captions and hashtags",
        requiredPermission: "ai:generate_caption",
        parameters: { topic: "string", tone: "string" },
        requiresUserConfirmation: false,
      },
    ],
    [
      "generate_ideas",
      {
        name: "generate_ideas",
        description: "Generate reel hooks and video storyboards",
        requiredPermission: "ai:generate_ideas",
        parameters: { topic: "string" },
        requiresUserConfirmation: false,
      },
    ],
    [
      "moderate_content",
      {
        name: "moderate_content",
        description: "Check text or media against Trust & Safety guidelines",
        requiredPermission: "ai:moderate_content",
        parameters: { content: "string" },
        requiresUserConfirmation: false,
      },
    ],
    [
      "draft_post",
      {
        name: "draft_post",
        description: "Create an unpublished draft post on caller's profile",
        requiredPermission: "ai:draft_post",
        parameters: { caption: "string", mediaId: "string" },
        requiresUserConfirmation: true, // High impact: requires user approval
      },
    ],
  ]);

  /**
   * Validate that the caller has sufficient permission to invoke a tool,
   * target user isolation is preserved, and human confirmation is present if required.
   */
  public static authorizeToolInvocation(
    toolName: string,
    context: ToolExecutionContext,
  ): {
    allowed: boolean;
    reason?: string;
  } {
    const tool = this.registeredTools.get(toolName);
    if (!tool) {
      return { allowed: false, reason: `Unrecognized or unregistered tool: "${toolName}"` };
    }

    // 1. Cross-user isolation: Caller may NEVER operate on another user's content
    if (context.targetUserId && context.targetUserId !== context.callerUserId) {
      return {
        allowed: false,
        reason:
          "Security violation: Cross-user boundary breach. Cannot access or modify other user data.",
      };
    }

    // 2. Permission check
    if (!context.grantedPermissions.has(tool.requiredPermission)) {
      return {
        allowed: false,
        reason: `Missing required permission: ${tool.requiredPermission}`,
      };
    }

    // 3. User confirmation check for high-impact actions
    if (tool.requiresUserConfirmation && !context.confirmedByUser) {
      return {
        allowed: false,
        reason: "Action requires explicit human confirmation before execution.",
      };
    }

    return { allowed: true };
  }

  public static getTool(name: string): ToolDefinition | undefined {
    return this.registeredTools.get(name);
  }
}
