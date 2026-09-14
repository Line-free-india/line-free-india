const fs = require('fs');
const file = 'src/components/PeakHeatmap.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { useMemo } from 'react';",
  "import { useMemo, useState, useEffect } from 'react';\nimport { useApp } from '../store/AppContext';"
);

// We'll replace the useMemo for heatmapData with an effect fetching real data.
const replacement = `
  const { user, getSalonTokens } = useApp();
  const [heatmapData, setHeatmapData] = useState<number[][]>(Array(7).fill(Array(13).fill(0)));

  useEffect(() => {
    if (!user) return;
    const loadRealData = async () => {
      const data = Array.from({ length: 7 }, () => Array(13).fill(0));
      const maxCount = 1; // avoid div by 0

      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
        
        const tokens = await getSalonTokens(user.uid, dateStr);
        const dayIndex = d.getDay(); // 0 = Sun, 1 = Mon, etc.
        
        tokens.forEach(t => {
          if (!t.createdAt) return;
          const h = new Date(t.createdAt).getHours();
          const hourIndex = h - 9; // 9 AM to 9 PM
          if (hourIndex >= 0 && hourIndex < 13) {
            data[dayIndex][hourIndex]++;
          }
        });
      }

      // Normalize data to 0.0 - 1.0 based on maximum value observed
      let maxVal = 1;
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 13; c++) {
          if (data[r][c] > maxVal) maxVal = data[r][c];
        }
      }

      const normalized = data.map(row => row.map(val => val / maxVal));
      setHeatmapData(normalized);
    };
    loadRealData();
  }, [user]);
`;

content = content.replace(
  /const heatmapData = useMemo\(\(\) => \{[\s\S]*?\}, \[\]\);/,
  replacement
);

fs.writeFileSync(file, content);
console.log('PeakHeatmap updated');
