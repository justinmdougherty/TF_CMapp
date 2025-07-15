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

// Function to extract the CN from a certificate subject
function extractCNFromCertificate(certSubject) {
  // For a full certificate, extract the CN (Common Name)
  // The certificate subject should be something like "CN=DOUGHERTY.JUSTIN.MICHAEL.1250227228,OU=USN,OU=PKI,OU=DoD,O=U.S. Government,C=US"
  const cnMatch = certSubject.match(/CN=([^,]+)/);
  return cnMatch ? cnMatch[1] : certSubject;
}

async function checkCertificateMapping() {
  try {
    const pool = await sql.connect(config);
    
    // Check the current certificate_subject in the database
    console.log('=== Current certificate subjects in database ===');
    const users = await pool.request().query(`
      SELECT user_id, display_name, certificate_subject
      FROM Users
      WHERE display_name = 'Justin Dougherty'
    `);
    
    console.log('Database users:', JSON.stringify(users.recordset, null, 2));
    
    // The DEFAULT_USER_CERT contains the full certificate, but we need to extract the CN
    const DEFAULT_USER_CERT = "MIIFRDCCBCygAwIBAgIDBnVHMA0GCSqGSIb3DQEBCwUAMFoxCzAJBgNVBAYTAlVTMRgwFgYDVQQKEw9VLlMuIEdvdmVybm1lbnQxDDAKBgNVBAsTA0RvRDEMMAoGA1UECxMDUEtJMRUwEwYDVQQDEwxET0QgSUQgQ0EtNzMwHhcNMjQwNzA5MDAwMDAwWhcNMjcwNzA4MjM1OTU5WjB/MQswCQYDVQQGEwJVUzEYMBYGA1UEChMPVS5TLiBHb3Zlcm5tZW50MQwwCgYDVQQLEwNEb0QxDDAKBgNVBAsTA1BLSTEMMAoGA1UECxMDVVNOMSwwKgYDVQQDEyNET1VHSEVSVFkuSlVTVElOLk1JQ0hBRUwuMTI1MDIyNzIyODCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJ98y7xGmNrfVUtSA85i9EzyFfzpWLZvQfWv3KMvE9tdvjYLpi9wf1Mm440NZSdsn+VBSruZyb7s7EWa9Jiw19A4AsHHTm0PDUmIt5WbGPcXsszc/6eL/VEsR2V/gp5mhl96Az5ct/fMIslFhh5UX+H7ma8K56Hwir1vIc/Be80fQBulMwzGHz0vWOyQ0AWDtLWf6VdpYJV+Vjv0SC+H3pgIbEZL91Vwwmd1i8PzHi5BojfQIhI64IQuKqyPcZrLgmA3trNpHPJP8hdw4fe8I+N6TAjH/NkaB2BICis5pIbnmlrUyac60jr9qtavfBNfjtHTC9NQtQSv7+oQzMvqL5kCAwEAAaOCAewwggHoMB8GA1UdIwQYMBaAFOkhe/IUbzhViHqgUAmekXIcS9k7MDcGA1UdHwQwMC4wLKAqoCiGJmh0dHA6Ly9jcmwuZGlzYS5taWwvY3JsL0RPRElEQ0FfNzMuY3JsMA4GA1UdDwEB/wQEAwIHgDAkBgNVHSAEHTAbMAsGCWCGSAFlAgELKjAMBgpghkgBZQMCAQMNMB0GA1UdDgQWBBTjksZ1APK0JkryT88aMZw9hGjSvDBlBggrBgEFBQcBAQRZMFcwMwYIKwYBBQUHMAKGJ2h0dHA6Ly9jcmwuZGlzYS5taWwvc2lnbi9ET0RJRENBXzczLmNlcjAgBggrBgEFBQcwAYYUaHR0cDovL29jc3AuZGlzYS5taWwwgYgGA1UdEQSBgDB+oCcGCGCGSAFlAwYGoBsEGdT4ENs8CGwUVIGtg2DaCKhQjiEChDgQo/OgJAYKKwYBBAGCNxQCA6AWDBQxMjUwMjI3MjI4MTE3MDAyQG1pbIYtdXJuOnV1aWQ6QTQ4NkZFRTctNDE4NS00NTAyLUEzOTQtRDVERUNDRUJBNkUzMBsGA1UdCQQUMBIwEAYIKwYBBQUHCQQxBBMCVVMwKAYDVR0lBCEwHwYKKwYBBAGCNxQCAgYIKwYBBQUHAwIGBysGAQUCAwQwDQYJKoZIhvcNAQELBQADggEBAFc6ZODAlHhmEInPE9vnPpGOYBaFhQ06RDDxft3UDKn9oxB0gxogFAs/5kMIJE+wn9mjazLH/B2VnizUfXarFZcPCP3aziNeVAWH/ZjqMq8PxUvV1PJdVxVJu1cU6XberkTs5dgHNSlAb39Qdl/OQANERHa1pUdCgHscIeGl2TrvprzXD3zf0WsFI57hNeil6KUazf3u3pXuN2P00cv3ryEOw7CzC2IO0Q61Yn/vAjCprVh3IhoIkF0yPrYhUiP5qqTLyhynDynnDYwbnt/ZGQYaLiC+gNFxZwkQJtGHVXlb7WOW0zRZI3QaBSielwK1eawfdq/J2SCtT3YHriwKeaI=";
    
    // Parse the certificate to extract CN
    const crypto = require('crypto');
    try {
      const cert = crypto.X509Certificate.from(Buffer.from(DEFAULT_USER_CERT, 'base64'));
      console.log('Certificate subject:', cert.subject);
      console.log('Certificate issuer:', cert.issuer);
      
      // Extract CN from the subject
      const cn = extractCNFromCertificate(cert.subject);
      console.log('Extracted CN:', cn);
      
      // Check if we have a match
      if (users.recordset.length > 0) {
        const dbCertSubject = users.recordset[0].certificate_subject;
        console.log('Database certificate subject:', dbCertSubject);
        console.log('Match found:', dbCertSubject === cn || dbCertSubject === cert.subject);
      }
      
    } catch (certError) {
      console.log('Certificate parsing error:', certError.message);
      console.log('Treating as raw certificate subject');
    }
    
    await sql.close();
    
  } catch (err) {
    console.error('❌ Error checking certificate mapping:', err);
    await sql.close();
  }
}

checkCertificateMapping();
