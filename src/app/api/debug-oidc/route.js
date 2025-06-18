import { getVercelOidcToken } from '@vercel/functions/oidc';

export async function GET() {
  try {
    const token = getVercelOidcToken();
    
    if (!token) {
      console.log('[Debug OIDC] No token found');
      return Response.json({ error: 'No OIDC token found' }, { status: 400 });
    }
    
    // Decode the JWT payload
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    
    console.log('=== OIDC TOKEN CLAIMS DEBUG ===');
    console.log('Full payload:', JSON.stringify(payload, null, 2));
    console.log('Issuer (iss):', payload.iss);
    console.log('Audience (aud):', payload.aud);
    console.log('Subject (sub):', payload.sub);
    console.log('Environment:', payload.environment);
    console.log('Project:', payload.project);
    console.log('Owner:', payload.owner);
    console.log('Configuration ID:', payload.configurationId);
    console.log('Team ID:', payload.teamId);
    console.log('================================');
    
    return Response.json({ 
      message: 'Check Vercel function logs for detailed claims',
      claims: {
        iss: payload.iss,
        aud: payload.aud,
        sub: payload.sub,
        environment: payload.environment,
        project: payload.project,
        owner: payload.owner,
        configurationId: payload.configurationId,
        teamId: payload.teamId
      }
    });
  } catch (error) {
    console.error('[Debug OIDC] Error:', error);
    return Response.json({ 
      error: 'Failed to debug token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 