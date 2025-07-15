const sql = require('mssql');

const config = {
  user: 'sa',
  password: '0)Password',
  server: '127.0.0.1',
  database: 'H10CM',
  port: 1433,
  options: {
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: true
  }
};

// The certificate from the DEFAULT_USER_CERT in the API
const CORRECT_CERT = "MIIFRDCCBCygAwIBAgIDBnVHMA0GCSqGSIb3DQEBCwUAMFoxCzAJBgNVBAYTAlVTMRgwFgYDVQQKEw9VLlMuIEdvdmVybm1lbnQxDDAKBgNVBAsTA0RvRDEMMAoGA1UECxMDUEtJMRUwEwYDVQQDEwxET0QgSUQgQ0EtNzMwHhcNMjQwNzA5MDAwMDAwWhcNMjcwNzA4MjM1OTU5WjB/MQswCQYDVQQGEwJVUzEYMBYGA1UEChMPVS5TLiBHb3Zlcm5tZW50MQwwCgYDVQQLEwNEb0QxDDAKBgNVBAsTA1BLSTEMMAoGA1UECxMDVVNOMSwwKgYDVQQDEyNET1VHSEVSVFkuSlVTVElOLk1JQ0hBRUwuMTI1MDIyNzIyODCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJ98y7xGmNrfVUtSA85i9EzyFfzpWLZvQfWv3KMvE9tdvjYLpi9wf1Mm440NZSdsn+VBSruZyb7s7EWa9Jiw19A4AsHHTm0PDUmIt5WbGPcXsszc/6eL/VEsR2V/gp5mhl96Az5ct/fMIslFhh5UX+H7ma8K56Hwir1vIc/Be80fQBulMwzGHz0vWOyQ0AWDtLWf6VdpYJV+Vjv0SC+H3pgIbEZL91Vwwmd1i8PzHi5BojfQIhI64IQuKqyPcZrLgmA3trNpHPJP8hdw4fe8I+N6TAjH/NkaB2BICis5pIbnmlrUyac60jr9qtavfBNfjtHTC9NQtQSv7+oQzMvqL5kCAwEAAaOCAewwggHoMB8GA1UdIwQYMBaAFOkhe/IUbzhViHqgUAmekXIcS9k7MDcGA1UdHwQwMC4wLKAqoCiGJmh0dHA6Ly9jcmwuZGlzYS5taWwvY3JsL0RPRElEQ0FfNzMuY3JsMA4GA1UdDwEB/wQEAwIHgDAkBgNVHSAEHTAbMAsGCWCGSAFlAgELKjAMBgpghkgBZQMCAQMNMB0GA1UdDgQWBBTjksZ1APK0JkryT88aMZw9hGjSvDBlBggrBgEFBQcBAQRZMFcwMwYIKwYBBQUHMAKGJ2h0dHA6Ly9jcmwuZGlzYS5taWwvc2lnbi9ET0RJRENBXzczLmNlcjAgBggrBgEFBQcwAYYUaHR0cDovL29jc3AuZGlzYS5taWwwgYgGA1UdEQSBgDB+oCcGCGCGSAFlAwYGoBsEGdT4ENs8CGwUVIGtg2DaCKhQjiEChDgQo/OgJAYKKwYBBAGCNxQCA6AWDBQxMjUwMjI3MjI4MTE3MDAyQG1pbIYtdXJuOnV1aWQ6QTQ4NkZFRTctNDE4NS00NTAyLUEzOTQtRDVERUNDRUJBNkUzMBsGA1UdCQQUMBIwEAYIKwYBBQUHCQQxBBMCVVMwKAYDVR0lBCEwHwYKKwYBBAGCNxQCAgYIKwYBBQUHAwIGBysGAQUCAwQwDQYJKoZIhvcNAQELBQADggEBAFc6ZODAlHhmEInPE9vnPpGOYBaFhQ06RDDxft3UDKn9oxB0gxogFAs/5kMIJE+wn9mjazLH/B2VnizUfXarFZcPCP3aziNeVAWH/ZjqMq8PxUvV1PJdVxVJu1cU6XberkTs5dgHNSlAb39Qdl/OQANERHa1pUdCgHscIeGl2TrvprzXD3zf0WsFI57hNeil6KUazf3u3pXuN2P00cv3ryEOw7CzC2IO0Q61Yn/vAjCprVh3IhoIkF0yPrYhUiP5qqTLyhynDynnDYwbnt/ZGQYaLiC+gNFxZwkQJtGHVXlb7WOW0zRZI3QaBSielwK1eawfdq/J2SCtT3YHriwKeaI=";

async function updateCertificate() {
  try {
    const pool = await sql.connect(config);
    
    // First, check what certificate is currently stored
    console.log('=== Current certificate in database ===');
    const currentCert = await pool.request().query(`
      SELECT user_id, display_name, certificate_subject
      FROM Users
      WHERE display_name = 'Justin Dougherty'
    `);
    
    if (currentCert.recordset.length > 0) {
      console.log('Current certificate (first 100 chars):', currentCert.recordset[0].certificate_subject.substring(0, 100) + '...');
      
      // Update the certificate to match the DEFAULT_USER_CERT
      console.log('=== Updating certificate ===');
      await pool.request()
        .input('user_id', sql.Int, currentCert.recordset[0].user_id)
        .input('certificate_subject', sql.NVarChar, CORRECT_CERT)
        .query(`
          UPDATE Users 
          SET certificate_subject = @certificate_subject
          WHERE user_id = @user_id
        `);
      
      console.log('✅ Certificate updated successfully');
      
      // Test the authentication
      console.log('=== Testing authentication ===');
      const testAuth = await pool.request()
        .input('certificate_subject', sql.NVarChar, CORRECT_CERT)
        .query(`
          SELECT 
            u.user_id,
            u.user_name,
            u.display_name,
            u.is_system_admin,
            r.role_name
          FROM Users u
          LEFT JOIN UserRoles ur ON u.user_id = ur.user_id
          LEFT JOIN Roles r ON ur.role_id = r.role_id
          WHERE u.certificate_subject = @certificate_subject
        `);
      
      console.log('Authentication test result:', JSON.stringify(testAuth.recordset, null, 2));
      
    } else {
      console.log('❌ Justin Dougherty user not found!');
    }
    
    await sql.close();
    
  } catch (err) {
    console.error('❌ Error updating certificate:', err);
    await sql.close();
  }
}

updateCertificate();
