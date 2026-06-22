import mongoose from 'mongoose';

async function updateAdmin() {
  await mongoose.connect('mongodb://localhost:27017/crave-quest');
  const db = mongoose.connection.db;
  
  const result = await db.collection('users').updateOne(
    { email: 'chinrajmit@gmail.com' },
    { $set: { roles: ['admin', 'user', 'delivery', 'restaurant'], role: 'admin' } }
  );
  
  console.log('Update result:', result);
  const user = await db.collection('users').findOne({ email: 'chinrajmit@gmail.com' });
  console.log('User roles:', user?.roles);
  
  process.exit(0);
}

updateAdmin();
