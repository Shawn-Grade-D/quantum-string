const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateCert() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  const days = 365;
  const now = new Date();
  const after = new Date(now.getTime() + days * 86400000);

  // Create cert fields
  const key = privateKey;
  const pub = publicKey;

  // Create a simple self-signed cert using crypto.createSign
  const certInfo = {
    serial: '01',
    subject: '/CN=192.168.8.5',
    issuer: '/CN=192.168.8.5',
    notBefore: now.toISOString(),
    notAfter: after.toISOString(),
  };

  // Use node-forge style approach is complex in pure node.
  // Instead, let's write a minimal PEM cert using manual construction.
  // Actually, for a simpler approach, let's use a pre-baked dev cert.
  
  return { key, pub, days, now, after };
}

const dir = path.resolve(__dirname);

// Generate PEM files manually using Node.js
// Just use a pre-created self-signed cert approach

// Actually, Node.js v24 has X509Certificate but requires DER format
// Let me generate DER and convert

const { privateKey: key, publicKey: pub } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'der' },
  privateKeyEncoding: { type: 'pkcs8', format: 'der' }
});

// Create a simple self-signed cert using Node.js internal API
// We need to create a certificate in PEM format

// Write the private key
fs.writeFileSync(path.join(dir, 'key.pem'), 
  '-----BEGIN PRIVATE KEY-----\n' + 
  key.toString('base64').match(/.{1,64}/g).join('\n') + 
  '\n-----END PRIVATE KEY-----\n'
);

// For the cert, we can use the approach of generating and self-signing
const { X509Certificate } = crypto;
// Node.js 24 doesn't expose X509Certificate constructor well for generation.
// Let's use a different approach: just embed a pre-generated self-signed cert.

// Actually, let me just write a minimal self-signed cert generator
// Use the simpler built-in approach
try {
  const cert = crypto.createSign('SHA256');
  // This is getting too complex. Let me just create an HTTPS server
  // with a programmatically generated self-signed cert using node-forge
  // or just generate it externally
  
  // For now, let me use an alternative: 
  // serve via the OpenClaw gateway's control UI port
  // and use a DNS/proxy approach
  
  console.log('Cert generation - need alternative approach');
  console.log('Key file written');
  console.log('Private key length:', key.length);
} catch(e) {
  console.error(e.message);
}
