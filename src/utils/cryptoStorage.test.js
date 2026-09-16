import { encryptValue, decryptValue } from "./cryptoStorage";

describe("cryptoStorage — encryptValue / decryptValue", () => {
  it("round-trip: decryptValue(encryptValue(s)) === s", async () => {
    const original = '{"activeId":"abc","accounts":[{"id":"abc","username":"alice","apiKey":"key123"}]}';
    const encrypted = await encryptValue(original);
    const decrypted = await decryptValue(encrypted);
    expect(decrypted).toBe(original);
  });

  it("deux encryptions du même texte produisent des ciphertexts différents (IV aléatoire)", async () => {
    const plain = "test";
    const enc1 = await encryptValue(plain);
    const enc2 = await encryptValue(plain);
    expect(enc1).not.toBe(enc2);
  });

  it("round-trip avec une chaîne vide", async () => {
    const encrypted = await encryptValue("");
    const decrypted = await decryptValue(encrypted);
    expect(decrypted).toBe("");
  });

  it("decryptValue lève une erreur sur une entrée sans point séparateur", async () => {
    await expect(decryptValue("nodothere")).rejects.toThrow();
  });

  it("decryptValue lève une erreur sur un ciphertext corrompu", async () => {
    await expect(decryptValue("aGVsbG8=.d29ybGQ=")).rejects.toThrow();
  });
});
