const fs = require('fs');

const replaceAlerts = (file) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/alert\(/g, "console.log('Mock Alert:', ");
    fs.writeFileSync(file, content);
    console.log('Replaced alerts in', file);
  }
}

replaceAlerts('src/pages/AIBotManager.tsx');
replaceAlerts('src/pages/CustomerLoyalty.tsx');
replaceAlerts('src/pages/BarberHome.tsx');
