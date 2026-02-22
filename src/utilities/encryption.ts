import crypto from "crypto";

class EncryptionModule {
 static Encrypt = async (data: any) => {
  try {
   const algorithm = "aes-256-cbc";
   const key = crypto.randomBytes(32);
   const iv = crypto.randomBytes(16);

   const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
   let encrypted = cipher.update(JSON.stringify(data));
   encrypted = Buffer.concat([encrypted, cipher.final()]);

   return {
    iv: iv.toString("hex"),
    encryptedData: encrypted.toString("hex"),
    key: key.toString("hex"),
   };
  } catch (error) {
   throw error;
  }
 };

 static Decrypt = async (encrypted: any) => {
  try {
   const algorithm = "aes-256-cbc";
   const key = Buffer.from(encrypted.key, "hex");
   const iv = Buffer.from(encrypted.iv, "hex");

   const decipher = crypto.createDecipheriv(algorithm, key, iv);
   let decrypted = decipher.update(Buffer.from(encrypted.encryptedData, "hex"));
   decrypted = Buffer.concat([decrypted, decipher.final()]);

   return JSON.parse(decrypted.toString());
  } catch (error) {
   throw error;
  }
 };
}

export default EncryptionModule;
