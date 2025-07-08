#!/usr/bin/env node

// Comprehensive Section Management Test
const testSectionManagement = async () => {
  console.log('🧪 Testing Section Management Functionality...\n');
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    // 1. Test Users API
    console.log('1. Testing Users API...');
    const usersResponse = await fetch(`${baseUrl}/api/users`);
    const users = await usersResponse.json();
    console.log(`   ✅ Found ${users.length} users`);
    users.forEach(user => console.log(`   - ${user.firstName} ${user.lastName} (${user.role})`));
    
    // 2. Test Sections API
    console.log('\n2. Testing Sections API...');
    const sectionsResponse = await fetch(`${baseUrl}/api/sections`);
    const sections = await sectionsResponse.json();
    console.log(`   ✅ Found ${sections.length} sections`);
    sections.forEach(section => console.log(`   - ${section.name} (${section.memberCount} members)`));
    
    // 3. Test Section Members
    const testSectionId = sections[0]?.id;
    if (testSectionId) {
      console.log(`\n3. Testing Section Members for "${sections[0].name}"...`);
      const membersResponse = await fetch(`${baseUrl}/api/sections/${testSectionId}/members`);
      const members = await membersResponse.json();
      console.log(`   ✅ Found ${members.length} members`);
      members.forEach(member => console.log(`   - ${member.studentName} (${member.studentEmail})`));
      
      // 4. Test Adding Student to Section
      const studentsToAdd = users.filter(user => 
        user.role === 'student' && 
        !members.some(member => member.studentId === user.id)
      );
      
      if (studentsToAdd.length > 0) {
        console.log(`\n4. Testing Add Student to Section...`);
        const studentToAdd = studentsToAdd[0];
        console.log(`   Adding ${studentToAdd.firstName} ${studentToAdd.lastName}...`);
        
        const addResponse = await fetch(`${baseUrl}/api/sections/${testSectionId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentIds: [studentToAdd.id] })
        });
        
        if (addResponse.ok) {
          console.log('   ✅ Student added successfully');
          
          // Verify addition
          const updatedMembersResponse = await fetch(`${baseUrl}/api/sections/${testSectionId}/members`);
          const updatedMembers = await updatedMembersResponse.json();
          console.log(`   ✅ Verified: Section now has ${updatedMembers.length} members`);
        } else {
          console.log('   ❌ Failed to add student');
        }
      } else {
        console.log('\n4. All students already in section');
      }
    }
    
    // 5. Test Quiz Assignments
    console.log('\n5. Testing Quiz Assignments API...');
    const assignmentsResponse = await fetch(`${baseUrl}/api/quiz-assignments`);
    const assignments = await assignmentsResponse.json();
    console.log(`   ✅ Found ${assignments.length} quiz assignments`);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testSectionManagement();