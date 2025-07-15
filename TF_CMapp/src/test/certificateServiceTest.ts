// Test file to debug certificate parsing
import certificateService from '../services/certificateService';

// Test the certificate parsing with the default certificate
const DEFAULT_USER_CERT = "MIIFRDCCBCygAwIBAgIDBnVHMA0GCSqGSIb3DQEBCwUAMFoxCzAJBgNVBAYTAlVTMRgwFgYDVQQKEw9VLlMuIEdvdmVybm1lbnQxDDAKBgNVBAsTA0RvRDEMMAoGA1UECxMDUEtJMRUwEwYDVQQDEwxET0QgSUQgQ0EtNzMwHhcNMjQwNzA5MDAwMDAwWhcNMjcwNzA4MjM1OTU5WjB/MQswCQYDVQQGEwJVUzEYMBYGA1UEChMPVS5TLiBHb3Zlcm5tZW50MQwwCgYDVQQLEwNEb0QxDDAKBgNVBAsTA1BLSTEMMAoGA1UECxMDVVNOMSwwKgYDVQQDEyNET1VHSEVSVFkuSlVTVElOLk1JQ0hBRUwuMTI1MDIyNzIyODCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJ98y7xGmNrfVUtSA85i9EzyFfzpWLZvQfWv3KMvE9tdvjYLpi9wf1Mm440NZSdsn+VBSruZyb7s7EWa9Jiw19A4AsHHTm0PDUmIt5WbGPcXsszc/6eL/VEsR2V/gp5mhl96Az5ct/fMIslFhh5UX+H7ma8K56Hwir1vIc/Be80fQBulMwzGHz0vWOyQ0AWDtLWf6VdpYJV+Vjv0SC+H3pgIbEZL91Vwwmd1i8PzHi5BojfQIhI64IQuKqyPcZrLgmA3trNpHPJP8hdw4fe8I+N6TAjH/NkaB2BICis5pIbnmlrUyac60jr9qtavfBNfjtHTC9NQtQSv7+oQzMvqL5kCAwEAAaOCAewwggHoMB8GA1UdIwQYMBaAFOkhe/IUbzhViHqgUAmekXIcS9k7MDcGA1UdHwQwMC4wLKAqoCiGJmh0dHA6Ly9jcmwuZGlzYS5taWwvY3JsL0RPRElEQ0FfNzMuY3JsMA4GA1UdDwEB/wQEAwIHgDAkBgNVHSAEHTAbMAsGCWCGSAFlAgELKjAMBgpghkgBZQMCAQMNMB0GA1UdDgQWBBTjksZ1APK0JkryT88aMZw9hGjSvDBlBggrBgEFBQcBAQRZMFcwMwYIKwYBBQUHMAKGJ2h0dHA6Ly9jcmwuZGlzYS5taWwvc2lnbi9ET0RJRENBXzczLmNlcjAgBggrBgEFBQcwAYYUaHR0cDovL29jc3AuZGlzYS5taWwwgYgGA1UdEQSBgDB+oCcGCGCGSAFlAwYGoBsEGdT4ENs8CGwUVIGtg2DaCKhQjiEChDgQo/OgJAYKKwYBBAGCNxQCA6AWDBQxMjUwMjI3MjI4MTE3MDAyQG1pbIYtdXJuOnV1aWQ6QTQ4NkZFRTctNDE4NS00NTAyLUEzOTQtRDVERUNDRUJBNkUzMBsGA1UdCQQUMBIwEAYIKwYBBQUHCQQxBBMCVVMwKAYDVR0lBCEwHwYKKwYBBAGCNxQCAgYIKwYBBQUHAwIGBysGAQUCAwQwDQYJKoZIhvcNAQELBQADggEBAFc6ZODAlHhmEInPE9vnPpGOYBaFhQ06RDDxft3UDKn9oxB0gxogFAs/5kMIJE+wn9mjazLH/B2VnizUfXarFZcPCP3aziNeVAWH/ZjqMq8PxUvV1PJdVxVJu1cU6XberkTs5dgHNSlAb39Qdl/OQANERHa1pUdCgHscIeGl2TrvprzXD3zf0WsFI57hNeil6KUazf3u3pXuN2P00cv3ryEOw7CzC2IO0Q61Yn/vAjCprVh3IhoIkF0yPrYhUiP5qqTLyhynDynnDYwbnt/ZGQYaLiC+gNFxZwkQJtGHVXlb7WOW0zRZI3QaBSielwK1eawfdq/J2SCtT3YHriwKeaI=";

// Mock API response
const mockApiResponse = {
  user: {
    username: "",
    displayName: "",
    certificateInfo: {
      subject: DEFAULT_USER_CERT,
      issuer: "",
      serialNumber: ""
    }
  },
  headers: {
    'x-arr-clientcert': DEFAULT_USER_CERT
  },
  extractedFrom: 'fallback'
};

console.log('Testing certificate parsing...');
console.log('Expected Common Name: DOUGHERTY.JUSTIN.MICHAEL.1250227228');
console.log('Expected Display Name: Justin Dougherty');

// Test the extraction
const extractedInfo = certificateService.extractCertificateInfo(DEFAULT_USER_CERT);
console.log('Extracted Info:', extractedInfo);

// Test the full processing
const processedInfo = certificateService.processAuthResponse(mockApiResponse);
console.log('Processed User Info:', processedInfo);

export { extractedInfo, processedInfo };
