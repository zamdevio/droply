export function newId(len = 8) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  crypto.getRandomValues(new Uint8Array(len)).forEach((n) => (id += alphabet[n % alphabet.length]));
  return id;
}
