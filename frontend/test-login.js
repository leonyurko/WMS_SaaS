
import axios from 'axios';

const testLogin = async () => {
  try {
    console.log('Testing login...');
    const response = await axios.post('http://wms-backend:5000/api/auth/login', {
      username: 'admin',
      password: 'password123'
    });
    
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.status === 'success') {
      console.log('Login successful structure matches!');
    } else {
      console.log('Login failed structure mismatch!');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
};

testLogin();
