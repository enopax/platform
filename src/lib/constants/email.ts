export const EmailTemplate = (children: string) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>IPFS Storage</title>
    </head>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background: #f8fafc;">

      <div style="max-width:600px; margin:0 auto; background:#fff; box-shadow:0 4px 16px rgba(0,0,0,0.1); overflow:hidden;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 8px;">🌐</div>
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">IPFS STORAGE</h1>
          <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Decentralized storage for the modern web</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px; font-size: 16px; color: #333; line-height: 1.6;">
          ${children}
        </div>

        <!-- Network Stats -->
        <div style="background: #f8fafc; padding: 20px 30px; display: flex; justify-content: space-between; text-align: center; border-top: 1px solid #e2e8f0;">
          <div style="flex:1;">
            <div style="font-size: 20px; color: #3b82f6; font-weight: bold;">2.8M+</div>
            <div style="font-size: 12px; color: #64748b; text-transform: uppercase;">Files Stored</div>
          </div>
          <div style="flex:1; border-left:1px solid #e2e8f0; border-right:1px solid #e2e8f0;">
            <div style="font-size: 20px; color: #8b5cf6; font-weight: bold;">47</div>
            <div style="font-size: 12px; color: #64748b; text-transform: uppercase;">Active Nodes</div>
          </div>
          <div style="flex:1;">
            <div style="font-size: 20px; color: #10b981; font-weight: bold;">99.9%</div>
            <div style="font-size: 12px; color: #64748b; text-transform: uppercase;">Uptime</div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center;">
          <p style="margin:0 0 10px; font-weight: bold;">The IPFS Storage Team</p>
          <p style="margin:0; font-size:13px;">Enterprise-grade decentralized storage since 2025</p>
          <p style="margin:10px 0 0; font-size:12px;">📧 support@ipfs-storage.com<br>🌐 www.ipfs-storage.com</p>
        </div>

        <!-- Unsubscribe -->
        <div style="background: #f8fafc; padding: 15px; text-align: center; font-size: 11px; color: #64748b;">
          <p style="margin:0;">
            You're receiving this because you have an account with IPFS Storage.<br>
            <a href="#" style="color: #3b82f6; text-decoration: underline;">Manage preferences</a> |
            <a href="#" style="color: #3b82f6; text-decoration: underline;">Unsubscribe</a>
          </p>
        </div>

      </div>

    </body>
  </html>
`;
