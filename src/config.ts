// Fælles indstillinger for hjemmesiden.

// Modtager af henvendelser. Bruges som reserveløsning (mailto), hvis
// Web3Forms-nøglen ikke er sat endnu, og i fejlbeskeder.
export const LEAD_EMAIL = 'hje@nordicstone.dk';
export const LEAD_PHONE_DISPLAY = '+45 40 22 96 96';

// Web3Forms-nøgle (access key). Oprettes gratis på https://web3forms.com med
// hje@nordicstone.dk - nøglen kommer på mail. Nøglen er beregnet til at være
// offentlig og må gerne ligge her i koden.
// Er nøglen ugyldig eller fjernet, åbner formularerne den besøgendes mailprogram i stedet.
export const WEB3FORMS_ACCESS_KEY = 'e396b889-b5e1-4ba0-9f28-e7fb02454f2f';

// Meta Pixel-ID (Events Manager -> Datakilder). Tom streng = ingen tracking og intet
// cookie-banner. Pixel indlæses først, når den besøgende har accepteret cookies.
export const META_PIXEL_ID = '';
