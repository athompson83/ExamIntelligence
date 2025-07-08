// Test script to verify student addition functionality
const testStudentAddition = async () => {
  console.log('Testing student addition to sections...');
  
  try {
    // 1. Get all sections
    const sectionsResponse = await fetch('http://localhost:5000/api/sections');
    const sections = await sectionsResponse.json();
    console.log('Sections:', sections.length);
    
    // 2. Get all users
    const usersResponse = await fetch('http://localhost:5000/api/users');
    const users = await usersResponse.text();
    console.log('Users response (first 200 chars):', users.substring(0, 200));
    
    // 3. Test adding a student to the first section
    if (sections.length > 0) {
      const sectionId = sections[0].id;
      console.log('Testing with section ID:', sectionId);
      
      // Get current members
      const membersResponse = await fetch(`http://localhost:5000/api/sections/${sectionId}/members`);
      const members = await membersResponse.json();
      console.log('Current members:', members.length);
      
      // Add test user
      const addResponse = await fetch(`http://localhost:5000/api/sections/${sectionId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: ['test-user-2']
        }),
      });
      
      if (addResponse.ok) {
        console.log('Successfully added student');
        
        // Check members again
        const updatedMembersResponse = await fetch(`http://localhost:5000/api/sections/${sectionId}/members`);
        const updatedMembers = await updatedMembersResponse.json();
        console.log('Updated members:', updatedMembers.length);
        
      } else {
        console.log('Failed to add student:', await addResponse.text());
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// For Node.js
if (typeof require !== 'undefined') {
  testStudentAddition();
}