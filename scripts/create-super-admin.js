const { AdminAuth } = require('../server/adminAuth.ts');

async function createSuperAdmin() {
  try {
    const admin = await AdminAuth.createAdminAccount({
      username: 'superadmin',
      email: 'admin@activ.com',
      password: 'AdminPassword123!',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin'
    });

    console.log('Super admin created successfully!');
    console.log('Username: superadmin');
    console.log('Password: AdminPassword123!');
    console.log('Please change the password after first login.');
  } catch (error) {
    console.error('Error creating super admin:', error);
  }
}

createSuperAdmin();