const fs = require('fs');
const file = 'src/pages/StaffAttendance.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace alert
content = content.replace(
  "    } catch(e:any) { alert('Error: ' + e.message); }",
  "    } catch(e:any) { console.error('Error: ', e); }"
);

// Replace simulateScan with handleCheckIn
content = content.replace(
  /const simulateScan = async \(\) => \{[\s\S]*?\}, 2500\);\n  \};/,
  `const handleCheckIn = async () => {
    setScanning(true);
    setScanPhase('scanning');
    triggerHaptic('medium');
    
    // Check in with minimal latency instead of multi-phase simulation
    setTimeout(async () => {
      setScanPhase('success');
      triggerHaptic('success');
      const staffName = user?.displayName || 'Staff Member';
      await markAttendance(staffName, 'present');
      
      setTimeout(() => {
        setScanning(false);
        setScanPhase('idle');
      }, 1500);
    }, 800);
  };`
);

// Update onClick
content = content.replace(/onClick=\{simulateScan\}/g, 'onClick={handleCheckIn}');

// Remove DNA text
content = content.replace(/scanPhase === 'verifying' \? '🧬' : /g, '');
content = content.replace(/scanPhase === 'verifying' \? 'DNA Match\.\.\.' : /g, '');
content = content.replace(/\{scanPhase === 'verifying' && \([\s\S]*?\}\)\}\n/g, '');

fs.writeFileSync(file, content);
console.log('StaffAttendance updated');
