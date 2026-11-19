// Místo, kam se může „přihlásit“ sólový hlas (ukázka frází, otázka–odpověď).
// Groovebox ho volá při každém kroku s přesným časem, takže zvuk sedí do rytmu.

let lead = null;

export const setLead = (fn) => { lead = fn; };
export const getLead = () => lead;
