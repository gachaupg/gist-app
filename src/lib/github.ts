import { Octokit } from "octokit";

// Interface for Gist creation
export interface GistCreateInput {
  description: string;
  public: boolean;
  files: {
    [key: string]: {
      content: string;
    };
  };
}

// Interface for Gist update
export interface GistUpdateInput {
  gist_id: string;
  description?: string;
  files?: {
    [key: string]: {
      content: string;
    } | null;
  };
}

// GitHub API client class
export class GitHubClient {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  // List all gists for the authenticated user
  async listGists(per_page = 10, page = 1) {
    try {
      const response = await this.octokit.request("GET /gists", {
        per_page,
        page,
      });
      return response.data;
    } catch (error) {
      console.error("Error listing gists:", error);
      throw error;
    }
  }

  // List gists for a specific user
  async listUserGists(username: string, per_page = 10, page = 1) {
    try {
      const response = await this.octokit.request(
        `GET /users/${username}/gists`,
        {
          per_page,
          page,
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error listing gists for user ${username}:`, error);
      throw error;
    }
  }

  // Get a single gist
  async getGist(gistId: string) {
    try {
      const response = await this.octokit.request(`GET /gists/${gistId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting gist ${gistId}:`, error);
      throw error;
    }
  }

  // Create a new gist
  async createGist(data: GistCreateInput) {
    try {
      const response = await this.octokit.request("POST /gists", data);
      return response.data;
    } catch (error) {
      console.error("Error creating gist:", error);
      throw error;
    }
  }

  // Update a gist
  async updateGist({ gist_id, ...data }: GistUpdateInput) {
    try {
      const response = await this.octokit.request(
        `PATCH /gists/${gist_id}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating gist ${gist_id}:`, error);
      throw error;
    }
  }

  // Delete a gist
  async deleteGist(gistId: string) {
    try {
      await this.octokit.request(`DELETE /gists/${gistId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting gist ${gistId}:`, error);
      throw error;
    }
  }

  // Star a gist
  async starGist(gistId: string) {
    try {
      await this.octokit.request(`PUT /gists/${gistId}/star`);
      return true;
    } catch (error) {
      console.error(`Error starring gist ${gistId}:`, error);
      throw error;
    }
  }

  // Unstar a gist
  async unstarGist(gistId: string) {
    try {
      await this.octokit.request(`DELETE /gists/${gistId}/star`);
      return true;
    } catch (error) {
      console.error(`Error unstarring gist ${gistId}:`, error);
      throw error;
    }
  }

  // Check if a gist is starred
  async isGistStarred(gistId: string) {
    try {
      const response = await this.octokit.request(`GET /gists/${gistId}/star`);
      return response.status === 204; // 204 No Content means it's starred
    } catch (error: any) {
      if (error.status === 404) {
        return false; // 404 means it's not starred
      }
      console.error(`Error checking if gist ${gistId} is starred:`, error);
      throw error;
    }
  }

  // Get authenticated user information
  async getAuthenticatedUser() {
    try {
      const response = await this.octokit.request("GET /user");
      return response.data;
    } catch (error) {
      console.error("Error getting authenticated user:", error);
      throw error;
    }
  }
}

// Create a GitHub client instance with a token
export function createGitHubClient(token?: string) {
  // Use the provided token or fall back to the default token
  const authToken = token || "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";
  return new GitHubClient(authToken);
}
