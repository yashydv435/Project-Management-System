const http = require('http');

async function testApi() {
  const baseUrl = 'http://localhost:5000/api';
  let adminCookie = '';
  let memberCookie = '';
  let projectId = '';
  let taskId = '';
  let adminId = '';
  let memberId = '';

  const request = (endpoint, method, body, cookie) => {
    return new Promise((resolve, reject) => {
      const url = new URL(baseUrl + endpoint);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...(cookie ? { 'Cookie': cookie } : {})
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let parsed;
          try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
          
          let resCookie = null;
          if (res.headers['set-cookie']) {
            resCookie = res.headers['set-cookie'][0];
          }
          
          resolve({ status: res.statusCode, data: parsed, cookie: resCookie });
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  try {
    console.log('--- STARTING TESTS ---');

    // 1. Register Admin
    console.log('\n1. Registering Admin User...');
    const adminRes = await request('/auth/register', 'POST', {
      name: 'Admin User',
      email: `admin_${Date.now()}@test.com`,
      password: 'password123',
      role: 'Admin'
    });
    console.log('Status:', adminRes.status);
    if (adminRes.status === 200) {
      adminCookie = adminRes.cookie;
      adminId = adminRes.data.user.id;
      console.log('✅ Admin registered successfully.');
    } else {
      console.error('❌ Admin registration failed:', adminRes.data);
      return;
    }

    // 2. Register Member
    console.log('\n2. Registering Member User...');
    const memberRes = await request('/auth/register', 'POST', {
      name: 'Member User',
      email: `member_${Date.now()}@test.com`,
      password: 'password123',
      role: 'Member'
    });
    console.log('Status:', memberRes.status);
    if (memberRes.status === 200) {
      memberCookie = memberRes.cookie;
      memberId = memberRes.data.user.id;
      console.log('✅ Member registered successfully.');
    } else {
      console.error('❌ Member registration failed:', memberRes.data);
      return;
    }

    // 3. Admin creates Project
    console.log('\n3. Admin creating a Project...');
    const projectRes = await request('/projects', 'POST', {
      name: 'Test Project',
      description: 'A project for automated testing'
    }, adminCookie);
    console.log('Status:', projectRes.status);
    if (projectRes.status === 201) {
      projectId = projectRes.data.id;
      console.log('✅ Project created successfully.');
    } else {
      console.error('❌ Project creation failed:', projectRes.data);
    }

    // 4. Admin creates Task and assigns to Member
    console.log('\n4. Admin creating a Task...');
    const taskRes = await request('/tasks', 'POST', {
      title: 'Automated Test Task',
      projectId: projectId,
      assignedToId: memberId
    }, adminCookie);
    console.log('Status:', taskRes.status);
    if (taskRes.status === 201) {
      taskId = taskRes.data.id;
      console.log('✅ Task created successfully.');
    } else {
      console.error('❌ Task creation failed:', taskRes.data);
    }

    // 5. Member fetches Tasks
    console.log('\n5. Member fetching tasks...');
    const getTasksRes = await request('/tasks', 'GET', null, memberCookie);
    console.log('Status:', getTasksRes.status);
    if (getTasksRes.status === 200 && getTasksRes.data.length > 0) {
      console.log('✅ Member successfully retrieved assigned task.');
    } else {
      console.error('❌ Member task retrieval failed:', getTasksRes.data);
    }

    // 6. Member updates Task Status
    console.log('\n6. Member updating Task status...');
    const updateTaskRes = await request(`/tasks/${taskId}`, 'PATCH', {
      status: 'InProgress'
    }, memberCookie);
    console.log('Status:', updateTaskRes.status);
    if (updateTaskRes.status === 200 && updateTaskRes.data.status === 'InProgress') {
      console.log('✅ Member successfully updated task status.');
    } else {
      console.error('❌ Member task update failed:', updateTaskRes.data);
    }

    console.log('\n--- TESTS COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Test script crashed:', err);
  }
}

testApi();
