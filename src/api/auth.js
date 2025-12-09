import { mockUsers } from '../data/mockUsers';
import { delay } from '../utils/delay';

export const loginApi = async (username, password) => {
  await delay(600); // simulate network
  const user = mockUsers.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  if (!user) {
    throw new Error('Invalid credentials');
  }
  // omit password when storing
  const { password: _, ...safeUser } = user;
  return safeUser;
};

