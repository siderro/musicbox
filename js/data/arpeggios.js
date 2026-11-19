// Knihovna arpeggií. Polohy se počítají jako okna o šířce `span` pražců.

export const ARPEGGIOS = {
  maj: { name: 'Durový kvintakord', intervals: ['1', '3', '5'], span: 4 },
  min: { name: 'Mollový kvintakord', intervals: ['1', 'b3', '5'], span: 4 },
  dom7: { name: 'Dominantní septakord (7)', intervals: ['1', '3', '5', 'b7'], span: 4 },
  maj7: { name: 'Velký septakord (maj7)', intervals: ['1', '3', '5', '7'], span: 4 },
  m7: { name: 'Mollový septakord (m7)', intervals: ['1', 'b3', '5', 'b7'], span: 4 },
  m7b5: { name: 'Malý zmenšený (m7♭5)', intervals: ['1', 'b3', 'b5', 'b7'], span: 4 },
  dim7: { name: 'Zmenšený septakord (°7)', intervals: ['1', 'b3', 'b5', 'bb7'], span: 4 },
};
