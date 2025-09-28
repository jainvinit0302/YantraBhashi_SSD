const mockAPI = {
  users: [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'student1', password: 'pass123', role: 'student' }
  ],
  submissions: [],

  async signup(username, password) {
    const existingUser = this.users.find(u => u.username === username);
    if (existingUser) throw new Error('Username already exists');
    
    this.users.push({ username, password, role: 'student' });
    return { success: true };
  },

  async login(username, password) {
    const user = this.users.find(u => u.username === username && u.password === password);
    if (!user) throw new Error('Invalid credentials');
    return user;
  },

  async submitCode(userId, code, status, output, errors) {
    const submission = {
      id: Date.now(),
      userId,
      code,
      status,
      output,
      errors,
      timestamp: new Date().toISOString()
    };
    this.submissions.push(submission);
    return submission;
  },

  async getSubmissions(userId = null) {
    return userId ? this.submissions.filter(s => s.userId === userId) : this.submissions;
  }
};

export default mockAPI;