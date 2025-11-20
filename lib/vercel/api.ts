/**
 * Vercel API Utilities
 *
 * Programmatic domain management for Vercel deployments.
 * Automatically adds/removes custom domains from Vercel project.
 *
 * Required Environment Variables:
 * - VERCEL_TOKEN: API token from Vercel dashboard
 * - VERCEL_PROJECT_ID: Project ID from Vercel settings
 * - VERCEL_TEAM_ID: (Optional) Team ID for team projects
 *
 * API Documentation: https://vercel.com/docs/rest-api/endpoints/domains
 */

const VERCEL_API_BASE = 'https://api.vercel.com';

interface VercelErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

interface VercelDomainConfig {
  name: string;
  gitBranch?: string | null;
  redirect?: string | null;
  redirectStatusCode?: (307 | 308) | null;
}

interface VercelDomainResponse {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string | null;
  redirectStatusCode?: number | null;
  gitBranch?: string | null;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
}

/**
 * Get Vercel API headers with authentication
 */
function getVercelHeaders(): HeadersInit {
  const token = process.env.VERCEL_TOKEN;

  if (!token) {
    throw new Error('VERCEL_TOKEN environment variable is not set');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Get Vercel project ID
 */
function getProjectId(): string {
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!projectId) {
    throw new Error('VERCEL_PROJECT_ID environment variable is not set');
  }

  return projectId;
}

/**
 * Build Vercel API URL with optional team ID
 */
function buildVercelUrl(path: string): string {
  const teamId = process.env.VERCEL_TEAM_ID;
  const baseUrl = `${VERCEL_API_BASE}${path}`;

  if (teamId) {
    const separator = path.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}teamId=${teamId}`;
  }

  return baseUrl;
}

/**
 * Add a custom domain to Vercel project
 *
 * @param domain - The custom domain to add (e.g., 'transfers.acmehotel.com')
 * @returns Success status and domain details
 *
 * @example
 * ```typescript
 * const result = await addDomainToVercel('transfers.acmehotel.com');
 * if (result.success) {
 *   console.log('Domain added:', result.domain);
 * }
 * ```
 */
export async function addDomainToVercel(domain: string): Promise<{
  success: boolean;
  domain?: VercelDomainResponse;
  error?: string;
  code?: string;
}> {
  try {
    const projectId = getProjectId();
    const url = buildVercelUrl(`/v10/projects/${projectId}/domains`);

    const domainConfig: VercelDomainConfig = {
      name: domain,
      // No git branch (use default deployment)
      gitBranch: null,
      // No redirect
      redirect: null,
      redirectStatusCode: null,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: getVercelHeaders(),
      body: JSON.stringify(domainConfig),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as VercelErrorResponse;

      // Domain already exists is not a critical error
      if (error.error?.code === 'domain_already_in_use' ||
          error.error?.code === 'domain_already_exists') {
        console.log(`Domain ${domain} already exists in Vercel`);
        return {
          success: true,
          domain: data as VercelDomainResponse,
        };
      }

      console.error('Vercel API error:', error);
      return {
        success: false,
        error: error.error?.message || 'Failed to add domain to Vercel',
        code: error.error?.code,
      };
    }

    console.log(`Successfully added domain ${domain} to Vercel`);
    return {
      success: true,
      domain: data as VercelDomainResponse,
    };
  } catch (error) {
    console.error('Error adding domain to Vercel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Remove a custom domain from Vercel project
 *
 * @param domain - The custom domain to remove
 * @returns Success status
 *
 * @example
 * ```typescript
 * const result = await removeDomainFromVercel('transfers.acmehotel.com');
 * if (result.success) {
 *   console.log('Domain removed successfully');
 * }
 * ```
 */
export async function removeDomainFromVercel(domain: string): Promise<{
  success: boolean;
  error?: string;
  code?: string;
}> {
  try {
    const projectId = getProjectId();
    const url = buildVercelUrl(`/v9/projects/${projectId}/domains/${domain}`);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: getVercelHeaders(),
    });

    if (!response.ok) {
      const data = await response.json() as VercelErrorResponse;

      // Domain not found is not a critical error (already removed)
      if (data.error?.code === 'not_found' ||
          data.error?.code === 'domain_not_found') {
        console.log(`Domain ${domain} not found in Vercel (already removed)`);
        return {
          success: true,
        };
      }

      console.error('Vercel API error:', data);
      return {
        success: false,
        error: data.error?.message || 'Failed to remove domain from Vercel',
        code: data.error?.code,
      };
    }

    console.log(`Successfully removed domain ${domain} from Vercel`);
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error removing domain from Vercel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Check the status and configuration of a domain in Vercel
 *
 * @param domain - The domain to check
 * @returns Domain details or error
 *
 * @example
 * ```typescript
 * const result = await checkDomainStatus('transfers.acmehotel.com');
 * if (result.success && result.domain) {
 *   console.log('Domain verified:', result.domain.verified);
 * }
 * ```
 */
export async function checkDomainStatus(domain: string): Promise<{
  success: boolean;
  domain?: VercelDomainResponse;
  error?: string;
  code?: string;
}> {
  try {
    const projectId = getProjectId();
    const url = buildVercelUrl(`/v9/projects/${projectId}/domains/${domain}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: getVercelHeaders(),
    });

    if (!response.ok) {
      const data = await response.json() as VercelErrorResponse;

      console.error('Vercel API error:', data);
      return {
        success: false,
        error: data.error?.message || 'Failed to get domain status',
        code: data.error?.code,
      };
    }

    const data = await response.json() as VercelDomainResponse;

    return {
      success: true,
      domain: data,
    };
  } catch (error) {
    console.error('Error checking domain status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Check if Vercel API is properly configured
 *
 * @returns Configuration status
 */
export function isVercelConfigured(): boolean {
  return !!(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID);
}
