// src/services/certificateService.ts
import forge from 'node-forge';

export interface CertificateInfo {
  commonName: string;
  username: string;
  displayName: string;
  nameParts?: {
    lastName: string;
    firstName: string;
    middleName?: string;
    dodId?: string;
  };
}

export interface UserAuthInfo {
  username: string;
  displayName: string; // This is "FirstName LastName"
  certificateInfo: {
    subject: string;
    issuer: string;
    serialNumber: string;
  };
  // Let's add nameParts here if available
  nameParts?: {
    lastName: string;
    firstName: string;
    middleName?: string;
    dodId?: string;
  };
}

// Helper function to convert a string to proper case
const toProperCase = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

/**
 * Extract user information from certificate data using proper certificate parsing
 * @param certData The raw certificate data from the API response
 * @returns Extracted user information or null if not found
 */
function extractCertificateInfo(certData: string): CertificateInfo | null {
  if (!certData) return null;
  
  try {
    // Decode the base64 certificate to binary DER format
    const binaryDer = forge.util.decode64(certData);
    // Convert binary DER to an ASN.1 object
    const asn1Obj = forge.asn1.fromDer(binaryDer);
    // Parse the ASN.1 object into a certificate object
    const certObj = forge.pki.certificateFromAsn1(asn1Obj);
    // Find the attribute for the common name (CN)
    const cnAttribute = certObj.subject.attributes.find(
      (attr) => attr.name === "commonName"
    );

    if (!cnAttribute || !cnAttribute.value) {
      console.log('No common name found in certificate');
      return null;
    }

    // Extract the common name
    const commonName = typeof cnAttribute.value === "string"
      ? cnAttribute.value
      : String(cnAttribute.value);
    
    console.log('Extracted common name:', commonName);
    
    // Assume the extracted name is in the format "LAST.FIRST.MIDDLE.ID"
    if (commonName.includes('.')) {
      const parts = commonName.split('.');
      
      if (parts.length >= 4) {
        const lastName = parts[0];
        const firstName = parts[1];
        const middleName = parts[2];
        const dodId = parts[3];
        
        return {
          commonName,
          username: commonName.toLowerCase(),
          displayName: `${toProperCase(firstName)} ${toProperCase(lastName)}`,
          nameParts: {
            lastName,
            firstName,
            middleName,
            dodId
          }
        };
      } else if (parts.length >= 2) {
        // Simpler format with just LAST.FIRST
        const lastName = parts[0];
        const firstName = parts[1];
        
        return {
          commonName,
          username: commonName.toLowerCase(),
          displayName: `${toProperCase(firstName)} ${toProperCase(lastName)}`
        };
      }
    }
    
    // Fallback: just use the CN as is
    return {
      commonName,
      username: commonName.toLowerCase(),
      displayName: commonName
    };
  } catch (error) {
    console.error('Error extracting certificate info:', error);
    return null;
  }
}

/**
 * Process the API response and extract user information
 * @param apiResponse The full response from the /api/auth/me endpoint
 * @returns Processed user information with identity filled in
 */
function processAuthResponse(apiResponse: any): UserAuthInfo {
  console.log('Processing auth response:', apiResponse);
  
  const userInfo: UserAuthInfo = {
    username: '',
    displayName: '',
    certificateInfo: {
      subject: '',
      issuer: apiResponse?.serverVariables?.CERT_ISSUER || 
              apiResponse?.user?.certificateInfo?.issuer || '',
      serialNumber: apiResponse?.serverVariables?.CERT_SERIAL ||
                    apiResponse?.user?.certificateInfo?.serialNumber || ''
    }
  };
  
  const certData = apiResponse?.headers?.['x-arr-clientcert'];
  
  if (certData) {
    console.log('Certificate data found in API response');
    const extractedInfo = extractCertificateInfo(certData);
    
    if (extractedInfo) {
      console.log('Successfully extracted certificate info:', extractedInfo);
      userInfo.username = extractedInfo.username;
      userInfo.displayName = extractedInfo.displayName;
      userInfo.certificateInfo.subject = extractedInfo.commonName;
      if (extractedInfo.nameParts) { // <-- Add this
        userInfo.nameParts = extractedInfo.nameParts;
      }
    } else {
      console.log('Failed to extract certificate info');
    }
  } else {
    console.log('No certificate data found in API response');
  }
  
  return userInfo;
}

/**
 * Get the current user info from the API and process it
 * @returns Promise resolving to the processed user information
 */
async function getCurrentUser(): Promise<UserAuthInfo> {
  try {
    const response = await fetch('/api/auth/me');
    const data = await response.json();
    
    return processAuthResponse(data);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return {
      username: '',
      displayName: '',
      certificateInfo: {
        subject: '',
        issuer: '',
        serialNumber: ''
      }
    };
  }
}

/**
 * Log activity for the current user
 * @param activityType Type of activity being logged
 * @param activityDetails Details about the activity
 */
async function logUserActivity(activityType: string, activityDetails: string | object): Promise<any> {
  try {
    // Get the current user
    const user = await getCurrentUser();
    
    if (!user || !user.username) {
      console.error('Cannot log activity: No authenticated user');
      return { success: false, error: 'No authenticated user' };
    }
    
    // Prepare activity data
    const activityData = {
      activityType,
      activityDetails: typeof activityDetails === 'object' 
        ? JSON.stringify(activityDetails) 
        : activityDetails,
      username: user.username,
      timestamp: new Date().toISOString()
    };
    
    // Send to API
    const response = await fetch('/api/user/log-activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(activityData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to log activity: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error logging user activity:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Export the service as a singleton
const certificateService = {
  extractCertificateInfo,
  processAuthResponse,
  getCurrentUser,
  logUserActivity
};

export default certificateService;